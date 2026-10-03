// SPDX-License-Identifier: Apache-2.0

import ParserJsonld from '@rdfjs/parser-jsonld';
import { Writer } from 'n3';
import { Readable } from 'node:stream';

const BASE = 'https://id.i2idl.org';
const HUMAN_GLOSSARY = 'https://www.i2idl.org/glossary';

function commonHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    Vary: 'Accept',
    ...extra
  };
}

function jsonLdResponse(
  data,
  method = 'GET',
  status = 200
) {
  return new Response(
    method === 'HEAD'
      ? null
      : JSON.stringify(data, null, 2),
    {
      status,
      headers: commonHeaders({
        'Content-Type':
          'application/ld+json; charset=utf-8',
        'Cache-Control':
          'public, max-age=3600'
      })
    }
  );
}

function turtleResponse(
  turtle,
  method = 'GET',
  status = 200
) {
  return new Response(
    method === 'HEAD'
      ? null
      : turtle,
    {
      status,
      headers: commonHeaders({
        'Content-Type':
          'text/turtle; charset=utf-8',
        'Cache-Control':
          'public, max-age=3600'
      })
    }
  );
}

function textResponse(
  message,
  method = 'GET',
  status = 200
) {
  return new Response(
    method === 'HEAD'
      ? null
      : message,
    {
      status,
      headers: commonHeaders({
        'Content-Type':
          'text/plain; charset=utf-8'
      })
    }
  );
}

function wantsJsonLd(request, url) {
  if (
    url.searchParams.get('format') ===
    'jsonld'
  ) {
    return true;
  }

  const accept =
    request.headers.get('accept') || '';

  return (
    accept.includes(
      'application/ld+json'
    ) ||
    accept.includes(
      'application/json'
    )
  );
}

function wantsTurtle(request, url) {
  if (
    url.searchParams.get('format') ===
    'ttl'
  ) {
    return true;
  }

  const accept =
    request.headers.get('accept') || '';

  return (
    accept.includes('text/turtle') ||
    accept.includes(
      'application/x-turtle'
    )
  );
}

async function loadGraph(request) {
  const url = new URL(
    '/glossary.jsonld',
    request.url
  );

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to load glossary graph (${response.status})`
    );
  }

  return response.json();
}

function graphNodes(data) {
  return Array.isArray(
    data?.['@graph']
  )
    ? data['@graph']
    : [];
}

function findById(data, id) {
  return graphNodes(data).find(
    node => node?.['@id'] === id
  );
}

function compactNode(graph, node) {
  return {
    '@context':
      graph['@context'],
    ...node
  };
}

async function jsonLdToTurtle(data) {
  const parser =
    new ParserJsonld();

  const input =
    JSON.stringify(data);

  const quadStream =
    parser.import(
      Readable.from([input])
    );

  const writer = new Writer({
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
  graph,
  node,
  method
) {
  const data =
    compactNode(
      graph,
      node
    );

  if (
    wantsTurtle(
      request,
      url
    )
  ) {
    const turtle =
      await jsonLdToTurtle(
        data
      );

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

export default {
  async fetch(request) {
    const method =
      request.method.toUpperCase();

    const url =
      new URL(request.url);

    if (
      method === 'OPTIONS'
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers:
            commonHeaders()
        }
      );
    }

    if (
      !['GET', 'HEAD']
        .includes(method)
    ) {
      return textResponse(
        'Method Not Allowed',
        method,
        405
      );
    }

    try {
      const kind =
        url.searchParams.get(
          'kind'
        );

      const id =
        url.searchParams.get(
          'id'
        );

      const graph =
        await loadGraph(
          request
        );

      if (
        kind === 'glossary'
      ) {
        if (
          wantsTurtle(
            request,
            url
          )
        ) {
          const turtle =
            await jsonLdToTurtle(
              graph
            );

          return turtleResponse(
            turtle,
            method
          );
        }

        if (
          wantsJsonLd(
            request,
            url
          )
        ) {
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

      if (
        kind === 'scheme'
      ) {
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

        if (
          wantsTurtle(
            request,
            url
          ) ||
          wantsJsonLd(
            request,
            url
          )
        ) {
          return await semanticResponse(
            request,
            url,
            graph,
            node,
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
          decodeURIComponent(id);

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
              kind[0]
                .toUpperCase() +
              kind.slice(1)
            } not found`,
            method,
            404
          );
        }

        if (
          wantsTurtle(
            request,
            url
          ) ||
          wantsJsonLd(
            request,
            url
          )
        ) {
          return await semanticResponse(
            request,
            url,
            graph,
            node,
            method
          );
        }

        if (
          kind === 'concept'
        ) {
          return Response.redirect(
            `${HUMAN_GLOSSARY}#${encodeURIComponent(decodedId)}`,
            303
          );
        }

        return jsonLdResponse(
          compactNode(
            graph,
            node
          ),
          method
        );
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