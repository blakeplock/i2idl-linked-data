#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Read-only semantic delta proposal. Never writes to versioning/snapshots, releases or registry.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import ParserJsonld from '@rdfjs/parser-jsonld';
import * as rdfCanonize from 'rdf-canonize';

const BASE = 'https://id.i2idl.org';
const SAFE_RELEASE = /^v\d+\.\d+\.\d+$/;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const args = process.argv.slice(2);
function opt(name, fallback) {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error(`${name} requires a value`);
  return args[i + 1];
}
const previous = opt('--from', 'v0.0.87');
const source = opt('--source', 'public/glossary.jsonld');
const output = opt('--out', 'versioning/proposals/latest');
if (!SAFE_RELEASE.test(previous)) throw Error('Invalid --from version');
if (args.some(a => a.startsWith('--') && !['--from','--source','--out'].includes(a))) throw Error('Unknown argument');
const manifest = JSON.parse(fs.readFileSync(`versioning/releases/${previous}.json`, 'utf8'));
const graph = JSON.parse(fs.readFileSync(source, 'utf8'));
if (manifest.release !== previous || manifest.canonicalization !== 'RDFC-1.0' || !Array.isArray(manifest.entries)) throw Error('Unsupported baseline manifest');
if (!graph['@context'] || Array.isArray(graph['@context']) || graph['@context']['@import']) throw Error('Expected inline JSON-LD context');
if (!Array.isArray(graph['@graph'])) throw Error('Expected @graph');
const nodes = graph['@graph'];
const asArray = v => v == null ? [] : Array.isArray(v) ? v : [v];
const ref = v => typeof v === 'string' ? v : v?.['@id'];
const byId = new Map(nodes.map(n => [n['@id'], n]));
if (byId.size !== nodes.length || byId.has(undefined)) throw Error('Duplicate or missing graph node IDs');
const concepts = nodes.filter(n => asArray(n['@type']).includes('skos:Concept'));
const byConcept = new Map(concepts.map(c => [c['@id'], c]));
if (byConcept.size !== concepts.length) throw Error('Duplicate concept IDs');
const known = new Map(manifest.entries.map(e => [e.concept, e]));
if (known.size !== manifest.entries.length) throw Error('Duplicate manifest concepts');
for (const e of manifest.entries) {
  const slug = e.concept.slice(`${BASE}/concepts/`.length);
  if (!e.concept.startsWith(`${BASE}/concepts/`) || !SAFE_SLUG.test(slug) || !Number.isSafeInteger(e.revision) || e.revision < 1 || e.graph !== `${BASE}/graphs/concepts/${slug}/versions/${e.revision}` || e.path !== `snapshots/${slug}/${e.revision}.nq`) throw Error('Invalid manifest entry');
}

function term(t) {
  if (t.termType === 'NamedNode') return `<${t.value}>`;
  if (t.termType === 'BlankNode') return `_:${t.value}`;
  if (t.termType === 'Literal') {
    const value = JSON.stringify(t.value).replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
    if (t.language) return `${value}@${t.language}`;
    if (t.datatype?.value && t.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') return `${value}^^<${t.datatype.value}>`;
    return value;
  }
  throw Error(`Unsupported RDF term ${t.termType}`);
}
async function canonicalSnapshot(concept, graphUri) {
  const uri = concept['@id'];
  const definition = byId.get(ref(concept['gs:activeDefinition']));
  if (!definition) throw Error(`Missing active definition for ${uri}`);
  const memberships = nodes.filter(n => asArray(n['@type']).includes('skos:Collection') && asArray(n['skos:member']).some(v => ref(v) === uri)).map(n => ({'@id':n['@id'], 'skos:member':{'@id':uri}}));
  const doc = {'@context':graph['@context'], '@graph':[concept, definition, ...memberships]};
  const stream = new ParserJsonld().import(Readable.from([JSON.stringify(doc)]));
  const lines = [];
  for await (const q of stream) lines.push(`${term(q.subject)} ${term(q.predicate)} ${term(q.object)} <${graphUri}> .`);
  return rdfCanonize.canonize(lines.join('\n')+'\n', {algorithm:'RDFC-1.0',inputFormat:'application/n-quads',format:'application/n-quads'});
}
function lines(s) { return new Set(s.split('\n').filter(Boolean)); }
function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function diff(oldText, newText) {
  const a = lines(oldText), b = lines(newText);
  return {removed:[...a].filter(x=>!b.has(x)).sort(), added:[...b].filter(x=>!a.has(x)).sort()};
}
const changes=[];
for (const uri of [...new Set([...known.keys(), ...byConcept.keys()])].sort()) {
  const current = byConcept.get(uri);
  const prior = known.get(uri);
  if (!uri.startsWith(`${BASE}/concepts/`) || !SAFE_SLUG.test(uri.slice(`${BASE}/concepts/`.length))) throw Error(`Invalid concept URI ${uri}`);
  if (!current) { changes.push({concept:uri,status:'removed',previousRevision:prior.revision,requiresEditorialDecision:true}); continue; }
  const graphUri = prior?.graph ?? `${BASE}/graphs/concepts/${uri.slice(`${BASE}/concepts/`.length)}/versions/1`;
  const candidate = await canonicalSnapshot(current, graphUri);
  if (!prior) {changes.push({concept:uri,status:'added',proposedRevision:1,addedAssertions: [...lines(candidate)].sort(),requiresEditorialDecision:true});continue;}
  // Validate historical bytes before trusting comparison.
  const oldFile = path.resolve('versioning', prior.path);
  const expectedRoot = path.resolve('versioning/snapshots') + path.sep;
  if (!oldFile.startsWith(expectedRoot)) throw Error('Snapshot path escapes snapshot directory');
  const old = fs.readFileSync(oldFile,'utf8');
  if (sha(old) !== prior.sha256) throw Error(`Historical snapshot hash mismatch: ${uri}`);
  if (old === candidate) continue;
  const delta = diff(old,candidate);
  changes.push({concept:uri,status:'changed',previousRevision:prior.revision,proposedRevision:prior.revision+1,previousSha256:prior.sha256,candidateSha256:sha(candidate),addedAssertions:delta.added,removedAssertions:delta.removed,requiresEditorialDecision:true});
}
// Abort rather than overwriting a previous proposal directory.
if (fs.existsSync(output)) throw Error(`Output already exists: ${output}. Choose a new --out directory.`);
const summary = {comparedAgainst:previous,source,sourcePublicationVersion:byId.get(`${BASE}/scheme`)?.['gs:publicationVersion'] ?? null,createdAt:new Date().toISOString(),counts:{unchanged:byConcept.size-changes.filter(x=>x.status==='changed').length-changes.filter(x=>x.status==='added').length,changed:changes.filter(x=>x.status==='changed').length,added:changes.filter(x=>x.status==='added').length,removed:changes.filter(x=>x.status==='removed').length},changes};
const md = [`# Concept revision proposal`, '', `Compared against **${previous}**. Candidate publication version: **${summary.sourcePublicationVersion ?? 'unspecified'}**.`, '', `Unchanged: ${summary.counts.unchanged} · Changed: ${summary.counts.changed} · Added: ${summary.counts.added} · Removed: ${summary.counts.removed}`, '', '> Review only. No revision snapshots, registries, or release manifests were modified.', ''];
for (const c of changes) {
  md.push(`## ${c.concept.split('/').pop()} — ${c.status}`, '', `Concept: ${c.concept}`, '');
  if (c.previousRevision) md.push(`Prior revision: ${c.previousRevision}`, '');
  if (c.proposedRevision) md.push(`Proposed revision: ${c.proposedRevision}`, '');
  if (c.removedAssertions?.length) md.push('### Removed assertions', '', '```nquads', ...c.removedAssertions, '```', '');
  if (c.addedAssertions?.length) md.push('### Added assertions', '', '```nquads', ...c.addedAssertions, '```', '');
}
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'proposal.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(output,'proposal.md'),md.join('\n')+'\n');
console.log(`Proposal: ${summary.counts.changed} changed, ${summary.counts.added} added, ${summary.counts.removed} removed, ${summary.counts.unchanged} unchanged`);
console.log(`Review ${output}/proposal.md and proposal.json`);
