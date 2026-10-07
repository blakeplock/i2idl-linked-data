// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const FILE =
  new URL(
    '../public/glossary.jsonld',
    import.meta.url
  );

const BASE =
  'https://id.i2idl.org';

const CURATED_PREFIX =
  `${BASE}/collections/curated/`;

const SAFE_SLUG =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const raw =
  await readFile(
    FILE,
    'utf8'
  );

const graph =
  JSON.parse(raw);

const nodes =
  Array.isArray(
    graph?.['@graph']
  )
    ? graph['@graph']
    : [];

const curated =
  nodes.filter(
    node =>
      node?.['gs:facet'] ===
      'curated'
  );

const failures = [];

function fail(message) {
  failures.push(message);
}

function asArray(value) {
  if (
    value == null
  ) {
    return [];
  }

  return Array.isArray(value)
    ? value
    : [value];
}

for (
  const collection
  of curated
) {
  const id =
    collection?.['@id'];

  if (
    typeof id !== 'string' ||
    !id.startsWith(
      CURATED_PREFIX
    )
  ) {
    fail(
      `Curated collection has invalid URI: ${id || '(missing @id)'}`
    );

    continue;
  }

  const slug =
    id.slice(
      CURATED_PREFIX.length
    );

  if (
    !SAFE_SLUG.test(slug)
  ) {
    fail(
      `${id}: unsafe curated collection slug`
    );
  }

  const types =
    asArray(
      collection['@type']
    );

  if (
    !types.includes(
      'skos:Collection'
    )
  ) {
    fail(
      `${id}: curated collection must be a skos:Collection`
    );
  }

  if (
    typeof collection[
      'skos:prefLabel'
    ] !== 'string' ||
    !collection[
      'skos:prefLabel'
    ].trim()
  ) {
    fail(
      `${id}: missing skos:prefLabel`
    );
  }

  if (
    typeof collection[
      'dcterms:description'
    ] !== 'string' ||
    !collection[
      'dcterms:description'
    ].trim()
  ) {
    fail(
      `${id}: missing dcterms:description`
    );
  }

  const members =
    asArray(
      collection[
        'skos:member'
      ]
    );

  if (
    members.length < 2
  ) {
    fail(
      `${id}: curated collection must contain at least two concepts`
    );
  }
}

console.log(
  `${curated.length} curated collections`
);

if (
  failures.length
) {
  console.error(
    'CURATED COLLECTION VALIDATION FAILED'
  );

  for (
    const message
    of failures
  ) {
    console.error(
      `- ${message}`
    );
  }

  process.exit(1);
}

console.log(
  'PASS: curated collection identifiers and metadata are valid'
);

console.log(
  'CURATED COLLECTION VALIDATION PASSED'
);