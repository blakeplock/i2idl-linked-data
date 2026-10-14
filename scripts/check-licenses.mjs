#!/usr/bin/env node
import { readFileSync } from 'node:fs';

// MIT and Apache-2.0 are the only automatically approved licenses.
// Reviewed exceptions are NOT approved; --baseline retains its original CI contract.
const args = new Set(process.argv.slice(2));
const allowed = new Set(['MIT', 'Apache-2.0']);
const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const lock = load('../package-lock.json');
if (!lock.packages || typeof lock.packages !== 'object') throw Error('Expected lockfile v2/v3 packages object');

const entries = Object.entries(lock.packages).filter(([location]) => location).map(([location, entry]) => ({
  name: location.split('node_modules/').pop(),
  version: entry.version || 'UNKNOWN',
  license: typeof entry.license === 'string' && entry.license.trim() ? entry.license.trim() : 'UNDECLARED',
  location,
}));
const exceptions = entries.filter(x => !allowed.has(x.license));
const id = x => [x.name, x.version, x.license].join('|');
const groups = new Map();
for (const x of exceptions) {
  const key = id(x);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(x.location);
}

const reviewsFile = load('../docs/LICENSE-REVIEWS.json');
if (!Array.isArray(reviewsFile.reviews)) throw Error('LICENSE-REVIEWS.json: reviews array required');
const reviewMap = new Map();
for (const review of reviewsFile.reviews) {
  if (typeof review.package !== 'string' || typeof review.version !== 'string' || typeof review.status !== 'string') {
    throw Error('License review requires package, version, and status strings');
  }
  if (!['reviewed-pending-approval', 'approved-exception', 'rejected'].includes(review.status)) {
    throw Error(`Unsupported license review status: ${review.status}`);
  }
  const key = `${review.package}|${review.version}`;
  if (reviewMap.has(key)) throw Error(`Duplicate license review: ${key}`);
  reviewMap.set(key, review);
}
const currentPairs = new Set(exceptions.map(x => `${x.name}|${x.version}`));
for (const key of reviewMap.keys()) {
  if (!currentPairs.has(key)) console.warn(`STALE REVIEW: ${key} is not an active exception`);
}

const counts = new Map();
for (const x of entries) counts.set(x.license, (counts.get(x.license) || 0) + 1);
console.log(`I2IDL npm license inventory: ${entries.length} installed entries`);
console.log('Automatically approved: MIT, Apache-2.0');
for (const [k, v] of [...counts].sort((a,b) => a[0].localeCompare(b[0]))) console.log(`  ${k}: ${v}`);
console.log(`License exceptions: ${exceptions.length} installed entries; ${groups.size} distinct package/version/license combinations`);

const sorted = [...groups].sort(([a], [b]) => a.localeCompare(b));
const stateCounts = { 'reviewed-pending-approval': 0, 'approved-exception': 0, rejected: 0, unreviewed: 0 };
for (const [key, locations] of sorted) {
  const example = entries.find(x => id(x) === key);
  const review = reviewMap.get(`${example.name}|${example.version}`);
  const status = review?.status ?? 'unreviewed';
  stateCounts[status] += locations.length;
  // An explicit recorded review describes evidence; it does not rewrite the lockfile license.
  const verified = review?.license && review.license !== example.license ? `; reviewed as ${review.license}` : '';
  console.log(`  [${status}] ${key} (${locations.length} installation${locations.length === 1 ? '' : 's'}${verified})`);
  if (args.has('--details')) for (const location of locations) console.log(`    ${location}`);
}
console.log(`Review status by installed entries: ${stateCounts.unreviewed} unreviewed, ${stateCounts['reviewed-pending-approval']} pending approval, ${stateCounts['approved-exception']} approved exceptions, ${stateCounts.rejected} rejected`);

if (args.has('--strict')) {
  // The repository's strict policy still permits ONLY MIT and Apache-2.0.
  if (exceptions.length) {
    console.error('FAIL: strict MIT/Apache-2.0 policy is not satisfied');
    process.exitCode = 1;
  } else console.log('PASS: strict MIT/Apache-2.0 policy');
} else if (args.has('--baseline')) {
  const baseline = load('../docs/LICENSE-EXCEPTION-BASELINE.json');
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
  } else console.log(`PASS: no new exceptions; ${exceptions.length} existing entries remain outside automatic policy`);
} else {
  console.log('REPORT ONLY: use --baseline to block new exceptions or --strict to block all exceptions');
}
