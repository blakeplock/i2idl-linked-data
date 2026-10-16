# I2IDL Phase 9: Dynamic Explorer localization, batch 1

This patch targets the merged Phase 8 source on `main`. Start a new branch `french-phase9-dynamic` in GitHub Desktop. Extract the ZIP into the repository root.

Run:

```sh
python3 scripts/apply-fr-phase9.py
node --check public/i2idl-dynamic-i18n.js
node --check public/graph-explorer.js
node --check public/research-discovery.js
node scripts/test-fr-phase9.mjs
npm run validate
```

Check `/explore?lang=fr&concept=learning-engineering`; try shortest path, concept comparison, Graph Analytics, then switch languages and re-run each action. English fallback still applies to 418 untranslated concepts. The app's calculations and data sources are not changed.

**Scope:** This is the first dynamic-string batch: core concept action descriptions, relationship headings, shortest-path messaging, comparison empty state, Graph Analytics summary labels, and Research Discovery settings-change feedback. Other dynamic messages, advanced analytics descriptions, OpenAlex result text, and some comparison summaries are deliberately left for batch 2. The helper is internal UI copy, not a translation of canonical RDF.

Do not merge before Vercel browser checks. Do not bump the v0.0.90 semantic publication version for interface-only changes.
