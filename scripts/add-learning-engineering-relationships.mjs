// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from 'node:fs/promises';

const FILE =
  new URL(
    '../public/glossary.jsonld',
    import.meta.url
  );

const BASE =
  'https://id.i2idl.org/concepts/';

const raw =
  await readFile(
    FILE,
    'utf8'
  );

const graph =
  JSON.parse(raw);

const nodes =
  graph['@graph'];

const byId =
  new Map(
    nodes.map(
      node => [
        node['@id'],
        node
      ]
    )
  );

function concept(slug) {
  const id =
    `${BASE}${slug}`;

  const node =
    byId.get(id);

  if (!node) {
    throw new Error(
      `Concept not found: ${id}`
    );
  }

  return node;
}

function mergeRefs(
  node,
  property,
  ...slugs
) {
  const existing =
    node[property] == null
      ? []
      : Array.isArray(
          node[property]
        )
        ? node[property]
        : [
            node[property]
          ];

  const ids =
    new Set(
      existing
        .map(
          item =>
            item?.['@id']
        )
        .filter(Boolean)
    );

  for (
    const slug
    of slugs
  ) {
    const id =
      `${BASE}${slug}`;

    if (
      !byId.has(id)
    ) {
      throw new Error(
        `Concept not found: ${id}`
      );
    }

    if (
      !ids.has(id)
    ) {
      existing.push({
        '@id': id
      });

      ids.add(id);
    }
  }

  node[property] =
    existing;
}

function broader(
  narrowerSlug,
  broaderSlug
) {
  mergeRefs(
    concept(narrowerSlug),
    'skos:broader',
    broaderSlug
  );

  mergeRefs(
    concept(broaderSlug),
    'skos:narrower',
    narrowerSlug
  );
}

function related(
  leftSlug,
  rightSlug
) {
  mergeRefs(
    concept(leftSlug),
    'skos:related',
    rightSlug
  );

  mergeRefs(
    concept(rightSlug),
    'skos:related',
    leftSlug
  );
}

/*
 * Hierarchical relationships
 */

broader(
  'learning-engineer',
  'learning-design-practitioner'
);

broader(
  'instructional-designer',
  'learning-design-practitioner'
);

broader(
  'design-build-cycle',
  'iterative-design'
);

broader(
  'interdisciplinary-exploratory-research',
  'exploratory-research'
);

broader(
  'equitable-co-design',
  'co-design'
);

broader(
  'extended-mooc-xmooc',
  'massive-open-online-course-mooc'
);

broader(
  'learner-feedback-loop',
  'feedback-loop'
);

/*
 * Learning engineering foundations
 */

related(
  'learning-engineering',
  'learning-sciences'
);

related(
  'learning-engineering',
  'human-centered-design'
);

related(
  'learning-engineering',
  'engineering-design'
);

related(
  'learning-engineering',
  'data-informed-decision-making'
);

related(
  'learning-engineering',
  'learning-engineering-process'
);

related(
  'learning-engineering',
  'learning-engineering-team'
);

related(
  'learning-engineering',
  'learning-environment'
);

/*
 * Learning engineering process
 */

related(
  'learning-engineering-process',
  'challenge-identification'
);

related(
  'learning-engineering-process',
  'creation-phase'
);

related(
  'learning-engineering-process',
  'implementation'
);

related(
  'learning-engineering-process',
  'investigation-phase'
);

related(
  'learning-engineering-process',
  'continuous-improvement'
);

related(
  'learning-engineering-process',
  'design-build-cycle'
);

related(
  'learning-engineering-process',
  'learner-feedback-loop'
);

/*
 * Design reasoning and decision documentation
 */

related(
  'design-decision-making',
  'design-decision'
);

related(
  'design-decision-making',
  'design-judgment'
);

related(
  'design-decision-making',
  'design-justification'
);

related(
  'design-decision-making',
  'source-of-influence'
);

related(
  'design-decision-making',
  'contextual-factor'
);

related(
  'design-decision-making',
  'stakeholder-requirement'
);

related(
  'design-decision-making',
  'design-revision'
);

related(
  'design-decision-making',
  'decision-tracking'
);

related(
  'design-decision-making',
  'reflective-design-documentation'
);

/*
 * LEED tracker
 */

related(
  'leed-tracker',
  'decision-tracking'
);

related(
  'leed-tracker',
  'design-decision'
);

related(
  'leed-tracker',
  'design-justification'
);

related(
  'leed-tracker',
  'source-of-influence'
);

related(
  'leed-tracker',
  'design-revision'
);

related(
  'leed-tracker',
  'learning-engineering-process'
);

/*
 * Teams and expertise
 */

related(
  'learning-engineering-team',
  'cross-domain-collaboration'
);

related(
  'learning-engineering-team',
  'stakeholder-engagement'
);

related(
  'learning-engineering-team',
  'subject-matter-expert-sme'
);

related(
  'learning-engineering-team',
  'practitioner-expertise'
);

related(
  'stakeholder-engagement',
  'stakeholder-requirement'
);

/*
 * Learning experience design
 */

related(
  'learning-experience-design-lxd',
  'human-centered-design'
);

related(
  'learning-experience-design-lxd',
  'iterative-design'
);

related(
  'learning-experience-design-lxd',
  'prototype'
);

related(
  'learning-experience-design-lxd',
  'rapid-prototyping'
);

related(
  'learning-experience-design-lxd',
  'usability-testing'
);

related(
  'learning-experience-design-lxd',
  'co-design'
);

related(
  'design-build-cycle',
  'rapid-prototyping'
);

related(
  'design-build-cycle',
  'usability-testing'
);

/*
 * Learning modalities
 */

related(
  'online-learning-modality',
  'synchronous-learning'
);

related(
  'online-learning-modality',
  'asynchronous-learning'
);

related(
  'online-learning-modality',
  'instructor-facilitated-learning'
);

related(
  'online-learning-modality',
  'resource-facilitated-learning'
);

related(
  'online-learning-modality',
  'remote-learning'
);

related(
  'distributed-learning',
  'remote-learning'
);

related(
  'distributed-learning',
  'mobile-learning'
);

related(
  'distributed-learning',
  'virtual-classroom'
);

related(
  'distributed-learning',
  'computer-based-learning'
);

/*
 * Ecosystems and ongoing improvement
 */

related(
  'future-learning-ecosystem',
  'ubiquitous-learning'
);

related(
  'future-learning-ecosystem',
  'distributed-learning'
);

related(
  'future-learning-ecosystem',
  'learning-environment'
);

related(
  'continuous-improvement',
  'learner-feedback-loop'
);

await writeFile(
  FILE,
  `${JSON.stringify(graph, null, 2)}\n`,
  'utf8'
);

console.log(
  'Added Learning Engineering and design concept relationships.'
);