# REST API v1 — Phase 2

Adds these public, read-only routes to the deployed Phase 1 REST API:

| Route | Description |
| --- | --- |
| `GET /api/v1/concepts/{id}/relationships` | Broader/narrower/related concepts with labels and external mappings |
| `GET /api/v1/concepts/{id}/versions` | Normalized existing immutable historical revision metadata |
| `GET /api/v1/collections?type=field` | Collection listing; `type` optionally `field`, `type` or `curated` |
| `GET /api/v1/collections/{type}/{id}` | Paginated collection members with labels |
| `GET /api/v1/sources` | List of canonical glossary source nodes |
| `GET /api/v1/sources/{id}` | Canonical source metadata |

Collections use `limit` (1–100, default 20) and `offset` (0–100000, default 0). Error responses use `{ "error": { "code": "...", "message": "..." } }` with HTTP status codes. `GET`, `HEAD`, `OPTIONS` are supported. Data remain authoritative only at their original canonical JSON-LD URIs.

All endpoints use the existing static published indexes, canonical JSON-LD, or the existing historical version service. No persistent state, database, new npm dependency, or concept revision is created. Collection listings reference a matched `sourceTag` pair; source queries use the canonical graph. At high traffic levels, caching and rate limiting should be configured at the deployment edge.

Run `node scripts/test-api-v1-phase2.mjs` followed by `node scripts/test-api-v1.mjs` and `npm run validate`. Confirm Vercel preview responses before merging.
