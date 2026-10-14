# I2IDL Glossary — MCP Registry publishing

This directory contains a registry metadata manifest for the existing public remote MCP service. It changes no glossary data, Vercel configuration, REST endpoints, or Squarespace code. The glossary publication remains v0.0.88. The registry listing version (`1.0.0`) is independent of that publication version.

## Registry identity

- Name: `io.github.blakeplock/i2idl-glossary`
- Title: I2IDL Glossary of Digital Learning
- Transport: remote Streamable HTTP
- URL: `https://id.i2idl.org/mcp`
- Authentication to **use the MCP server**: none
- Authentication to **publish registry metadata**: GitHub OAuth by `blakeplock`

The official registry is currently in preview; schemas and requirements may change. GitHub namespace ownership is required. Remote-only entries need no npm publication.

## Steps (run separately from repository root)

1. Create branch `docs/mcp-registry-publication` in GitHub Desktop.
2. Copy `server.json` to repository root and this guide to `docs/MCP-REGISTRY-PUBLISHING.md`.
3. Run `python3 -m json.tool server.json > /dev/null` to check JSON syntax.
4. Install the publisher, if needed: `brew install mcp-publisher`.
5. Run `mcp-publisher validate server.json`. **Do not publish if validation fails.**
6. Run `npm run validate` and `git diff --check`.
7. Commit only `server.json` and `docs/MCP-REGISTRY-PUBLISHING.md`, open a PR, and merge after checks pass.
8. In the merged checkout, run `mcp-publisher login github` and complete the GitHub browser authorization for the `blakeplock` account.
9. Run `mcp-publisher publish server.json`.
10. Verify with `curl -sS 'https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.blakeplock/i2idl-glossary'` and confirm the intended server name and remote URL appear.

If publication reports a name/URL conflict, stop and investigate; do not silently change the remote endpoint or publish under a different identity. If the validator rejects schema/fields, capture the output and revise the manifest before submitting.

## Notes

Browser GET requests to `/mcp` return HTTP 405 by design; client requests use POST. Server tool annotations are read-only; the service is public but operationally rate limited. External AI clients must support remote Streamable HTTP and the negotiated MCP protocol version. Never publish GitHub OAuth codes, access tokens, or terminal output containing tokens.

## Official references

- https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/remote-servers.mdx
- https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx
- https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/cli/commands.md
- https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md
