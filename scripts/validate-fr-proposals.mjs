#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import assert from 'node:assert/strict';
const proposal=JSON.parse(fs.readFileSync('i18n/fr.proposals.json','utf8'));
const glossary=JSON.parse(fs.readFileSync('public/glossary.jsonld','utf8'));
const graph=glossary['@graph'];
const scheme=graph.find(n=>n['@id']==='https://id.i2idl.org/scheme');
assert.equal(proposal.sourcePublicationVersion,scheme['gs:publicationVersion']);
assert.equal(proposal.language,'fr');
assert.equal(proposal.status,'draft-only — not for publication');
const concepts=graph.filter(n=>[n['@type']].flat().includes('skos:Concept'));
const byId=new Map(concepts.map(c=>[c['dcterms:identifier'],c]));
const byUri=new Map(graph.map(n=>[n['@id'],n]));
const seen=new Set();
for(const item of proposal.concepts){
 assert(!seen.has(item.id),'Duplicate '+item.id);seen.add(item.id);
 assert.equal(item.status,'draft');assert(!item.reviewer&&!item.reviewedOn);
 const c=byId.get(item.id);assert(c,'Unknown '+item.id);
 assert.equal(c['skos:prefLabel'],item.en.prefLabel,'English label drift: '+item.id);
 const d=byUri.get(c['gs:activeDefinition']['@id']);
 assert.equal(d?.['rdf:value'],item.en.definition,'English definition drift: '+item.id);
 assert(item.fr.prefLabel?.trim()&&item.fr.definition?.trim(),'Missing French: '+item.id);
 assert(Array.isArray(item.fr.altLabels),'French aliases must be array: '+item.id);
}
assert.equal(proposal.concepts.length,34);
console.log(`PASS French editorial proposals: ${seen.size} draft concepts, no canonical changes`);
