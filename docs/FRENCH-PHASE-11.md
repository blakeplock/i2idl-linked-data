# I2IDL French Phase 11 — editorial review and controlled approval

## Purpose

Prepare 32 pending French proposals for editorial review. **The package does not approve any draft automatically.** The two existing approved concepts remain untouched. French proposals are verified against the current canonical English preferred label and active definition before being presented.

## Installation

Create branch `french-phase11-review` from current `main` in GitHub Desktop. Extract this package into repository root. Run:

```sh
node scripts/build-fr-phase11-review.mjs
node scripts/apply-fr-phase11-decisions.mjs
npm run validate
```

Read `i18n/fr.phase11.review.md`. Edit the French text in `i18n/fr.phase11.decisions.json` if needed and explicitly set `status` to `approved`, with `reviewer` and `reviewedOn` on EACH approved entry. Unreviewed entries must stay `pending`.

Dry-run again:

```sh
node scripts/apply-fr-phase11-decisions.mjs
```

Only after actual editorial signoff:

```sh
node scripts/apply-fr-phase11-decisions.mjs --apply
node scripts/build-glossary-language-index.mjs
node scripts/build-fr-jsonld-overlay.mjs
node scripts/test-fr-jsonld-overlay.mjs
node scripts/build-glossary-language-index.mjs --check
node scripts/build-fr-jsonld-overlay.mjs --check
npm run validate
```

Check `public/glossary-languages.json` French-approved count, and the JSON-LD preview overlay. The source English graph is unchanged. The review/decisions files can be committed before approval; do not claim 34 approvals until editorial signoff. A second `--apply` with already approved records will fail closed; create a new batch or mark those entries excluded before additional runs.

## Editorial cautions

Pay special attention to electronic versus online learning, educational terminology with regional variation, and xAPI/semantic standards terms for which literal translations could change meaning. Provenance for the English definitions must not be misrepresented as evidence that French terms came from ERIC.
