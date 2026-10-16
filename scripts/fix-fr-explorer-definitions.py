#!/usr/bin/env python3
"""Correct Phase 7 French definitions: join by gs:activeDefinition, never URI slugs."""
from pathlib import Path

path = Path('public/graph-explorer.js')
s = path.read_text(encoding='utf-8')
old = "const conceptId=id.replace('/definitions/','/concepts/');const item=items.get(conceptId)||{};item.definition=n['rdf:value']['@value'];items.set(conceptId,item);"
new = "const item=items.get(id)||{};item.definition=n['rdf:value']['@value'];items.set(id,item);"
if new in s and 'i2idlAttachFrenchDefinitions(provenanceGraph,i2idlFrench);' in s:
    print('PASS: French definition resolver already patched')
    raise SystemExit(0)
if s.count(old) != 1:
    raise SystemExit('Expected exactly one old definition mapping; no changes made')
s = s.replace(old,new)
anchor = 'function onGraph(data){'
helper = """function i2idlAttachFrenchDefinitions(graph,translations){
  for(const concept of graph){
    if(!refs(concept['@type']).includes('skos:Concept'))continue;
    const definitionUri=rid(concept['gs:activeDefinition']);
    if(!definitionUri)continue;
    const translatedDefinition=translations.get(definitionUri)?.definition;
    if(!translatedDefinition)continue;
    const item=translations.get(concept['@id'])||{};
    item.definition=translatedDefinition;
    translations.set(concept['@id'],item);
  }
}
"""
if s.count(anchor)!=1:
    raise SystemExit('Could not uniquely locate onGraph; no changes made')
s = s.replace(anchor,helper+anchor)
needle = 'provenanceGraph=graph;nodes=graph.filter'
if s.count(needle)!=1:
    raise SystemExit('Could not uniquely locate graph initialization; no changes made')
s = s.replace(needle,'provenanceGraph=graph;i2idlAttachFrenchDefinitions(graph,i2idlFrench);nodes=graph.filter')
path.write_text(s,encoding='utf-8')
print('PATCHED public/graph-explorer.js: French definitions joined by gs:activeDefinition')
