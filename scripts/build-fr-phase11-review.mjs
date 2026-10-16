#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Build an editorial review packet without changing published translations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const proposals=read('i18n/fr.proposals.json');
const reviewed=read('i18n/fr.reviewed.json');
const canonical=read('public/glossary.jsonld');
const nodes=new Map(canonical['@graph'].map(n=>[n['@id'],n]));
const version=nodes.get('https://id.i2idl.org/scheme')?.['gs:publicationVersion'];
assert.equal(proposals.sourcePublicationVersion,version);
assert.equal(reviewed.sourcePublicationVersion,version);
const pending=proposals.concepts.filter(x=>!reviewed.concepts[x.id]);
assert.equal(new Set(proposals.concepts.map(x=>x.id)).size,proposals.concepts.length);
for(const x of pending){
 const c=nodes.get('https://id.i2idl.org/concepts/'+x.id);assert(c,`Unknown concept ${x.id}`);
 const d=nodes.get(c['gs:activeDefinition']?.['@id']);assert(d,`Missing active definition ${x.id}`);
 assert.equal(x.en.prefLabel,c['skos:prefLabel'],`Label mismatch ${x.id}`);
 assert.equal(x.en.definition,d['rdf:value'],`Definition mismatch ${x.id}`);
 assert(x.fr.prefLabel?.trim()&&x.fr.definition?.trim(),`Incomplete proposal ${x.id}`);
}
const esc=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
const lines=[`# French translation editorial review — ${version}`,'',`**Pending:** ${pending.length} concepts. **Previously approved:** ${Object.keys(reviewed.concepts).length}.`,'','These are proposals, not approved translations. Review the fidelity of the French definition to the English source, terminology, ambiguity, variants, and supporting terminology references. No canonical identifiers change.','','| # | Concept URI | English label | Proposed French label |','|---:|---|---|---|',...pending.map((x,i)=>`| ${i+1} | \`${x.id}\` | ${esc(x.en.prefLabel)} | ${esc(x.fr.prefLabel)} |`),'','## Individual reviews',''];
for(const [i,x] of pending.entries())lines.push(`### ${i+1}. ${x.en.prefLabel} — ${x.id}`,'',`**Canonical URI:** https://id.i2idl.org/concepts/${x.id}`,'',`**English definition:** ${x.en.definition}`,'',`**Proposed French preferred label:** ${x.fr.prefLabel}`,'',`**Proposed French definition:** ${x.fr.definition}`,'',`**Existing review note:** ${x.reviewNotes||'—'}`,'',`**Source provenance:** ${x.sourceProvenance||'—'}`,'','**Editorial review:** Check terminology, source fidelity, inclusion/exclusion, regional usage (where relevant), and appropriate French alternates. Record your decision in `i18n/fr.phase11.decisions.json`.','','---','');
fs.mkdirSync('i18n',{recursive:true});
fs.writeFileSync('i18n/fr.phase11.review.md',lines.join('\n')+'\n');
const existing='i18n/fr.phase11.decisions.json';
if(!fs.existsSync(existing)){
 const decisions={schemaVersion:1,sourcePublicationVersion:version,language:'fr',instructions:'Only status=approved, reviewer and reviewedOn authorize promotion; edit labels and definitions here after review. Keep pending for all unreviewed entries.',concepts:Object.fromEntries(pending.map(x=>[x.id,{status:'pending',reviewer:'',reviewedOn:'',fr:structuredClone(x.fr),notes:''}]))};
 fs.writeFileSync(existing,JSON.stringify(decisions,null,2)+'\n');
}else{
 const decisions=read(existing);assert.equal(decisions.sourcePublicationVersion,version,'Existing decisions from another release');
 for(const x of pending)assert(decisions.concepts[x.id],`Missing decision ${x.id}`);
}
console.log(`PASS: prepared ${pending.length} pending reviews; no translations approved automatically`);
