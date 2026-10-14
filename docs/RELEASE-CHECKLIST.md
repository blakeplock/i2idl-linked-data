# Release Checklist

[Documentation index](README.md) · [Publication guide](PUBLICATION.md)

Use this checklist before creating a GitHub release. Repository/package version, canonical glossary publication version, Squarespace displayed version, and GitHub release tag are separate and must be checked explicitly.

## 1. Establish release scope

- [ ] Confirm the exact current version in `public/glossary.jsonld` (`gs:publicationVersion`).
- [ ] Confirm the live Squarespace glossary displays the same glossary version.
- [ ] Decide whether this release changes **content/semantics**, **platform only**, or **both**.
- [ ] Choose the release tag after checking existing tags and release policy; do not assume v0.0.87 is the next release.
- [ ] Decide whether to update glossary/content version as part of this release; do **not** silently bump data for a platform-only change.

## 2. Repository checks

```bash
npm ci
npm run validate
npm run relationships:coverage
npm run indexes:build
git diff --exit-code -- public/glossary-core.json public/glossary-details.json public/glossary-web.json
npm run validate:live
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

## 4. Publish and tag

- [ ] Merge reviewed housekeeping/documentation PRs.
- [ ] If glossary publication version changed, synchronize canonical JSON-LD, generated indexes, Squarespace embed, and visible version/timestamp; validate both surfaces.
- [ ] Verify Production deployment is Ready and the intended `main` commit is live.
- [ ] Create an annotated Git tag, e.g. `v0.0.87`, pointing to the reviewed release commit.
- [ ] Publish the GitHub release with a concise feature list, documentation links, security notes, and known limitations.
- [ ] Verify release links and both browser and machine-readable endpoints.

**Tag caveat:** A release tag is not a substitute for changing the actual canonical glossary publication data. Never state the graph is v0.0.87 unless its publication metadata and human glossary have been updated and verified.
