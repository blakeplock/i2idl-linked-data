#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Controlled promotion of individually signed-off editorial decisions.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const decisions=read('i18n/fr.phase11.decisions.json');
const reviewed=read('i18n/fr.reviewed.json');
const proposals=read('i18n/fr.proposals.json');
const canonical=read('public/glossary.jsonld');
const graph=new Map(canonical['@graph'].map(x=>[x['@id'],x]));
const version=graph.get('https://id.i2idl.org/scheme')?.['gs:publicationVersion'];
for(const x of [decisions,reviewed,proposals])assert.equal(x.sourcePublicationVersion,version,'Publication version mismatch');
const byProposal=new Map(proposals.concepts.map(x=>[x.id,x]));
const approved=[];
for(const [id,item] of Object.entries(decisions.concepts)){
 assert(byProposal.has(id),`Unknown proposal ${id}`);
 assert(['pending','approved','rejected'].includes(item.status),`Invalid decision status ${id}`);
 if(item.status!=='approved')continue;
 assert(!reviewed.concepts[id],`Already approved: ${id}; do not overwrite`);
 assert(typeof item.reviewer==='string'&&item.reviewer.trim(),`Missing reviewer ${id}`);
 assert(/^\d{4}-\d{2}-\d{2}$/.test(item.reviewedOn)&&!Number.isNaN(Date.parse(item.reviewedOn)),`Invalid review date ${id}`);
 assert(item.fr?.prefLabel?.trim()&&item.fr?.definition?.trim(),`Missing French content ${id}`);
 assert(Array.isArray(item.fr.altLabels)&&item.fr.altLabels.every(x=>typeof x==='string'&&x.trim()),`Bad altLabels ${id}`);
 const c=graph.get('https://id.i2idl.org/concepts/'+id);
 const def=graph.get(c?.['gs:activeDefinition']?.['@id']);
 assert(c&&def,`Missing canonical data ${id}`);
 const proposal=byProposal.get(id);
 assert.equal(proposal.en.prefLabel,c['skos:prefLabel'],`Source label drift ${id}`);
 assert.equal(proposal.en.definition,def['rdf:value'],`Source definition drift ${id}`);
 approved.push([id,{status:'approved',reviewer:item.reviewer.trim(),reviewedOn:item.reviewedOn,fr:item.fr}]);
}
console.log(`Ready to promote ${approved.length} explicitly approved entries; ${Object.values(decisions.concepts).filter(x=>x.status==='pending').length} remain pending.`);
if(!process.argv.includes('--apply')){console.log('Dry run: no files changed. Use --apply only after editorial signoff.');process.exit(0)}
assert(approved.length>0,'No approved entries to promote');
for(const [id,item] of approved)reviewed.concepts[id]=item;
fs.writeFileSync('i18n/fr.reviewed.json',JSON.stringify(reviewed,null,2)+'\n');
console.log(`PASS: promoted ${approved.length} approved entries; run builders and validation`);
