#!/usr/bin/env node
import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const graph=fs.readFileSync('public/graph-explorer.js','utf8');
const research=fs.readFileSync('public/research-discovery.js','utf8');
const helper=fs.readFileSync('public/i2idl-dynamic-i18n.js','utf8');
for(const token of ["if($('path-result').children.length)runPath()","if($('compare-result').children.length)runCompare()","if(!$('analytics-panel').hidden)renderAnalytics()"]){assert(graph.includes(token),token)}
for(const token of ['function renderDisplayedResearch()','if(displayedWorks)renderDisplayedResearch()','ri().publicationMeta(work)','ri().researchOutcome(displayedWorks','ri().researchYears(thisYear+1)'])assert(research.includes(token),token);
let lang='fr';const win={};vm.runInNewContext(helper,{window:win,document:{getElementById:()=>({value:lang})}});
const x=win.I2IDLDynamicI18n;assert.equal(x.researchCount(2),'2 sur 5 sélectionnés');assert(x.researchOutcome([{title:'A'}],'Apprentissage',false).includes('publication'));assert(x.publicationMeta({citations:10,openAccess:true}).includes('Accès ouvert'));
lang='en';assert.equal(x.researchCount(2),'2 of 5 selected');assert(x.researchOutcome([], 'Learning',false).includes('No results found'));
assert(!research.includes("status.textContent=isCluster?'Searching across selected concepts…'"));
console.log('PASS: Phase 10 translations, switching, cached results and graph rerender hooks');
