#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Explicitly promote human-reviewed French translations into the approved catalog.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const args=process.argv.slice(2);
const arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1]};
const apply=args.includes('--apply');
const ids=(arg('--ids')||'').split(',').map(x=>x.trim()).filter(Boolean);
const reviewer=(arg('--reviewer')||'').trim();
const date=arg('--date')||new Date().toISOString().slice(0,10);
if(!ids.length||!reviewer||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))throw Error('Usage: node scripts/review-fr-translations.mjs --ids learning-engineering,learning-sciences --reviewer "Name" [--date YYYY-MM-DD] [--apply]');
assert.equal(new Set(ids).size,ids.length,'Duplicate selected identifier');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const proposals=read('i18n/fr.proposals.json');
const approved=read('i18n/fr.reviewed.json');
const graph=read('public/glossary.jsonld');
const version=graph['@graph'].find(n=>n['@id']==='https://id.i2idl.org/scheme')?.['gs:publicationVersion'];
assert.equal(version,proposals.sourcePublicationVersion,'Proposal version mismatch');
assert.equal(version,approved.sourcePublicationVersion,'Approved catalog version mismatch');
const nodes=new Map(graph['@graph'].map(n=>[n['@id'],n]));
const byProposal=new Map(proposals.concepts.map(x=>[x.id,x]));
const changes=[];
for(const id of ids){
  const item=byProposal.get(id);
  assert(item,`No proposal for ${id}`);
  assert(!approved.concepts[id],`${id}: already approved; never overwrite automatically`);
  const concept=nodes.get(`https://id.i2idl.org/concepts/${id}`);
  assert(concept,`${id}: missing canonical concept`);
  const def=nodes.get(concept['gs:activeDefinition']?.['@id']);
  assert(def,`${id}: missing canonical definition`);
  assert.equal(item.en.prefLabel,concept['skos:prefLabel'],`${id}: English label changed; re-review`);
  assert.equal(item.en.definition,def['rdf:value'],`${id}: English definition changed; re-review`);
  assert(typeof item.fr.prefLabel==='string'&&item.fr.prefLabel.trim(),`${id}: missing French label`);
  assert(typeof item.fr.definition==='string'&&item.fr.definition.trim(),`${id}: missing French definition`);
  assert(Array.isArray(item.fr.altLabels)&&item.fr.altLabels.every(x=>typeof x==='string'&&x.trim()),`${id}: invalid French aliases`);
  changes.push({id,en:item.en,fr:item.fr});
}
console.log(`${apply?'APPLY':'PREVIEW'}: ${changes.length} explicitly selected translation(s) for review by ${reviewer} on ${date}`);
for(const item of changes)console.log(`  ${item.id}: ${item.en.prefLabel} -> ${item.fr.prefLabel}`);
if(!apply){console.log('No changes made. Verify each French label and definition before --apply.');process.exit(0)}
for(const item of changes)approved.concepts[item.id]={status:'approved',reviewer,reviewedOn:date,fr:item.fr};
fs.writeFileSync('i18n/fr.reviewed.json',JSON.stringify(approved,null,2)+'\n');
console.log('Updated i18n/fr.reviewed.json. Now rebuild and validate language index.');
