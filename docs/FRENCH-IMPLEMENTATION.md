# I2IDL French (fr) — implementation foundation

## Scope
- Preserve `https://id.i2idl.org/concepts/{slug}` and definition identifiers.
- Preserve 420 curated concepts, definitions, sources, evidence, collection membership, and SKOS relationships.
- Mark translated labels and definitions `@language: "fr"`; maintain English text, with fallback when French is unavailable.
- New French text is *editorial draft* until reviewed. Never treat machine translation as approved.
- Do not independently assign all French translations to the main graph before consumer compatibility and version-history work is complete.

## Phases / dependencies
1. Compatibility audit (this package). Run `node scripts/audit-glossary-i18n.mjs` and `node scripts/test-i2idl-languages.mjs`.
2. Adapt `scripts/build-glossary-web.mjs` to project a backward-compatible `.term`, `.definition`, `.aka` in English and additional `i18n.en/fr` objects. Preserve core/details sourceTag synchronization.
3. Adapt JSON-LD resolvers, REST and MCP output and the Explorer to negotiate or select `en`/`fr` with English fallback; expose translation status and evidence.
4. Translate and review a pilot concept set, then scale. Use scoped French reviewer approvals, cross-check concept identity and semantic precision.
5. Introduce `skos:prefLabel` and `skos:altLabel` language-value arrays and language-tagged `rdf:value` only when consumers and JSON-LD context have been tested. Extend validators. Existing revision hashes must be revised, not overwritten.
6. Add EN/FR toggle in the existing Squarespace design. Keep browser language preference optional and user-selectable. Test autocomplete, search, filters, daily concept, cards, and URL deep links.
7. Prepare release **after** content approval and tests. Update immutable version history, GitHub release metadata and Squarespace together.

## Compatibility contract
For multilingual fields, the reusable helper supports a legacy plain string or one/multiple JSON-LD value objects, e.g.:

```json
"skos:prefLabel": [
  {"@value": "Learning Engineering", "@language": "en"},
  {"@value": "Ingénierie de l’apprentissage", "@language": "fr"}
]
```

The actual existing graph should not be rewritten to this representation until consumers handle it. In particular, Graph Explorer currently renders `skos:prefLabel` as a string. A content-only edit would break display and sorting.
