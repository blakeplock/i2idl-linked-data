// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import api from '../api/v1-graph.mjs';
const saved=globalThis.fetch;
const base='https://id.i2idl.org';
const core={publicationVersion:'v0.0.88',sourceTag:'abc',entries:[{id:'learning-engineering',term:'Learning Engineering'},{id:'data-privacy',term:'Data Privacy'}],allCollections:[{id:`${base}/collections/field/learning-sciences`,slug:'learning-sciences',label:'Learning Sciences',description:'Field',members:[`${base}/concepts/learning-engineering`]}]};
const details={publicationVersion:'v0.0.88',sourceTag:'abc',entries:{'learning-engineering':{broader:[],narrower:[],related:[`${base}/concepts/data-privacy`],externalMappings:[]}}};
const graph={'@graph':[{'@id':`${base}/sources/lebok`,'dcterms:title':'LeBOK','schema:url':'https://lebok.wiki'}]};
const history={'gs:currentRevision':{'@id':`${base}/concepts/learning-engineering/versions/1`},'gs:revisionHistory':[{'@id':`${base}/concepts/learning-engineering/versions/1`,'gs:revisionNumber':1,'gs:contentDigest':'abc','gs:firstObservedRelease':'v0.0.87'}]};
globalThis.fetch=async u=>new Response(JSON.stringify(String(u).includes('glossary-core')?core:String(u).includes('glossary-details')?details:String(u).includes('glossary.jsonld')?graph:history),{status:200});
const req=(p,m='GET')=>api.fetch(new Request(`${base}${p}`,{method:m}));
try{
 let r=await req('/api/v1/concepts/learning-engineering/relationships?route=relationships&id=learning-engineering');let x=await r.json();assert.equal(x.relationships.related[0].term,'Data Privacy');
 r=await req('/api/v1/collections?route=collections');x=await r.json();assert.equal(x.items[0].type,'field');
 r=await req('/api/v1/collections/field/learning-sciences?route=collection&type=field&id=learning-sciences');x=await r.json();assert.equal(x.items[0].term,'Learning Engineering');
 r=await req('/api/v1/sources?route=sources');x=await r.json();assert.equal(x.total,1);
 r=await req('/api/v1/sources/lebok?route=source&id=lebok');x=await r.json();assert.equal(x.source.title,'LeBOK');
 r=await req('/api/v1/concepts/learning-engineering/versions?route=versions&id=learning-engineering');x=await r.json();assert.equal(x.revisions[0].revision,1);
 r=await req('/api/v1/collections?route=collections&limit=0');assert.equal(r.status,400);
 r=await req('/api/v1/collections?route=collections&wat=1');assert.equal(r.status,400);
 r=await req('/api/v1/collections?route=collections','HEAD');assert.equal(await r.text(),'');
 r=await req('/api/v1/collections?route=collections','POST');assert.equal(r.status,405);
 r=await req('/api/v1/concepts/nope/relationships?route=relationships&id=nope');assert.equal(r.status,404);
 console.log('PASS REST API Phase 2: relationships, collections, sources, history, bounds, errors, HEAD, methods');
}finally{globalThis.fetch=saved;}
