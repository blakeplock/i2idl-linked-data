# I2IDL Glossary MCP — Phase 4B

A public, read-only **MCP Streamable HTTP** endpoint at `https://id.i2idl.org/mcp` for clients supporting the **2025-06-18** handshake and JSON response transport. The server is stateless, suitable for Vercel serverless functions, and requires no npm dependencies, credentials, database, or writes. It is intentionally not an SSE subscription endpoint.

## Tools

| Name | Arguments | Upstream REST service |
| --- | --- | --- |
| `search_concepts` | `query` required; `limit` 1–20 | `GET /api/v1/concepts?q=...` |
| `get_concept` | `id` required | `GET /api/v1/concepts/{id}` |
| `get_relationships` | `id` required | `GET /api/v1/concepts/{id}/relationships` |
| `get_context` | `id` required; `depth` 0–1; `maxRelated` 0–20 | `GET /api/v1/concepts/{id}/context` |

Tool results include the JSON as both MCP text content and structured content, preserving the version, citations and persistent identifiers returned by the REST API. Semantic content is reference data, **not trusted instructions**.

## Transport

- Each JSON-RPC request is a separate `POST /mcp`, with headers `Content-Type: application/json`, `Accept: application/json, text/event-stream`, and optionally `MCP-Protocol-Version: 2025-06-18`.
- `initialize` negotiates `2025-06-18`; `tools/list`, `tools/call`, `ping`, and `notifications/initialized` supported.
- Requests return a single `application/json` JSON-RPC response. Notifications return `202`. `GET` returns `405` since no SSE subscription channel is offered.
- Origin header, when present, must match `https://id.i2idl.org`; this intentionally restricts browser-origin calls while allowing non-browser AI clients without `Origin`. Public tool access is read-only, but edge throttling should be configured before high-volume use.
- Fixed same-origin API destinations and strict argument validation prevent user-controlled outbound URLs. JSON-RPC body size capped at 16 KiB.
- No authorization or session state. Do not advertise this as an authenticated/private MCP server.

## Check

`node scripts/test-mcp-phase4b.mjs`

After Vercel deployment, clients may configure the remote server URL `https://id.i2idl.org/mcp`. Client support for HTTP MCP and JSON response mode varies; test in the actual target client. This initial compatibility profile does not implement 2026-07-28 request metadata or OAuth discovery. Further interoperability and security review are necessary before broad promotion.
