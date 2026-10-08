// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';

const FILE =
  new URL(
    '../public/glossary.jsonld',
    import.meta.url
  );

const SHOW_ISOLATED =
  process.argv.includes('--isolated');

const raw =
  await readFile(
    FILE,
    'utf8'
  );

const graph =
  JSON.parse(raw);

const nodes =
  graph['@graph'] ?? [];

const array =
  value =>
    value == null
      ? []
      : Array.isArray(value)
        ? value
        : [value];

const concepts =
  nodes.filter(
    node =>
      array(node['@type'])
        .includes('skos:Concept')
  );

const fieldCollections =
  nodes.filter(
    node =>
      array(node['@type'])
        .includes('skos:Collection') &&
      node['@id']?.includes('/collections/field/')
  );

const byId =
  new Map(
    concepts.map(
      concept => [
        concept['@id'],
        concept
      ]
    )
  );

function isConnected(concept) {
  return [
    'skos:broader',
    'skos:narrower',
    'skos:related'
  ].some(
    property =>
      array(
        concept[property]
      ).length > 0
  );
}

function percent(
  connected,
  total
) {
  if (total === 0) {
    return '0.0%';
  }

  return `${(
    connected /
    total *
    100
  ).toFixed(1)}%`;
}

const connectedConcepts =
  concepts.filter(
    isConnected
  );

const isolatedConcepts =
  concepts.filter(
    concept =>
      !isConnected(concept)
  );

console.log(
  '\nI2IDL Semantic Relationship Coverage\n'
);

console.log(
  `Overall: ${connectedConcepts.length}/${concepts.length} connected ` +
  `(${percent(connectedConcepts.length, concepts.length)})`
);

console.log(
  `Isolated: ${isolatedConcepts.length}\n`
);

const fieldRows =
  fieldCollections
    .map(
      collection => {
        const memberIds =
          array(
            collection['skos:member']
          )
            .map(
              member =>
                member?.['@id']
            )
            .filter(Boolean);

        const members =
          memberIds
            .map(
              id =>
                byId.get(id)
            )
            .filter(Boolean);

        const connected =
          members.filter(
            isConnected
          ).length;

        const isolated =
          members.length -
          connected;

        return {
          field:
            collection['skos:prefLabel'] ??
            collection['@id'],
          total:
            members.length,
          connected,
          isolated,
          coverage:
            percent(
              connected,
              members.length
            )
        };
      }
    )
    .sort(
      (a, b) =>
        a.field.localeCompare(
          b.field
        )
    );

console.table(
  fieldRows
);

if (SHOW_ISOLATED) {
  console.log(
    '\nIsolated concepts\n'
  );

  if (
    isolatedConcepts.length === 0
  ) {
    console.log(
      'None.'
    );
  } else {
    const rows =
      isolatedConcepts
        .map(
          concept => ({
            slug:
              concept['@id']
                .split('/')
                .pop(),
            label:
              concept['skos:prefLabel'] ??
              ''
          })
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label
            )
        );

    console.table(
      rows
    );
  }
}