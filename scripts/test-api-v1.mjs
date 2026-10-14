// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import api from '../api/v1.mjs';
const original=globalThis.fetch;
const core={publicationVersion:'v0.0.88',sourceTag:'abc',entries:[
  {id:'learning-engineering',term:'Learning Engineering',definition:'Engineering for learning',why:'Helpful',aka:'LE',field:'Learning Engineering',type:'Discipline',collections:['https://id.i2idl.org/collections/field/learning-engineering']},
  {id:'data-privacy',term:'Data Privacy',definition:'Privacy in data',why:'Important',aka:'',field:'Enterprise & Governance',type:'Concept',collections:[]}]};
const details={publicationVersion:'v0.0.88',sourceTag:'abc',entries:{
  'learning-engineering':{broader:[],narrower:[],related:['https://id.i2idl.org/concepts/data-privacy'],sources:[{name:'LeBOK'}],externalMappings:[]},
  'data-privacy':{broader:[],narrower:[],related:[],sources:[],externalMappings:[]}}};
globalThis.fetch=async u=>new Response(JSON.stringify(String(u).includes('glossary-core')?core:details),{status:200});
async function req(path,method='GET') {return api.fetch(new Request(`https://id.i2idl.org${path}`,{method}));}
try{
 let r=await req('/api/v1/concepts?route=concepts&q=learning');let x=await r.json();assert.equal(x.total,1);assert.equal(x.items[0].id,'learning-engineering');
 r=await req('/api/v1/concepts?route=concepts&limit=1&offset=1');x=await r.json();assert.equal(x.items.length,1);assert.equal(x.total,2);
 r=await req('/api/v1/concepts?route=concepts&source=LeBOK');x=await r.json();assert.equal(x.total,1);
 r=await req('/api/v1/concepts/learning-engineering?route=concept&id=learning-engineering');x=await r.json();assert.equal(x.concept.relationships.related.length,1);
 r=await req('/api/v1/concepts/not-here?route=concept&id=not-here');assert.equal(r.status,404);
 r=await req('/api/v1/concepts?route=concepts&limit=-1');assert.equal(r.status,400);
 r=await req('/api/v1/concepts?route=concepts&unknown=1');assert.equal(r.status,400);
 r=await req('/api/v1/concepts?route=concepts','HEAD');assert.equal(r.status,200);assert.equal(await r.text(),'');
 r=await req('/api/v1/concepts?route=concepts','POST');assert.equal(r.status,405);
 r=await req('/api/v1/concepts?route=concepts','OPTIONS');assert.equal(r.status,204);
 details.sourceTag='different';r=await req('/api/v1/concepts?route=concepts');assert.equal(r.status,503);
 console.log('PASS REST API Phase 1: search, filters, pagination, retrieval, 404, 400, HEAD, methods, index mismatch');
}finally{globalThis.fetch=original;}
