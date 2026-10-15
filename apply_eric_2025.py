#!/usr/bin/env python3
"""Apply the approved ERIC 2025 I2IDL editorial expansion to a local checkout.
Runs in-place on the CURRENT BRANCH only after explicit preflight checks.
Does not bump the public release version or regenerate published indexes.
"""
import argparse, copy, json, pathlib, subprocess, sys
BASE='https://id.i2idl.org'
ERIC='https://eric.ed.gov/?ti=all'
LINKS={
 'learning-management-systems':['Learning Record Store (LRS)','Learning analytics'],
 'technology-integration':['Education technology (EdTech)','Interoperability'],
 'electronic-learning':['Online learning modality','Computer-based learning'],
 'instructional-design':['Learning experience design (LXD)','Instructional designer'],
 'instructional-systems':['Adaptive instructional system','Learning engineering'],
 'learning-objectives':['Curriculum','Learning assessment'],
 'learning-strategies':['Pedagogy','Self-regulated learning'],
 'blended-learning':['Flipped classroom','Synchronous learning','Asynchronous learning'],
 'gamification':['Motivation','Game Based Learning'],
 'game-based-learning':['Gamification','Simulation'],
 'adaptive-testing':['Assessment','Personalization'],
 'assessment-literacy':['Formative assessment','Learning assessment'],
 'performance-based-assessment':['Assessment','Competency-based learning'],
 'learning-trajectories':['Learning sciences','Mastery learning'],
 'transfer-of-training':['Experiential learning','Learning sciences'],
 'assistive-technology':['Accessibility','Human-centered design'],
 'access-to-internet':['Digital divide','Remote learning'],
 'information-literacy':['Digital Literacy','Data use'],
 'media-literacy':['Digital Literacy','Digital learning materials'],
 'technological-literacy':['Digital Literacy','Digital skills'],
 'natural-language-processing':['Artificial intelligence (AI)','Machine learning'],
 'instructional-effectiveness':['Educational evaluation','Learning analytics'],
 'educational-indicators':['Educational evaluation','Learning analytics'],
}
FIELD={
 'learning-management-systems':'standards-and-interoperability','technology-integration':'education',
 'electronic-learning':'education','instructional-design':'learning-engineering',
 'instructional-systems':'engineering-and-systems','learning-objectives':'education',
 'learning-strategies':'learning-sciences','blended-learning':'education',
 'gamification':'learning-sciences','game-based-learning':'learning-sciences',
 'adaptive-testing':'assessment-and-measurement','assessment-literacy':'assessment-and-measurement',
 'performance-based-assessment':'assessment-and-measurement','learning-trajectories':'learning-sciences',
 'transfer-of-training':'learning-sciences','assistive-technology':'human-centered-design',
 'access-to-internet':'education','information-literacy':'education','media-literacy':'education',
 'technological-literacy':'education','natural-language-processing':'ai-and-machine-learning',
 'instructional-effectiveness':'assessment-and-measurement','educational-indicators':'assessment-and-measurement'
}
def ary(x):return x if isinstance(x,list) else ([] if x is None else [x])
def refs(node,key):return {x.get('@id') for x in ary(node.get(key)) if isinstance(x,dict)}
def main():
 p=argparse.ArgumentParser();p.add_argument('--repo',default='.');p.add_argument('--apply',action='store_true');args=p.parse_args()
 repo=pathlib.Path(args.repo).resolve(); src=repo/'public/glossary.jsonld'; payload=pathlib.Path(__file__).with_name('ERIC_23_Approved_Editorial_Worklist.json')
 if not src.is_file() or not payload.is_file():sys.exit('ERROR: run with --repo path/to/i2idl-linked-data and place JSON worklist beside script')
 branch=subprocess.run(['git','-C',str(repo),'branch','--show-current'],capture_output=True,text=True).stdout.strip()
 if branch!='eric-thesaurus':sys.exit('ERROR: checkout the eric-thesaurus branch first; current branch: '+repr(branch))
 changes=subprocess.run(['git','-C',str(repo),'status','--porcelain'],capture_output=True,text=True).stdout.strip()
 if changes:sys.exit('ERROR: working tree is not clean; commit/stash changes before applying')
 graph=json.loads(src.read_text()); nodes=graph['@graph']; idx={n['@id']:n for n in nodes}; concepts=[n for n in nodes if 'skos:Concept' in ary(n.get('@type'))];
 if len(concepts)!=397:sys.exit(f'ERROR: expected 397 concepts; found {len(concepts)}. Do not apply blindly.')
 data=json.loads(payload.read_text()); additions=data['additions'];assert len(additions)==23
 bylabel={str(n.get('skos:prefLabel','')).casefold():n for n in concepts}
 old=idx.get(BASE+'/concepts/digital-literacies')
 if not old or old.get('skos:prefLabel','').casefold()!='digital literacies':sys.exit('ERROR: digital-literacies concept not in expected state')
 old['skos:prefLabel']='Digital Literacy'; old['skos:altLabel']=sorted(set(ary(old.get('skos:altLabel'))+['Digital literacies']),key=str.casefold)
 bylabel['digital literacy']=old
 sourceid=BASE+'/sources/eric-thesaurus-2025'
 if sourceid in idx:sys.exit('ERROR: ERIC source ID exists already; review before applying')
 source={'@id':sourceid,'@type':['schema:CreativeWork'],'dcterms:title':'ERIC Thesaurus (2025)','dcterms:publisher':'Institute of Education Sciences, U.S. Department of Education','schema:url':'https://eric.ed.gov/?download','dcterms:rights':'Public domain, confirmed by ERIC Help Desk (2026-10-15)','dcterms:issued':'2025'}
 newnodes=[source]
 collection_by_slug={n['@id'].split('/')[-1]:n for n in nodes if 'skos:Collection' in ary(n.get('@type'))}
 type_collection=collection_by_slug.get('concept')
 if not type_collection:sys.exit('ERROR: missing concept type collection')
 for rec in additions:
  slug=rec['proposed_id']; term=rec['term']; cid=BASE+'/concepts/'+slug; did=BASE+'/definitions/'+slug
  if cid in idx or did in idx:sys.exit('ERROR: already present: '+cid)
  if not rec.get('i2idl_definition_draft'):sys.exit('ERROR: definition missing for '+term)
  field=FIELD[slug]; col=collection_by_slug.get(field)
  if not col:sys.exit('ERROR: collection not found: '+field)
  c={'@id':cid,'@type':['skos:Concept','schema:DefinedTerm'],'dcterms:identifier':slug,'skos:inScheme':{'@id':BASE+'/scheme'},'skos:prefLabel':term,'gs:activeDefinition':{'@id':did},'gs:editorialExplanation':rec['proposed_editorial_rationale'],'gs:fieldCollection':{'@id':col['@id']},'gs:typeCollection':{'@id':type_collection['@id']}}
  note=rec.get('eric_scope_note','');evidence={'dcterms:source':{'@id':sourceid,'dcterms:title':'ERIC Thesaurus (2025)'},'prov:wasDerivedFrom':{'@id':sourceid},'gs:sourceLabel':'ERIC Thesaurus (2025)','gs:citationDetail':'ERIC Thesaurus 2025 descriptor: '+term,'gs:evidenceRelation':'supporting','schema:url':ERIC}
  d={'@id':did,'@type':['gs:Definition'],'rdf:value':rec['i2idl_definition_draft'],'gs:evidence':[evidence]}
  if note:d['dcterms:description']='ERIC scope note: '+note
  newnodes.extend([c,d]);idx[cid]=c;idx[did]=d;bylabel[term.casefold()]=c
  for coll in [col,type_collection]:
   arr=ary(coll.get('skos:member')); arr.append({'@id':cid});coll['skos:member']=arr
 for slug, labels in LINKS.items():
  node=idx[BASE+'/concepts/'+slug]
  for label in labels:
   other=bylabel.get(label.casefold())
   if not other:sys.exit('ERROR: missing relationship target '+label+' for '+slug)
   if other['@id']==node['@id']:continue
   for a,b in [(node,other),(other,node)]:
    target=b['@id'];
    if target in refs(a,'skos:broader')|refs(a,'skos:narrower'):sys.exit('ERROR: conflicting hierarchical edge '+a['@id']+' '+target)
    if target not in refs(a,'skos:related'):a['skos:related']=ary(a.get('skos:related'))+[{'@id':target}]
 nodes.extend(newnodes)
 assert len([n for n in nodes if 'skos:Concept' in ary(n.get('@type'))])==420
 print('PREVIEW: will add 23 concepts, 23 definition records, one ERIC source; rename one concept; add reciprocal related links')
 print('Current publication version remains unchanged; release metadata MUST be synchronized before publishing')
 if args.apply:
  src.write_text(json.dumps(graph,ensure_ascii=False,indent=2)+'\n')
  print('WROTE',src)
 else:print('DRY RUN: no files changed. Run again with --apply to write changes.')
if __name__=='__main__':main()
