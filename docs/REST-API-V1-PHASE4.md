# REST API v1 — Phase 4: AI context bundles

This platform-only phase introduces `GET /api/v1/concepts/{id}/context` to provide deterministic, bounded semantic context suitable for RAG and agent applications. It does **not** perform inference, train models, embed text, expose an MCP server, or change publication content.

The response includes the concept's term, definition, editorial explanation, identifiers, field/type, collections, available external mappings, source evidence with citation details and URLs, and one hop of labeled broader/narrower/related neighbors (with their definitions). It also returns a version label, matched index source tag and canonical RDF links. All fields are projections of published indexes and should be interpreted as data, not AI instructions.

## Parameters

- `depth=0|1` (default `1`): whether to include immediate neighbors.
- `maxRelated=0..20` (default `10`): maximum total neighbors, processed in broader, narrower, related order. This is **not** a relevance ranking.

Examples:

```
https://id.i2idl.org/api/v1/concepts/learning-engineering/context
https://id.i2idl.org/api/v1/concepts/learning-engineering/context?depth=0
https://id.i2idl.org/api/v1/concepts/learning-engineering/context?maxRelated=5
```

Response fields: `apiVersion`, `bundleVersion`, `publicationVersion`, `semanticProfileVersion`, `sourceTag`, `concept`, `evidence`, `neighbors`, `traversal`, `provenance`, `usageNote`.

`traversal.truncated` tells the caller when not all available neighbors are shown. Empty citations indicate the published index has no citation for that concept; they are not proof that a concept is verified. No generated summaries, invented relationships, unstated source claims, or historical revisions are included.

## Security and release model

Read-only and unauthenticated; allows GET, HEAD, OPTIONS. Fixed same-origin fetches only, strict identifier validation, no arbitrary URL fetch, strict parameter whitelist, bounded traversal, consistent errors, and cross-origin reads. The API refuses mismatched presentation indexes. No new dependencies. Canonical JSON-LD remains authoritative. Source license terms remain applicable to downstream reuse. This feature requires no new glossary version or Squarespace update.

## Validation

```
node scripts/test-api-v1-context.mjs
node scripts/test-api-v1.mjs
node scripts/test-api-v1-phase2.mjs
npm run validate
```

After merging, verify the production context endpoint against the same concept's canonical JSON-LD. MCP integration is a separate future step with its own protocol, security, and rate-limit review.
