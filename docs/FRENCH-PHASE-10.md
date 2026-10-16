# French Phase 10: Graph results and Research Discovery

A narrowly scoped additive patch to the merged Phase 9 code. It translates generated Research Discovery status messages, publication metadata and matched-concept counts; and re-renders existing research results from memory when EN/FR changes, **without fetching OpenAlex again**. Existing shortest-path, comparison and Graph Analytics results are re-rendered from graph data on language changes, preserving selected concepts and graph calculations.

## Apply

Create `french-phase10-results` from updated `main` using GitHub Desktop. Extract this package into repository root and run:

```sh
python3 scripts/apply-fr-phase10.py
node --check public/graph-explorer.js
node --check public/research-discovery.js
node --check public/i2idl-dynamic-i18n.js
node scripts/test-fr-phase10.mjs
npm run validate
```

Commit and push with GitHub Desktop, then open a PR. Do not merge before testing `/explore?lang=fr&concept=learning-engineering` in a Vercel branch deployment.

**Browser checklist:** Run shortest path, comparison and analytics; switch French → English → French without re-running tools manually. Find research papers; switch languages and confirm titles/authors/DOIs remain unchanged while explanatory text changes; confirm no duplicate OpenAlex network request. Check CSV/BibTeX still export correctly. Check on mobile. This phase retains the two approved French concept translations and the English semantic publication v0.0.90. Some advanced source-network analytics wording and filter summaries remain English for future review.
