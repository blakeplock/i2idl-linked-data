#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('public/graph.html','utf8');
const js=fs.readFileSync('public/graph-explorer-i18n.js','utf8');
assert(html.includes('<script src="/graph-explorer-i18n.js" defer></script>'), 'UI script missing');
assert(html.indexOf('/graph-explorer-i18n.js')<html.indexOf('/graph-explorer.js'), 'UI script must precede graph script');
for(const name of ['#search','#find-path','#run-compare','#research-run','#research-sort option[value="relevant"]'])assert(js.includes(name), `Missing localization target ${name}`);
assert(js.includes("select.addEventListener('change',apply)"),'Language switch event missing');
assert(js.includes("lang==='fr'"),'French switch missing');
console.log('PASS: Graph Explorer bilingual UI script registered and basic contracts intact');
