#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Build a separate multilingual presentation catalog without mutating canonical JSON-LD.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(`${root}/${p}`, 'utf8'));
const canonical = read('public/glossary.jsonld');
const review = read('i18n/fr.reviewed.json');
const nodes = canonical['@graph'];
const byId = new Map(nodes.map(n => [n['@id'], n]));
const concepts = nodes.filter(n => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).includes('skos:Concept'));
const scheme = byId.get('https://id.i2idl.org/scheme');
assert(scheme?.['gs:publicationVersion'], 'Missing publication version');
assert.equal(review.schemaVersion, 1);
assert.equal(review.sourcePublicationVersion, scheme['gs:publicationVersion'], 'Translation catalog based on a different release');
assert.deepEqual(review.languages, ['en','fr']);
assert(review.concepts && typeof review.concepts === 'object' && !Array.isArray(review.concepts));
const present = new Set(concepts.map(n => n['dcterms:identifier']));
for (const [id, item] of Object.entries(review.concepts)) {
  assert(present.has(id), `Unknown concept: ${id}`);
  assert(item && item.status === 'approved', `${id}: only reviewed/approved French translations may enter publication index`);
  assert(typeof item.reviewer === 'string' && item.reviewer.trim(), `${id}: reviewer required`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(item.reviewedOn), `${id}: review date required`);
  assert(item.fr && typeof item.fr.prefLabel === 'string' && item.fr.prefLabel.trim(), `${id}: missing French preferred label`);
  assert(typeof item.fr.definition === 'string' && item.fr.definition.trim(), `${id}: missing French definition`);
  assert(item.fr.altLabels === undefined || (Array.isArray(item.fr.altLabels) && item.fr.altLabels.every(x => typeof x === 'string' && x.trim())), `${id}: invalid alternate labels`);
}
const entries = Object.fromEntries(concepts.map(c => {
  const id = c['dcterms:identifier'];
  const def = byId.get(c['gs:activeDefinition']?.['@id']);
  assert(def, `Missing definition: ${id}`);
  const aliases = c['skos:altLabel'] == null ? [] : Array.isArray(c['skos:altLabel']) ? c['skos:altLabel'] : [c['skos:altLabel']];
  const translated = review.concepts[id];
  return [id, {
    canonicalUri: c['@id'],
    en: {prefLabel:c['skos:prefLabel'], definition:def['rdf:value'], altLabels:aliases},
    ...(translated ? {fr:translated.fr, translationReview:{status:'approved', reviewer:translated.reviewer, reviewedOn:translated.reviewedOn}} : {})
  }];
}));
const output = {
  schemaVersion:1, publicationVersion:scheme['gs:publicationVersion'], languages:['en','fr'],
  fallbackLanguage:'en', conceptCount:concepts.length,
  frenchApprovedCount:Object.values(entries).filter(x=>x.fr).length, entries
};
if (process.argv.includes('--check')) {
  if (fs.existsSync('public/glossary-languages.json')) {
    assert.deepEqual(read('public/glossary-languages.json'),output,'Language index needs regeneration');
  }
  console.log(`PASS language index: ${output.conceptCount} concepts, ${output.frenchApprovedCount} approved French entries`);
} else {
  fs.writeFileSync('public/glossary-languages.json',JSON.stringify(output)+'\n');
  console.log(`Wrote public/glossary-languages.json: ${output.conceptCount} concepts, ${output.frenchApprovedCount} French approved`);
}
