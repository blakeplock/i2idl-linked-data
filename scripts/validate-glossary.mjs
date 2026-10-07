// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const FILE = new URL('../public/glossary.jsonld', import.meta.url);
const BASE = 'https://id.i2idl.org';
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_RELATIONS = new Set(['direct', 'supporting']);
const DANGEROUS_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype'
]);

const INTERNAL_CONCEPT_RELATIONS = new Map([
  ['skos:broader', 'skos:narrower'],
  ['skos:narrower', 'skos:broader'],
  ['skos:related', 'skos:related']
]);

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function refId(value) {
  if (typeof value === 'string') return value;

  if (
    value &&
    typeof value === 'object'
  ) {
    return value['@id'] || null;
  }

  return null;
}

function isHttps(value) {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    return (
      new URL(value).protocol ===
      'https:'
    );
  } catch (_) {
    return false;
  }
}

function isConcept(node) {
  return asArray(
    node?.['@type']
  ).includes(
    'skos:Concept'
  );
}

function relationIds(
  concept,
  property
) {
  return asArray(
    concept?.[property]
  )
    .map(refId)
    .filter(Boolean);
}

function canonicalPair(
  left,
  right
) {
  return [
    left,
    right
  ]
    .sort()
    .join('\n');
}

function walk(
  value,
  path = '$'
) {
  if (
    typeof value === 'string'
  ) {
    if (
      /<\/script\b/i.test(value)
    ) {
      fail(
        `${path}: contains a script-closing sequence`
      );
    }

    if (
      /\u2028|\u2029/.test(value)
    ) {
      warn(
        `${path}: contains a Unicode line separator that must be escaped in HTML embeds`
      );
    }

    return;
  }

  if (
    Array.isArray(value)
  ) {
    value.forEach(
      (item, index) =>
        walk(
          item,
          `${path}[${index}]`
        )
    );

    return;
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    for (
      const [key, item]
      of Object.entries(value)
    ) {
      if (
        DANGEROUS_KEYS.has(key)
      ) {
        fail(
          `${path}: dangerous object key ${key}`
        );
      }

      walk(
        item,
        `${path}.${key}`
      );
    }
  }
}

const raw =
  await readFile(
    FILE,
    'utf8'
  );

let graph;

try {
  graph =
    JSON.parse(raw);
} catch (error) {
  console.error(
    `VALIDATION FAILED\n- JSON parse error: ${error.message}`
  );

  process.exit(1);
}

walk(graph);

const context =
  graph?.['@context'];

if (
  !context ||
  Array.isArray(context) ||
  typeof context !== 'object'
) {
  fail(
    '@context must be an inline object'
  );
} else if (
  Object.hasOwn(
    context,
    '@import'
  )
) {
  fail(
    '@context must not use @import'
  );
}

const nodes =
  Array.isArray(
    graph?.['@graph']
  )
    ? graph['@graph']
    : null;

if (!nodes) {
  fail(
    '@graph must be an array'
  );
}

const list =
  nodes || [];

const byId =
  new Map();

for (
  const node
  of list
) {
  const id =
    node?.['@id'];

  if (
    typeof id !== 'string' ||
    !id
  ) {
    fail(
      'Every top-level graph node must have a non-empty @id'
    );

    continue;
  }

  if (
    byId.has(id)
  ) {
    fail(
      `Duplicate @id: ${id}`
    );
  } else {
    byId.set(
      id,
      node
    );
  }

  for (
    const prefix
    of [
      'concepts',
      'definitions',
      'sources'
    ]
  ) {
    const marker =
      `${BASE}/${prefix}/`;

    if (
      id.startsWith(marker)
    ) {
      const slug =
        id.slice(
          marker.length
        );

      if (
        !SAFE_SLUG.test(slug)
      ) {
        fail(
          `Unsafe ${prefix} identifier slug: ${slug}`
        );
      }
    }
  }
}

const concepts =
  list.filter(
    node =>
      isConcept(node)
  );

const definitions =
  list.filter(
    node =>
      asArray(
        node?.['@type']
      ).includes(
        'gs:Definition'
      )
  );

const sources =
  list.filter(
    node =>
      String(
        node?.['@id'] || ''
      ).startsWith(
        `${BASE}/sources/`
      )
  );

const collections =
  list.filter(
    node =>
      asArray(
        node?.['@type']
      ).includes(
        'skos:Collection'
      )
  );

const fieldCollections =
  collections.filter(
    node =>
      node?.['gs:facet'] ===
      'field'
  );

for (
  const collection
  of collections
) {
  const id =
    collection['@id'];

  const members =
    asArray(
      collection[
        'skos:member'
      ]
    );

  const seenMembers =
    new Set();

  for (
    let index = 0;
    index < members.length;
    index += 1
  ) {
    const memberId =
      refId(
        members[index]
      );

    const label =
      `${id} skos:member[${index}]`;

    if (!memberId) {
      fail(
        `${label}: missing @id`
      );

      continue;
    }

    if (
      seenMembers.has(
        memberId
      )
    ) {
      fail(
        `${id}: duplicate skos:member ${memberId}`
      );

      continue;
    }

    seenMembers.add(
      memberId
    );

    const member =
      byId.get(
        memberId
      );

    if (!member) {
      fail(
        `${label}: referenced concept does not exist: ${memberId}`
      );

      continue;
    }

    if (
      !isConcept(member)
    ) {
      fail(
        `${label}: referenced node is not a skos:Concept: ${memberId}`
      );
    }
  }
}

const fieldMembershipsByConcept =
  new Map();

for (
  const collection
  of fieldCollections
) {
  for (
    const memberRef
    of asArray(
      collection[
        'skos:member'
      ]
    )
  ) {
    const memberId =
      refId(
        memberRef
      );

    if (!memberId) {
      continue;
    }

    if (
      !fieldMembershipsByConcept
        .has(memberId)
    ) {
      fieldMembershipsByConcept
        .set(
          memberId,
          new Set()
        );
    }

    fieldMembershipsByConcept
      .get(memberId)
      .add(
        collection['@id']
      );
  }
}

for (
  const source
  of sources
) {
  const id =
    source['@id'];

  if (
    typeof source[
      'dcterms:title'
    ] !== 'string' ||
    !source[
      'dcterms:title'
    ].trim()
  ) {
    fail(
      `${id}: source is missing dcterms:title`
    );
  }

  if (
    !isHttps(
      source['schema:url']
    )
  ) {
    fail(
      `${id}: source schema:url must be HTTPS`
    );
  }

  if (
    source[
      'gs:rightsUrl'
    ] != null &&
    !isHttps(
      source[
        'gs:rightsUrl'
      ]
    )
  ) {
    fail(
      `${id}: gs:rightsUrl must be HTTPS when present`
    );
  }
}

for (
  const concept
  of concepts
) {
  const id =
    concept['@id'];

  const definitionId =
    refId(
      concept[
        'gs:activeDefinition'
      ]
    );

  const primaryFieldId =
    refId(
      concept[
        'gs:fieldCollection'
      ]
    );

  if (
    !definitionId
  ) {
    fail(
      `${id}: missing gs:activeDefinition`
    );
  } else if (
    !byId.has(
      definitionId
    )
  ) {
    fail(
      `${id}: active definition does not resolve: ${definitionId}`
    );
  }

  if (
    primaryFieldId
  ) {
    const primaryField =
      byId.get(
        primaryFieldId
      );

    if (
      !primaryField ||
      !asArray(
        primaryField[
          '@type'
        ]
      ).includes(
        'skos:Collection'
      )
    ) {
      fail(
        `${id}: gs:fieldCollection does not resolve to a skos:Collection: ${primaryFieldId}`
      );
    } else if (
      !fieldMembershipsByConcept
        .get(id)
        ?.has(
          primaryFieldId
        )
    ) {
      fail(
        `${id}: primary gs:fieldCollection does not include the concept as skos:member`
      );
    }
  }
}

const conceptsWithRelationships =
  new Set();

const broaderPairs =
  new Set();

const relatedPairs =
  new Set();

for (
  const concept
  of concepts
) {
  const sourceId =
    concept['@id'];

  for (
    const [
      property,
      inverseProperty
    ]
    of INTERNAL_CONCEPT_RELATIONS
  ) {
    const values =
      asArray(
        concept[property]
      );

    const seenTargets =
      new Set();

    for (
      let index = 0;
      index < values.length;
      index += 1
    ) {
      const targetId =
        refId(
          values[index]
        );

      const label =
        `${sourceId} ${property}[${index}]`;

      if (
        !targetId
      ) {
        fail(
          `${label}: missing @id`
        );

        continue;
      }

      if (
        seenTargets.has(
          targetId
        )
      ) {
        fail(
          `${sourceId}: duplicate ${property} relationship to ${targetId}`
        );

        continue;
      }

      seenTargets.add(
        targetId
      );

      if (
        targetId ===
        sourceId
      ) {
        fail(
          `${sourceId}: ${property} must not point to the concept itself`
        );

        continue;
      }

      const target =
        byId.get(
          targetId
        );

      if (!target) {
        fail(
          `${label}: relationship target does not exist: ${targetId}`
        );

        continue;
      }

      if (
        !isConcept(target)
      ) {
        fail(
          `${label}: relationship target is not a skos:Concept: ${targetId}`
        );

        continue;
      }

      conceptsWithRelationships
        .add(sourceId);

      conceptsWithRelationships
        .add(targetId);

      const inverseIds =
        new Set(
          relationIds(
            target,
            inverseProperty
          )
        );

      if (
        !inverseIds.has(
          sourceId
        )
      ) {
        fail(
          `${sourceId} ${property} ${targetId}: missing reciprocal ${inverseProperty}`
        );
      }

      if (
        property ===
        'skos:broader'
      ) {
        broaderPairs.add(
          `${sourceId}\n${targetId}`
        );
      }

      if (
        property ===
        'skos:related'
      ) {
        relatedPairs.add(
          canonicalPair(
            sourceId,
            targetId
          )
        );
      }
    }
  }

  const hierarchicalTargets =
    new Set([
      ...relationIds(
        concept,
        'skos:broader'
      ),
      ...relationIds(
        concept,
        'skos:narrower'
      )
    ]);

  for (
    const relatedId
    of relationIds(
      concept,
      'skos:related'
    )
  ) {
    if (
      hierarchicalTargets.has(
        relatedId
      )
    ) {
      fail(
        `${sourceId}: ${relatedId} must not be both hierarchical and skos:related`
      );
    }
  }
}

let evidenceCount = 0;

for (
  const definition
  of definitions
) {
  const id =
    definition['@id'];

  const evidence =
    asArray(
      definition[
        'gs:evidence'
      ]
    );

  if (
    !evidence.length
  ) {
    fail(
      `${id}: definition has no gs:evidence`
    );

    continue;
  }

  for (
    let index = 0;
    index < evidence.length;
    index += 1
  ) {
    evidenceCount += 1;

    const item =
      evidence[index];

    const label =
      `${id} evidence[${index}]`;

    const sourceObj =
      item?.[
        'dcterms:source'
      ];

    const sourceId =
      refId(
        sourceObj
      );

    const derivedId =
      refId(
        item?.[
          'prov:wasDerivedFrom'
        ]
      );

    if (!sourceId) {
      fail(
        `${label}: missing dcterms:source @id`
      );
    }

    if (!derivedId) {
      fail(
        `${label}: missing prov:wasDerivedFrom @id`
      );
    }

    if (
      sourceId &&
      derivedId &&
      sourceId !==
        derivedId
    ) {
      fail(
        `${label}: dcterms:source and prov:wasDerivedFrom disagree`
      );
    }

    if (
      sourceId &&
      !byId.has(
        sourceId
      )
    ) {
      fail(
        `${label}: referenced source does not exist: ${sourceId}`
      );
    }

    if (
      !sourceObj ||
      typeof sourceObj !==
        'object' ||
      typeof sourceObj[
        'dcterms:title'
      ] !== 'string' ||
      !sourceObj[
        'dcterms:title'
      ].trim()
    ) {
      fail(
        `${label}: embedded source is missing dcterms:title`
      );
    }

    if (
      typeof item?.[
        'gs:sourceLabel'
      ] !== 'string' ||
      !item[
        'gs:sourceLabel'
      ].trim()
    ) {
      fail(
        `${label}: missing gs:sourceLabel`
      );
    }

    if (
      typeof item?.[
        'gs:citationDetail'
      ] !== 'string' ||
      !item[
        'gs:citationDetail'
      ].trim()
    ) {
      fail(
        `${label}: missing gs:citationDetail`
      );
    }

    if (
      !ALLOWED_RELATIONS.has(
        item?.[
          'gs:evidenceRelation'
        ]
      )
    ) {
      fail(
        `${label}: gs:evidenceRelation must be direct or supporting`
      );
    }

    if (
      !isHttps(
        item?.[
          'schema:url'
        ]
      )
    ) {
      fail(
        `${label}: schema:url must be HTTPS`
      );
    }
  }
}

function validateUrlFields(
  value,
  path = '$'
) {
  if (
    Array.isArray(value)
  ) {
    value.forEach(
      (item, index) =>
        validateUrlFields(
          item,
          `${path}[${index}]`
        )
    );

    return;
  }

  if (
    !value ||
    typeof value !== 'object'
  ) {
    return;
  }

  for (
    const [key, item]
    of Object.entries(value)
  ) {
    if (
      (
        key ===
          'schema:url' ||
        key ===
          'gs:rightsUrl'
      ) &&
      !isHttps(item)
    ) {
      fail(
        `${path}.${key}: only HTTPS URLs are permitted`
      );
    }

    validateUrlFields(
      item,
      `${path}.${key}`
    );
  }
}

validateUrlFields(
  graph
);

const multiFieldConcepts =
  [
    ...fieldMembershipsByConcept
      .values()
  ]
    .filter(
      collectionIds =>
        collectionIds.size > 1
    )
    .length;

const isolatedConcepts =
  concepts.length -
  conceptsWithRelationships.size;

console.log(
  'I2IDL Glossary Validation'
);

console.log('');

console.log(
  `${concepts.length} concepts`
);

console.log(
  `${definitions.length} definitions`
);

console.log(
  `${sources.length} sources`
);

console.log(
  `${evidenceCount} evidence records`
);

console.log(
  `${collections.length} collections`
);

console.log(
  `${multiFieldConcepts} concepts in multiple field collections`
);

console.log(
  `${conceptsWithRelationships.size} concepts with semantic relationships`
);

console.log(
  `${broaderPairs.size} broader/narrower relationship pairs`
);

console.log(
  `${relatedPairs.size} related relationship pairs`
);

console.log(
  `${isolatedConcepts} concepts without semantic relationships`
);

console.log('');

for (
  const warning
  of warnings
) {
  console.log(
    `WARNING: ${warning}`
  );
}

if (
  failures.length
) {
  console.error(
    'VALIDATION FAILED'
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
  'PASS: inline JSON-LD context only'
);

console.log(
  'PASS: canonical identifiers are unique and safe'
);

console.log(
  'PASS: collection members resolve to concepts and contain no duplicates'
);

console.log(
  'PASS: primary field memberships are internally consistent'
);

console.log(
  'PASS: concepts may belong to multiple field collections'
);

console.log(
  'PASS: all active definitions resolve'
);

console.log(
  'PASS: internal concept relationships resolve to concepts'
);

console.log(
  'PASS: internal concept relationships contain no duplicates or self-references'
);

console.log(
  'PASS: broader, narrower, and related relationships are reciprocal'
);

console.log(
  'PASS: hierarchical relationships are not also asserted as skos:related'
);

console.log(
  'PASS: all evidence records have complete provenance'
);

console.log(
  'PASS: all evidence relations are classified'
);

console.log(
  'PASS: all referenced sources resolve and have titles'
);

console.log(
  'PASS: all rendered external URLs use HTTPS'
);

console.log(
  'PASS: no dangerous object keys or script terminators found'
);

console.log('');

console.log(
  'VALIDATION PASSED'
);