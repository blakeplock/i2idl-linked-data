// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import mcp from '../api/mcp.mjs';
const BASE='https://id.i2idl.org/mcp';
const original=globalThis.fetch;
let upstream=[];
globalThis.fetch=async (url)=>{upstream.push(String(url));return new Response(JSON.stringify({apiVersion:'v1',publicationVersion:'v0.0.88',items:[],concept:{id:'learning-engineering'},evidence:[{source:'LeBOK'}]}),{headers:{'content-type':'application/json'}});};
async function send(method,params={},id=1,headers={}){
 return mcp.fetch(new Request(BASE,{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream',...headers},body:JSON.stringify({jsonrpc:'2.0',id,method,params})}));
}
try{
 let r=await send('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}});let v=await r.json();assert.equal(v.result.protocolVersion,'2025-06-18');
 r=await send('tools/list');v=await r.json();assert.deepEqual(v.result.tools.map(t=>t.name),['search_concepts','get_concept','get_relationships','get_context']);
 r=await send('tools/call',{name:'search_concepts',arguments:{query:'learning',limit:3}});v=await r.json();assert.equal(v.result.structuredContent.publicationVersion,'v0.0.88');assert.match(upstream.pop(),/limit=3/);
 r=await send('tools/call',{name:'get_context',arguments:{id:'learning-engineering',maxRelated:4,depth:1}});v=await r.json();assert.equal(v.result.structuredContent.evidence[0].source,'LeBOK');assert.match(upstream.pop(),/maxRelated=4/);
 r=await send('tools/call',{name:'get_relationships',arguments:{id:'learning-engineering'}});assert.equal(r.status,200);assert.match(upstream.pop(),/relationships/);
 r=await send('tools/call',{name:'get_concept',arguments:{id:'learning-engineering'}});assert.equal(r.status,200);assert.match(upstream.pop(),/learning-engineering$/);
 const before=upstream.length;
 for(const args of [{id:'../secret'},{id:'learning-engineering',depth:5},{id:'learning-engineering',url:'https://evil.example'}]){
   r=await send('tools/call',{name:'get_context',arguments:args});v=await r.json();assert.equal(v.error.code,-32602);
 }
 assert.equal(upstream.length,before);
 r=await send('tools/call',{name:'unknown',arguments:{}});assert.equal((await r.json()).error.code,-32602);
 r=await send('foo');assert.equal((await r.json()).error.code,-32601);
 r=await send('initialize',{protocolVersion:'2099'});assert.equal((await r.json()).error.code,-32602);
 r=await send('tools/list',{},1,{'origin':'https://evil.example'});assert.equal(r.status,403);
 r=await mcp.fetch(new Request(BASE,{method:'GET'}));assert.equal(r.status,405);
 r=await mcp.fetch(new Request(BASE,{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream'},body:'{"jsonrpc":"2.0","method":"notifications/initialized"}'}));assert.equal(r.status,202);
 r=await mcp.fetch(new Request(BASE,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:'{}'}));assert.equal(r.status,406);
 console.log('PASS MCP Phase 4B: initialization, discovery, four tools, grounding, argument bounds, origin, methods, notifications');
}finally{globalThis.fetch=original;}
