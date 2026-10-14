# REST API v1 — Phase 3: Developer documentation

This platform-only release adds a public OpenAPI 3.1 document and an interactive, dependency-free documentation page. It does not change API response behavior, canonical JSON-LD, history snapshots, or Squarespace.

- `/api/openapi.json` — versioned API contract, describing eight GET routes and corresponding HEAD/OPTIONS semantics
- `/api/docs` — browser-based endpoint selector, parameter inputs, JSON response viewer, and JS/Python/cURL examples

OpenAPI describes actual Phase 1 and 2 payload shapes and bounded query parameters. It is a developer guide, not a substitute for the normative JSON-LD publication. Responses may contain extra fields from the underlying glossary indexes.

## Local checks

Run `node scripts/test-api-v1-contract.mjs`, `node scripts/test-api-v1-phase2.mjs`, `node scripts/test-api-v1.mjs`, `npm run validate`, and `git diff --check`. Check both documentation endpoints on a Vercel preview, including mobile usability, before merging.

## Security and operational details

Documentation fetches only same-origin URLs from the published OpenAPI specification. Server endpoints remain read-only; no arbitrary SPARQL or file fetching is introduced. JSON output is displayed via `textContent`, not injected into HTML. No external JS, CSS, or font dependencies. Requests use existing public CORS handling. The new documentation has no authentication requirement or data-collection behavior. CDN and edge rate-limiting remain deployment concerns.
