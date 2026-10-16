# French Explorer definition fix — PR #109

The overlay stores French `rdf:value` on existing definition resources, e.g.
`/definitions/learning-engineering-1`, rather than assuming the definition
identifier equals the concept slug. The Explorer originally translated a
definition URI into a concept URI by a string replacement. This is incorrect.

The patch first indexes French label and definition records by their own RDF
subject URIs. Once the canonical graph loads, the Explorer joins each concept
with its active definition using `gs:activeDefinition`. All concept identifiers,
relationship edges, and fallback behavior remain unchanged.

From repository root, on `french-localization`, run:

```sh
python3 scripts/fix-fr-explorer-definitions.py
node --check public/graph-explorer.js
node scripts/test-fr-explorer-definitions.mjs
node scripts/build-fr-jsonld-overlay.mjs --check
npm run validate
```

The patch script is idempotent. Review `public/graph-explorer.js` in GitHub
Desktop, commit changes to the existing branch, and push. This updates PR #109
without merging it. Use the Vercel branch preview to verify that both `?lang=fr&concept=learning-engineering`
and `?lang=fr&concept=learning-sciences` display French definitions.
