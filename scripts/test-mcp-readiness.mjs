// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import mcp from '../api/mcp.mjs';
const original = globalThis.fetch;
const endpoint='https://id.i2idl.org/mcp';
const headers={'content-type':'application/json','accept':'application/json, text/event-stream'};
const request = (method,params={},id=1)=>mcp.fetch(new Request(endpoint,{
  method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id,method,params})
}));
const normal={apiVersion:'v1',publicationVersion:'v0.0.88',concept:{id:'learning-engineering'},evidence:[{source:'LeBOK'}]};
const tool=()=>request('tools/call',{name:'get_context',arguments:{id:'learning-engineering',maxRelated:3}});
try {
  globalThis.fetch=async ()=>new Response(JSON.stringify(normal),{status:200,headers:{'content-type':'application/json'}});
  let r=await request('tools/list');let obj=await r.json();
  assert.equal(obj.result.tools.length,4);
  for(const t of obj.result.tools){
    assert.deepEqual(t.annotations,{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false});
  }
  r=await tool();obj=await r.json();
  assert.equal(obj.result.structuredContent.evidence[0].source,'LeBOK');
  assert.equal(JSON.parse(obj.result.content[0].text).publicationVersion,'v0.0.88');
  globalThis.fetch=async ()=>new Response(JSON.stringify({error:{message:'secret internal trace'}}),{status:500});
  r=await tool();obj=await r.json();
  assert.equal(obj.result.isError,true);
  assert.ok(!JSON.stringify(obj).includes('secret internal trace'));
  globalThis.fetch=async ()=>new Response('x'.repeat(270000),{status:200});
  r=await tool();obj=await r.json();assert.equal(obj.result.isError,true);
  assert.ok(!obj.result.structuredContent);
  globalThis.fetch=async ()=>new Response('x',{status:200,headers:{'content-length':'300000'}});
  r=await tool();obj=await r.json();assert.equal(obj.result.isError,true);
  // Verify AbortSignal is forwarded, and aborting the upstream request is handled safely.
  let signal;
  globalThis.fetch=async (_url,options)=>{signal=options.signal;throw new DOMException('Aborted','AbortError');};
  r=await tool();obj=await r.json();assert.equal(obj.result.isError,true);
  assert.ok(signal instanceof AbortSignal);
  assert.equal((await request('initialize',{protocolVersion:'2025-11-25'})).status,200);
  console.log('PASS MCP production readiness: read-only tool annotations, bounded success, safe errors, response limits, abort signal, negotiation');
}finally{globalThis.fetch=original;}
