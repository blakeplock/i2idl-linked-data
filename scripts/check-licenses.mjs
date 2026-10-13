#!/usr/bin/env node
import { readFileSync } from 'node:fs';

// I2IDL software policy: MIT and Apache-2.0 only. This report is read-only.
// `--strict` exits non-zero if any entry lacks explicit policy compliance.
const strict = process.argv.includes('--strict');
const allowed = new Set(['MIT', 'Apache-2.0']);
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
if (!lock.packages || typeof lock.packages !== 'object') {
  console.error('Expected npm package-lock.json with a packages object.');
  process.exit(2);
}
const entries = Object.entries(lock.packages)
  .filter(([location]) => location)
  .map(([location, pkg]) => {
    const name = location.split('node_modules/').pop();
    const license = typeof pkg.license === 'string' && pkg.license.trim()
      ? pkg.license.trim() : 'UNDECLARED';
    // Do not silently approve compound expressions: review their options.
    return { name, version: pkg.version ?? '?', license, location, compliant: allowed.has(license) };
  });
const exceptions = entries.filter(pkg => !pkg.compliant);
const counts = new Map();
for (const pkg of entries) counts.set(pkg.license, (counts.get(pkg.license) || 0) + 1);
console.log(`I2IDL npm license inventory: ${entries.length} installed entries`);
console.log('Approved: MIT, Apache-2.0 (exact declared identifiers only)');
for (const [license, count] of [...counts].sort((a,b)=>a[0].localeCompare(b[0]))) {
  console.log(`  ${license}: ${count}`);
}
console.log(`\n${exceptions.length} entries require review:`);
for (const item of exceptions.sort((a,b)=>a.name.localeCompare(b.name)||a.location.localeCompare(b.location))) {
  console.log(`  ${item.name}@${item.version} | ${item.license} | ${item.location}`);
}
if (strict && exceptions.length) {
  console.error('\nFAIL: installed licenses do not all match the strict I2IDL policy.');
  process.exitCode = 1;
} else if (exceptions.length) {
  console.log('\nREPORT ONLY: exceptions are unresolved. Run with --strict to enforce the policy.');
} else {
  console.log('\nPASS: all installed entries declare approved licenses.');
}
