#!/usr/bin/env node
import { readFileSync } from 'node:fs';

// MIT and Apache-2.0 are the only automatically approved licenses.
// A baseline is NOT a license approval: it only prevents new unreviewed exceptions.
const args = new Set(process.argv.slice(2));
const allowed = new Set(['MIT', 'Apache-2.0']);
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
if (!lock.packages || typeof lock.packages !== 'object') throw Error('Expected lockfile v2/v3 packages object');
const entries = Object.entries(lock.packages).filter(([path]) => path).map(([location, entry]) => ({
  name: location.split('node_modules/').pop(),
  version: entry.version || 'UNKNOWN',
  license: typeof entry.license === 'string' && entry.license.trim() ? entry.license.trim() : 'UNDECLARED',
  location,
}));
const exceptions = entries.filter(x => !allowed.has(x.license));
const id = x => [x.name, x.version, x.license].join('|');
const counts = new Map();
for (const x of entries) counts.set(x.license, (counts.get(x.license) || 0) + 1);
console.log(`I2IDL npm license inventory: ${entries.length} installed entries`);
console.log('Automatically approved: MIT, Apache-2.0');
for (const [k,v] of [...counts].sort((a,b) => a[0].localeCompare(b[0]))) console.log(`  ${k}: ${v}`);
console.log(`Unresolved license exceptions: ${exceptions.length} entries`);
if (args.has('--strict')) {
  if (exceptions.length) {
    for (const x of exceptions) console.error(`  ${id(x)} (${x.location})`);
    console.error('FAIL: strict MIT/Apache-2.0 policy is not satisfied');
    process.exitCode = 1;
  } else console.log('PASS: strict MIT/Apache-2.0 policy');
} else if (args.has('--baseline')) {
  const baseline = JSON.parse(readFileSync(new URL('../docs/LICENSE-EXCEPTION-BASELINE.json', import.meta.url), 'utf8'));
  if (!Array.isArray(baseline.unreviewed)) throw Error('Invalid baseline: unreviewed array required');
  const known = new Set(baseline.unreviewed);
  if (known.size !== baseline.unreviewed.length) throw Error('Duplicate baseline entries');
  const current = new Set(exceptions.map(id));
  const unexpected = [...current].filter(x => !known.has(x)).sort();
  const removed = [...known].filter(x => !current.has(x)).sort();
  for (const x of unexpected) console.error(`NEW UNREVIEWED: ${x}`);
  for (const x of removed) console.log(`NO LONGER PRESENT: ${x} (remove from baseline after review)`);
  if (unexpected.length) {
    console.error('FAIL: new or changed exceptions require manual licensing review');
    process.exitCode = 1;
  } else console.log(`PASS: no new exceptions; ${exceptions.length} existing entries remain unapproved pending review`);
} else {
  for (const x of exceptions.sort((a,b)=>a.name.localeCompare(b.name)||a.location.localeCompare(b.location))) console.log(`  ${id(x)} (${x.location})`);
  console.log('REPORT ONLY: use --baseline to block new exceptions or --strict to block all exceptions');
}
