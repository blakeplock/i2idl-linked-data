# I2IDL Glossary Semantic Relationships

The I2IDL Digital Learning Glossary publishes editorially reviewed semantic relationships among concepts as part of its Linked Data graph.

Beginning with release `v0.0.80`, every published glossary concept participates in at least one internal semantic relationship.

## Editorial principle

Relationships are intended to express defensible conceptual structure.

They are not generated automatically from:

- lexical similarity
- shared keywords
- embedding similarity
- vector proximity
- automated clustering

Automated methods may assist editors in identifying candidates for review, but publication of a semantic relationship requires editorial judgment.

Field membership and curated-collection membership are also not treated as semantic relationships by themselves. A concept may belong to one or more collections without implying that those collections establish hierarchy or conceptual equivalence.

## Internal concept relationships

The internal relationship model currently uses three SKOS properties:

```text
skos:broader
skos:narrower
skos:related
```

### `skos:broader`

Used when one concept represents a genuine broader category or conceptual generalization of another concept.

Example:

```text
Machine learning
    skos:broader
Artificial intelligence
```

A broader relationship is not used merely because one concept:

- is used by another
- appears within the same workflow
- belongs to the same field
- is a component of a system
- is commonly discussed alongside another concept

### `skos:narrower`

The reciprocal form of `skos:broader`.

When the glossary asserts:

```text
A skos:broader B
```

it also materializes:

```text
B skos:narrower A
```

### `skos:related`

Used for meaningful associative relationships where neither concept is appropriately modeled as a broader or narrower form of the other.

Examples include relationships among:

- systems and supporting models
- practices and methods
- standards and the concepts they operationalize
- learning processes and relevant evidence
- technologies and the environments in which they are used
- governance concepts and related responsibilities

`skos:related` relationships are materialized reciprocally.

## Relationship integrity rules

The glossary validator enforces the following requirements:

- every internal relationship resolves to an existing concept
- no relationship may reference the concept itself
- duplicate internal relationships are prohibited
- `skos:broader` and `skos:narrower` must be reciprocal
- `skos:related` must be reciprocal
- the same concept pair may not simultaneously be asserted as hierarchical and `skos:related`

These rules are checked by:

```bash
npm run validate
```

## Relationship coverage

Release `v0.0.80` establishes complete internal relationship coverage across the published glossary.

Current graph profile:

```text
397 concepts
397 concepts with semantic relationships
0 isolated concepts
31 broader/narrower relationship pairs
644 related relationship pairs
100.0% concept relationship coverage
```

Coverage can be inspected at any time with:

```bash
npm run relationships:coverage
```

To include a list of isolated concepts, if any exist:

```bash
npm run relationships:coverage -- --isolated
```

The coverage report is informational rather than a publication failure condition. This allows new concepts to be added and reviewed before an editorial relationship is necessarily assigned.

## Collections are distinct from relationships

The glossary uses SKOS collections to organize concepts by field, type, and curated editorial pathway.

Collection membership does not imply:

```text
skos:broader
skos:narrower
skos:related
```

A concept can therefore belong to multiple fields or curated collections while retaining an independent semantic neighborhood.

This distinction is important because classification and conceptual structure answer different questions:

- collections describe where a concept is useful or relevant
- semantic relationships describe how concepts are conceptually connected

## Curated collections

The glossary currently includes three curated collections:

- Adaptive Learning Systems
- Competency and Assessment
- Learning Analytics and Decision Support

These collections provide human- and machine-readable pathways through the graph while remaining separate from the relationship model.

## Human-readable concept neighborhoods

Internal relationships are surfaced in the human glossary as concept neighborhoods.

Where applicable, a concept can expose:

- broader concepts
- narrower concepts
- related concepts

This allows users to navigate the graph without needing to understand RDF, JSON-LD, SKOS, or SPARQL.

## External vocabulary mappings

Internal concept relationships should remain distinct from mappings to concepts in external vocabularies.

External mappings will use SKOS mapping properties where editorially justified:

```text
skos:exactMatch
skos:closeMatch
skos:relatedMatch
```

These predicates have different semantic implications from the internal relationship properties and should not be used interchangeably.

### `skos:exactMatch`

Reserved for concepts judged sufficiently equivalent across vocabularies to support a strong mapping assertion.

### `skos:closeMatch`

Used where concepts are strongly corresponding but differ enough in scope, framing, or definition that exact equivalence would overstate the relationship.

### `skos:relatedMatch`

Used for useful cross-vocabulary conceptual relationships that are neither exact nor close equivalences.

External mappings should be based on review of the external concept itself, its authoritative identifier, definition, scope, and source vocabulary.

## Editorial maintenance

When adding or revising relationships:

1. Review the definitions and evidence for both concepts.
2. Determine whether the relationship is hierarchical or associative.
3. Avoid deriving hierarchy from field or collection membership.
4. Prefer `skos:related` when a broader/narrower assertion would overstate the evidence.
5. Materialize reciprocal internal relationships.
6. Run:

```bash
npm run validate
```

7. Review coverage:

```bash
npm run relationships:coverage
```

The goal is not to maximize relationship count. The goal is to maintain a useful, defensible, navigable knowledge graph.