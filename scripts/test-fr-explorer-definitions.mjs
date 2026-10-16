#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('public/graph-explorer.js','utf8');
assert(!source.includes("id.replace('/definitions/','/concepts/')"), 'Old slug-based mapping remains');
assert(source.includes('i2idlAttachFrenchDefinitions(graph,i2idlFrench);'), 'Explorer does not join definitions during graph load');
const start=source.indexOf('function i2idlAttachFrenchDefinitions(');
const end=source.indexOf('function onGraph(',start);
assert(start>=0&&end>start,'Missing resolver function');
const code=source.slice(start,end);
const canonical=JSON.parse(fs.readFileSync('public/glossary.jsonld','utf8'));
const overlay=JSON.parse(fs.readFileSync('public/glossary-fr-preview.jsonld','utf8'));
const graph=canonical['@graph'];
const translations=new Map();
for(const n of overlay['@graph']){
  const id=n['@id'];
  const item=translations.get(id)||{};
  if(n['skos:prefLabel']?.['@language']==='fr')item.label=n['skos:prefLabel']['@value'];
  if(n['rdf:value']?.['@language']==='fr')item.definition=n['rdf:value']['@value'];
  translations.set(id,item);
}
const context=vm.createContext({translations,graph});
vm.runInContext(`const refs=x=>x==null?[]:Array.isArray(x)?x:[x];const rid=x=>typeof x==='string'?x:x&&x['@id'];${code}\ni2idlAttachFrenchDefinitions(graph,translations);`,context);
for(const id of ['learning-engineering','learning-sciences']){
  const uri=`https://id.i2idl.org/concepts/${id}`;
  const concept=graph.find(n=>n['@id']===uri);
  assert(concept,'Missing canonical concept '+id);
  const definitionId=concept['gs:activeDefinition']['@id'];
  assert.notEqual(definitionId,`https://id.i2idl.org/definitions/${id}`,'Fixture must cover nonmatching definition URI');
  assert.equal(translations.get(uri)?.definition,translations.get(definitionId)?.definition,`${id}: French definition join failed`);
  assert(translations.get(uri)?.label,`${id}: French label missing`);
}
assert.equal(graph.filter(n=>[].concat(n['@type']).includes('skos:Concept')).length,420);
console.log('PASS: Explorer resolves both approved French definitions via canonical gs:activeDefinition (420 concepts unchanged)');
