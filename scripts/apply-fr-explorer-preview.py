#!/usr/bin/env python3
"""Idempotent preview patch for Explorer; operates on local working tree only."""
from pathlib import Path
import sys
html=Path('public/graph.html'); js=Path('public/graph-explorer.js')
if not html.exists() or not js.exists(): sys.exit('Run from i2idl-linked-data repository root')
h=html.read_text(); s=js.read_text()
marker='i2idl-fr-explorer-phase7'
if marker in h or marker in s: sys.exit('Phase 7 patch already present; no changes made')
def replace_once(src,old,new,label):
 if src.count(old)!=1: sys.exit(f'Expected exactly one {label}, found {src.count(old)}; no files changed')
 return src.replace(old,new,1)
h=replace_once(h,'<div class="toolbar">','<div class="toolbar"><label class="caption" for="i2idl-language">Language / Langue</label><select id="i2idl-language" aria-label="Explorer display language"><option value="en">English</option><option value="fr">Français</option></select>', 'Explorer toolbar')
h=replace_once(h,'Search 397 concepts…','Search 420 concepts…','search placeholder')
s=replace_once(s,"const label=n=>n['skos:prefLabel']||n['dcterms:identifier']||n['@id'].split('/').pop();",'''// i2idl-fr-explorer-phase7: reviewed translations overlay; English is authoritative fallback.
let i2idlLocale='en';let i2idlFrench=new Map();
const i2idlText=v=>typeof v==='string'?v:(v&&v['@value'])||'';
const i2idlEnglish=n=>i2idlText(n['skos:prefLabel'])||n['dcterms:identifier']||n['@id'].split('/').pop();
const label=n=>n?(i2idlLocale==='fr'?i2idlFrench.get(n['@id'])?.label:null)||i2idlEnglish(n):'';
const i2idlDefinition=n=>(i2idlLocale==='fr'?i2idlFrench.get(n['@id'])?.definition:null)||i2idlText(n['skos:definition'])||'';
const i2idlAliases=n=>[...refs(n['skos:altLabel']).map(i2idlText),...(i2idlFrench.get(n['@id'])?.aliases||[])];
const i2idlUI={en:{selected:'SELECTED CONCEPT',unclassified:'Unclassified',missing:'See the published glossary for the definition.',all:'All fields',other:'Other / Unclassified',status:'Select any connected node to navigate.',research:'Explore the research',papers:'Find papers on this concept',cluster:'Add to research cluster +'},fr:{selected:'CONCEPT SÉLECTIONNÉ',unclassified:'Non classé',missing:'Consultez le glossaire publié pour obtenir la définition.',all:'Tous les domaines',other:'Autre / Non classé',status:'Sélectionnez un nœud pour naviguer.',research:'Explorer la recherche',papers:'Rechercher des publications sur ce concept',cluster:'Ajouter au groupe de recherche +'}};
const i2idlT=key=>i2idlUI[i2idlLocale][key];''','label accessor')
s=replace_once(s,"kicker.textContent='SELECTED CONCEPT';","kicker.textContent=i2idlT('selected');",'detail caption')
s=replace_once(s,"field.textContent=fields.get(fieldId(n))||'Unclassified';","field.textContent=fields.get(fieldId(n))||i2idlT('unclassified');",'detail field')
s=replace_once(s,"desc.textContent=n['skos:definition']||'See the published glossary for the definition.';","desc.textContent=i2idlDefinition(n)||i2idlT('missing');",'detail definition')
s=replace_once(s,"actionsTitle.textContent='Explore the research';","actionsTitle.textContent=i2idlT('research');",'research title')
s=replace_once(s,"researchBtn.textContent='Find papers on this concept';","researchBtn.textContent=i2idlT('papers');",'research button')
s=replace_once(s,"clusterBtn.textContent='Add to research cluster +';","clusterBtn.textContent=i2idlT('cluster');",'cluster button')
s=replace_once(s,"new Option('All fields','all')","new Option(i2idlT('all'),'all')",'collection all')
s=replace_once(s,"new Option('Other / Unclassified','other')","new Option(i2idlT('other'),'other')",'collection other')
s=replace_once(s,"const title=normalizeSearch(label(n));","const title=normalizeSearch(label(n));",'search title')
s=replace_once(s,"const alternatives=refs(n['skos:altLabel']).map(v=>normalizeSearch(typeof v==='string'?v:(v&&v['@value'])||''));","const alternatives=[i2idlEnglish(n),...i2idlAliases(n),i2idlFrench.get(n['@id'])?.label||''].map(normalizeSearch);",'search aliases')
s=replace_once(s,"const definition=normalizeSearch(n['skos:definition']||'');","const definition=normalizeSearch([i2idlDefinition(n),i2idlText(n['skos:definition']),i2idlFrench.get(n['@id'])?.definition||''].join(' '));",'search definitions')
s=replace_once(s,"fetch('/glossary.jsonld',{headers:{Accept:'application/ld+json'},cache:'default'}).then(r=>{",'''const langSelect=$('i2idl-language');
const requestedLang=new URLSearchParams(location.search).get('lang');
i2idlLocale=requestedLang==='fr'?'fr':'en';langSelect.value=i2idlLocale;document.documentElement.lang=i2idlLocale;
langSelect.addEventListener('change',()=>{i2idlLocale=langSelect.value;document.documentElement.lang=i2idlLocale;
 try{const u=new URL(location.href);u.searchParams.set('lang',i2idlLocale);window.history.replaceState(null,'',u)}catch(_){}
 if(nodes.length){const selected=active;populateResearch();const field=$('collection').value;const filter=$('collection');filter.options[0].textContent=i2idlT('all');filter.options[filter.options.length-1].textContent=i2idlT('other');filter.value=field;if(selected)focus(selected,false,false);if($('search').value)$('search').dispatchEvent(new Event('input'));}
});
async function i2idlLoadFrenchOverlay(){
 try{const r=await fetch('/glossary-fr-preview.jsonld',{cache:'no-cache'});if(!r.ok)throw Error(`HTTP ${r.status}`);const doc=await r.json();
 if(!Array.isArray(doc['@graph']))throw Error('Invalid French overlay');
 const items=new Map();const base='https://id.i2idl.org/';
 for(const n of doc['@graph']){const id=n['@id'];if(typeof id!=='string'||!id.startsWith(base))continue;
 const lit=n['skos:prefLabel'];if(lit?.['@language']==='fr'&&typeof lit['@value']==='string'){
 const item=items.get(id)||{};item.label=lit['@value'];item.aliases=refs(n['skos:altLabel']).filter(v=>v?.['@language']==='fr').map(v=>v['@value']);items.set(id,item);}
 if(n['rdf:value']?.['@language']==='fr'&&typeof n['rdf:value']['@value']==='string'){
 const conceptId=id.replace('/definitions/','/concepts/');const item=items.get(conceptId)||{};item.definition=n['rdf:value']['@value'];items.set(conceptId,item);}
 }i2idlFrench=items;
 }catch(err){console.warn('I2IDL: French overlay unavailable, using English fallback.',err);i2idlFrench=new Map();}
}
Promise.all([fetch('/glossary.jsonld',{headers:{Accept:'application/ld+json'},cache:'default'}),i2idlLoadFrenchOverlay()]).then(([r])=>{''','graph fetch')
# If the French overlay uses a normal /definitions/{slug} URI, mapped concept ID remains stable.
h=replace_once(h,'<title>I2IDL Concept Graph Explorer</title>','<title>I2IDL Concept Graph Explorer</title><!-- i2idl-fr-explorer-phase7 -->','html marker')
html.write_text(h);js.write_text(s)
print('Patched public/graph.html and public/graph-explorer.js for EN/FR preview. No production files deployed.')
