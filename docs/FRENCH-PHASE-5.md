# Phase 5 - EN/FR Squarespace interface preview

This phase makes a complete **unpublished** bilingual preview HTML from the existing full v0.0.90 Squarespace embed. It does not change canonical JSON-LD, versioning snapshots, the Graph Explorer, or the live site.

## Install

Copy `scripts/build-fr-squarespace-preview.py` into the same directory in your `i2idl-linked-data` repo. Keep Phase 1-4 files on your `french-localization` branch.

First, ensure the approved translation catalog includes the two concepts reviewed in Phase 4, and run:

```sh
node scripts/build-glossary-language-index.mjs
node scripts/build-glossary-language-index.mjs --check
npm run validate
```

Generate the draft embed using a **local copy** of the published v0.0.90 embed (for example, saved as `squarespace-v0.0.90.html` in the repository root):

```sh
python3 scripts/build-fr-squarespace-preview.py --input squarespace-v0.0.90.html --output preview/glossary-fr-preview.html
```

The package contains a generated example at `preview/glossary-fr-preview.html`. Do **not publish** this on your live Squarespace page yet.

## Functionality in this preview

- Adds an accessible English / Francais toggle to the existing hero without changing the CSS design system.
- Reads `https://id.i2idl.org/glossary-languages.json` only when available and the publication version and concept count match.
- Uses reviewed French preferred labels and definitions where present; otherwise falls back to English.
- Searches both languages, including accents and unaccented spellings, regardless of current display language.
- Keeps identifiers, semantic links, collection filters, source attribution, version tag, and English default.
- Keeps partial English interface chrome deliberately: this is an intermediate test, not the completed FR localization.

## Important dependencies and boundaries

- The preview fetches the language catalog from the **deployed** endpoint. Publishing `public/glossary-languages.json` to an approved Vercel preview branch is necessary for actual French terms to appear in a browser. Until then, the EN/FR switch shows English fallback.
- Neither the public Squarespace page nor the Graph Explorer has been updated by this phase.
- Translations have NOT been inserted into the canonical RDF graph as `@fr` literals. That work requires coordination with index builders, resolver, SPARQL, history snapshots, and API clients, then a synchronized release.
- A successful JavaScript syntax check does not replace manual browser testing of source hydration, searching, deep links, and language toggle with the preview URL.

## Preview checks

1. Open the preview in a test-only Squarespace page or a controlled web preview (not production).
2. Confirm 420 entries and both language toggles.
3. Search `ingenierie` and `ingénierie`, confirm the reviewed `learning-engineering` entry is found and labeled in French when FR is selected.
4. Check English fallback on an untranslated concept, plus source citations and connected-concept links.
5. Toggle languages while a filtered entry is selected; check that search, copy links, and concept selection still function.
6. Check mobile and keyboard navigation.

This package intentionally does not bump the public release version or tag. Use GitHub Desktop to commit these development-only files when ready.
