#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Apply a minimal, fail-closed MCP production-readiness patch."""
from pathlib import Path
p=Path('api/mcp.mjs')
if not p.is_file():
    raise SystemExit('Run from the i2idl-linked-data repository root (api/mcp.mjs missing).')
s=p.read_text()
if 'MCP_UPSTREAM_TIMEOUT_MS' in s:
    raise SystemExit('Hardening patch already applied; no changes made.')

def replace_once(old,new):
    global s
    occurrences=s.count(old)
    if occurrences != 1:
        raise SystemExit(f'Unexpected source ({occurrences} matches for {old[:80]!r}); no files changed.')
    s=s.replace(old,new,1)

replace_once('const MAX_BODY = 16384;', '''const MAX_BODY = 16384;
const MCP_UPSTREAM_TIMEOUT_MS = 8000;
const MCP_UPSTREAM_MAX_BYTES = 262144; // 256 KiB, measured before JSON parsing.
// Read only a bounded upstream body, even if Content-Length is missing or false.
async function boundedJSON(response) {
  const length = response.headers.get('content-length');
  if (length !== null && Number.isFinite(Number(length)) && Number(length) > MCP_UPSTREAM_MAX_BYTES)
    throw new Error('MCP upstream response exceeded size limit');
  if (!response.body) throw new Error('MCP upstream response has no body');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MCP_UPSTREAM_MAX_BYTES) {
        await reader.cancel().catch(()=>{});
        throw new Error('MCP upstream response exceeded size limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let position = 0;
  for (const chunk of chunks) {bytes.set(chunk, position); position += chunk.byteLength;}
  const data = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('MCP upstream response is not a JSON object');
  return data;
}''')
replace_once("  name, description, inputSchema: { type:'object', additionalProperties:false, properties, required }", "  name, description, annotations: {readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false}, inputSchema: { type:'object', additionalProperties:false, properties, required }")
replace_once('''      const fetched=await fetch(url,{headers:{Accept:'application/json'}});
      if(!fetched.ok){
        const data=await fetched.json().catch(()=>({error:{message:'Glossary API unavailable'}}));
        const message=String(data?.error?.message||`Glossary API returned HTTP ${fetched.status}`);
        return rpcResult(id,{isError:true,content:[{type:'text',text:message}]});
      }
      const data=await fetched.json();
      return rpcResult(id,{content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data});''', '''      const controller = new AbortController();
      // Explicit timer also covers slow response-body streaming after headers arrive.
      const timeout = setTimeout(() => controller.abort(), MCP_UPSTREAM_TIMEOUT_MS);
      try {
        const fetched = await fetch(url, {headers:{Accept:'application/json'}, signal:controller.signal});
        if (!fetched.ok) {
          // Do not echo arbitrary upstream error bodies to MCP clients.
          return rpcResult(id,{isError:true,content:[{type:'text',text:'Glossary API request failed'}]});
        }
        const data = await boundedJSON(fetched);
        return rpcResult(id,{content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data});
      } finally {
        clearTimeout(timeout);
      }''')
p.write_text(s)
print('Patched api/mcp.mjs: read-only annotations, 8s upstream timeout, 256 KiB streaming response cap, generic upstream errors')
