#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const graph=fs.readFileSync('public/graph-explorer.js','utf8');
const research=fs.readFileSync('public/research-discovery.js','utf8');
const html=fs.readFileSync('public/graph.html','utf8');
const source=fs.readFileSync('public/i2idl-dynamic-i18n.js','utf8');
assert(html.includes('/i2idl-dynamic-i18n.js'));
assert(html.indexOf('/i2idl-dynamic-i18n.js')<html.indexOf('/graph-explorer.js'));
for(const token of ["di().pathCount(path.length-1)","di().t('noPath')","di().t('different')","di().componentNote(","di().t('researchHelp')"])assert(graph.includes(token),token);
assert(research.includes("ri().t('searchChanged')"));
let lang='fr';const win={};vm.runInNewContext(source,{window:win,document:{getElementById:()=>({value:lang})}});
const t=win.I2IDLDynamicI18n;
assert.equal(t.t('noPath'),'Aucun chemin ne relie ces concepts dans le graphe SKOS publié.');
assert.equal(t.pathCount(2),'Chemin le plus court : 2 relations');
lang='en';assert.equal(t.pathCount(1),'Shortest path: 1 relationship');
assert.equal(t.t('different'),'Choose two different concepts.');
console.log('PASS: dynamic translations, EN/FR switching and installed hooks');
