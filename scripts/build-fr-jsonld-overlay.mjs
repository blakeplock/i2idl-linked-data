#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Preview-only, language-tagged RDF overlay. Does not mutate canonical graph.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const canonical = read('public/glossary.jsonld');
const catalog = read('public/glossary-languages.json');
const reviewed = read('i18n/fr.reviewed.json');
const scheme = canonical['@graph'].find(n=>n['@id']==='https://id.i2idl.org/scheme');
assert(scheme,'Canonical scheme absent');
const version = scheme['gs:publicationVersion'];
assert.equal(catalog.publicationVersion,version,'Catalog/canonical version mismatch');
assert.equal(reviewed.sourcePublicationVersion,version,'Review/canonical version mismatch');
assert.equal(catalog.conceptCount,420,'Unexpected concept count');
const all = new Map(canonical['@graph'].map(n=>[n['@id'],n]));
const concepts = canonical['@graph'].filter(n=>[n['@type']].flat().includes('skos:Concept'));
const approved = reviewed.concepts || {};
const overlay = [];
for(const c of concepts){
 const id = c['dcterms:identifier'];
 const entry = approved[id];
 if(!entry) continue;
 assert.equal(entry.status,'approved',`${id}: not approved`);
 assert(entry.reviewer && /^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedOn),`${id}: reviewer and date required`);
 const d = all.get(c['gs:activeDefinition']?.['@id']);
 assert(d,`${id}: missing definition`);
 const local = catalog.entries[id];
 assert(local && local.canonicalUri===c['@id'],`${id}: identifier mismatch`);
 assert.equal(local.fr?.prefLabel,entry.fr?.prefLabel,`${id}: catalog out of sync`);
 assert.equal(local.fr?.definition,entry.fr?.definition,`${id}: catalog definition mismatch`);
 assert(typeof entry.fr?.prefLabel==='string' && entry.fr.prefLabel.trim(),`${id}: missing label`);
 assert(typeof entry.fr?.definition==='string' && entry.fr.definition.trim(),`${id}: missing definition`);
 const lang=s=>({'@value':s,'@language':'fr'});
 overlay.push({'@id':c['@id'],'skos:prefLabel':lang(entry.fr.prefLabel),...(entry.fr.altLabels?.length?{'skos:altLabel':entry.fr.altLabels.map(lang)}:{})});
 overlay.push({'@id':d['@id'],'rdf:value':lang(entry.fr.definition)});
}
const out={'@context': canonical['@context'], '@graph': overlay};
const target='public/glossary-fr-preview.jsonld';
if(process.argv.includes('--check')){
 assert(fs.existsSync(target),`Missing ${target}`);
 assert.deepEqual(read(target),out,'Overlay is stale');
 console.log(`PASS French RDF overlay: ${overlay.length/2} reviewed concepts, ${overlay.length} RDF subjects; unchanged canonical IDs`);
}else{
 fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');
 console.log(`Wrote ${target}: ${overlay.length/2} reviewed concepts; preview only`);
}
