# I2IDL Glossary MCP — production readiness

**Scope:** Platform-only patch; no changes to the canonical JSON-LD, glossary publication, Squarespace embed, or the read-only REST API.

## Implemented in this patch

- All four existing tools declare MCP `annotations`: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, and `openWorldHint: false`. These are advisory classification hints, not enforcement mechanisms.
- The upstream fetch has an **8-second abort timeout**, covering response-body streaming as well as headers.
- Every successful upstream response is read with an enforced **256 KiB maximum**, including responses without `Content-Length`.
- Upstream error bodies are not reflected to MCP clients; operational failures produce a generic `isError` result.
- Protocol negotiation remains at the supported **2025-06-18** revision. Tool names, argument schemas, and JSON + structuredContent response shape are unchanged.

## Still requires operator action

**Rate limiting has not been configured by this patch.** Set a production WAF or edge rate-limit rule on `/mcp`, monitor the effect on real ChatGPT requests, and consider limits on the dependent REST routes as well. Start with a conservative per-IP threshold and review legitimate NAT/shared-IP traffic before enforcement. The appropriate numeric threshold depends on observed traffic; no one-size-fits-all number is assumed.

**Inspect and monitor** request rate, 4xx/5xx ratios, latency, function execution duration, and upstream failure rates. Avoid logging payloads containing user queries or any secret headers.

**Plugin approval:** Confirm ChatGPT reclassifies the tools as read-only after refreshing their metadata. Disable automatic enrollment of future tools, and keep review of newly added tools enabled.

**Security boundary:** This is public, unauthenticated, read-only data; read-only annotations do not replace server-enforced permissions. A compromised deployment or changed upstream endpoints could still introduce risks. Keep secret configuration out of responses and review all tool additions.

## Verification

Run each from repository root:

```sh
python3 apply-mcp-hardening.py
node scripts/test-mcp-readiness.mjs
node scripts/test-mcp-phase4b.mjs
node scripts/test-mcp-negotiation.mjs
npm run validate
git diff --check
```

Commit `api/mcp.mjs`, `scripts/test-mcp-readiness.mjs`, `docs/MCP-PRODUCTION-READINESS.md`. Do **not** commit the one-time `apply-mcp-hardening.py` installer.

After Vercel preview, verify initial handshake, `tools/list` annotations and `get_context`; then merge and refresh the ChatGPT plugin's tool discovery. Do not claim that edge rate limiting is active until separately configured and tested.
