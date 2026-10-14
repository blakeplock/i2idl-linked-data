// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import mcp from '../api/mcp.mjs';
const base='https://id.i2idl.org/mcp';
const headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream'};
async function rpc(payload,moreHeaders={}) {
  const res=await mcp.fetch(new Request(base,{method:'POST',headers:{...headers,...moreHeaders},body:JSON.stringify(payload)}));
  return {status:res.status,body:await res.json()};
}
function initialize(version,id=1){return {jsonrpc:'2.0',id,method:'initialize',params:{protocolVersion:version,capabilities:{},clientInfo:{name:'compat-test',version:'1.0.0'}}};}
let r=await rpc(initialize('2025-06-18'));
assert.equal(r.status,200);
assert.equal(r.body.result.protocolVersion,'2025-06-18');
r=await rpc(initialize('2025-11-25',2));
assert.equal(r.status,200);
assert.equal(r.body.result.protocolVersion,'2025-06-18','server must negotiate an implemented version, not falsely claim newer support');
r=await rpc(initialize('2026-07-28',3));
assert.equal(r.status,200);
assert.equal(r.body.result.protocolVersion,'2025-06-18');
r=await rpc(initialize('garbage',4));
assert.equal(r.body.error.code,-32602);
r=await rpc({jsonrpc:'2.0',id:5,method:'tools/list',params:{}},{'MCP-Protocol-Version':'2025-06-18'});
assert.equal(r.status,200);
assert.equal(r.body.result.tools.length,4);
r=await rpc({jsonrpc:'2.0',id:6,method:'tools/list',params:{}},{'MCP-Protocol-Version':'2025-11-25'});
assert.equal(r.status,400);
assert.equal(r.body.error.code,-32602);
console.log('PASS MCP negotiation: legacy versions negotiate supported 2025-06-18, invalid version rejected, tools preserved, unsupported post-initialize headers rejected');
