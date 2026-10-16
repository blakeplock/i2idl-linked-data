# PR #112 — Preserve analysis selections on language switching

From the `french-phase10-results` branch, extract this package into the repository root, preserving directories. Run:

```sh
python3 scripts/fix-fr-phase10-preserve.py
node --check public/graph-explorer.js
node scripts/test-fr-phase10-preserve.mjs
node scripts/test-fr-phase10.mjs
npm run validate
```

The fix captures pathfinding and comparison selections and whether results have been displayed *before* `populateResearch()` rebuilds option labels and clears result panels. It restores those selections and only reruns analyses that were visible. No graph data or semantic identifiers are changed.

Commit and push via GitHub Desktop; PR #112 updates automatically. Do not merge before checking the Vercel preview.
