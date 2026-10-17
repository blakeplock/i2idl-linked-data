// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const path = process.argv[2];

if (!path) {
  console.error('Usage: node scripts/validate-embed.mjs <glossary-html-file>');
  process.exit(2);
}

const html = await readFile(path, 'utf8');
const failures = [];

function fail(message) {
  failures.push(message);
}

if (!(html.trimStart().startsWith('<!-- I2IDL Glossary of Digital Learning') || html.trimStart().startsWith('<!-- I2IDL Digital Learning Glossary'))) {
  fail('opening glossary comment is missing');
}

const firstLine = html.split(/\r?\n/, 1)[0];
if (!firstLine.includes('-->')) {
  fail('opening glossary comment is not closed with -->');
}

if (/root\.querySelector\(window\.location\.hash\)/.test(html)) {
  fail('unsafe direct location.hash use remains');
}

if (/deeper\.href\s*=\s*source\.url/.test(html)) {
  fail('source URLs are assigned without HTTPS validation');
}

const required = [
  ["glossary-core.json", "staged core data"],
  ["glossary-details.json", "staged detail data"],
  ["glossary-fr-preview.jsonld", "French translation overlay"],
  ["safeHttpsUrl", "safe HTTPS URL handling"],
  ["data-version", "publication version"],
  ["Shelly Blake-Plock", "creator acknowledgment"],
  ["linkedin.com/in/sblakeplock", "creator profile link"],
  ["Institute for Infrastructure and Interoperable Data in Learning", "institutional attribution"]
];
for (const [text, label] of required) {
  if (!html.includes(text)) fail(`Missing ${label}: ${text}`);
}
if (!html.includes("v0.0.92")) fail("Expected v0.0.92 publication");
if (!html.includes("fr") || !html.includes("en")) fail("Bilingual language support missing");

if (failures.length) {
  console.error('EMBED VALIDATION FAILED');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('EMBED VALIDATION PASSED');
