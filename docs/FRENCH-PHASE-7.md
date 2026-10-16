# French Phase 7 — Graph Explorer preview

On the `french-localization` branch, first build the reviewed translation artifacts:

```sh
node scripts/build-glossary-language-index.mjs
node scripts/build-fr-jsonld-overlay.mjs
node scripts/build-fr-jsonld-overlay.mjs --check
node scripts/test-fr-jsonld-overlay.mjs
```

Copy `scripts/apply-fr-explorer-preview.py` into `scripts/`, then run from your repo root:

```sh
python3 scripts/apply-fr-explorer-preview.py
node --check public/graph-explorer.js
npm run validate
```

The patch modifies **only** `public/graph.html` and `public/graph-explorer.js` and leaves canonical JSON-LD, identifiers, version history, and v0.0.90 metadata unchanged. It adds a language selector and loads `/glossary-fr-preview.jsonld` alongside `/glossary.jsonld`. French labels and definitions are shown where reviewed, with English fallback. Search includes both French and English titles/aliases/definitions independent of display choice. Selection, paths, graph edges, and concept URIs remain canonical.

Use the deployed **Vercel branch preview** to test `/explore?lang=fr&concept=learning-engineering` and `/explore?lang=fr&concept=learning-sciences`. Verify switching back to English, filtering, search with accents and without accents, research controls, and version history. Some deeper analytics and third-party Research Discovery copy are still English; this phase is not full interface localization.

**Important:** Keep your branch open. Do not publish to main or update Squarespace. Do not claim the two approved French entries imply complete French coverage of all 420 concepts. If your local branch differs from the v0.0.90 Explorer, the patch deliberately exits instead of guessing at replacements. Inspect GitHub Desktop's changed files before committing.
