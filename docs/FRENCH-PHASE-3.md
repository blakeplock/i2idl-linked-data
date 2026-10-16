# I2IDL French: Phase 3 editorial proposals

This package proposes French preferred terms and definitions for **34 existing I2IDL concepts**: the 23 ERIC-related additions plus 11 core concepts in learning engineering, learning sciences, xAPI, and interoperability.

**No translation is approved by this package.** Drafts are working translations created for review, not verified quotations from UNESCO or any other authoritative French source. Their English definitions are from I2IDL v0.0.90 and retain their separate provenance. Do not describe proposals as reviewed by UNESCO/ERIC.

## Install

Copy `i18n/fr.proposals.json`, `i18n/fr.review-sheet.csv`, and `scripts/validate-fr-proposals.mjs` to the same paths in the `french-localization` repository branch. Do not change `i18n/fr.reviewed.json` yet.

Run `node scripts/validate-fr-proposals.mjs`, then `npm run validate` and `node scripts/build-glossary-language-index.mjs --check`. These commands do not publish anything.

## Review

Edit the spreadsheet, verify each translation against French-language authoritative sources where available, and resolve editorial disagreements. When a specific entry has been approved, manually transfer it to `i18n/fr.reviewed.json` in the **Phase 2** schema: `concepts[id] = { status: "approved", reviewer: "...", reviewedOn: "YYYY-MM-DD", fr: { prefLabel: "...", definition: "...", altLabels: [] } }`. Record term provenance in editorial notes/work papers. The Phase 2 builder rejects unapproved entries.

## Important

Translation of a concept is a new language expression, not a new concept URI. Preserve `https://id.i2idl.org/concepts/{id}`. No release bump or Squarespace deployment at this step. Only after review and technical adaptations should the translation be represented with language-tagged SKOS/JSON-LD literals and included in a versioned release.
