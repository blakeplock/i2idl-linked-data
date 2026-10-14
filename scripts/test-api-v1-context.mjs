// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import api from '../api/v1-context.mjs';
const old = globalThis.fetch;
const base = 'https://id.i2idl.org';
const core = {publicationVersion:'v0.0.88',semanticProfileVersion:'0.4.0',sourceTag:'123',entries:[
  {id:'learning-engineering',term:'Learning Engineering',definition:'A defined concept',why:'Editorial note',aka:'LE',field:'Learning Sciences',type:'Concept',collections:[]},
  {id:'data-privacy',term:'Data Privacy',definition:'Privacy definition',aka:'',field:'Governance',type:'Concept',collections:[]}
]};
const details = {publicationVersion:'v0.0.88',sourceTag:'123',entries:{
  'learning-engineering':{broader:[],narrower:[],related:[`${base}/concepts/data-privacy`],sources:[{name:'LeBOK',detail:'Chapter 2',url:'https://lebok.wiki',relation:'direct'}],externalMappings:[]},
  'data-privacy':{broader:[],narrower:[],related:[],sources:[],externalMappings:[]}
}};
globalThis.fetch=async u=>new Response(JSON.stringify(String(u).includes('glossary-core')?core:details),{status:200});
const call=(suffix,method='GET')=>api.fetch(new Request(`${base}/api/v1/concepts/learning-engineering/context${suffix}`,{method}));
try {
  let r=await call('?id=learning-engineering'); let b=await r.json();
  assert.equal(r.status,200); assert.equal(b.publicationVersion,'v0.0.88');
  assert.equal(b.evidence[0].citationDetail,'Chapter 2');
  assert.equal(b.neighbors[0].term,'Data Privacy');
  assert.equal(b.neighbors[0].relation,'related');
  assert.equal(b.concept.citationUri,`${base}/concepts/learning-engineering.jsonld`);
  r=await call('?id=learning-engineering&depth=0');b=await r.json();assert.equal(b.neighbors.length,0);
  r=await call('?id=learning-engineering&maxRelated=0');b=await r.json();assert.equal(b.traversal.truncated,true);
  r=await call('?id=learning-engineering&depth=2');assert.equal(r.status,400);
  r=await call('?id=learning-engineering&maxRelated=21');assert.equal(r.status,400);
  r=await call('?id=learning-engineering&url=https://evil.example');assert.equal(r.status,400);
  r=await call('?id=unknown');assert.equal(r.status,404);
  r=await call('?id=Learning-Engineering');assert.equal(r.status,400);
  r=await call('?id=learning-engineering','HEAD');assert.equal(r.status,200);assert.equal(await r.text(),'');
  r=await call('?id=learning-engineering','OPTIONS');assert.equal(r.status,204);
  r=await call('?id=learning-engineering','POST');assert.equal(r.status,405);
  details.sourceTag='mismatch';
  const orig=console.error;console.error=()=>{};
  try{r=await call('?id=learning-engineering');assert.equal(r.status,503);}finally{console.error=orig;}
  console.log('PASS Phase 4: grounded context, evidence, neighbors, bounds, errors, HEAD, OPTIONS, index mismatch');
} finally {globalThis.fetch=old;}
