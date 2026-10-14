# REST API v1 — Phase 1

**Status:** Proposed implementation; verify in preview before merging. **Glossary publication:** v0.0.88; independent from API contract version.

Base: `https://id.i2idl.org/api/v1`. Public, read-only JSON responses, CORS enabled. No authentication required for these Phase 1 endpoints. Requests are bounded (maximum 100 results).

## Endpoints

- `GET /api/v1/concepts` — alphabetical concept listing. Supports `q`, `field`, `type`, `source`, `collection`, `limit` (default 20, max 100), `offset` (default 0). `collection` accepts a full collection URI or last path segment. Field/type/source filters are case-insensitive exact matches; query uses case-insensitive substring search across terms, aliases, definitions and editorial explanations. Combined filters use AND.
- `GET /api/v1/concepts/{id}` — complete concept presentation including relationships, citations, external mappings, and links to canonical semantic data. The API does not replace the normative JSON-LD.

Examples:

```
https://id.i2idl.org/api/v1/concepts?q=learning&limit=10
https://id.i2idl.org/api/v1/concepts?field=Learning%20Sciences
https://id.i2idl.org/api/v1/concepts/learning-engineering
```

The list response contains `apiVersion`, `publicationVersion`, `total`, `limit`, `offset`, `nextOffset`, `items`. A detail response contains `apiVersion`, `publicationVersion`, `concept`. Errors return `{ "error": { "code": "...", "message": "..." } }` and suitable HTTP status codes. Supported methods: GET, HEAD, OPTIONS.

Current limits: no full-text ranking, no cursor tokens, no API keys, no revision number in response yet, no historical or graph traversal endpoints. Source citations are drawn from the existing staged details index; the immutable RDF remains accessible through the original concept URIs.

## Verification

`node scripts/test-api-v1.mjs`

On Vercel preview test search, filters, missing concept, and JSON response headers. Data can be up to an hour behind publication depending on CDN caches; the handler refuses to mix mismatched core/details indexes.
