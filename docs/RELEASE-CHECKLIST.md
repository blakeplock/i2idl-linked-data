# Release Checklist

[Documentation index](README.md) · [Publication guide](PUBLICATION.md)

Use this checklist before creating a GitHub release. I2IDL uses a **single public release sequence**. A release is classified **Content**, **Platform**, or **Combined**. The public tag, JSON-LD `gs:publicationVersion`, release manifest, and Squarespace displayed version must agree; npm/MCP compatibility versions are independent. See [publication policy](PUBLICATION.md).

## 1. Establish release scope

- [ ] Confirm the exact current version in `public/glossary.jsonld` (`gs:publicationVersion`).
- [ ] Confirm the live Squarespace glossary displays the same glossary version.
- [ ] Classify release as **Content**, **Platform**, or **Combined**, and include this label in release notes.
- [ ] Choose the next `v0.0.x` public tag after checking existing tags and releases; avoid a second platform tag series.
- [ ] For every public release, plan synchronized updates to publication-level `gs:publicationVersion`, Squarespace version/timestamp, and release manifest.
- [ ] For Platform releases, confirm that **curated graph assertions and all concept revision hashes are unchanged**. No synthetic concept-revision snapshots.

## 2. Repository checks

```bash
npm ci
npm run validate
npm run relationships:coverage
npm run indexes:build
git diff --exit-code -- public/glossary-core.json public/glossary-details.json public/glossary-web.json
npm run validate:live
node --check api/mcp.mjs
node --check api/sparql.mjs
node --check api/v1.mjs
node --check api/v1-graph.mjs
node --check api/v1-context.mjs
node scripts/test-mcp-readiness.mjs
node scripts/test-mcp-negotiation.mjs
node scripts/test-api-v1-contract.mjs
node --check api/research.mjs
node --check api/activity.mjs
node --check public/graph-explorer.js
node --check public/research-discovery.js
node --check public/activity-dashboard.js
node --check public/explorer-activity.js
node scripts/check-licenses.mjs --baseline
npm audit
```

Run `npm audit` separately; do not silently accept or suppress findings. `npm run indexes:build` may regenerate files; inspect any changes before resetting or committing. `npm run validate:live` checks the *currently deployed* site, which may lag the branch under review.

## 3. Security and integration

- [ ] Review dependency advisories, license exceptions, GitHub Actions, and deployment status.
- [ ] Confirm no credentials, temporary installer payloads, local datasets, or generated test outputs are staged.
- [ ] Verify the Explorer, research search, filters, CSV/BibTeX export, and `/activity` dashboard on a production-equivalent preview.
- [ ] Check the Explorer Version history panel on desktop and a narrow mobile viewport; select at least two concepts to confirm the panel refreshes and the RDF links remain readable.
- [ ] Check `/concepts/learning-engineering/versions`, `/versions/1.jsonld`, `/versions/1.ttl`, and `/versions/1.nq` beneath the concept URI on Preview; verify expected content types and HEAD/404 responses.
- [ ] Run `node scripts/test-version-history.mjs` and `node scripts/validate-version-release.mjs --release v0.0.87` before deploying the history API.
- [ ] Verify `/api/activity` returns expected aggregate JSON with correctly configured Redis credentials.
- [ ] Verify Research Discovery failure modes and that its results do not modify curated data.
- [ ] Confirm CSP/security headers still permit only intended resources.
- [ ] Smoke-test `/developers`, `/api/docs`, `/api/openapi.json`, `/api/v1/concepts`, `/mcp` (POST; GET 405 expected), `/sparql`, `/explore`, and `/` on deployed preview.
- [ ] Verify REST API contract and MCP negotiation/tool behaviors using maintained regression scripts; inspect failures rather than skipping tests.
- [ ] Check GitHub Actions dependency-security and glossary-validation status, `npm audit`, and allowed licenses.
- [ ] Review repository root for temporary installers, generated binaries, stale backup files, and accidental credentials; delete only confirmed unused material in a separate reviewed change.

## 4. Publish and tag

- [ ] Merge reviewed housekeeping/documentation PRs.
- [ ] Synchronize canonical JSON-LD publication metadata, generated indexes, Squarespace embed, visible version/timestamp, and release manifest for **every** public release. For Platform releases, verify no curated assertions or concept revisions changed.
- [ ] Verify Production deployment is Ready and the intended `main` commit is live.
- [ ] Create a single Git tag such as `v0.0.89` pointing to the verified release commit, after checking the tag does not exist.
- [ ] Publish the GitHub release with a concise feature list, documentation links, security notes, and known limitations.
- [ ] Verify release links and both browser and machine-readable endpoints.

**Tag caveat:** A release tag is not a substitute for publication metadata synchronization. A Platform release changes publication-level metadata and version strings, but does not alter curated concept assertions or increment individual concept revisions.
