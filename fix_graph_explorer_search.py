#!/usr/bin/env python3
"""Improve I2IDL Graph Explorer search in the existing HTML, without changing graph data."""
from pathlib import Path

paths = [Path('public/graph.html'), Path('i2idl-graph-production/graph.html')]
old = "for(const n of nodes.filter(n=>label(n).toLowerCase().includes(val)).slice(0,12))"
new = "for(const n of rankedConceptSearch(val).slice(0,12))"
helper = '''
// Rank concept names and aliases first, before less precise description matches.
// All dynamic suggestion labels are inserted with textContent, never as HTML.
function normalizeSearch(value){return String(value??'').normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function rankedConceptSearch(query){
  const q=normalizeSearch(query);if(!q)return [];
  const tokens=q.split(' ').filter(Boolean);
  const scored=[];
  for(const n of nodes){
    const title=normalizeSearch(label(n));
    const alternatives=refs(n['skos:altLabel']).map(v=>normalizeSearch(typeof v==='string'?v:(v&&v['@value'])||''));
    const identifier=normalizeSearch(n['dcterms:identifier']||slug(n));
    const names=[title,...alternatives,identifier].filter(Boolean);
    const definition=normalizeSearch(n['skos:definition']||'');
    let score=0;
    if(names.some(v=>v===q))score=1000;
    else if(title.startsWith(q))score=850;
    else if(alternatives.some(v=>v.startsWith(q)))score=800;
    else if(names.some(v=>v.includes(q)))score=700;
    else if(tokens.every(word=>names.some(v=>v.split(' ').some(part=>part.startsWith(word)))))score=600;
    else if(definition.includes(q))score=250;
    else if(tokens.every(word=>definition.includes(word)))score=100;
    if(score)scored.push({n,score});
  }
  scored.sort((a,b)=>b.score-a.score||label(a.n).localeCompare(label(b.n)));
  return scored.map(item=>item.n);
}
'''
for path in paths:
    if not path.is_file():
        continue
    text=path.read_text(encoding='utf-8')
    if 'function rankedConceptSearch(query)' in text:
        print(f'{path}: already patched');continue
    if text.count(old)!=1:
        raise SystemExit(f'{path}: expected exactly one original search loop, found {text.count(old)}; no changes made')
    anchor="$('search').addEventListener('input',e=>"
    if text.count(anchor)!=1:
        raise SystemExit(f'{path}: search event handler not found uniquely; no changes made')
    text=text.replace(old,new,1)
    text=text.replace(anchor,helper+'\n'+anchor,1)
    path.write_text(text,encoding='utf-8')
    print(f'{path}: search ranking and alias support added')
