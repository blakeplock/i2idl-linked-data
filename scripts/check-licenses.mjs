#!/usr/bin/env node
import { readFileSync } from 'node:fs';

// I2IDL policy: commercial-use-permissive, non-copyleft licenses.
// An ambiguous / undeclared license needs a documented approved review.
const args = new Set(process.argv.slice(2));
const allowed = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause',
  'ISC', 'BlueOak-1.0.0', '(WTFPL OR MIT)', '(MIT OR WTFPL)'
]);
const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const lock = load('../package-lock.json');
if (!lock.packages || typeof lock.packages !== 'object') throw Error('Expected lockfile v2/v3 packages object');
const entries = Object.entries(lock.packages).filter(([location]) => location).map(([location, entry]) => ({
  name: location.split('node_modules/').pop(),
  version: entry.version || 'UNKNOWN',
  license: typeof entry.license === 'string' && entry.license.trim() ? entry.license.trim() : 'UNDECLARED',
  location,
}));
const id = x => [x.name, x.version, x.license].join('|');
const reviews = load('../docs/LICENSE-REVIEWS.json').reviews;
if (!Array.isArray(reviews)) throw Error('LICENSE-REVIEWS.json: reviews array required');
const reviewMap = new Map();
for (const review of reviews) {
  if (!review || typeof review.package !== 'string' || typeof review.version !== 'string' ||
      typeof review.status !== 'string') throw Error('License review requires package, version, and status strings');
  if (!['reviewed-pending-approval', 'approved-exception', 'rejected'].includes(review.status)) {
    throw Error(`Unsupported license review status: ${review.status}`);
  }
  const key = `${review.package}|${review.version}`;
  if (reviewMap.has(key)) throw Error(`Duplicate license review: ${key}`);
  reviewMap.set(key, review);
}
const exceptional = entries.filter(x => !allowed.has(x.license));
const groups = new Map();
for (const x of exceptional) {
  const key = id(x);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(x.location);
}
const currentPairs = new Set(exceptional.map(x => `${x.name}|${x.version}`));
for (const key of reviewMap.keys()) if (!currentPairs.has(key)) console.warn(`STALE REVIEW: ${key} is not an active exception`);
const counts = new Map();
for (const x of entries) counts.set(x.license, (counts.get(x.license) || 0) + 1);
console.log(`I2IDL npm license inventory: ${entries.length} installed entries`);
console.log(`Automatically approved: ${[...allowed].join(', ')}`);
for (const [license, count] of [...counts].sort((a,b) => a[0].localeCompare(b[0]))) console.log(`  ${license}: ${count}`);
console.log(`License exceptions: ${exceptional.length} installed entries; ${groups.size} distinct package/version/license combinations`);
const stateCounts = { 'reviewed-pending-approval': 0, 'approved-exception': 0, rejected: 0, unreviewed: 0 };
const unapproved = [];
for (const [key, locations] of [...groups].sort(([a],[b]) => a.localeCompare(b))) {
  const example = entries.find(x => id(x) === key);
  const review = reviewMap.get(`${example.name}|${example.version}`);
  // An approved exception must identify a permitted license and its source evidence.
  const approved = review?.status === 'approved-exception' &&
    typeof review.license === 'string' && allowed.has(review.license) &&
    typeof review.source === 'string' && review.source.trim().length > 0 &&
    typeof review.notes === 'string' && review.notes.trim().length > 0;
  const status = review?.status ?? 'unreviewed';
  stateCounts[status] += locations.length;
  if (!approved) unapproved.push(key);
  const verified = review?.license && review.license !== example.license ? `; reviewed as ${review.license}` : '';
  console.log(`  [${approved ? 'approved-exception' : status}] ${key} (${locations.length} installation${locations.length === 1 ? '' : 's'}${verified})`);
  if (args.has('--details')) for (const location of locations) console.log(`    ${location}`);
}
console.log(`Review status by installed entries: ${stateCounts.unreviewed} unreviewed, ${stateCounts['reviewed-pending-approval']} pending approval, ${stateCounts['approved-exception']} approved exceptions, ${stateCounts.rejected} rejected`);
if (args.has('--strict')) {
  if (unapproved.length) {
    for (const key of unapproved) console.error(`NOT APPROVED: ${key}`);
    console.error('FAIL: unapproved dependency licenses remain');
    process.exitCode = 1;
  } else console.log('PASS: all installed dependency licenses are permitted or approved with evidence');
} else if (args.has('--baseline')) {
  const baseline = load('../docs/LICENSE-EXCEPTION-BASELINE.json');
  if (!Array.isArray(baseline.unreviewed)) throw Error('Invalid baseline: unreviewed array required');
  const known = new Set(baseline.unreviewed);
  if (known.size !== baseline.unreviewed.length) throw Error('Duplicate baseline entries');
  const unexpected = unapproved.filter(x => !known.has(x));
  for (const key of unexpected) console.error(`NEW UNAPPROVED: ${key}`);
  if (unexpected.length) {
    console.error('FAIL: new or changed license exceptions require review');
    process.exitCode = 1;
  } else console.log(`PASS: no new unapproved exceptions; ${unapproved.length} grandfathered entries remain`);
} else console.log('REPORT ONLY: use --strict to block unapproved licenses or --baseline to block newly unapproved licenses');
