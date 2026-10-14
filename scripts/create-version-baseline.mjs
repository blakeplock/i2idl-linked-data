// SPDX-License-Identifier: Apache-2.0
// One-time immutable RDF named-graph baseline for v0.0.87.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import ParserJsonld from '@rdfjs/parser-jsonld';
import * as rdfCanonize from 'rdf-canonize';

const BASE = 'https://id.i2idl.org';
const RELEASE = 'v0.0.87';
const sourcePath = 'public/glossary.jsonld';
const graph = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const nodes = graph['@graph'];
const asArray = x => x == null ? [] : Array.isArray(x) ? x : [x];
const ref = x => typeof x === 'string' ? x : x?.['@id'];
const concepts = nodes.filter(x => asArray(x['@type']).includes('skos:Concept'));
const byId = new Map(nodes.map(x => [x['@id'], x]));
const scheme = byId.get(`${BASE}/scheme`);
if (scheme?.['gs:publicationVersion'] !== RELEASE || concepts.length !== 397) {
  throw Error('Baseline must be created against the validated v0.0.87 graph with 397 concepts');
}
const outRoot = 'versioning';
const manifestPath = path.join(outRoot, 'releases', `${RELEASE}.json`);
if (fs.existsSync(manifestPath)) throw Error('Release manifest exists; refusing to rewrite immutable history');
if (fs.existsSync(path.join(outRoot, 'snapshots'))) throw Error('Snapshot directory exists; refusing to overwrite immutable history');
const work = path.join(outRoot, `.baseline-build-${process.pid}`);
fs.mkdirSync(work, {recursive:true});

async function toQuads(doc) {
  const parser = new ParserJsonld();
  const stream = parser.import(Readable.from([JSON.stringify(doc)]));
  const quads = [];
  for await (const q of stream) quads.push(q);
  return quads;
}
function ntTerm(t) {
  if(t.termType === 'NamedNode') return `<${t.value}>`;
  if(t.termType === 'BlankNode') return `_:${t.value}`;
  if(t.termType === 'Literal') {
    const value = JSON.stringify(t.value)
  .replaceAll('\u2028', '\\u2028')
  .replaceAll('\u2029', '\\u2029');
    return t.language ? `${value}@${t.language}` : t.datatype?.value !== 'http://www.w3.org/2001/XMLSchema#string' ? `${value}^^<${t.datatype.value}>` : value;
  }
  throw Error(`Unsupported RDF term ${t.termType}`);
}
function nq(q, name) {return `${ntTerm(q.subject)} ${ntTerm(q.predicate)} ${ntTerm(q.object)} <${name}> .`}

try {
  const entries=[];
  for(const c of concepts.sort((a,b)=>a['@id'].localeCompare(b['@id']))) {
    const conceptUri=c['@id'];
    const slug=conceptUri.slice(`${BASE}/concepts/`.length);
    if(!conceptUri.startsWith(`${BASE}/concepts/`) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Bad concept id');
    const definitionUri=ref(c['gs:activeDefinition']);
    const definition=byId.get(definitionUri);
    if(!definition) throw Error(`Missing active definition for ${slug}`);
    // Preserve existing graph nodes exactly, including nested evidence records.
    const members=nodes.filter(n=>asArray(n['@type']).includes('skos:Collection') && asArray(n['skos:member']).some(v=>ref(v)===conceptUri));
    const membershipAssertions=members.map(n=>({'@id':n['@id'],'skos:member': {'@id':conceptUri}}));
    const doc={'@context':graph['@context'],'@graph':[c,definition,...membershipAssertions]};
    const graphUri=`${BASE}/graphs/concepts/${slug}/versions/1`;
    const quads=await toQuads(doc);
    const nqText=quads.map(q=>nq(q,graphUri)).join('\n')+'\n';
    const canonical=await rdfCanonize.canonize(nqText,{algorithm:'RDFC-1.0',inputFormat:'application/n-quads',format:'application/n-quads'});
    const digest=crypto.createHash('sha256').update(canonical).digest('hex');
    const rel=`snapshots/${slug}/1.nq`;
    const dest=path.join(work,rel);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,canonical);
    entries.push({concept:conceptUri,revision:1,revisionUri:`${conceptUri}/versions/1`,graph:graphUri,sha256:digest,path:rel});
  }
  const manifest={schemaVersion:1,release:RELEASE,source:`${BASE}/glossary.jsonld`,conceptCount:entries.length,hashAlgorithm:'sha256',canonicalization:'RDFC-1.0',entries};
  fs.writeFileSync(path.join(work,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const registry={
    '@context': {
      'dcterms':'http://purl.org/dc/terms/',
      'prov':'http://www.w3.org/ns/prov#',
      'gs': graph['@context'].gs || `${BASE}/vocab/`,
      'xsd':'http://www.w3.org/2001/XMLSchema#'
    },
    '@graph': entries.map(entry=>({
      '@id':entry.revisionUri,
      '@type':'prov:Entity',
      'dcterms:isVersionOf':{'@id':entry.concept},
      'prov:wasDerivedFrom':{'@id':`${BASE}/releases/${RELEASE}`},
      'gs:revisionNumber':{'@value':1,'@type':'xsd:integer'},
      'gs:versionGraph':{'@id':entry.graph},
      'gs:contentDigest':entry.sha256,
      'gs:publicationVersion':RELEASE
    }))
  };
  fs.writeFileSync(path.join(work,'registry.jsonld'),JSON.stringify(registry,null,2)+'\n');
  const target=path.join(outRoot,'snapshots');
  fs.renameSync(path.join(work,'snapshots'),target);
  fs.mkdirSync(path.dirname(manifestPath),{recursive:true});
  fs.renameSync(path.join(work,'manifest.json'),manifestPath);
  fs.mkdirSync(path.join(outRoot,'registry'),{recursive:true});
  fs.renameSync(path.join(work,'registry.jsonld'),path.join(outRoot,'registry',`${RELEASE}.jsonld`));
  console.log(`Created immutable ${RELEASE} baseline: ${entries.length} concepts`);
} finally {fs.rmSync(work,{recursive:true,force:true});}
