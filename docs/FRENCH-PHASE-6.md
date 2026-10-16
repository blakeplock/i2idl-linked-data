# French Phase 6 — Preview JSON-LD overlay

This phase delivers standards-based `@fr` RDF literals for **reviewed translations only**, without modifying `public/glossary.jsonld`, its existing English strings, resolver, SPARQL behavior, existing concept snapshots, or public release metadata.

## Steps

Copy the files into their matching repository folders while on `french-localization`. First regenerate the approved language index:

```sh
node scripts/build-glossary-language-index.mjs
node scripts/build-fr-jsonld-overlay.mjs
node scripts/build-fr-jsonld-overlay.mjs --check
node scripts/test-fr-jsonld-overlay.mjs
npm run validate
```

Do NOT publish the overlay as the canonical glossary or merge to `main` yet. `public/glossary-fr-preview.jsonld` is an additive, distinct preview resource. In JSON-LD, its subject IRIs match the existing concept and active-definition resources; `skos:prefLabel` and `rdf:value` carry French language-tagged literals. Consumers should merge language-tagged literals with the canonical data, rather than replacing the English value.

## Editorial provenance

`i18n/fr.reviewed.json` is the authority for review status, reviewer and review date. The preview RDF holds lexical content; the review catalog holds approval metadata. No draft terms are emitted. All unreviewed concepts remain English-only.

## Production migration needed before release

The canonical graph, generated core/details/web indexes, REST API, MCP, SPARQL, concept history and Graph Explorer still assume English values in several places. Before publishing a bilingual release, implement and test explicit language selection/fallback in each consumer. Do not simply convert all English string values to arrays of tagged literals. Once ready, construct new immutable concept snapshots for changed assertions and synchronize version, release manifest and Squarespace embed.

## Known boundary

This preview is not yet French support in the live Graph Explorer. It is the RDF feed for that integration; an EN/FR Explorer toggle and bilingual Graph Explorer UI are the next phase.
