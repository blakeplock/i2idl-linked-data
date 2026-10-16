#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync('public/glossary-fr-preview.jsonld','utf8'));
const canonical=JSON.parse(fs.readFileSync('public/glossary.jsonld','utf8'));
const valid=new Map(canonical['@graph'].map(n=>[n['@id'],n]));
const types=new Set(['skos:prefLabel','skos:altLabel','rdf:value']);
for(const node of p['@graph']){
 assert(valid.has(node['@id']),`Unknown canonical URI ${node['@id']}`);
 for(const [key,value] of Object.entries(node)){
  if(key==='@id')continue;
  assert(types.has(key),`Unexpected predicate ${key}`);
  for(const literal of Array.isArray(value)?value:[value]){
   assert.equal(literal['@language'],'fr',`${key}: not French-tagged`);
   assert(typeof literal['@value']==='string' && literal['@value'].trim(),`Empty ${key}`);
  }
 }
}
assert.equal(p['@graph'].length%2,0,'Expect concept+definition pair');
console.log(`PASS: ${p['@graph'].length/2} French concept/definition pairs resolve to existing canonical URIs`);
