# I2IDL French support — Phase 2

This phase creates a **separate presentation-language index**. No canonical URIs, English JSON-LD assertions, or immutable revision snapshots are changed. The empty reviewed catalog is deliberate: it does not claim French translations exist yet.

## Install
Copy `scripts/build-glossary-language-index.mjs` and `i18n/fr.reviewed.json` to the same paths in the `french-localization` branch.

## Run
```sh
node scripts/build-glossary-language-index.mjs
node scripts/build-glossary-language-index.mjs --check
npm run validate
```

The output `public/glossary-languages.json` contains 420 English entries and initially **0 French entries**. It is a supplemental data payload for future bilingual consumers, not a replacement for `glossary-core.json` or the canonical `glossary.jsonld`.

## Adding reviewed French translations
Populate `concepts` in `i18n/fr.reviewed.json` with entries keyed by the **existing canonical slug**. Example below is a SHAPE EXAMPLE ONLY, not a verified translation or publishable approval:
```json
{
  "some-existing-slug": {
    "status": "approved",
    "reviewer": "Real reviewer identity",
    "reviewedOn": "2026-10-16",
    "fr": {
      "prefLabel": "Reviewed French term",
      "definition": "Reviewed French definition",
      "altLabels": []
    }
  }
}
```
Keep source language and evidence separate from translator attribution. Do not mark a translation approved without editorial review.

## Important limitations / next steps
- This index is a compatibility layer only; multilingual SKOS language literals must be added to the canonical graph and covered by immutable content revisions in a subsequent release stage.
- Existing Explorer, REST, MCP, SPARQL and Squarespace do **not yet** read this index. Do not change the Squarespace embed or bump v0.0.90 on this phase.
- Before introducing French values, define a language-aware JSON-LD field migration, add legacy-English compatibility in builders and API resolvers, and update graph Explorer and Squarespace together.
- Add automated coverage, translation status, and review provenance tests to CI before publication.
