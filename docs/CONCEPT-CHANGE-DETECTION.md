# Concept versioning: Phase 2 — change proposals

Phase 2 compares the current canonical JSON-LD with the immutable revision snapshots referenced by a published release manifest. It writes an **unapproved proposal**, never published revisions. The current glossary, SPARQL endpoint, generated indexes and Squarespace embed do not change.

## Usage

```bash
node scripts/propose-concept-revisions.mjs --from v0.0.87 --source public/glossary.jsonld --out versioning/proposals/review-001
```

The output contains `proposal.json` (machine-readable) and `proposal.md` (editorial report). Choose a new `--out` directory for subsequent runs. `versioning/proposals/` is ignored by Git; do not commit it or the underlying draft content without editorial review.

The tool verifies the SHA-256 digest of each previous snapshot before comparison, extracts concept/active-definition assertions and collection membership assertions using the Phase 1 scope, serializes N-Quads, and canonicalizes with RDFC-1.0. It compares candidates **using the prior revision's named-graph identifier** so the graph name itself cannot manufacture a change. Unchanged concepts have no proposed new revision.

Changes report exact RDF assertions added and removed. An introduced concept is proposed as revision 1; a missing concept is flagged for editorial review (never silently deleted). Each changed existing concept receives a *proposed* next revision number. Reciprocal SKOS relations may change two concept snapshots.

This implementation does not classify meaning equivalence, approve revisions, publish versioned graphs, or backfill history. Release manifest creation and immutable publication are separate future operations. Semantic source nodes shared across concepts are not copied into these snapshots, matching the Phase 1 boundary.

### Release safety

1. Never run this tool against unpublished or untrusted RDF as an approval substitute.
2. Preserve `versioning/snapshots/`, `versioning/releases/` and `versioning/registry/` as immutable published history.
3. Human review is required to decide whether a change is editorial, semantic, evidence, classification or lifecycle and whether the concept identity remains valid.
4. The tool is deliberately append-only for its *proposal output directory*, which cannot overwrite another proposal.
5. Confirm exact unchanged baseline comparison before introducing a modified test fixture.
