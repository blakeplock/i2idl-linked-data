#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Read-only baseline report. Does not change canonical JSON-LD or history.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { asArray, languageOf, textOf, selectText } from '../lib/i2idl-languages.mjs';
const file = process.argv[2] || 'public/glossary.jsonld';
const graph = JSON.parse(fs.readFileSync(file, 'utf8'));
assert(Array.isArray(graph['@graph']), 'Expected a JSON-LD @graph array');
const nodes = graph['@graph'];
const concepts = nodes.filter(n => asArray(n['@type']).includes('skos:Concept'));
const byId = new Map(nodes.map(n => [n['@id'],n]));
const refs = x => typeof x === 'string' ? x : x?.['@id'];
const countLanguages = value => [...new Set(asArray(value).map(x => languageOf(x)).filter(Boolean))];
const report = {
  publicationVersion: byId.get('https://id.i2idl.org/scheme')?.['gs:publicationVersion'] ?? null,
  concepts: concepts.length,
  conceptsMissingEnglishLabel: [], conceptsWithFrenchLabel: [],
  definitionsMissingEnglish: [], definitionsWithFrench: [],
  legacyStringLabels: 0, legacyStringDefinitions: 0,
  conceptsMissingDefinition: [], duplicatePreferredLanguages: [],
  identifiersStable: true,
  notes: [
    'This audit reads only; it does not insert machine translations.',
    'EN remains the default for older consumers until the web builder, resolver, MCP, SPARQL, Explorer and Squarespace are language-aware.',
    'Translate concepts via editorial review; preserve canonical URIs and existing history.'
  ]
};
for(const c of concepts){
  const id = c['dcterms:identifier'] || c['@id'];
  const label = c['skos:prefLabel'];
  if(typeof label==='string') report.legacyStringLabels++;
  if(!selectText(label,'en')) report.conceptsMissingEnglishLabel.push(id);
  if(countLanguages(label).includes('fr')) report.conceptsWithFrenchLabel.push(id);
  const langs = asArray(label).map(x => languageOf(x)).filter(Boolean);
  if(new Set(langs).size!==langs.length) report.duplicatePreferredLanguages.push(id);
  const d = byId.get(refs(c['gs:activeDefinition']));
  if(!d) {report.conceptsMissingDefinition.push(id);continue;}
  if(typeof d['rdf:value']==='string') report.legacyStringDefinitions++;
  if(!selectText(d['rdf:value'],'en')) report.definitionsMissingEnglish.push(id);
  if(countLanguages(d['rdf:value']).includes('fr')) report.definitionsWithFrench.push(id);
  if(!c['@id']?.startsWith('https://id.i2idl.org/concepts/')) report.identifiersStable=false;
}
console.log(JSON.stringify(report,null,2));
if(report.conceptsMissingEnglishLabel.length || report.definitionsMissingEnglish.length || report.conceptsMissingDefinition.length || report.duplicatePreferredLanguages.length || !report.identifiersStable)process.exitCode=1;
