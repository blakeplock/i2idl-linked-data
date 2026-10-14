#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const args=process.argv.slice(2);
function get(k){const i=args.indexOf(k);return i>=0?args[i+1]:null;}
const release=get('--release');
const store=path.resolve(get('--store')||'versioning');
if(!/^v\d+\.\d+\.\d+$/.test(release||''))throw Error('Specify --release vX.Y.Z');
const manifest=JSON.parse(fs.readFileSync(path.join(store,'releases',`${release}.json`),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(store,'registry',`${release}.jsonld`),'utf8'));
if(manifest.release!==release||manifest.canonicalization!=='RDFC-1.0'||manifest.hashAlgorithm!=='sha256'||!Array.isArray(manifest.entries)||manifest.conceptCount!==manifest.entries.length)throw Error('Manifest metadata invalid');
if(!Array.isArray(registry['@graph']))throw Error('Registry invalid');
const BASE='https://id.i2idl.org';
const seen=new Set();
for(const e of manifest.entries){
  const slug=e.concept?.startsWith(`${BASE}/concepts/`)?e.concept.slice(`${BASE}/concepts/`.length):'';
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||seen.has(e.concept)||!Number.isSafeInteger(e.revision)||e.revision<1)throw Error('Invalid/duplicate concept revision');
  seen.add(e.concept);
  const name=`${BASE}/graphs/concepts/${slug}/versions/${e.revision}`;
  const rel=`snapshots/${slug}/${e.revision}.nq`;
  if(e.graph!==name||e.path!==rel||e.revisionUri!==`${e.concept}/versions/${e.revision}`||!/^[a-f0-9]{64}$/.test(e.sha256))throw Error('Manifest revision shape mismatch');
  const text=fs.readFileSync(path.join(store,rel),'utf8');
  if(!text.trim()||text.split('\n').filter(Boolean).some(line=>!line.endsWith(` <${name}> .`)))throw Error(`Invalid graph lines for ${slug}`);
  if(crypto.createHash('sha256').update(text).digest('hex')!==e.sha256)throw Error(`Snapshot changed: ${slug}`);
}
for(const entity of registry['@graph']){
  const e=manifest.entries.find(x=>x.revisionUri===entity['@id']);
  if(!e||entity['gs:contentDigest']!==e.sha256||entity['gs:publicationVersion']!==release)throw Error('Registry entity does not match release');
}
console.log(`PASS ${release}: ${manifest.conceptCount} manifest entries, snapshot hashes, named graphs, ${registry['@graph'].length} new registry entities`);
