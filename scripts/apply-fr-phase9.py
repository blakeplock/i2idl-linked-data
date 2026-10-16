#!/usr/bin/env python3
"""Apply Phase 9 narrowly to merged Phase 8 Graph Explorer. Idempotent and fail closed."""
from pathlib import Path
h=Path('public/graph.html'); g=Path('public/graph-explorer.js'); r=Path('public/research-discovery.js')
if not all(p.exists() for p in (h,g,r)): raise SystemExit('Run from i2idl-linked-data repository root')
def replace_once(s,a,b,what):
 if b in s: return s
 if s.count(a)!=1: raise SystemExit(f'Expected one anchor for {what}; found {s.count(a)}. No files changed.')
 return s.replace(a,b)
html=h.read_text(); graph=g.read_text(); research=r.read_text()
html=replace_once(html,'<script src="/graph-explorer.js" defer></script>','<script src="/i2idl-dynamic-i18n.js" defer></script><script src="/graph-explorer.js" defer></script>','HTML script inclusion')
anchor="const slug=n=>n['@id'].split('/').pop();"
graph=replace_once(graph,anchor,"const di=()=>window.I2IDLDynamicI18n;"+anchor,'Graph dynamic helper')
changes=[
 ("researchHelp.textContent='Search scholarly publications for this topic now.'","researchHelp.textContent=di().t('researchHelp')"),
 ("clusterHelp.textContent='Collect 2–5 concepts, then find papers that connect them.'","clusterHelp.textContent=di().t('clusterHelp')"),
 ("refTitle.textContent='Reference links'","refTitle.textContent=di().t('references')"),
 ("({broader:'Broader concepts',narrower:'Narrower concepts',related:'Related concepts'})[type]","di().t(type)"),
 ("result.textContent='No path connects these concepts within the published SKOS graph.'","result.textContent=di().t('noPath')"),
 ("title.textContent=`Shortest path: ${path.length-1} relationship${path.length===2?'':'s'}`","title.textContent=di().pathCount(path.length-1)"),
 ("note.textContent='Multiple equally short routes may exist. A path denotes a chain of editorially asserted relationships, not a causal or logical implication.'","note.textContent=di().t('pathNote')"),
 ("out.textContent='Choose two different concepts.'","out.textContent=di().t('different')"),
 ("document.createTextNode(' None')","document.createTextNode(di().t('noItems'))"),
 ("[['Concepts',nodes.length],['Unique links',analysisEdgeCount],['Connected components',0],['Mean degree',nodes.length?","[[di().t('concepts'),nodes.length],[di().t('links'),analysisEdgeCount],[di().t('components'),0],[di().t('degree'),nodes.length?"),
 ("[['Most connected concepts',deg],['Cross-primary-field connections',bridges]]","[[di().t('mostConnected'),deg],[di().t('crossFields'),bridges]]"),
 ("info.textContent=`Largest connected component: ${Math.max(...components.map(x=>x.length))} concepts. These metrics describe I2IDL's curated graph, not objective scholarly importance. Cross-field score uses primary field only; secondary memberships are not counted.`","info.textContent=di().componentNote(Math.max(...components.map(x=>x.length)))"),
]
for a,b in changes: graph=replace_once(graph,a,b,a[:35])
# Preserve raw graph operations, translate rendered labels only.
research=replace_once(research,"const $=id=>document.getElementById(id),root=$('research-discovery');","const ri=()=>window.I2IDLDynamicI18n;const $=id=>document.getElementById(id),root=$('research-discovery');",'Research helper')
research=replace_once(research,"status.textContent='Search settings changed. Find papers again to export the updated results.'","status.textContent=ri().t('searchChanged')",'Research status')
# Source files are written only when every anchor has passed.
h.write_text(html);g.write_text(graph);r.write_text(research)
print('PASS: Phase 9 dynamic graph messages + research settings localization installed')
