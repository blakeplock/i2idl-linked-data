// SPDX-License-Identifier: Apache-2.0

import ParserJsonld from '@rdfjs/parser-jsonld';
import { Writer } from 'n3';
import { Readable } from 'node:stream';

const BASE = 'https://id.i2idl.org';
const HUMAN_GLOSSARY = 'https://www.i2idl.org/glossary';
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ID_LENGTH = 160;

const JSONLD_MEDIA_TYPES = new Set([
  'application/ld+json',
  'application/json'
]);

const TURTLE_MEDIA_TYPES = new Set([
  'text/turtle',
  'application/x-turtle'
]);

function commonHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Vary': 'Accept',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...extra
  };
}

function jsonLdResponse(data, method = 'GET', status = 200) {
  return new Response(
    method === 'HEAD' ? null : JSON.stringify(data, null, 2),
    {
      status,
      headers: commonHeaders({
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      })
    }
  );
}

function turtleResponse(turtle, method = 'GET', status = 200) {
  return new Response(
    method === 'HEAD' ? null : turtle,
    {
      status,
      headers: commonHeaders({
        'Content-Type': 'text/turtle; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      })
    }
  );
}

function textResponse(message, method = 'GET', status = 200) {
  return new Response(
    method === 'HEAD' ? null : message,
    {
      status,
      headers: commonHeaders({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      })
    }
  );
}

function explicitFormat(url) {
  const format = (
    url.searchParams.get('format') || ''
  ).toLowerCase();

  if (format === 'jsonld') {
    return 'jsonld';
  }

  if (format === 'ttl') {
    return 'ttl';
  }

  return null;
}

function parseAcceptHeader(request) {
  const header =
    request.headers.get('accept') || '';

  if (!header.trim()) {
    return [];
  }

  return header
    .split(',')
    .map((entry, index) => {
      const parts = entry
        .split(';')
        .map(part => part.trim());

      const mediaType =
        (parts.shift() || '').toLowerCase();

      let quality = 1;

      for (const parameter of parts) {
        const separator =
          parameter.indexOf('=');

        if (separator === -1) {
          continue;
        }

        const name = parameter
          .slice(0, separator)
          .trim()
          .toLowerCase();

        if (name !== 'q') {
          continue;
        }

        const value = Number(
          parameter
            .slice(separator + 1)
            .trim()
        );

        quality =
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 1
            ? value
            : 0;

        break;
      }

      return {
        mediaType,
        quality,
        index
      };
    })
    .filter(entry => entry.mediaType);
}

function preferredSemanticFormat(request, url) {
  // Explicit serialization routes always win over Accept negotiation.
  // Vercel rewrites .jsonld and .ttl routes into these format parameters.
  const explicit =
    explicitFormat(url);

  if (explicit) {
    return explicit;
  }

  const accepted =
    parseAcceptHeader(request);

  let best = null;

  for (const entry of accepted) {
    if (entry.quality <= 0) {
      continue;
    }

    let format = null;

    if (
      JSONLD_MEDIA_TYPES.has(
        entry.mediaType
      )
    ) {
      format = 'jsonld';
    } else if (
      TURTLE_MEDIA_TYPES.has(
        entry.mediaType
      )
    ) {
      format = 'ttl';
    }

    if (!format) {
      continue;
    }

    if (
      !best ||
      entry.quality > best.quality ||
      (
        entry.quality === best.quality &&
        entry.index < best.index
      )
    ) {
      best = {
        format,
        quality: entry.quality,
        index: entry.index
      };
    }
  }

  return best?.format || null;
}

function assertInlineContext(data) {
  const context = data?.['@context'];

  if (
    !context ||
    Array.isArray(context) ||
    typeof context !== 'object'
  ) {
    throw new Error(
      'Glossary JSON-LD must use an inline @context object.'
    );
  }

  if (Object.hasOwn(context, '@import')) {
    throw new Error(
      'Remote JSON-LD @context imports are not permitted.'
    );
  }
}

async function loadGraph(request) {
  // Fixed same-origin URL only. Request parameters never influence this fetch.
  const url =
    new URL(
      '/glossary.jsonld',
      request.url
    );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to load glossary graph (${response.status})`
    );
  }

  const graph =
    await response.json();

  assertInlineContext(graph);

  return graph;
}

function graphNodes(data) {
  return Array.isArray(
    data?.['@graph']
  )
    ? data['@graph']
    : [];
}

function findById(data, id) {
  return graphNodes(data)
    .find(
      node =>
        node?.['@id'] === id
    );
}

function compactNode(graph, node) {
  return {
    '@context': graph['@context'],
    ...node
  };
}

function graphDocument(graph, nodes) {
  return {
    '@context': graph['@context'],
    '@graph': nodes
  };
}

function asArray(value) {
  if (value == null) {
    return [];
  }

  return Array.isArray(value)
    ? value
    : [value];
}

function refId(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    return value['@id'] || null;
  }

  return null;
}

function sourceIdsFromDefinition(definition) {
  const ids = new Set();

  for (
    const evidence
    of asArray(
      definition?.['gs:evidence']
    )
  ) {
    for (
      const key
      of [
        'dcterms:source',
        'prov:wasDerivedFrom'
      ]
    ) {
      for (
        const value
        of asArray(
          evidence?.[key]
        )
      ) {
        const id =
          refId(value);

        if (id) {
          ids.add(id);
        }
      }
    }
  }

  return [...ids];
}

function definitionSubgraph(
  graph,
  definition
) {
  const nodes = [definition];

  for (
    const sourceId
    of sourceIdsFromDefinition(
      definition
    )
  ) {
    const source =
      findById(
        graph,
        sourceId
      );

    if (source) {
      nodes.push(source);
    }
  }

  return graphDocument(
    graph,
    nodes
  );
}

function conceptSubgraph(
  graph,
  concept
) {
  const nodes = [concept];
  const definitionIds =
    new Set();

  for (
    const value
    of asArray(
      concept?.['gs:activeDefinition']
    )
  ) {
    const id =
      refId(value);

    if (id) {
      definitionIds.add(id);
    }
  }

  for (
    const definitionId
    of definitionIds
  ) {
    const definition =
      findById(
        graph,
        definitionId
      );

    if (!definition) {
      continue;
    }

    nodes.push(definition);

    for (
      const sourceId
      of sourceIdsFromDefinition(
        definition
      )
    ) {
      const source =
        findById(
          graph,
          sourceId
        );

      if (
        source &&
        !nodes.some(
          node =>
            node?.['@id'] ===
            source['@id']
        )
      ) {
        nodes.push(source);
      }
    }
  }

  return graphDocument(
    graph,
    nodes
  );
}

async function jsonLdToTurtle(data) {
  assertInlineContext(data);

  const parser =
    new ParserJsonld();

  const input =
    JSON.stringify(data);

  const quadStream =
    parser.import(
      Readable.from([input])
    );

  const writer =
    new Writer({
      format: 'text/turtle'
    });

  for await (
    const quad
    of quadStream
  ) {
    writer.addQuad(quad);
  }

  return await new Promise(
    (resolve, reject) => {
      writer.end(
        (error, output) => {
          if (error) {
            reject(error);
          } else {
            resolve(output);
          }
        }
      );
    }
  );
}

async function semanticResponse(
  request,
  url,
  data,
  method,
  defaultFormat = 'jsonld'
) {
  const format =
    preferredSemanticFormat(
      request,
      url
    ) || defaultFormat;

  if (format === 'ttl') {
    const turtle =
      await jsonLdToTurtle(data);

    return turtleResponse(
      turtle,
      method
    );
  }

  return jsonLdResponse(
    data,
    method
  );
}

function safeDecodedId(rawId) {
  if (
    typeof rawId !== 'string' ||
    rawId.length >
      MAX_ID_LENGTH * 3
  ) {
    return null;
  }

  let decoded;

  try {
    decoded =
      decodeURIComponent(rawId);
  } catch (_) {
    return null;
  }

  if (
    decoded.length >
      MAX_ID_LENGTH ||
    !SAFE_ID.test(decoded)
  ) {
    return null;
  }

  return decoded;
}

export default {
  async fetch(request) {
    const method =
      request.method.toUpperCase();

    const url =
      new URL(request.url);

    if (method === 'OPTIONS') {
      return new Response(
        null,
        {
          status: 204,
          headers: commonHeaders()
        }
      );
    }

    if (
      ![
        'GET',
        'HEAD'
      ].includes(method)
    ) {
      return textResponse(
        'Method Not Allowed',
        method,
        405
      );
    }

    try {
      const kind =
        url.searchParams.get('kind');

      const id =
        url.searchParams.get('id');

      const graph =
        await loadGraph(request);

      if (kind === 'glossary') {
        const format =
          preferredSemanticFormat(
            request,
            url
          );

        if (format === 'ttl') {
          const turtle =
            await jsonLdToTurtle(
              graph
            );

          return turtleResponse(
            turtle,
            method
          );
        }

        if (format === 'jsonld') {
          return jsonLdResponse(
            graph,
            method
          );
        }

        return Response.redirect(
          HUMAN_GLOSSARY,
          303
        );
      }

      if (kind === 'scheme') {
        const node =
          findById(
            graph,
            `${BASE}/scheme`
          );

        if (!node) {
          return textResponse(
            'Scheme not found',
            method,
            404
          );
        }

        const format =
          preferredSemanticFormat(
            request,
            url
          );

        if (format) {
          return await semanticResponse(
            request,
            url,
            compactNode(
              graph,
              node
            ),
            method
          );
        }

        return Response.redirect(
          HUMAN_GLOSSARY,
          303
        );
      }

      const prefixes = {
        concept: 'concepts',
        definition: 'definitions',
        source: 'sources'
      };

      if (
        prefixes[kind] &&
        id
      ) {
        const decodedId =
          safeDecodedId(id);

        if (!decodedId) {
          return textResponse(
            'Invalid identifier',
            method,
            400
          );
        }

        const canonicalId =
          `${BASE}/${prefixes[kind]}/${decodedId}`;

        const node =
          findById(
            graph,
            canonicalId
          );

        if (!node) {
          return textResponse(
            `${
              kind[0].toUpperCase() +
              kind.slice(1)
            } not found`,
            method,
            404
          );
        }

        if (kind === 'concept') {
          const format =
            preferredSemanticFormat(
              request,
              url
            );

          if (format) {
            return await semanticResponse(
              request,
              url,
              conceptSubgraph(
                graph,
                node
              ),
              method
            );
          }

          return Response.redirect(
            `${HUMAN_GLOSSARY}#${encodeURIComponent(decodedId)}`,
            303
          );
        }

        if (kind === 'definition') {
          return await semanticResponse(
            request,
            url,
            definitionSubgraph(
              graph,
              node
            ),
            method
          );
        }

        if (kind === 'source') {
          return await semanticResponse(
            request,
            url,
            compactNode(
              graph,
              node
            ),
            method
          );
        }
      }

      return textResponse(
        'Not found',
        method,
        404
      );
    } catch (error) {
      console.error(error);

      return textResponse(
        'Linked Data service error',
        method,
        500
      );
    }
  }
};