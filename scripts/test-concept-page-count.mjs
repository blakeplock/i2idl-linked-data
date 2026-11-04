// SPDX-License-Identifier: Apache-2.0
// Run the actual generators/validators on a bounded subset of real source entries.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const source = read('public/glossary.jsonld');
const index = read('public/glossary-web.json');
const overlay = read('public/glossary-fr-preview.jsonld');
const conceptBase = 'https://id.i2idl.org/concepts/';
const byIri = new Map(source['@graph'].map(n => [n['@id'], n]));
const french = new Set(overlay['@graph'].map(n => n['@id']));
const entries = index.entries.filter(e => french.has(conceptBase + e.id) && french.has(byIri.get(conceptBase + e.id)?.['gs:activeDefinition']?.['@id'])).slice(0, 3);
assert.equal(entries.length, 3, 'Three existing source concepts with approved French are required');
const foreign = index.entries.find(e => !entries.some(p => p.id === e.id));
assert.ok(foreign, 'A real entry outside the bounded fixture is required');
const concepts = entries.map(e => byIri.get(conceptBase + e.id));
const definitions = concepts.map(c => byIri.get(c['gs:activeDefinition']['@id']));
const fixture = { ...source, '@graph': [byIri.get('https://id.i2idl.org/scheme'), ...concepts, ...definitions] };
const tempRoot = path.resolve(os.tmpdir());
const directory = fs.mkdtempSync(path.join(tempRoot, 'i2idl-concept-pages-'));
assert.equal(path.dirname(directory), tempRoot);
assert.ok(path.basename(directory).startsWith('i2idl-concept-pages-'));
const write = (name, value) => fs.writeFileSync(path.join(directory, 'public', name), JSON.stringify(value));
const run = script => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...(script.startsWith('build-') ? ['--all'] : [])], { cwd: directory, encoding: 'utf8' });
const failsMembership = result => {
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /exactly the canonical concept identifiers/);
};
try {
  fs.mkdirSync(path.join(directory, 'public'));
  write('glossary.jsonld', fixture);
  write('glossary-web.json', { ...index, entries });
  write('glossary-fr-preview.jsonld', overlay);
  const built = run('build-concept-pages.mjs');
  assert.equal(built.status, 0, built.stderr);
  const validated = run('validate-concept-pages.mjs');
  assert.equal(validated.status, 0, validated.stderr);

  write('glossary-web.json', { ...index, entries: entries.slice(1) });
  failsMembership(run('build-concept-pages.mjs'));
  failsMembership(run('validate-concept-pages.mjs'));

  // Equal length is insufficient: substituting a real but foreign entry must fail.
  write('glossary-web.json', { ...index, entries: [...entries.slice(1), foreign] });
  failsMembership(run('build-concept-pages.mjs'));
  failsMembership(run('validate-concept-pages.mjs'));

  write('glossary-web.json', { ...index, entries });
  write('glossary-fr-preview.jsonld', { ...overlay, '@graph': overlay['@graph'].filter(n => n['@id'] !== concepts[0]['@id']) });
  const missingFrench = run('build-concept-pages.mjs');
  assert.notEqual(missingFrench.status, 0);
  assert.match(missingFrench.stderr, /Missing approved French label\/active definition/);
  console.log('PASS: actual page generator/validator accept canonical membership beyond a fixed release count, reject missing/foreign IDs, and still refuse missing reviewed French. Real source subset only; no publication or model call.');
} finally {
  // Only remove the exact temporary directory created and checked above.
  if (path.dirname(directory) !== tempRoot || !path.basename(directory).startsWith('i2idl-concept-pages-')) throw Error('Unexpected temporary cleanup target');
  fs.rmSync(directory, { recursive: true, force: true });
}
