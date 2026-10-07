// SPDX-License-Identifier: Apache-2.0

import { Worker } from 'node:worker_threads';
import { Parser as SparqlParser } from 'sparqljs';

const ALLOWED_QUERY_TYPES = new Set([
  'SELECT',
  'ASK',
  'CONSTRUCT',
  'DESCRIBE'
]);

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

  if (rateBuckets.size > 5000) {
    for (const [bucketKey, value] of rateBuckets) {
      if (now >= value.resetAt) {
        rateBuckets.delete(bucketKey);
      }
    }

    if (rateBuckets.size > 10000) {
      rateBuckets.clear();
      rateBuckets.set(key, bucket);
    }
  }

  const remaining =
    Math.max(
      0,
      RATE_LIMIT_MAX - bucket.count
    );

  const resetSeconds =
    Math.max(
      1,
      Math.ceil(
        (bucket.resetAt - now) / 1000
      )
    );

  const headers = {
    'RateLimit-Limit':
      String(RATE_LIMIT_MAX),
    'RateLimit-Remaining':
      String(remaining),
    'RateLimit-Reset':
      String(resetSeconds)
  };

  if (bucket.count > RATE_LIMIT_MAX) {
    return jsonResponse(
      {
        error:
          'Too many SPARQL requests. Please retry later.'
      },
      429,
      'application/json; charset=utf-8',
      {
        ...headers,
        'Retry-After':
          String(resetSeconds)
      }
    );
  }

  return { headers };
}

async function readBodyLimited(request) {
  const declaredLength =
    Number(
      request.headers.get(
        'content-length'
      ) || 0
    );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength >
      MAX_POST_BODY_BYTES
  ) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) {
    return '';
  }

  const reader =
    request.body.getReader();

  const chunks = [];
  let total = 0;

  try {
    while (true) {
      const {
        done,
        value
      } = await reader.read();

      if (done) {
        break;
      }

      total += value.byteLength;

      if (
        total >
        MAX_POST_BODY_BYTES
      ) {
        try {
          await reader.cancel();
        } catch (_) {}

        throw new PayloadTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged =
    new Uint8Array(total);

  let offset = 0;

  for (const chunk of chunks) {
    merged.set(
      chunk,
      offset
    );

    offset +=
      chunk.byteLength;
  }

  return new TextDecoder(
    'utf-8',
    { fatal: false }
  ).decode(merged);
}

async function getQuery(request) {
  const url =
    new URL(request.url);

  if (request.method === 'GET') {
    return (
      url.searchParams.get('query') ||
      ''
    );
  }

  const contentType = (
    request.headers.get(
      'content-type'
    ) || ''
  )
    .split(';', 1)[0]
    .trim()
    .toLowerCase();

  const allowedTypes =
    new Set([
      '',
      'text/plain',
      'application/sparql-query',
      'application/x-www-form-urlencoded',
      'application/json'
    ]);

  if (
    !allowedTypes.has(
      contentType
    )
  ) {
    throw new UnsupportedMediaTypeError();
  }

  const body =
    await readBodyLimited(
      request
    );

  if (
    contentType ===
      'application/sparql-query' ||
    contentType ===
      'text/plain' ||
    contentType === ''
  ) {
    return body;
  }

  if (
    contentType ===
    'application/x-www-form-urlencoded'
  ) {
    const params =
      new URLSearchParams(body);

    return (
      params.get('query') ||
      ''
    );
  }

  if (
    contentType ===
    'application/json'
  ) {
    let parsed;

    try {
      parsed =
        JSON.parse(
          body || '{}'
        );
    } catch (_) {
      return '';
    }

    return (
      typeof parsed?.query ===
      'string'
        ? parsed.query
        : ''
    );
  }

  return '';
}

function containsServicePattern(value) {
  const seen =
    new WeakSet();

  const visit = (node) => {
    if (
      !node ||
      typeof node !== 'object'
    ) {
      return false;
    }

    if (seen.has(node)) {
      return false;
    }

    seen.add(node);

    if (
      node.type === 'service'
    ) {
      return true;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        if (visit(item)) {
          return true;
        }
      }

      return false;
    }

    for (
      const child
      of Object.values(node)
    ) {
      if (visit(child)) {
        return true;
      }
    }

    return false;
  };

  return visit(value);
}

function hasDatasetClause(parsed) {
  const from =
    parsed?.from;

  if (
    !from ||
    typeof from !== 'object'
  ) {
    return false;
  }

  const defaults =
    Array.isArray(from.default)
      ? from.default
      : [];

  const named =
    Array.isArray(from.named)
      ? from.named
      : [];

  return (
    defaults.length > 0 ||
    named.length > 0
  );
}

function validateQuery(query) {
  if (
    typeof query !== 'string' ||
    !query.trim()
  ) {
    return {
      error:
        'Missing SPARQL query.',
      type: null
    };
  }

  if (
    query.length >
    MAX_QUERY_LENGTH
  ) {
    return {
      error:
        `SPARQL query exceeds the ${MAX_QUERY_LENGTH}-character limit.`,
      type: null
    };
  }

  let parsed;

  try {
    const parser =
      new SparqlParser();

    parsed =
      parser.parse(query);
  } catch (_) {
    return {
      error:
        'Invalid SPARQL query.',
      type: null
    };
  }

  if (
    parsed?.type !== 'query'
  ) {
    return {
      error:
        'SPARQL Update operations are not permitted.',
      type: null
    };
  }

  const type =
    String(
      parsed.queryType || ''
    ).toUpperCase();

  if (
    !ALLOWED_QUERY_TYPES.has(
      type
    )
  ) {
    return {
      error:
        'Only SELECT, ASK, CONSTRUCT, and DESCRIBE queries are permitted.',
      type: null
    };
  }

  if (
    containsServicePattern(
      parsed
    ) ||
    hasDatasetClause(
      parsed
    )
  ) {
    return {
      error:
        'Federated and remote-dataset SPARQL clauses are not permitted.',
      type: null
    };
  }

  return {
    error: null,
    type
  };
}

function runQueryInWorker(
  query,
  type,
  graphUrl,
  abortSignal
) {
  return new Promise(
    (resolve, reject) => {
      const worker =
        new Worker(
          new URL(
            '../lib/sparql-query-worker.mjs',
            import.meta.url
          ),
          {
            workerData: {
              query,
              type,
              graphUrl,
              maxResultRows:
                MAX_RESULT_ROWS,
              maxGraphQuads:
                MAX_GRAPH_QUADS
            }
          }
        );

      let settled = false;

      const cleanup = () => {
        clearTimeout(timeout);

        if (abortSignal) {
          abortSignal
            .removeEventListener(
              'abort',
              onAbort
            );
        }
      };

      const finish =
        (callback) => {
          if (settled) {
            return;
          }

          settled = true;
          cleanup();
          callback();
        };

      const terminate = () => {
        worker
          .terminate()
          .catch(() => {});
      };

      const onAbort = () => {
        if (settled) {
          return;
        }

        finish(() => {
          terminate();

          const error =
            new Error(
              'SPARQL request was cancelled.'
            );

          error.name =
            'AbortError';

          reject(error);
        });
      };

      const timeout =
        setTimeout(
          () => {
            if (settled) {
              return;
            }

            finish(() => {
              terminate();

              reject(
                new QueryTimeoutError()
              );
            });
          },
          QUERY_TIMEOUT_MS
        );

      if (abortSignal) {
        if (
          abortSignal.aborted
        ) {
          onAbort();
          return;
        }

        abortSignal
          .addEventListener(
            'abort',
            onAbort,
            { once: true }
          );
      }

      worker.once(
        'message',
        (message) => {
          finish(() => {
            if (message?.ok) {
              resolve(
                message.result
              );

              return;
            }

            if (
              message
                ?.error
                ?.name ===
              'ResultLimitError'
            ) {
              reject(
                new ResultLimitError(
                  message.error
                    .message
                )
              );

              return;
            }

            const error =
              new Error(
                message
                  ?.error
                  ?.message ||
                'SPARQL worker failed.'
              );

            error.name =
              message
                ?.error
                ?.name ||
              'Error';

            reject(error);
          });
        }
      );

      worker.once(
        'error',
        (error) => {
          finish(
            () =>
              reject(error)
          );
        }
      );

      worker.once(
        'exit',
        (code) => {
          if (!settled) {
            finish(() => {
              reject(
                new Error(
                  `SPARQL worker exited before returning a result (code ${code}).`
                )
              );
            });
          }
        }
      );
    }
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
      <details>
        <summary>Example SELECT query</summary>
        <pre>${exampleSelect}</pre>
      </details>

      <details>
        <summary>Example ASK query</summary>
        <pre>${exampleAsk}</pre>
      </details>

      <details>
        <summary>Example CONSTRUCT query</summary>
        <pre>${exampleConstruct}</pre>
      </details>

      <details>
        <summary>Example DESCRIBE query</summary>
        <pre>${exampleDescribe}</pre>
      </details>
    </div>

    <p style="margin-top:32px">
      Full JSON-LD graph:
      <a href="/glossary.jsonld">/glossary.jsonld</a>
    </p>

    <p>
      Human-readable glossary:
      <a href="https://www.i2idl.org/glossary">
        www.i2idl.org/glossary
      </a>
    </p>
  </main>
</body>
</html>`;
}

export default {
  async fetch(request) {
    if (
      request.method ===
      'OPTIONS'
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers:
            corsHeaders()
        }
      );
    }

    if (
      ![
        'GET',
        'POST'
      ].includes(
        request.method
      )
    ) {
      return textResponse(
        'Method Not Allowed',
        405
      );
    }

    const rateLimit =
      checkRateLimit(
        request
      );

    if (
      rateLimit instanceof
      Response
    ) {
      return rateLimit;
    }

    try {
      const query =
        await getQuery(
          request
        );

      if (
        request.method ===
          'GET' &&
        !query.trim()
      ) {
        return htmlResponse(
          browserInterface()
        );
      }

      const validation =
        validateQuery(query);

      if (
        validation.error
      ) {
        return jsonResponse(
          {
            error:
              validation.error
          },
          400
        );
      }

      const type =
        validation.type;

      const graphUrl =
        new URL(
          '/glossary.jsonld',
          request.url
        ).href;

      const result =
        await runQueryInWorker(
          query,
          type,
          graphUrl,
          request.signal
        );

      if (
        type === 'SELECT'
      ) {
        return jsonResponse(
          {
            head: {
              vars:
                result.vars
            },
            results: {
              bindings:
                result.bindings
            }
          },
          200,
          'application/sparql-results+json; charset=utf-8'
        );
      }

      if (
        type === 'ASK'
      ) {
        return jsonResponse(
          {
            head: {},
            boolean:
              result.boolean
          },
          200,
          'application/sparql-results+json; charset=utf-8'
        );
      }

      if (
        type ===
          'CONSTRUCT' ||
        type ===
          'DESCRIBE'
      ) {
        return textResponse(
          result.turtle,
          200,
          'text/turtle; charset=utf-8'
        );
      }

      return jsonResponse(
        {
          error:
            'Unsupported query type.'
        },
        400
      );
    } catch (error) {
      console.error(error);

      if (
        error instanceof
        PayloadTooLargeError
      ) {
        return jsonResponse(
          {
            error:
              error.message
          },
          413
        );
      }

      if (
        error instanceof
        UnsupportedMediaTypeError
      ) {
        return jsonResponse(
          {
            error:
              error.message
          },
          415
        );
      }

      if (
        error instanceof
        QueryTimeoutError
      ) {
        return jsonResponse(
          {
            error:
              error.message
          },
          408
        );
      }

      if (
        error instanceof
        ResultLimitError
      ) {
        return jsonResponse(
          {
            error:
              error.message
          },
          413
        );
      }

      return jsonResponse(
        {
          error:
            'SPARQL query failed.'
        },
        500
      );
    }
  }
};