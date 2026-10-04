// SPDX-License-Identifier: Apache-2.0

import { QueryEngine } from '@comunica/query-sparql-rdfjs';
import ParserJsonld from '@rdfjs/parser-jsonld';
import { Store, Writer } from 'n3';
import { Readable } from 'node:stream';

const engine = new QueryEngine();

const ALLOWED_QUERY_TYPES = new Set([
  'SELECT',
  'ASK',
  'CONSTRUCT',
  'DESCRIBE'
]);

const UPDATE_KEYWORDS =
  /\b(INSERT|DELETE|LOAD|CLEAR|CREATE|DROP|COPY|MOVE|ADD|WITH|USING)\b/i;

// SERVICE and FROM/FROM NAMED are intentionally disabled so public queries
// cannot cause the endpoint to dereference remote datasets or services.
const FEDERATION_KEYWORDS = /\b(SERVICE|FROM)\b/i;

const MAX_QUERY_LENGTH = 12000;
const MAX_POST_BODY_BYTES = 16384;
const QUERY_TIMEOUT_MS = 10000;
const MAX_RESULT_ROWS = 5000;
const MAX_GRAPH_QUADS = 5000;

// Best-effort application rate limit. This protects warm serverless instances.
// A Vercel Firewall rate-limit rule should also be enabled for /sparql so the
// limit is enforced across all instances.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateBuckets = new Map();

class QueryTimeoutError extends Error {
  constructor() {
    super(
      `SPARQL query exceeded the ${QUERY_TIMEOUT_MS / 1000}-second execution limit.`
    );
    this.name = 'QueryTimeoutError';
  }
}

class ResultLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResultLimitError';
  }
}

class PayloadTooLargeError extends Error {
  constructor() {
    super(`Request body exceeds the ${MAX_POST_BODY_BYTES}-byte limit.`);
    this.name = 'PayloadTooLargeError';
  }
}

class UnsupportedMediaTypeError extends Error {
  constructor() {
    super('Unsupported request Content-Type.');
    this.name = 'UnsupportedMediaTypeError';
  }
}

function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...extra
  };
}

function corsHeaders(extra = {}) {
  return securityHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Cache-Control': 'no-store',
    ...extra
  });
}

function jsonResponse(
  data,
  status = 200,
  contentType = 'application/json; charset=utf-8',
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: corsHeaders({
        'Content-Type': contentType,
        ...extraHeaders
      })
    }
  );
}

function textResponse(
  text,
  status = 200,
  contentType = 'text/plain; charset=utf-8',
  extraHeaders = {}
) {
  return new Response(text, {
    status,
    headers: corsHeaders({
      'Content-Type': contentType,
      ...extraHeaders
    })
  });
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: corsHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': [
        "default-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'none'",
        "img-src 'none'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'"
      ].join('; ')
    })
  });
}

function clientKey(request) {
  const raw =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    '';

  const first = raw.split(',')[0].trim();
  return first ? first.slice(0, 128) : null;
}

function checkRateLimit(request) {
  const key = clientKey(request);

  // Vercel normally supplies a client IP. If it does not, avoid putting all
  // clients into one shared fallback bucket; platform/WAF controls still apply.
  if (!key) {
    return null;
  }

  const now = Date.now();
  let bucket = rateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    };
  }

  bucket.count += 1;
  rateBuckets.set(key, bucket);

  // Opportunistic cleanup keeps a long-lived warm instance bounded.
  if (rateBuckets.size > 5000) {
    for (const [bucketKey, value] of rateBuckets) {
      if (now >= value.resetAt) rateBuckets.delete(bucketKey);
    }
    // Bound memory even during a burst of many distinct client addresses.
    if (rateBuckets.size > 10000) {
      rateBuckets.clear();
      rateBuckets.set(key, bucket);
    }
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX - bucket.count);
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  const headers = {
    'RateLimit-Limit': String(RATE_LIMIT_MAX),
    'RateLimit-Remaining': String(remaining),
    'RateLimit-Reset': String(resetSeconds)
  };

  if (bucket.count > RATE_LIMIT_MAX) {
    return jsonResponse(
      { error: 'Too many SPARQL requests. Please retry later.' },
      429,
      'application/json; charset=utf-8',
      {
        ...headers,
        'Retry-After': String(resetSeconds)
      }
    );
  }

  return { headers };
}

function deadlineFromNow() {
  return Date.now() + QUERY_TIMEOUT_MS;
}

function checkDeadline(deadline) {
  if (Date.now() > deadline) {
    throw new QueryTimeoutError();
  }
}

function promiseWithDeadline(promise, deadline) {
  let timeout;
  const remaining = Math.max(1, deadline - Date.now());

  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(
      () => reject(new QueryTimeoutError()),
      remaining
    );
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeout);
  });
}

async function readBodyLimited(request) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_POST_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.byteLength;
      if (total > MAX_POST_BODY_BYTES) {
        try { await reader.cancel(); } catch (_) {}
        throw new PayloadTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

async function getQuery(request) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const raw = url.searchParams.get('query') || '';
    return raw.replace(/\+/g, ' ');
  }

  const contentType = (request.headers.get('content-type') || '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();

  const allowedTypes = new Set([
    '',
    'text/plain',
    'application/sparql-query',
    'application/x-www-form-urlencoded',
    'application/json'
  ]);

  if (!allowedTypes.has(contentType)) {
    throw new UnsupportedMediaTypeError();
  }

  const body = await readBodyLimited(request);

  if (
    contentType === 'application/sparql-query' ||
    contentType === 'text/plain' ||
    contentType === ''
  ) {
    return body;
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(body);
    return (params.get('query') || '').replace(/\+/g, ' ');
  }

  if (contentType === 'application/json') {
    let parsed;
    try {
      parsed = JSON.parse(body || '{}');
    } catch (_) {
      return '';
    }

    return typeof parsed?.query === 'string' ? parsed.query : '';
  }

  return '';
}

// Removes comments, strings, IRIs, variables, and prefixed-name bodies before
// keyword scanning. This prevents false positives such as ?service or a literal
// containing the word SERVICE while still detecting actual SPARQL clauses.
function keywordScanText(query) {
  let out = '';
  let i = 0;

  while (i < query.length) {
    const ch = query[i];

    if (ch === '#') {
      while (i < query.length && query[i] !== '\n') i += 1;
      out += '\n';
      continue;
    }

    if (ch === '<') {
      i += 1;
      while (i < query.length) {
        if (query[i] === '\\') {
          i += 2;
          continue;
        }
        if (query[i] === '>') {
          i += 1;
          break;
        }
        i += 1;
      }
      out += ' ';
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      const triple = query.slice(i, i + 3) === quote.repeat(3);
      i += triple ? 3 : 1;

      while (i < query.length) {
        if (query[i] === '\\') {
          i += 2;
          continue;
        }
        if (triple && query.slice(i, i + 3) === quote.repeat(3)) {
          i += 3;
          break;
        }
        if (!triple && query[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }

      out += ' ';
      continue;
    }

    out += ch;
    i += 1;
  }

  return out
    .replace(/[?$][A-Za-z_][A-Za-z0-9_-]*/g, ' ')
    .replace(/\b[A-Za-z_][A-Za-z0-9_-]*:[A-Za-z0-9_.~-]+/g, ' ');
}

function queryType(query) {
  const cleaned = query
    .replace(/^\s*#.*$/gm, '')
    .trim();

  const match = cleaned.match(
    /^(?:(?:PREFIX\s+\S+:\s*<[^>]+>|BASE\s+<[^>]+>)\s*)*(SELECT|ASK|CONSTRUCT|DESCRIBE)\b/i
  );

  return match ? match[1].toUpperCase() : null;
}

function validateQuery(query) {
  if (typeof query !== 'string' || !query.trim()) {
    return 'Missing SPARQL query.';
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return `SPARQL query exceeds the ${MAX_QUERY_LENGTH}-character limit.`;
  }

  const scan = keywordScanText(query);

  if (UPDATE_KEYWORDS.test(scan)) {
    return 'SPARQL Update operations are not permitted.';
  }

  if (FEDERATION_KEYWORDS.test(scan)) {
    return 'Federated and remote-dataset SPARQL clauses are not permitted.';
  }

  const type = queryType(query);

  if (!type || !ALLOWED_QUERY_TYPES.has(type)) {
    return 'Only SELECT, ASK, CONSTRUCT, and DESCRIBE queries are permitted.';
  }

  return null;
}

async function loadStore(request, deadline) {
  checkDeadline(deadline);

  // Fixed same-origin URL only. User input is never used to form this fetch.
  const graphUrl = new URL('/glossary.jsonld', request.url);
  const response = await promiseWithDeadline(fetch(graphUrl), deadline);

  if (!response.ok) {
    throw new Error(`Unable to load glossary graph (${response.status})`);
  }

  const jsonldText = await promiseWithDeadline(response.text(), deadline);
  checkDeadline(deadline);

  const parser = new ParserJsonld();
  const quadStream = parser.import(Readable.from([jsonldText]));
  const store = new Store();

  for await (const quad of quadStream) {
    checkDeadline(deadline);
    store.addQuad(quad);
  }

  return store;
}

async function bindingsToJson(result, deadline) {
  const bindings = [];

  for await (const binding of result) {
    checkDeadline(deadline);

    if (bindings.length >= MAX_RESULT_ROWS) {
      throw new ResultLimitError(
        `SELECT result exceeds the ${MAX_RESULT_ROWS}-row limit.`
      );
    }

    const row = {};

    for (const [variable, term] of binding) {
      row[variable.value] = {
        type:
          term.termType === 'Literal'
            ? 'literal'
            : term.termType === 'BlankNode'
              ? 'bnode'
              : 'uri',
        value: term.value
      };

      if (term.termType === 'Literal') {
        if (term.language) {
          row[variable.value]['xml:lang'] = term.language;
        }

        if (term.datatype?.value) {
          row[variable.value].datatype = term.datatype.value;
        }
      }
    }

    bindings.push(row);
  }

  return bindings;
}

async function quadsToTurtle(result, deadline) {
  const writer = new Writer({
    format: 'text/turtle'
  });

  let count = 0;

  for await (const quad of result) {
    checkDeadline(deadline);

    if (count >= MAX_GRAPH_QUADS) {
      throw new ResultLimitError(
        `Graph result exceeds the ${MAX_GRAPH_QUADS}-quad limit.`
      );
    }

    writer.addQuad(quad);
    count += 1;
  }

  return await promiseWithDeadline(
    new Promise((resolve, reject) => {
      writer.end((error, output) => {
        if (error) reject(error);
        else resolve(output);
      });
    }),
    deadline
  );
}

function browserInterface() {
  const exampleSelect =
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?concept ?label
WHERE {
  ?concept a skos:Concept ;
           skos:prefLabel ?label .
}
ORDER BY ?label
LIMIT 25`;

  const exampleAsk =
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

ASK {
  <https://id.i2idl.org/concepts/data-privacy>
    a skos:Concept .
}`;

  const exampleConstruct =
`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

CONSTRUCT {
  <https://id.i2idl.org/concepts/data-privacy>
    ?p ?o .
}
WHERE {
  <https://id.i2idl.org/concepts/data-privacy>
    ?p ?o .
}`;

  const exampleDescribe =
`DESCRIBE <https://id.i2idl.org/concepts/data-privacy>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>I2IDL SPARQL Endpoint</title>
  <style>
    :root { color-scheme: light; font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    body { margin:0; background:#f7f5f0; color:#1f1f1f; }
    main { max-width:960px; margin:0 auto; padding:48px 24px 72px; }
    h1 { margin:0 0 12px; font-size:clamp(2rem,6vw,4rem); line-height:1; }
    p { line-height:1.6; }
    .meta { color:#5d5a54; margin-bottom:32px; }
    .notice { margin:18px 0 32px; padding:14px 16px; background:#eee9f1; border-left:4px solid #3b174b; line-height:1.5; }
    form { background:white; border:1px solid #ddd8cf; border-radius:16px; padding:20px; box-shadow:0 8px 28px rgba(0,0,0,.06); }
    label { display:block; font-weight:700; margin-bottom:8px; }
    textarea { width:100%; min-height:320px; box-sizing:border-box; resize:vertical; padding:16px; font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; border:1px solid #cfc9bf; border-radius:10px; background:#fcfbf8; }
    button { margin-top:14px; border:0; border-radius:10px; padding:12px 18px; background:#3b174b; color:white; font-weight:700; cursor:pointer; }
    .examples { margin-top:32px; display:grid; gap:16px; }
    details { background:white; border:1px solid #ddd8cf; border-radius:12px; padding:14px 16px; }
    summary { cursor:pointer; font-weight:700; }
    pre { overflow-x:auto; white-space:pre-wrap; word-break:break-word; background:#f3f1eb; border-radius:8px; padding:14px; margin-bottom:0; }
    a { color:#3b174b; }
  </style>
</head>
<body>
  <main>
    <h1>I2IDL SPARQL Endpoint</h1>
    <p class="meta">Read-only SPARQL access to the I2IDL Digital Learning Glossary.</p>
    <div class="notice">Supported query forms: SELECT, ASK, CONSTRUCT, and DESCRIBE. SPARQL Update, SERVICE, and remote-dataset clauses are disabled. Queries are subject to execution, result, request-size, and rate limits.</div>
    <form method="get" action="/sparql">
      <label for="query">SPARQL query</label>
      <textarea id="query" name="query">${exampleSelect}</textarea>
      <button type="submit">Run query</button>
    </form>
    <div class="examples">
      <details><summary>Example SELECT query</summary><pre>${exampleSelect}</pre></details>
      <details><summary>Example ASK query</summary><pre>${exampleAsk}</pre></details>
      <details><summary>Example CONSTRUCT query</summary><pre>${exampleConstruct}</pre></details>
      <details><summary>Example DESCRIBE query</summary><pre>${exampleDescribe}</pre></details>
    </div>
    <p style="margin-top:32px">Full JSON-LD graph: <a href="/glossary.jsonld">/glossary.jsonld</a></p>
    <p>Human-readable glossary: <a href="https://www.i2idl.org/glossary">www.i2idl.org/glossary</a></p>
  </main>
</body>
</html>`;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (!['GET', 'POST'].includes(request.method)) {
      return textResponse('Method Not Allowed', 405);
    }

    const rateLimit = checkRateLimit(request);
    if (rateLimit instanceof Response) return rateLimit;

    try {
      const query = await getQuery(request);

      if (request.method === 'GET' && !query.trim()) {
        return htmlResponse(browserInterface());
      }

      const validationError = validateQuery(query);

      if (validationError) {
        return jsonResponse({ error: validationError }, 400);
      }

      const type = queryType(query);
      const deadline = deadlineFromNow();
      const store = await loadStore(request, deadline);

      if (type === 'SELECT') {
        const result = await promiseWithDeadline(
          engine.queryBindings(query, { sources: [store] }),
          deadline
        );

        const bindings = await bindingsToJson(result, deadline);

        return jsonResponse(
          {
            head: {
              vars: bindings.length ? Object.keys(bindings[0]) : []
            },
            results: { bindings }
          },
          200,
          'application/sparql-results+json; charset=utf-8'
        );
      }

      if (type === 'ASK') {
        const boolean = await promiseWithDeadline(
          engine.queryBoolean(query, { sources: [store] }),
          deadline
        );

        return jsonResponse(
          { head: {}, boolean },
          200,
          'application/sparql-results+json; charset=utf-8'
        );
      }

      if (type === 'CONSTRUCT' || type === 'DESCRIBE') {
        const result = await promiseWithDeadline(
          engine.queryQuads(query, { sources: [store] }),
          deadline
        );

        const turtle = await quadsToTurtle(result, deadline);

        return textResponse(
          turtle,
          200,
          'text/turtle; charset=utf-8'
        );
      }

      return jsonResponse({ error: 'Unsupported query type.' }, 400);
    } catch (error) {
      console.error(error);

      if (error instanceof PayloadTooLargeError) {
        return jsonResponse({ error: error.message }, 413);
      }

      if (error instanceof UnsupportedMediaTypeError) {
        return jsonResponse({ error: error.message }, 415);
      }

      if (error instanceof QueryTimeoutError) {
        return jsonResponse({ error: error.message }, 408);
      }

      if (error instanceof ResultLimitError) {
        return jsonResponse({ error: error.message }, 413);
      }

      return jsonResponse({ error: 'SPARQL query failed.' }, 500);
    }
  }
};
