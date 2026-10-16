#!/usr/bin/env python3
from pathlib import Path
p=Path('public/graph-explorer.js')
s=p.read_text(encoding='utf-8')
old="""if(nodes.length){const selected=active;populateResearch();const field=$('collection').value;const filter=$('collection');filter.options[0].textContent=i2idlT('all');filter.options[filter.options.length-1].textContent=i2idlT('other');filter.value=field;if(selected)focus(selected,false,false);if($('search').value)$('search').dispatchEvent(new Event('input'));
  if($('path-result').children.length)runPath();if($('compare-result').children.length)runCompare();if(!$('analytics-panel').hidden)renderAnalytics();}"""
new="""if(nodes.length){
  const selected=active;
  const field=$('collection').value;
  const ids=['path-a','path-b','compare-a','compare-b'];
  const selections=Object.fromEntries(ids.map(id=>[id,$(id).value]));
  const hadPath=$('path-result').childNodes.length>0;
  const hadComparison=$('compare-result').childNodes.length>0;
  const hadAnalytics=!$('analytics-panel').hidden && $('analytics-result').childNodes.length>0;
  populateResearch();
  for(const id of ids){if([...$(id).options].some(option=>option.value===selections[id]))$(id).value=selections[id]}
  const filter=$('collection');filter.options[0].textContent=i2idlT('all');filter.options[filter.options.length-1].textContent=i2idlT('other');filter.value=field;
  if(selected)focus(selected,false,false);
  if($('search').value)$('search').dispatchEvent(new Event('input'));
  if(hadPath)runPath();
  if(hadComparison)runCompare();
  if(hadAnalytics)renderAnalytics();
}"""
if new in s:
 print('PASS: preservation fix already installed')
elif s.count(old)==1:
 p.write_text(s.replace(old,new),encoding='utf-8')
 print('PASS: language switching now preserves selections and existing results')
else:
 raise SystemExit(f'Expected exactly one Phase 10 switch block, found {s.count(old)}; no changes made')
