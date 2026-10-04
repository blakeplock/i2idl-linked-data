// SPDX-License-Identifier: Apache-2.0

import process from 'node:process';

const BASE = (process.env.I2IDL_BASE_URL || 'https://id.i2idl.org').replace(/\/$/, '');
const failures = [];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL: ${message}`);
}

async function expectStatus(url, options, expected, label) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    fail(`${label}: request failed: ${error.message}`);
    return null;
  }

  if (response.status !== expected) {
    fail(`${label}: expected HTTP ${expected}, got ${response.status}`);
    return response;
  }

  pass(`${label} returned HTTP ${expected}`);
  return response;
}

console.log(`Validating ${BASE}`);
console.log('');

const graphResponse = await expectStatus(
  `${BASE}/glossary.jsonld`,
  { headers: { Accept: 'application/ld+json' } },
  200,
  'Full JSON-LD graph'
);

if (graphResponse) {
  const contentType = graphResponse.headers.get('content-type') || '';
  if (!contentType.includes('application/ld+json')) {
    fail(`Full JSON-LD graph: wrong Content-Type: ${contentType}`);
  } else {
    pass('Full JSON-LD graph has application/ld+json Content-Type');
  }
}

const conceptUrl = `${BASE}/concepts/ai-assisted-teaching.jsonld`;
const conceptResponse = await expectStatus(
  conceptUrl,
  { headers: { Accept: 'application/ld+json' } },
  200,
  'Concept JSON-LD provenance subgraph'
);

let sourceIds = [];

if (conceptResponse) {
  try {
    const data = await conceptResponse.json();
    const nodes = Array.isArray(data?.['@graph']) ? data['@graph'] : [];
    const byId = new Map(nodes.map(node => [node?.['@id'], node]));
    const concept = byId.get(`${BASE}/concepts/ai-assisted-teaching`);
    const definitionId = concept?.['gs:activeDefinition']?.['@id'];
    const definition = definitionId ? byId.get(definitionId) : null;

    if (!concept || !definition) {
      fail('Concept JSON-LD does not include both concept and active definition');
    } else {
      pass('Concept JSON-LD includes concept and active definition');
    }

    const evidence = Array.isArray(definition?.['gs:evidence'])
      ? definition['gs:evidence']
      : definition?.['gs:evidence']
        ? [definition['gs:evidence']]
        : [];

    sourceIds = [...new Set(
      evidence
        .map(item => item?.['dcterms:source']?.['@id'])
        .filter(Boolean)
    )];

    if (!sourceIds.length) {
      fail('Concept JSON-LD active definition has no source evidence');
    } else if (!sourceIds.every(id => byId.has(id))) {
      fail('Concept JSON-LD does not include every referenced source node');
    } else {
      pass('Concept JSON-LD includes every referenced source node');
    }

    if (
      sourceIds.length &&
      !sourceIds.every(id => typeof byId.get(id)?.['dcterms:title'] === 'string')
    ) {
      fail('One or more source nodes lack dcterms:title');
    } else if (sourceIds.length) {
      pass('Concept JSON-LD source nodes include titles');
    }
  } catch (error) {
    fail(`Concept JSON-LD parse failed: ${error.message}`);
  }
}

const turtleResponse = await expectStatus(
  `${BASE}/concepts/ai-assisted-teaching.ttl`,
  { headers: { Accept: 'text/turtle' } },
  200,
  'Concept Turtle provenance subgraph'
);

if (turtleResponse) {
  const contentType = turtleResponse.headers.get('content-type') || '';
  const turtle = await turtleResponse.text();

  if (!contentType.includes('text/turtle')) {
    fail(`Concept Turtle: wrong Content-Type: ${contentType}`);
  } else {
    pass('Concept Turtle has text/turtle Content-Type');
  }

  if (sourceIds.length && !sourceIds.every(id => turtle.includes(id))) {
    fail('Concept Turtle does not include every referenced source URI');
  } else if (sourceIds.length) {
    pass('Concept Turtle includes the source provenance chain');
  }
}

const redirectResponse = await expectStatus(
  `${BASE}/concepts/ai-assisted-teaching`,
  {
    redirect: 'manual',
    headers: { Accept: 'text/html' }
  },
  303,
  'Human concept redirect'
);

if (redirectResponse) {
  const location = redirectResponse.headers.get('location') || '';
  if (!location.startsWith('https://www.i2idl.org/glossary#')) {
    fail(`Human concept redirect points to unexpected location: ${location}`);
  } else {
    pass('Human concept redirect points to the I2IDL glossary');
  }
}

const select = encodeURIComponent('SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 1');
const sparqlResponse = await expectStatus(
  `${BASE}/sparql?query=${select}`,
  {},
  200,
  'Read-only SPARQL SELECT'
);

if (sparqlResponse) {
  const requiredHeaders = [
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy'
  ];

  for (const header of requiredHeaders) {
    if (!sparqlResponse.headers.get(header)) {
      fail(`SPARQL response missing security header: ${header}`);
    }
  }

  if (requiredHeaders.every(header => sparqlResponse.headers.get(header))) {
    pass('SPARQL response includes baseline security headers');
  }
}

const blockedQueries = [
  {
    label: 'SPARQL SERVICE blocking',
    query: 'SELECT * WHERE { SERVICE <https://example.org/sparql> { ?s ?p ?o } } LIMIT 1'
  },
  {
    label: 'SPARQL FROM blocking',
    query: 'SELECT * FROM <https://example.org/data> WHERE { ?s ?p ?o } LIMIT 1'
  },
  {
    label: 'SPARQL Update blocking',
    query: 'INSERT DATA { <https://example.org/a> <https://example.org/b> <https://example.org/c> }'
  }
];

for (const test of blockedQueries) {
  const response = await expectStatus(
    `${BASE}/sparql?query=${encodeURIComponent(test.query)}`,
    {},
    400,
    test.label
  );

  if (response) {
    const body = await response.text();
    if (!/not permitted|disabled|only select/i.test(body)) {
      fail(`${test.label}: response did not explain that the query is blocked`);
    }
  }
}

const oversized = 'SELECT * WHERE { ?s ?p ?o } #' + 'x'.repeat(17000);
await expectStatus(
  `${BASE}/sparql`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/sparql-query' },
    body: oversized
  },
  413,
  'Oversized SPARQL request blocking'
);

await expectStatus(
  `${BASE}/concepts/%2e%2e%2fsecret.jsonld`,
  { headers: { Accept: 'application/ld+json' } },
  400,
  'Unsafe resolver identifier blocking'
);

console.log('');
if (failures.length) {
  console.error(`LIVE VALIDATION FAILED (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  process.exit(1);
}

console.log('LIVE VALIDATION PASSED');
