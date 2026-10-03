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
    .replace(/#[^\n\r]*/g, '')
    .trim();

  const match = cleaned.match(
    /^(?:PREFIX\s+\S+:\s*<[^>]+>\s*)*(SELECT|ASK|CONSTRUCT|DESCRIBE)\b/i
  );

  return match
    ? match[1].toUpperCase()
    : null;
}

function validateQuery(query) {
  if (!query.trim()) {
    return 'Missing SPARQL query.';
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