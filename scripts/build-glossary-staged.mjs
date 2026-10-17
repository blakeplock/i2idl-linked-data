#!/usr/bin/env node
// Build two synchronized presentation payloads from the canonical glossary.
// Requires scripts/build-glossary-web.mjs from Stage 4.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
execFileSync(process.execPath, ['scripts/build-glossary-web.mjs'], { stdio: 'inherit' });
const payload = JSON.parse(fs.readFileSync('public/glossary-web.json', 'utf8'));
const { publicationVersion, semanticProfileVersion, entries, allCollections } = payload;
if (!publicationVersion || !entries.length || !allCollections.length) throw Error('Unexpected glossary data; aborting staged build');
const sourceTag = crypto.createHash('sha256').update(fs.readFileSync('public/glossary.jsonld')).digest('hex').slice(0, 16);
const core = {
  publicationVersion, semanticProfileVersion, sourceTag,
  allCollections,
  entries: entries.map(({id,term,definition,why,aka,field,type,collections,sources,externalMappings}) => ({
    id,term,definition,why,aka,field,type,collections,
    sources:sources.map(({name})=>({name})),
    externalMappings:externalMappings.map(({vocabulary})=>({vocabulary}))
  }))
};
const details = {
  publicationVersion, sourceTag,
  entries: Object.fromEntries(entries.map(({id,broader,narrower,related,sources,externalMappings})=>[id,{broader,narrower,related,sources,externalMappings}]))
};
for (const [filename, obj] of [['public/glossary-core.json',core],['public/glossary-details.json',details]]) {
  const text=JSON.stringify(obj)+'\n';
  fs.writeFileSync(filename,text);
  console.log(`${filename}: ${(Buffer.byteLength(text)/1024).toFixed(1)} KB`);
}
// Generate and verify static bilingual HTML from the same publication snapshot.
execFileSync(process.execPath, ['scripts/build-concept-pages.mjs', '--all'], { stdio:'inherit' });
execFileSync(process.execPath, ['scripts/validate-concept-pages.mjs'], { stdio:'inherit' });
