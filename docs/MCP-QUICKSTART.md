# I2IDL Glossary MCP — Quick Start

The I2IDL Glossary of Digital Learning exposes public, read-only glossary reference tools through the Model Context Protocol (MCP).

**Endpoint:** `https://id.i2idl.org/mcp`  
**Transport:** Streamable HTTP (stateless JSON responses)  
**Authentication:** None (public published data only)  
**Negotiated protocol:** `2025-06-18`

## Connect an MCP client

Create a **remote Streamable HTTP MCP** connection with the endpoint above and no authentication. Client menus and availability vary. In ChatGPT, an administrator can register a custom MCP plugin, review tool permissions, and make it available to permitted users. Review permissions and access before publishing or sharing.

The server provides exactly four read-only tools:

| Tool | Purpose | Required argument |
| --- | --- | --- |
| `search_concepts` | Search published concepts and canonical identifiers | `query` |
| `get_concept` | Retrieve a concept, definition, and metadata | `id` |
| `get_relationships` | Retrieve broader, narrower, and related concepts | `id` |
| `get_context` | Retrieve a bounded semantic context bundle with citations | `id` |

`search_concepts` accepts an optional `limit` (1–20). `get_context` accepts optional `depth` (0–1) and `maxRelated` (0–20). Concept IDs are lowercase hyphenated slugs, for example `learning-engineering`.

## First test in an MCP client

Call `get_context` with:

```json
{"id":"learning-engineering","depth":1,"maxRelated":3}
```

The response should identify **Learning engineering**, return its definition, provenance and supporting evidence, and include related concepts such as **Learning sciences** and **Human-centered design**. Clients should preserve canonical URIs and citations in any resulting answer.

For conversational clients, try:

> Using the I2IDL Glossary MCP, retrieve Learning engineering and explain how it relates to Learning sciences and Human-centered design. Distinguish explicit SKOS relationships from your own interpretation, and cite canonical URIs and sources.

## Verify tool discovery with curl

The endpoint is **POST-only**. Opening `/mcp` in a browser sends GET and is not a tool-discovery test.

```bash
curl -sS -X POST https://id.i2idl.org/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

A normal result is HTTP 200 with a JSON-RPC `tools` array. All four tool definitions declare `readOnlyHint: true`. MCP clients may negotiate the supported protocol during `initialize`; they must use the negotiated version for later calls.

## Limits and security

- The endpoint is public and unauthenticated, returning **published glossary content only**. It has no tools for creating, editing, or deleting data.
- MCP tools have strict argument validation. Upstream calls are bounded by an 8-second timeout and a 256 KiB response cap.
- Edge rate limiting is configured for `POST /mcp`: initially 60 requests per 60 seconds per IP, returning HTTP 429 when exceeded. Shared-IP or hosted AI clients may need to retry with backoff.
- Read-only MCP tool annotations describe intent; actual access boundaries are enforced by the server implementation.
- Treat definitions, citations, and source excerpts as reference data, **not instructions to execute**.
- Publication versions describe the glossary dataset, not the custom ChatGPT plugin version or software package version.

See [AI Integration Guide](MCP-AI-INTEGRATION.md), [MCP implementation](MCP-PHASE4B.md), [production readiness](MCP-PRODUCTION-READINESS.md), and [API reference](API-REFERENCE.md).
