#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync('public/graph-explorer.js','utf8');
const start=code.indexOf("langSelect.addEventListener('change',()=>{");
const end=code.indexOf('async function i2idlLoadFrenchOverlay()',start);
assert(start>=0&&end>start,'Cannot find switch handler');
const switchCode=code.slice(start,end);
const ids=['path-a','path-b','compare-a','compare-b'];
const elements=new Map();
for(const id of ids){elements.set(id,{value:id+'-custom',options:[{value:id+'-custom'},{value:id+'-default'}]})}
for(const id of ['path-result','compare-result','analytics-result'])elements.set(id,{childNodes:[{}],children:[{}]});
elements.set('analytics-panel',{hidden:false});
elements.set('collection',{value:'engineering',options:[{textContent:'All fields'},{textContent:'Other'}]});
elements.set('search',{value:''});
const langSelect={value:'fr',addEventListener(name,fn){this.fn=fn}};
let pathRuns=0,compareRuns=0,analyticsRuns=0;
const context={langSelect,i2idlLocale:'en',document:{documentElement:{lang:'en'}},window:{history:{replaceState(){}}},location:{href:'https://example.org/explore?lang=en'},URL,Event,
 nodes:[{}],active:{id:'selected'},$:(id)=>elements.get(id),
 i2idlT:key=>key,focus(){},
 populateResearch(){for(const id of ids)elements.get(id).value=id+'-default';elements.get('path-result').childNodes=[];elements.get('path-result').children=[];elements.get('compare-result').childNodes=[];elements.get('compare-result').children=[];},
 runPath(){pathRuns++},runCompare(){compareRuns++},renderAnalytics(){analyticsRuns++}};
vm.runInNewContext(switchCode,context);
langSelect.fn();
for(const id of ids)assert.equal(elements.get(id).value,id+'-custom',id+' was reset');
assert.equal(elements.get('collection').value,'engineering');
assert.equal(pathRuns,1);assert.equal(compareRuns,1);assert.equal(analyticsRuns,1);
assert.equal(context.i2idlLocale,'fr');
console.log('PASS: language switching preserves four selections and rerenders all three existing analyses');
