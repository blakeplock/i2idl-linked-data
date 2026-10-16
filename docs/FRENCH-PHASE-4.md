# French localization Phase 4: Human editorial approval workflow

This phase intentionally does **not** publish draft translations. It provides explicit, per-concept promotion of previously reviewed French wording into `i18n/fr.reviewed.json`. Preserve the source wording in `i18n/fr.proposals.json` as the editorial record; review preferred terminology, aliases, accents, definition meaning, and provenance against authoritative bilingual sources before approving.

## Installation
Copy both scripts to the repository `scripts/` directory. Continue on the `french-localization` branch; no GitHub CLI commit is required.

## Commands

```sh
node scripts/validate-fr-proposals.mjs
node scripts/report-fr-review.mjs
node scripts/review-fr-translations.mjs --ids learning-engineering,learning-sciences --reviewer "YOUR NAME"
```

The third command only PREVIEWS. After actually checking both French definitions, rerun with `--apply`, using a real reviewer name. **Do not execute `--apply` for unreviewed content.**

```sh
node scripts/review-fr-translations.mjs --ids learning-engineering,learning-sciences --reviewer "YOUR NAME" --apply
node scripts/build-glossary-language-index.mjs
node scripts/build-glossary-language-index.mjs --check
npm run validate
```

For each approved entry, the language index will expose `en`, `fr`, and `translationReview`. A downstream UI must fall back to English for any unapproved French content. The index is a separate experiment, not yet a canonical SKOS/JSON-LD multilingual release. `gs:publicationVersion` remains v0.0.90.

## Release boundary
Do not switch canonical `skos:prefLabel` and `rdf:value` strings to JSON-LD language maps in this phase: current API, Explorer, and index builders expect strings. Final bilingual publication requires simultaneous updates to JSON-LD, API/resolvers, SPARQL, Explorer, Squarespace, and release-history snapshots, followed by a coordinated version bump.
