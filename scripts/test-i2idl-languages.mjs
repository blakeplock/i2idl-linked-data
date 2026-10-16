#!/usr/bin/env node
import assert from 'node:assert/strict';
import {selectText, selectTexts, normalizedSearchText, labelFor, definitionFor} from '../lib/i2idl-languages.mjs';
assert.equal(selectText('Learning Engineering','fr'),'Learning Engineering');
assert.equal(selectText([{'@value':'Learning Engineering','@language':'en'},{'@value':"Ingénierie de l’apprentissage",'@language':'fr'}],'fr'),"Ingénierie de l’apprentissage");
assert.equal(selectText([{'@value':'Learning Engineering','@language':'en'}],'fr'),'Learning Engineering');
assert.deepEqual(selectTexts([{'@value':'LC','@language':'fr'},{'@value':'EL','@language':'en'}],'fr'),['LC']);
assert.equal(labelFor({'skos:prefLabel':'Assessment'},'fr'),'Assessment');
assert.equal(definitionFor({'rdf:value':[{'@value':'English','@language':'en'},{'@value':'Français','@language':'fr'}]},'fr'),'Français');
assert.equal(normalizedSearchText('ÉVALUATION','fr'),'evaluation');
console.log('PASS: legacy English, fr selection, fallback, aliases, and accent-insensitive search');
