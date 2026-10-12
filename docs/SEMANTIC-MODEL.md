# Semantic Model and Relationships

[Documentation index](README.md) · [Project overview](../README.md)

## Semantic model

The glossary uses JSON-LD 1.1 as its canonical interchange representation. Its semantic model is based primarily on established vocabularies and standards:

- **SKOS** for concepts, concept schemes, preferred and alternate labels, definitions, semantic relationships, mappings, and collections
- **Schema.org** for `DefinedTerm` and `DefinedTermSet`
- **Dublin Core Terms** for titles, creators, sources, dates, rights, publishers, and bibliographic metadata
- **PROV-O** for provenance and derivation
- **Glossary Studio namespace** for application-specific properties that do not belong in the standard vocabularies above

A glossary concept has a stable identifier independent of any particular wording of its definition. Definitions, evidence, sources, classifications, collection memberships, and relationships can therefore be maintained as connected records rather than collapsed into a single display card.

Definitions are first-class graph entities. Evidence records distinguish between `direct` and `supporting` source relationships and preserve source identifiers, source titles, citation details, URLs, and provenance.

The canonical concept scheme identifier is:

```text
https://id.i2idl.org/scheme
```

## Multi-collection concept model

Beginning with `v0.0.74`, the glossary supports many-to-many membership between concepts and SKOS collections.

A concept keeps one stable URI and one editorially designated primary field while also participating in multiple collections when the concept has substantive relevance across domains.

For example:

```text
https://id.i2idl.org/concepts/data-informed-decision-making
```

can be a member of multiple field collections without duplicating the concept record or changing its identifier.

The glossary currently uses 12 field collections:

- Agile & Operations
- AI & Machine Learning
- Assessment & Measurement
- Data & Instrumentation
- Education
- Engineering & Systems
- Enterprise & Governance
- Human-Centered Design
- Learning Analytics
- Learning Engineering
- Learning Sciences
- Standards & Interoperability

The `v0.0.75` release expanded this model across all field collections.

Current field-membership profile:

```text
397 concepts
600 field memberships
171 concepts in more than one field collection
140 concepts in 2 field collections
30 concepts in 3 field collections
1 concept in 4 field collections
```

The primary `gs:fieldCollection` value remains unchanged for each concept. Additional membership is represented through `skos:member` on the relevant collections.

This structure supports comparative analysis while preserving stable concept identity.

### Example cross-collection query

The following query returns concepts shared by Learning Engineering and Learning Sciences:

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?concept ?label
WHERE {
  <https://id.i2idl.org/collections/field/learning-engineering>
    skos:member ?concept .

  <https://id.i2idl.org/collections/field/learning-sciences>
    skos:member ?concept .

  ?concept skos:prefLabel ?label .
}
ORDER BY ?label
```

The same model can be used to calculate pairwise intersections, unique-to-field concepts, concepts spanning three or more fields, and collection-similarity measures.

## Semantic relationships

Release `v0.0.80` established complete internal semantic relationship coverage across the glossary; subsequent interface and vocabulary-mapping work builds on that baseline.

The internal relationship model currently uses:

```text
skos:broader
skos:narrower
skos:related
```

Current relationship profile:

```text
397 concepts
397 concepts with semantic relationships
31 broader/narrower relationship pairs
644 related relationship pairs
0 isolated concepts
100.0% semantic relationship coverage
```

Relationships are editorially reviewed and intended to express defensible conceptual structure. They are not generated solely from lexical similarity, shared keywords, embedding similarity, or automated clustering.

The graph validator enforces:

- resolvable relationship targets
- no duplicate relationships
- no self-references
- reciprocal broader/narrower relationships
- reciprocal related relationships
- separation between hierarchical and related assertions

Detailed editorial policy is documented in:

```text
SEMANTIC-RELATIONSHIPS.md
```

Relationship coverage can be inspected with:

```bash
npm run relationships:coverage
```

To list isolated concepts if any are introduced in a future release:

```bash
npm run relationships:coverage -- --isolated
```

The coverage report is informational rather than a publication failure condition so that new concepts can be introduced and reviewed before a relationship is necessarily assigned.

## Curated collections

The glossary supports curated SKOS collections in addition to field and type collections.

The current curated collections are:

- **Adaptive Learning Systems**
- **Competency and Assessment**
- **Learning Analytics and Decision Support**

Curated collections provide editorial pathways through the graph while remaining distinct from semantic hierarchy.

Collection membership does not imply:

```text
skos:broader
skos:narrower
skos:related
```

This distinction allows classification, curation, and conceptual structure to coexist without being conflated.

## Human-readable concept neighborhoods

Semantic relationships are also surfaced in the human-facing glossary.

Where applicable, glossary concepts expose:

- broader concepts
- narrower concepts
- related concepts

This allows ordinary users to navigate the knowledge graph without needing to understand RDF, JSON-LD, SKOS, or SPARQL.
