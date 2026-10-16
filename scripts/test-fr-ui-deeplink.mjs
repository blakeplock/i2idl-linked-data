#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const js=fs.readFileSync('public/graph-explorer-i18n.js','utf8');
function simulatedPage(search){
 const elements=new Map(),events=new Map();
 const el=key=>{
  if(!elements.has(key)){
   const text={nodeType:3,nodeValue:'Original'};
   elements.set(key,{value:'en',childNodes:[text],children:[],textContent:'Original',attributes:{},
    setAttribute(k,v){this.attributes[k]=v;},
    addEventListener(name,fn){this.listeners??={};this.listeners[name]=fn;}});
  }
  return elements.get(key);
 };
 const document={readyState:'loading',getElementById:id=>el('#'+id),querySelector:selector=>el(selector),addEventListener:(name,fn)=>events.set(name,fn)};
 vm.runInNewContext(js,{document,window:{location:{search}},Node:{TEXT_NODE:3},URLSearchParams});
 el('#i2idl-language').value='en';
 events.get('DOMContentLoaded')();
 return el;
}
const fr=simulatedPage('?lang=fr&concept=learning-engineering');
assert.equal(fr('#i2idl-language').value,'fr');
assert.equal(fr('header h1').childNodes[0].nodeValue,'Explorer les concepts de l’apprentissage numérique');
assert.equal(fr('#search').attributes.placeholder,'Rechercher parmi 420 concepts…');
fr('#i2idl-language').value='en';fr('#i2idl-language').listeners.change();
assert.equal(fr('header h1').childNodes[0].nodeValue,'Explore digital learning concepts');
const en=simulatedPage('?lang=en');
assert.equal(en('header h1').childNodes[0].nodeValue,'Explore digital learning concepts');
console.log('PASS: French deep link, initial French interface, English toggle');
