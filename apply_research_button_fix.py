#!/usr/bin/env python3
"""Fix Explorer selection -> Research Discovery state; don't commit this installer."""
from pathlib import Path

explorer = Path('public/graph-explorer.js')
research = Path('public/research-discovery.js')
if not explorer.exists() or not research.exists():
    raise SystemExit('Run from the i2idl-linked-data repository root.')

s = explorer.read_text()
old = "draw(n,links);details(n,links);$('results').style.display='none'}"
new = "draw(n,links);details(n,links);document.dispatchEvent(new CustomEvent('i2idl:concept-selected',{detail:{id:slug(n),name:label(n)}}));$('results').style.display='none'}"
if new not in s:
    if s.count(old) != 1:
        raise SystemExit('Explorer focus() layout has changed. No Explorer file written.')
    s = s.replace(old, new, 1)
    explorer.write_text(s)
    print('Updated public/graph-explorer.js')
else:
    print('Explorer event already installed')

s = research.read_text()
old = "function setTopic(id,name){selected={id,name};$('research-topic').textContent='Selected concept: '+name;run.disabled=false;scholar.href=searchLink(name);list.replaceChildren();status.textContent='Ready to search '+name+'.'}"
new = "function setTopic(id,name){if(!id||!name)return;const changed=!selected||selected.id!==id;selected={id,name};$('research-topic').textContent='Selected concept: '+name;run.disabled=false;scholar.href=searchLink(name);if(changed){++sequence;list.replaceChildren();status.textContent='Ready to search '+name+'.'}}"
if new not in s:
    if s.count(old) != 1:
        raise SystemExit('Research setTopic() layout has changed. Review before patching.')
    s = s.replace(old, new, 1)

old = "document.addEventListener('click',event=>{const btn=event.target.closest('[data-research-concept]');if(!btn)return;setTopic(btn.dataset.researchConcept,btn.dataset.researchLabel);root.scrollIntoView({behavior:'smooth',block:'start'});run.click()});"
new = "document.addEventListener('i2idl:concept-selected',event=>{const topic=event.detail||{};setTopic(topic.id,topic.name)});\ndocument.addEventListener('click',event=>{const btn=event.target.closest('[data-research-concept]');if(!btn)return;setTopic(btn.dataset.researchConcept,btn.dataset.researchLabel);root.scrollIntoView({behavior:'smooth',block:'start'});run.click()});"
if new not in s:
    if s.count(old) != 1:
        raise SystemExit('Research click wiring has changed. Review before patching.')
    s = s.replace(old, new, 1)
    research.write_text(s)
    print('Updated public/research-discovery.js')
else:
    print('Research event listener already installed')

print('Run node --check on both files, then npm run validate.')
