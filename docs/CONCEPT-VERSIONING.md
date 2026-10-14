# Concept versioning and provenance (Phase 1)

Status: v0.0.87 immutable baseline implemented. Historical concept resolution and Explorer integration were added in Phases 4 and 5; see `CONCEPT-HISTORY-API.md` and `EXPLORER-VERSION-HISTORY.md`.
Baseline: publication `v0.0.87`. This is the **first recorded** state, not a reconstruction of earlier edits.

## Identity and graphs

* Concept identity: `https://id.i2idl.org/concepts/{slug}` (unchanged).
* Revision resource: `https://id.i2idl.org/concepts/{slug}/versions/{n}`.
* Named graph identifier: `https://id.i2idl.org/graphs/concepts/{slug}/versions/{n}`.
* Release manifest resource: `https://id.i2idl.org/releases/v0.0.87`.
* The named graph identifier identifies a *specific set of immutable triples*; these files can later be loaded into Jena/Fuseki or RDF4J contexts.

This Phase 1 design does **not** add revision triples to the canonical `public/glossary.jsonld` graph, and does not modify the live resolver, SPARQL endpoint, staged indexes, or Squarespace embed.

## Revision scope

An immutable concept snapshot includes the concept node, its active definition node, and the identifiers of source/evidence relations stored on that definition. It also includes a local membership index listing collections which reference the concept via `skos:member`. To avoid cascading revisions, immutable snapshots do not copy entire shared source or collection nodes: changes to those shared resources are tracked independently as source/collection changes in a future versioning phase. Concept revisions change when their own assertions, active-definition assertions, or collection memberships change. This includes outgoing SKOS relations, but reciprocal relationships may legitimately trigger revision changes on both endpoints.

Concept snapshots are RDF **datasets**, with all extracted assertions placed in the designated named graph. The original subject and object IRIs are preserved; the *graph name* supplies historical context. Nested JSON-LD and blank nodes are canonicalized before hashing. Never hash serialized JSON text, file ordering, or Git SHA as a concept identity.

## Phase 1 publication structure

```
versioning/
  releases/v0.0.87.json          # release manifest: concept -> revision + hash + graph URI
  snapshots/{slug}/1.nq         # RDFC-1.0-normalized N-Quads per named graph
  registry/v0.0.87.jsonld       # PROV-O and DCTERMS revision metadata
```

The manifest is an immutable release snapshot. The `sha256` value is computed over RDFC-1.0 canonical N-Quads, with SHA-256 expressed as lowercase hex. Future releases reuse unchanged revisions, appending immutable snapshots only for changed concepts. Initial revisions are numbered 1 for all 397 v0.0.87 concepts. The registry may be extended with later revision events and publication activities without mutating historical snapshot files.

## Metadata conventions

Each revision is a `prov:Entity`, with `dcterms:isVersionOf` its stable concept URI, `prov:wasDerivedFrom` the baseline publication, publication date and optional `prov:wasRevisionOf` for revision > 1. Custom application predicates (e.g., revision number, graph URI, digest, release) must be defined in the existing `gs:` vocabulary. A release manifest enumerates a revision for every active concept. Never use a Git commit URL as the semantic identity of a revision; Git commits may be recorded as supplementary provenance.

## Integrity invariants

1. Existing concept URI, definition URI, and source URI identifiers do not change.
2. `versioning/snapshots/` and published release manifests are append-only. Validate on every future CI run against the previous tagged release.
3. Each revision's N-Quads must have exactly one graph name, matching its manifest.
4. Every manifest snapshot exists, its digest verifies, and its concept appears in canonical v0.0.87.
5. The baseline generator refuses to overwrite any existing snapshot or release manifest.
6. Production serves the current graph independently of the immutable history API. Historical revision resolution and Explorer presentation are documented separately.

## Operational note

The baseline creation script requires the `rdf-canonize` library (RDFC-1.0) and `@rdfjs/parser-jsonld` already present in the repository. For the initial implementation, dependencies must be pinned through the normal npm lockfile and reviewed by CI. Avoid rebuilding the baseline after release: regenerate in a separate directory for reproducibility testing and compare hashes, rather than overwrite published history.

## Future persistent RDF storage

In Fuseki, each versioned N-Quads file can be imported into its named graph. RDF4J uses the same graph IRI as a context. The release registry and manifest can be loaded separately. Named graphs alone are not immutable: deploy an append-only writer/publisher and make historical datasets read-only for consumers.

## Known boundaries

No claim is made about reconstructed revisions before v0.0.87. Source record revisions, collection metadata history, conceptual replacement/editorial status, full release reconstruction are planned separately. The HTTP historical resolver is implemented. Legal redactions will be explicit, exceptional governance events rather than silent mutation.
