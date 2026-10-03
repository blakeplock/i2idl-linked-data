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

const MAX_QUERY_LENGTH = 12000;

async function loadStore(request) {
  const graphUrl = new URL('/glossary.jsonld', request.url);
  const response = await fetch(graphUrl);

  if (!response.ok) {
    throw new Error(
      `Unable to load glossary graph (${response.status})`
    );
  }

  const jsonldText = await response.text();

  const parser = new ParserJsonld();

  const quadStream = parser.import(
    Readable.from([jsonldText])
  );

  const store = new Store();

  for await (const quad of quadStream) {
    store.addQuad(quad);
  }

  return store;
}

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    ...extra
  };
}

function jsonResponse(
  data,
  status = 200,
  contentType = 'application/json; charset=utf-8'
) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: corsHeaders({
        'Content-Type': contentType
      })
    }
  );
}

function textResponse(
  text,
  status = 200,
  contentType = 'text/plain; charset=utf-8'
) {
  return new Response(text, {
    status,
    headers: corsHeaders({
      'Content-Type': contentType
    })
  });
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: corsHeaders({
      'Content-Type': 'text/html; charset=utf-8'
    })
  });
}

async function getQuery(request) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const raw = url.searchParams.get('query') || '';
    return raw.replace(/\+/g, ' ');
  }

  const contentType =
    request.headers.get('content-type') || '';

  if (
    contentType.includes('application/sparql-query')
  ) {
    return await request.text();
  }

  if (
    contentType.includes(
      'application/x-www-form-urlencoded'
    )
  ) {
    const body = await request.text();
    const params = new URLSearchParams(body);

    return (
      params.get('query') || ''
    ).replace(/\+/g, ' ');
  }

  if (contentType.includes('application/json')) {
    const body = await request.json();
    return body?.query || '';
  }

  return await request.text();
}

function queryType(query) {
  const cleaned = query
    .replace(/^\s*#.*$/gm, '')
    .trim();

  const match = cleaned.match(
    /^(?:(?:PREFIX\s+\S+:\s*<[^>]+>|BASE\s+<[^>]+>)\s*)*(SELECT|ASK|CONSTRUCT|DESCRIBE)\b/i
  );

  return match
    ? match[1].toUpperCase()
    : null;
}

function validateQuery(query) {
  if (!query.trim()) {
    return 'Missing SPARQL query.';
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return `SPARQL query exceeds the ${MAX_QUERY_LENGTH}-character limit.`;
  }

  if (UPDATE_KEYWORDS.test(query)) {
    return 'SPARQL Update operations are not permitted.';
  }

  const type = queryType(query);

  if (
    !type ||
    !ALLOWED_QUERY_TYPES.has(type)
  ) {
    return 'Only SELECT, ASK, CONSTRUCT, and DESCRIBE queries are permitted.';
  }

  return null;
}

async function bindingsToJson(result) {
  const bindings = [];

  for await (const binding of result) {
    const row = {};

    for (const [variable, term] of binding) {
      row[variable.value] = {
        type:
          term.termType === 'Literal'
            ? 'literal'
            : 'uri',
        value: term.value
      };

      if (term.termType === 'Literal') {
        if (term.language) {
          row[variable.value]['xml:lang'] =
            term.language;
        }

        if (term.datatype?.value) {
          row[variable.value].datatype =
            term.datatype.value;
        }
      }
    }

    bindings.push(row);
  }

  return bindings;
}

async function quadsToTurtle(result) {
  const writer = new Writer({
    format: 'text/turtle'
  });

  for await (const quad of result) {
    writer.addQuad(quad);
  }

  return await new Promise(
    (resolve, reject) => {
      writer.end((error, output) => {
        if (error) {
          reject(error);
        } else {
          resolve(output);
        }
      });
    }
  );
}

function browserInterface() {
  const exampleSelect = `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?concept ?label
WHERE {
  ?concept a skos:Concept ;
           skos:prefLabel ?label .
}
ORDER BY ?label
LIMIT 25`;

  const exampleAsk = `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

ASK {
  <https://id.i2idl.org/concepts/data-privacy>
    a skos:Concept .
}`;

  const exampleConstruct = `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

CONSTRUCT {
  <https://id.i2idl.org/concepts/data-privacy> ?p ?o .
}
WHERE {
  <https://id.i2idl.org/concepts/data-privacy> ?p ?o .
}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>I2IDL SPARQL Endpoint</title>
  <style>
    :root {
      color-scheme: light;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      margin: 0;
      background: #f7f5f0;
      color: #1f1f1f;
    }

    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 24px 72px;
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 6vw, 4rem);
      line-height: 1;
    }

    p {
      line-height: 1.6;
    }

    .meta {
      color: #5d5a54;
      margin-bottom: 32px;
    }

    form {
      background: white;
      border: 1px solid #ddd8cf;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 8px 28px rgba(0,0,0,.06);
    }

    label {
      display: block;
      font-weight: 700;
      margin-bottom: 8px;
    }

    textarea {
      width: 100%;
      min-height: 320px;
      box-sizing: border-box;
      resize: vertical;
      padding: 16px;
      font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      border: 1px solid #cfc9bf;
      border-radius: 10px;
      background: #fcfbf8;
    }

    button {
      margin-top: 14px;
      border: 0;
      border-radius: 10px;
      padding: 12px 18px;
      background: #3b174b;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    .examples {
      margin-top: 32px;
      display: grid;
      gap: 16px;
    }

    details {
      background: white;
      border: 1px solid #ddd8cf;
      border-radius: 12px;
      padding: 14px 16px;
    }

    summary {
      cursor: pointer;
      font-weight: 700;
    }

    pre {
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f3f1eb;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 0;
    }

    a {
      color: #3b174b;
    }
  </style>
</head>
<body>
  <main>
    <h1>I2IDL SPARQL Endpoint</h1>

    <p class="meta">
      Read-only SPARQL access to the I2IDL Digital Learning Glossary.
      Supported query forms: SELECT, ASK, CONSTRUCT, and DESCRIBE.
    </p>

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
    </div>

    <p style="margin-top:32px">
      Full JSON-LD graph:
      <a href="/glossary.jsonld">/glossary.jsonld</a>
    </p>
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

    if (
      !['GET', 'POST'].includes(request.method)
    ) {
      return textResponse(
        'Method Not Allowed',
        405
      );
    }

    try {
      const query = await getQuery(request);

      if (
        request.method === 'GET' &&
        !query.trim()
      ) {
        return htmlResponse(
          browserInterface()
        );
      }

      const validationError =
        validateQuery(query);

      if (validationError) {
        return jsonResponse(
          { error: validationError },
          400
        );
      }

      const type = queryType(query);
      const store = await loadStore(request);

      if (type === 'SELECT') {
        const result =
          await engine.queryBindings(
            query,
            {
              sources: [store]
            }
          );

        const bindings =
          await bindingsToJson(result);

        return jsonResponse(
          {
            head: {
              vars: bindings.length
                ? Object.keys(bindings[0])
                : []
            },
            results: {
              bindings
            }
          },
          200,
          'application/sparql-results+json; charset=utf-8'
        );
      }

      if (type === 'ASK') {
        const boolean =
          await engine.queryBoolean(
            query,
            {
              sources: [store]
            }
          );

        return jsonResponse(
          {
            head: {},
            boolean
          },
          200,
          'application/sparql-results+json; charset=utf-8'
        );
      }

      if (
        type === 'CONSTRUCT' ||
        type === 'DESCRIBE'
      ) {
        const result =
          await engine.queryQuads(
            query,
            {
              sources: [store]
            }
          );

        const turtle =
          await quadsToTurtle(result);

        return textResponse(
          turtle,
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