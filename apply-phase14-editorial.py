#!/usr/bin/env python3
"""Apply approved Phase 14 editorial changes to the Phase 13 French draft, without publication."""
import json,copy,sys
from pathlib import Path
root=Path('i18n/fr-phase13')
src=root/'all-386.fr.draft.json'
policy=Path('phase14-approved-changes.json')
out=root/'all-386.fr.phase14-reviewed-draft.json'
report=root/'phase14-change-report.json'
if not src.exists() or not policy.exists():
 sys.exit('Missing Phase 13 consolidated draft or phase14-approved-changes.json; run from repository root')
if out.exists() or report.exists():
 sys.exit('Refusing to overwrite Phase 14 output; move existing output files aside before re-running')
a=json.loads(src.read_text(encoding='utf-8'))
p=json.loads(policy.read_text(encoding='utf-8'))
assert len(a['concepts'])==386 and len({c['id'] for c in a['concepts']})==386
by={c['id']:c for c in a['concepts']}
assert len(p['changes'])==len(set(p['changes']))
changed=[]
for cid,r in p['changes'].items():
 assert cid in by, f'Missing concept: {cid}'
 c=by[cid]
 assert c['status']=='draft',f'Not draft: {cid}'
 assert c['fr']['prefLabel']==r['expected']['prefLabel'], f'Unexpected current label; review manually: {cid}'
 assert c['fr']['definition']==r['expected']['definition'], f'Unexpected current definition; review manually: {cid}'
 previous=copy.deepcopy(c['fr'])
 for field,value in r['set'].items():
  assert field in ('prefLabel','definition') and isinstance(value,str) and value.strip()
  c['fr'][field]=value
 for alt in r['addAltLabels']:
  if alt and alt!=c['fr']['prefLabel'] and alt not in c['fr']['altLabels']:
   c['fr']['altLabels'].append(alt)
 if c['fr']!=previous:changed.append({'id':cid,'before':previous,'after':c['fr'],'reason':r['reason']})
# Check every original source identifier, URI and English definition remains unchanged.
orig=json.loads(src.read_text(encoding='utf-8'))
for old,new in zip(orig['concepts'],a['concepts']):
 assert (old['id'],old['canonicalUri'],old['en'])==(new['id'],new['canonicalUri'],new['en'])
 assert new['status']=='draft' and new['fr']['prefLabel'].strip() and new['fr']['definition'].strip()
assert all(c['status']=='draft' for c in a['concepts'])
out.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report.write_text(json.dumps({'changed':changed,'heldForVerification':p['heldForVerification'],'count':len(changed)},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'PASS: {len(a["concepts"])} complete draft translations retained')
print(f'PASS: {len(changed)} entries changed; {len(p["heldForVerification"])} explicit holds retained')
print('PASS: source English definitions and canonical URIs unchanged')
print('PASS: no approvals granted; no published JSON-LD or catalog changed')
print('Wrote',out,'and',report)
