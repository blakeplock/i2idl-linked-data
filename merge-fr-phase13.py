#!/usr/bin/env python3
"""Merge locally reviewed Phase 13 batches 1+2 with the 336 draft-only bulk translations."""
import json
from pathlib import Path
root=Path('i18n/fr-phase13')
bulk_path=root/'bulk-draft-51-386.json'
queue_path=root/'queue.json'
assert root.exists(), 'Run from i2idl-linked-data repository root'
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
queue=read(queue_path)
bulk=read(bulk_path)
assert len(queue['concepts'])==len(bulk['concepts'])==386
source={c['id']:c for c in queue['concepts']}
by_id={c['id']:c for c in bulk['concepts']}
assert len(source)==len(by_id)==386
for cid,x in by_id.items():
 original=source[cid]
 assert x['canonicalUri']==original['canonicalUri'] and x['en']==original['en'],f'Source drift: {cid}'
 assert x['status']=='draft',f'Unexpected approval: {cid}'
for n in (1,2):
 path=root/f'batch-{n:02}.json'
 batch=read(path)
 assert len(batch['concepts'])==25,f'Unexpected batch size: {path}'
 for c in batch['concepts']:
  cid=c['id']
  assert cid in by_id and c['en']==by_id[cid]['en'] and c['canonicalUri']==by_id[cid]['canonicalUri'],f'Batch source mismatch: {cid}'
  assert c['fr']['prefLabel'].strip() and c['fr']['definition'].strip(),f'Untranslated batch: {cid}'
  assert c['status']=='draft',f'Unexpected approval: {cid}'
  by_id[cid]['fr']=c['fr']
  by_id[cid]['reviewNotes']=c.get('reviewNotes','')
all_rows=[by_id[c['id']] for c in queue['concepts']]
assert len(all_rows)==386
assert all(x['fr']['prefLabel'].strip() and x['fr']['definition'].strip() for x in all_rows)
assert all(x['status']=='draft' for x in all_rows)
out=root/'all-386.fr.draft.json'
assert not out.exists(),f'Refusing to overwrite {out}'
bulk['concepts']=all_rows
out.write_text(json.dumps(bulk,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PASS: 386 complete French draft translations')
print('PASS: 50 locally reviewed entries preserved')
print('PASS: 336 newly translated entries included')
print('PASS: canonical English text and URIs unchanged')
print('PASS: nothing approved or published')
print('Wrote',out)
