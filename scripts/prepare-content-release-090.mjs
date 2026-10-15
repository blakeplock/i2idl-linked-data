#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Incremental content release: reuses unchanged concept snapshots and adds immutable revisions.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { execFileSync } from 'node:child_process';
import ParserJsonld from '@rdfjs/parser-jsonld';
import * as rdfCanonize from 'rdf-canonize';

const BASE = 'https://id.i2idl.org';
const PREVIOUS = 'v0.0.89';
const RELEASE = 'v0.0.90';
const DATA_PATH = 'public/glossary.jsonld';
const ROOT = 'versioning';
const asArray = (x) => x == null ? [] : Array.isArray(x) ? x : [x];
const ref = (x) => typeof x === 'string' ? x : x?.['@id'];
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const digest = (s) => crypto.createHash('sha256').update(s).digest('hex');
const newManifestPath = path.join(ROOT, 'releases', `${RELEASE}.json`);
const newRegistryPath = path.join(ROOT, 'registry', `${RELEASE}.jsonld`);

assert(!fs.existsSync(newManifestPath), 'v0.0.90 release manifest already exists');
assert(!fs.existsSync(newRegistryPath), 'v0.0.90 registry already exists');
const original = fs.readFileSync(DATA_PATH, 'utf8');
const source = JSON.parse(original);
const nodes = source['@graph'];
assert(Array.isArray(nodes), 'Missing graph');
const byId = new Map(nodes.map(n => [n['@id'], n]));
const scheme = byId.get(`${BASE}/scheme`);
assert.equal(scheme?.['gs:publicationVersion'], PREVIOUS, 'Expected publication v0.0.89');
const concepts = nodes.filter(n => asArray(n['@type']).includes('skos:Concept'))
  .sort((a,b) => a['@id'].localeCompare(b['@id']));
assert.equal(concepts.length, 420, 'Expected exactly 420 concepts');
const previous = read(path.join(ROOT, 'releases', `${PREVIOUS}.json`));
assert.equal(previous.conceptCount, 397, 'Unexpected previous release baseline');
const previousById = new Map(previous.entries.map(e => [e.concept,e]));
const priorRegistry = read(path.join(ROOT, 'registry', `${PREVIOUS}.jsonld`));

async function toQuads(doc) {
  const stream = new ParserJsonld().import(Readable.from([JSON.stringify(doc)]));
  const quads = [];
  for await (const q of stream) quads.push(q);
  return quads;
}
function ntTerm(t) {
  if (t.termType === 'NamedNode') return `<${t.value}>`;
  if (t.termType === 'BlankNode') return `_:${t.value}`;
  if (t.termType === 'Literal') {
    const value = JSON.stringify(t.value).replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
    return t.language ? `${value}@${t.language}` :
      t.datatype?.value !== 'http://www.w3.org/2001/XMLSchema#string' ? `${value}^^<${t.datatype.value}>` : value;
  }
  throw Error(`Unsupported term ${t.termType}`);
}
async function snapshot(c, revision) {
  const uri = c['@id'];
  const slug = uri.slice(`${BASE}/concepts/`.length);
  assert(uri.startsWith(`${BASE}/concepts/`) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Invalid concept URI');
  const definition = byId.get(ref(c['gs:activeDefinition']));
  assert(definition, `Missing definition: ${slug}`);
  const members = nodes.filter(n => asArray(n['@type']).includes('skos:Collection') &&
    asArray(n['skos:member']).some(x => ref(x) === uri));
  const assertions = members.map(n => ({'@id':n['@id'],'skos:member':{'@id':uri}}));
  const doc = {'@context':source['@context'],'@graph':[c,definition,...assertions]};
  const graphUri = `${BASE}/graphs/concepts/${slug}/versions/${revision}`;
  const quads = await toQuads(doc);
  const nqText = quads.map(q => `${ntTerm(q.subject)} ${ntTerm(q.predicate)} ${ntTerm(q.object)} <${graphUri}> .`).join('\n') + '\n';
  const canonical = await rdfCanonize.canonize(nqText,{algorithm:'RDFC-1.0',inputFormat:'application/n-quads',format:'application/n-quads'});
  return {canonical,sha256:digest(canonical),graphUri};
}

const work = path.join(ROOT, `.release-090-prep-${process.pid}`);
fs.mkdirSync(work,{recursive:true});
try {
  const entries=[];
  const changed=[];
  for (const c of concepts) {
    const uri=c['@id'];
    const slug=uri.slice(`${BASE}/concepts/`.length);
    const old=previousById.get(uri);
    if (old) {
      // Compare against the old graph NAME to avoid false differences from revision URI alone.
      const candidateOld=await snapshot(c,old.revision);
      if (candidateOld.sha256===old.sha256) { entries.push(old); continue; }
    }
    const revision=old ? old.revision+1 : 1;
    const current=await snapshot(c,revision);
    const rel=`snapshots/${slug}/${revision}.nq`;
    assert(!fs.existsSync(path.join(ROOT,rel)), `Refusing to overwrite ${rel}`);
    const dest=path.join(work,rel);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,current.canonical);
    const entry={concept:uri,revision,revisionUri:`${uri}/versions/${revision}`,graph:current.graphUri,sha256:current.sha256,path:rel};
    entries.push(entry);
    changed.push({entry,previous:old});
  }
  assert.equal(entries.length,420);
  assert.equal(changed.filter(x=>!x.previous).length,23,'Expected exactly 23 new concepts');
  const manifest={...previous,release:RELEASE,conceptCount:entries.length,entries};
  const registry={'@context':priorRegistry['@context'],'@graph':changed.map(({entry,previous:old})=>({
    '@id':entry.revisionUri,'@type':'prov:Entity',
    'dcterms:isVersionOf':{'@id':entry.concept},
    'prov:wasDerivedFrom':{'@id':`${BASE}/releases/${RELEASE}`},
    ...(old ? {'prov:wasRevisionOf':{'@id':old.revisionUri}} : {}),
    'gs:revisionNumber':{'@value':entry.revision,'@type':'xsd:integer'},
    'gs:versionGraph':{'@id':entry.graph},
    'gs:contentDigest':entry.sha256,
    'gs:publicationVersion':RELEASE
  }))};
  fs.writeFileSync(path.join(work,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(work,'registry.jsonld'),JSON.stringify(registry,null,2)+'\n');
  // Change ONLY the scheme's publication version in canonical source.
  scheme['gs:publicationVersion']=RELEASE;
  const updated=JSON.stringify(source,null,2)+'\n';
  const verify=JSON.parse(updated);
  verify['@graph'].find(n=>n['@id']===`${BASE}/scheme`)['gs:publicationVersion']=PREVIOUS;
  assert.deepEqual(verify,JSON.parse(original),'Unexpected graph mutation');
  const countUpdated=changed.filter(x=>x.previous).length;
  console.log(`Prepared ${RELEASE}: ${entries.length} total, 23 new, ${countUpdated} revised, ${entries.length-changed.length} unchanged.`);
  console.log('Changed existing concepts:',changed.filter(x=>x.previous).map(x=>x.entry.concept.split('/').pop()).join(', '));
  if (!process.argv.includes('--apply')) {
    console.log('DRY RUN: no repository changes. Run with --apply to install release artifacts.');
    process.exit(0);
  }
  for (const {entry} of changed) {
    const dest=path.join(ROOT,entry.path);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.renameSync(path.join(work,entry.path),dest);
  }
  fs.renameSync(path.join(work,'manifest.json'),newManifestPath);
  fs.renameSync(path.join(work,'registry.jsonld'),newRegistryPath);
  fs.writeFileSync(DATA_PATH,updated);
  execFileSync(process.execPath,['scripts/build-glossary-staged.mjs'],{stdio:'inherit'});
  execFileSync(process.execPath,['scripts/validate-version-release.mjs','--release',RELEASE],{stdio:'inherit'});
  execFileSync('npm',['run','validate'],{stdio:'inherit'});
  console.log('v0.0.90 prepared locally. Review changes and synchronized Squarespace version before publish.');
} finally { fs.rmSync(work,{recursive:true,force:true}); }
