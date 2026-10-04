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

if (!html.trimStart().startsWith('<!-- I2IDL Digital Learning Glossary')) {
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

const semanticMatch = html.match(/const semanticModel\s*=\s*(\{.*?\});\s*\n\s*const semanticNodes/s);
if (!semanticMatch) {
  fail('embedded semanticModel object was not found');
} else {
  const serialized = semanticMatch[1];
  if (serialized.includes('</script')) {
    fail('embedded semantic model contains an unescaped script terminator');
  }
  if (/[\u2028\u2029]/.test(serialized)) {
    fail('embedded semantic model contains unescaped Unicode line separators');
  }
}

if (!html.includes('function safeHttpsUrl')) {
  fail('safeHttpsUrl helper is missing');
}

if (!html.includes('document.getElementById(hashId)')) {
  fail('safe hash-to-ID lookup is missing');
}

if (failures.length) {
  console.error('EMBED VALIDATION FAILED');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('EMBED VALIDATION PASSED');
