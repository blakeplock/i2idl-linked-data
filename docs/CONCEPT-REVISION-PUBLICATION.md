# Phase 3 — Controlled concept revision publication

Phase 3 is **not** a public historical API. It creates append-only RDF revision snapshots, a release manifest, and a PROV-O delta registry following editorial approval. Production JSON-LD, Squarespace, and SPARQL remain unchanged.

## Safety rules

- Generate a fresh Phase 2 proposal from a graph whose scheme `gs:publicationVersion` equals the target release.
- Review `proposal.md` and candidate source before generating and approving the approval checklist. The checklist binds the exact bytes of `proposal.json` and candidate JSON-LD via SHA-256.
- The publisher independently reruns Phase 2 against the candidate and previous release and compares change records.
- New snapshots use the **new revision's named graph**, not the predecessor graph used for diffing. The publisher re-canonicalizes N-Quads with RDFC-1.0 and hashes the final immutable bytes.
- Existing snapshots, registries, and manifests are never overwritten. Publication is staged and the manifest installed last; newly created files are rolled back on failure.
- Removed concepts are refused until lifecycle/deprecation rules are implemented. No change to stable concept URIs.
- The new release registry records **new revision entities only**; the full release manifest maps *all* active concepts to their current revisions. The v0.0.87 registry remains a complete baseline.
- Reviewers must ensure concept continuity when meaning changes, and determine whether new identifiers are needed.

## Simulation — use the **ignored** proposal directory

The simulation is deliberately run against a copied history store; do **not** publish a test release to `versioning/`.

From the repository root on a new branch, run the **temporary setup helper included in the ZIP**: `python3 prepare_phase3_simulation.py`. It creates `versioning/proposals/phase3-test/candidate.jsonld` with exactly one modified definition and release label `v0.0.88`, plus an isolated cloned history store. Do not commit the helper or test outputs.

Run (each command on one line):

```sh
node scripts/propose-concept-revisions.mjs --from v0.0.87 --source versioning/proposals/phase3-test/candidate.jsonld --out versioning/proposals/phase3-test/proposal
node scripts/prepare-version-approval.mjs versioning/proposals/phase3-test/proposal/proposal.json versioning/proposals/phase3-test/candidate.jsonld v0.0.88 versioning/proposals/phase3-test/approval.json
node scripts/publish-concept-revisions.mjs --proposal versioning/proposals/phase3-test/proposal/proposal.json --approval versioning/proposals/phase3-test/approval.json --source versioning/proposals/phase3-test/candidate.jsonld --release v0.0.88 --store versioning/proposals/phase3-test/history
node scripts/validate-version-release.mjs --release v0.0.88 --store versioning/proposals/phase3-test/history
```

Expected: proposal 1 changed, 396 unchanged; one new `snapshots/learning-engineering/2.nq`; manifest 397 entries; registry 1 new entity; 396 unchanged manifest entries refer to revision 1. Run the publisher **a second time** to prove overwrite refusal. It must error, and all existing snapshot hashes must remain intact.

## Operational limits

This Phase 3 publisher operates on the local checkout, while the Phase 2 replay currently reads predecessor manifests from the repository's standard `versioning/` directory. A copied history store is suitable for testing a successor to v0.0.87; later release automation should add a general store abstraction for the proposal generator. The approval checklist is not cryptographically signed and does not authenticate an editor; PR review, CI, and branch protections are the editorial authorization mechanism. Keep approval files in review artifacts and audit the release PR.
