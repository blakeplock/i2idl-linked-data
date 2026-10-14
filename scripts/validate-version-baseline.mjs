// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RELEASE='v0.0.87';
const BASE='https://id.i2idl.org';
const manifest=JSON.parse(fs.readFileSync(`versioning/releases/${RELEASE}.json`,'utf8'));
const registry=JSON.parse(fs.readFileSync(`versioning/registry/${RELEASE}.jsonld`,'utf8'));
const graph=JSON.parse(fs.readFileSync('public/glossary.jsonld','utf8'));
const types=x=>Array.isArray(x)?x:[x];
const concepts=graph['@graph'].filter(n=>types(n['@type']).includes('skos:Concept'));
const ids=new Set(concepts.map(n=>n['@id']));
if(manifest.release!==RELEASE || manifest.conceptCount!==397 || manifest.entries.length!==397 || ids.size!==397)throw Error('Baseline concept count/release mismatch');
if(manifest.canonicalization!=='RDFC-1.0')throw Error('Unexpected canonicalization algorithm');
if(registry['@graph']?.length!==397)throw Error('Revision registry size mismatch');
const seen=new Set();
for(const e of manifest.entries){
  if(seen.has(e.concept) || !ids.has(e.concept) || e.revision!==1)throw Error(`Bad concept or duplicate: ${e.concept}`);
  seen.add(e.concept);
  const slug=e.concept.slice(`${BASE}/concepts/`.length);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Bad concept slug');
  const graphUri=`${BASE}/graphs/concepts/${slug}/versions/1`;
  const relative=`snapshots/${slug}/1.nq`;
  if(e.graph!==graphUri || e.path!==relative || e.revisionUri!==`${e.concept}/versions/1`)throw Error(`Incorrect revision identifiers for ${slug}`);
  const absolute=path.join('versioning',relative);
  const txt=fs.readFileSync(absolute,'utf8');
  if(!txt.trim() || txt.split('\n').filter(Boolean).some(line=>!line.endsWith(` <${graphUri}> .`)))throw Error(`Wrong named graph for ${slug}`);
  if(crypto.createHash('sha256').update(txt).digest('hex')!==e.sha256)throw Error(`Digest mismatch for ${slug}`);
}
console.log(`PASS: ${RELEASE} immutable baseline: 397 concept snapshots, hashes, graph IDs, and registry entries`);
