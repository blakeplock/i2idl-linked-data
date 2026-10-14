# I2IDL Glossary External Mappings

The I2IDL Glossary of Digital Learning supports editorially reviewed mappings between I2IDL concepts and concepts published by external vocabularies, standards bodies, terminology systems, and Linked Data sources.

External mappings extend the glossary beyond its internal knowledge graph by connecting I2IDL concepts to authoritative identifiers maintained elsewhere.

These mappings are distinct from internal semantic relationships.

## Purpose

The goal of external mappings is to improve interoperability across terminology systems.

They can support:

- cross-vocabulary discovery
- terminology comparison
- standards alignment
- semantic interoperability
- research and analysis
- linked-data integration
- AI and retrieval systems
- future Glossary Studio crosswalks

External mappings should help users and machines understand how an I2IDL concept corresponds to concepts defined by other organizations without implying stronger equivalence than the evidence supports.

## Mapping properties

The glossary currently uses three SKOS mapping properties:

```text
skos:exactMatch
skos:closeMatch
skos:relatedMatch
```

These properties are used only for mappings to concepts outside the I2IDL namespace.

## `skos:exactMatch`

`skos:exactMatch` represents the strongest supported mapping.

It should be used only when the I2IDL concept and the external concept can reasonably be treated as equivalent for semantic interoperability.

An exact match requires more than identical or similar labels.

Editors should review:

- the external concept definition
- the I2IDL definition
- scope and intended use
- included and excluded meanings
- source context
- vocabulary structure
- whether substitution between the concepts would materially change meaning

`skos:exactMatch` should be uncommon.

When uncertainty exists, prefer `skos:closeMatch`.

## `skos:closeMatch`

`skos:closeMatch` is used when concepts strongly correspond but are not sufficiently equivalent to justify `skos:exactMatch`.

Differences may include:

- broader or narrower scope
- different disciplinary framing
- differences in operational definition
- differences in historical or institutional context
- differences in intended audience
- differences in how the concept is used within the source vocabulary

`skos:closeMatch` will often be the most appropriate mapping property for cross-vocabulary alignment.

## `skos:relatedMatch`

`skos:relatedMatch` is used when an external concept is meaningfully associated with an I2IDL concept but is not equivalent or near-equivalent.

Examples may include:

- a standard associated with a practice
- a technology associated with a learning model
- a governance concept associated with a responsibility
- a measurement concept associated with an outcome
- a specification concept associated with an implementation concept

A `relatedMatch` should still represent a useful semantic connection rather than simple topical proximity.

## Internal relationships and external mappings

External mapping properties must remain distinct from internal concept relationships.

Internal relationships use:

```text
skos:broader
skos:narrower
skos:related
```

External mappings use:

```text
skos:exactMatch
skos:closeMatch
skos:relatedMatch
```

Internal relationships connect concepts within:

```text
https://id.i2idl.org/
```

External mappings connect I2IDL concepts to identifiers maintained outside that namespace.

For example:

```text
https://id.i2idl.org/concepts/example-concept
    skos:closeMatch
https://example.org/vocabulary/concept-123
```

An external concept should not be represented as an internal I2IDL concept merely to create a mapping.

## Mapping target requirements

External mapping targets must:

- use the authoritative URI published by the external vocabulary
- be outside the `https://id.i2idl.org/` namespace
- identify a concept, term, class, property, standard term, or comparable semantic resource
- come from an identifiable source vocabulary or authority

The canonical mapping identifier may use either HTTP or HTTPS when that is the identifier formally published by the source vocabulary.

This is distinct from human-facing links. Browser links and rendered source URLs should use HTTPS whenever an HTTPS representation is available.

Preferred targets are persistent concept URIs rather than ordinary web pages.

Where both a concept URI and a human-readable documentation page exist, the concept URI should be used as the semantic mapping target.

For example, UNESCO publishes:

```text
http://vocabularies.unesco.org/thesaurus/concept97

## Authoritative sources

Priority should be given to mappings from authoritative or well-governed vocabularies.

Potential sources include:

- UNESCO vocabularies
- IEEE terminology and standards resources
- xAPI-related controlled vocabularies
- Schema.org
- W3C vocabularies
- established education vocabularies
- established learning-technology vocabularies
- recognized domain ontologies and terminology systems

A vocabulary should not be used simply because it is publicly accessible.

Editors should consider:

- provenance
- governance
- persistence
- maintenance
- licensing
- semantic stability
- availability of stable identifiers

## Editorial review

Every published mapping requires editorial review.

Automated systems may assist with identifying candidate mappings through:

- label matching
- alternate-label matching
- definition comparison
- semantic similarity
- embedding similarity
- vocabulary search

Automated similarity alone is not sufficient for publication.

Editors should inspect the external concept and determine whether the proposed mapping reflects its actual meaning and scope.

## Mapping evidence

Where practical, mapping decisions should retain enough information for later review.

Useful evidence may include:

- external concept identifier
- external preferred label
- source vocabulary
- source definition
- source URL
- mapping property
- editorial rationale
- review date

The canonical graph may initially publish only the SKOS mapping assertion, but the editorial process should preserve the reasoning needed to revisit important mapping decisions.

Future versions of the semantic profile may formalize mapping provenance as first-class records.

## Mapping integrity rules

The glossary validator should enforce the following requirements:

- all external mapping targets use HTTPS
- no external mapping target uses the I2IDL namespace
- duplicate mapping targets for the same property are prohibited
- self-references are prohibited
- the same I2IDL concept and external target may not simultaneously use both `skos:exactMatch` and `skos:closeMatch`
- internal relationship predicates are not used as substitutes for external mapping predicates
- external mapping predicates are not used to connect two internal I2IDL concepts

Validation is performed through:

```bash
npm run validate
```

## Multiple mappings

A concept may map to more than one external vocabulary.

For example, a single I2IDL concept may have mappings to:

- UNESCO
- IEEE
- Schema.org
- another education vocabulary

This is expected and useful.

A concept may also have multiple mappings within the same external vocabulary when the I2IDL concept overlaps more than one externally defined concept.

Each mapping should be evaluated independently.

## Conflicting mappings

A single I2IDL concept should not assert both:

```text
skos:exactMatch
```

and:

```text
skos:closeMatch
```

to the same external target.

If editorial review changes the strength of a mapping, the previous assertion should be replaced rather than retained.

`skos:relatedMatch` should also not be used alongside a stronger equivalence mapping to the same target unless there is an exceptional semantic reason documented by editors.

## Vocabulary changes

External vocabularies may change over time.

Mappings should therefore be treated as maintained editorial assertions rather than permanent facts.

Future review may be required when:

- an external concept is deprecated
- a concept URI stops resolving
- a definition changes
- the source vocabulary restructures its hierarchy
- an identifier is replaced
- I2IDL revises its own definition
- a stronger or weaker mapping becomes more appropriate

Machine-readable change history should eventually record these revisions.

## Human-readable presentation

External mappings should be visible in the human glossary without being confused with internal concept relationships.

A concept card may eventually present a section such as:

```text
Mapped to
```

or:

```text
External vocabularies
```

Mappings should display:

- external vocabulary name
- external concept label
- mapping strength
- link to the authoritative external concept

For example:

```text
UNESCO Thesaurus
Close match · Educational technology
```

Internal sections such as:

```text
Broader
Narrower
Related
```

should remain visually and semantically distinct.

## Initial mapping strategy

The first mapping phase should be deliberately conservative.

The recommended process is:

1. Select one authoritative external vocabulary.
2. Identify a small set of high-confidence candidate concepts.
3. Review labels, definitions, scope, and identifiers.
4. Assign the weakest mapping property that accurately represents the relationship.
5. Validate the graph.
6. Review the human-readable presentation.
7. Expand coverage only after the workflow has proven reliable.

The first implementation should prioritize quality over quantity.

## Initial target vocabulary

The recommended first external vocabulary is the UNESCO Thesaurus.

Reasons include:

- strong overlap with education terminology
- established vocabulary governance
- stable concept identifiers
- existing use of UNESCO resources within the glossary
- suitability for testing differences among `exactMatch`, `closeMatch`, and `relatedMatch`

A small pilot set should be completed and reviewed before broader automated candidate discovery begins.

## Editorial maintenance

When adding an external mapping:

1. Open the authoritative external concept.
2. Confirm that the URI identifies the concept itself.
3. Review the external preferred label and definition.
4. Compare scope with the I2IDL concept.
5. Select `exactMatch`, `closeMatch`, or `relatedMatch`.
6. Prefer the weaker relationship when equivalence is uncertain.
7. Confirm that the target uses HTTPS.
8. Confirm that the target is outside the I2IDL namespace.
9. Run:

```bash
npm run validate
```

10. Review the resulting concept in the human-facing glossary once mapping UI is available.

The goal is not to maximize the number of external mappings.

The goal is to create a defensible semantic bridge between the I2IDL knowledge graph and other authoritative vocabulary systems.

## External ontology-class associations (v0.0.84 experimental)

External ontology **classes** must be distinguished from external SKOS **concepts**. The custom property `gs:externalOntologyAssociations` records an editorial relationship to an external class, **without** asserting concept equivalence, class identity, instance typing, or subsumption. Do not use `skos:exactMatch`, `skos:closeMatch`, `skos:relatedMatch`, `rdf:type`, `rdfs:subClassOf`, or `owl:equivalentClass` for these associations.

The experimental structured annotation is an I2IDL-specific model, not a vocabulary term defined by Credential Engine. Example:

```json
{
  "gs:externalOntologyAssociations": [{
    "gs:target": {"@id": "https://purl.org/ctdl/terms/MicroCredential"},
    "gs:vocabulary": "CTDL",
    "gs:targetLabel": "Micro-Credential",
    "gs:targetKind": "rdfs:Class",
    "gs:associationType": "relatedClass",
    "gs:editorialNote": "A micro-credential concept is associated with a class describing credential resources; this is not equivalence.",
    "gs:reviewStatus": "proposed"
  }]
}
```

Validation requires a single external HTTPS target URI; a compatible namespace (`https://purl.org/ctdl/terms/` for CTDL or `https://purl.org/ctdlasn/terms/` for CTDL-ASN); nonempty target label and editorial note; class kind `rdfs:Class`; association type `relatedClass`; review status `proposed`, `reviewed`, or `approved`; and no duplicate targets per concept.

**Publication gate:** `proposed` means unapproved. Verify the specific class URIs and terminology with Credential Engine before treating associations as authoritative. The validator enforces syntactic constraints, not semantic endorsement or live URI resolution. The custom GS model should be formally declared in the JSON-LD context and semantic profile before claiming RDF interoperability for these structured annotations. Preserve the existing 17 SKOS crosswalks as a separate category.
