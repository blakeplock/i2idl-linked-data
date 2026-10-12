# I2IDL External Ontology Class Association Profile (v0.0.84 draft)

**Status:** experimental editorial profile; ontology associations remain *proposed*, not approved. This document supplements `EXTERNAL-MAPPINGS.md` and does not alter the 17 SKOS external mappings.

## Scope and intent

An I2IDL glossary term is a `skos:Concept`. Credential Engine CTDL and CTDL-ASN identifiers in this tranche name **ontology classes** (`rdfs:Class`). The editorial association between a SKOS concept and an ontology class is useful for discovery, but it is **not** a class-equivalence, concept-equivalence, instance-typing, or subclass assertion. It must not be interpreted as `owl:equivalentClass`, `rdf:type`, `rdfs:subClassOf`, or `skos:exactMatch`.

The record's `gs:associationType` string `relatedClass` is a local, non-inferencing editorial classification. It is not a standard OWL or SKOS predicate.

## Vocabulary and JSON-LD declarations

All `gs:` terms expand under `https://glossarystudio.app/ns/`. The `public/glossary.jsonld` inline `@context` explicitly declares:

| Field | Expanded identifier | Value shape |
|---|---|---|
| `gs:externalOntologyAssociations` | `https://glossarystudio.app/ns/externalOntologyAssociations` | Set of structured association records (JSON-LD blank nodes) |
| `gs:target` | `https://glossarystudio.app/ns/target` | URI reference to an external class |
| `gs:vocabulary` | `https://glossarystudio.app/ns/vocabulary` | Human-readable controlled string `CTDL` or `CTDL-ASN` |
| `gs:targetLabel` | `https://glossarystudio.app/ns/targetLabel` | Label of referenced class |
| `gs:targetKind` | `https://glossarystudio.app/ns/targetKind` | Controlled string `rdfs:Class` |
| `gs:associationType` | `https://glossarystudio.app/ns/associationType` | Controlled string `relatedClass` |
| `gs:editorialNote` | `https://glossarystudio.app/ns/editorialNote` | Explanation of semantic scope and limitations |
| `gs:reviewStatus` | `https://glossarystudio.app/ns/reviewStatus` | `proposed`, `reviewed`, or `approved` |

The structured record currently has no declared `@type`: RDF processors may interpret it as a blank node with GS properties. Its presence should not be interpreted as approval of an ontology alignment. The explicit `@container: @set` declaration ensures a consistent repeatable property; `gs:target` has `@type: @id` for URI semantics.

## Publication and editorial gates

- The six CTDL/CTDL-ASN candidate associations are marked `proposed` and must display that status if exposed in a user interface.
- A reviewer must verify each target against the authoritative Credential Engine schema, comparing class definitions and the I2IDL concept definition. Passing a validator does **not** validate semantic equivalence.
- Keep external ontology associations distinct from `skos:exactMatch`, `skos:closeMatch`, and `skos:relatedMatch` in graph processing, UI, and reporting.
- Any future change to `approved` requires editorial signoff and a documented rationale.
- Since these predicates are GS-local rather than W3C/CTDL standards, interoperability claims should describe them as experimental application-specific annotation properties, not externally endorsed ontology predicates.
