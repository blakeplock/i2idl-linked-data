#!/usr/bin/env python3
"""Phase 10: localized research output and live refresh; fail closed on unknown sources."""
from pathlib import Path
h=Path('public/graph-explorer.js'); r=Path('public/research-discovery.js'); d=Path('public/i2idl-dynamic-i18n.js')
for p in (h,r,d):
 if not p.exists(): raise SystemExit('Run from repository root; missing '+str(p))
G,R,D=(p.read_text(encoding='utf-8') for p in (h,r,d))
def swap(src,old,new,description):
 if old not in src: raise SystemExit('Missing anchor: '+description+'; no changes written')
 if src.count(old)!=1: raise SystemExit('Ambiguous anchor: '+description+'; no changes written')
 return src.replace(old,new)
# Translate keys appended to previous helper, without changes to graph calculations.
insert="""
function researchReady(n,name){return locale()==='fr'?`Recherche prête pour ${n} concepts sélectionnés.`:`Ready to search ${n}-concept intersection.`}
function researchTopic(name){return locale()==='fr'?`Concept sélectionné : ${name}`:`Selected concept: ${name}`}
function researchStatus(name,count){return locale()==='fr'?(name?`Recherche prête pour ${name}.`:'Sélectionnez un concept pour effectuer une recherche.'):(name?`Ready to search ${name}.`:'Select a concept to search.')}
function researchCount(n){return locale()==='fr'?`${n} sur 5 sélectionnés`:`${n} of 5 selected`}
function researchSearching(cluster){return locale()==='fr'?(cluster?'Recherche parmi les concepts sélectionnés…':'Recherche de publications scientifiques…'):(cluster?'Searching across selected concepts…':'Searching scholarly metadata…')}
function researchError(message){return locale()==='fr'?`Service de recherche indisponible : ${message}. Essayez Google Scholar.`:`Research search unavailable: ${message}. Try Google Scholar instead.`}
function researchYears(year){return locale()==='fr'?`Saisissez des années valides (1900–${year}), avec une année de début antérieure à l’année de fin.`:`Enter valid publication years (1900–${year}) with the start year before the end year.`}
function researchOutcome(works,selectedName,cluster){return locale()==='fr'?(cluster?paperFound(works.length,selectedName,true):works.length?paperFound(works.length,selectedName,false):t('noResults')):(cluster?paperFound(works.length,selectedName,true):works.length?paperFound(works.length,selectedName,false):t('noResults'))}
function researchFooter(){return locale()==='fr'?' Les résultats ne font pas l’objet d’une validation éditoriale.':' Discovery results are not editorially reviewed.'}
function publicationMeta(work){const citations=(Number(work.citations)||0).toLocaleString(locale()==='fr'?'fr-FR':'en-US');const rate=work.citationsPerYear==null?t('rateUnavailable'):Number(work.citationsPerYear).toLocaleString(locale()==='fr'?'fr-FR':'en-US',{maximumFractionDigits:2})+' '+t('perYear');return citations+' '+t('totalCitations')+' (OpenAlex) · '+rate+(work.openAccess?' · '+t('openAccess'):'')}
function matchedText(work,total){const n=work.matchedTerms?.length||0;return locale()==='fr'?`${n} sur ${total} concepts trouvés dans le texte indexé : ${(work.matchedTerms||[]).join(', ')}`:`${n} of ${total} concepts matched in indexed text: ${(work.matchedTerms||[]).join(', ')}`}
"""
D=swap(D,'window.I2IDLDynamicI18n={t,pathCount,comparison,componentNote,paperFound,locale};',insert+"\nwindow.I2IDLDynamicI18n={t,pathCount,comparison,componentNote,paperFound,locale,researchReady,researchTopic,researchStatus,researchCount,researchSearching,researchError,researchYears,researchOutcome,researchFooter,publicationMeta,matchedText};",'dynamic exports')
D=swap(D," 'noResults':['No results found.','Aucun résultat trouvé.']"," 'rateUnavailable':['Annual rate unavailable','Taux annuel indisponible'], 'perYear':['citations/year','citations par an'], 'totalCitations':['total citations','citations au total'], 'openAccess':['Open access','Accès ouvert'], 'untitled':['Untitled publication','Publication sans titre'], 'publication':['Publication','Publication'],\n 'noResults':['No results found.','Aucun résultat trouvé.']",'dictionary fields')
# Recompute visible graph calculations with existing inputs, only if results already rendered.
needle="langSelect.addEventListener('change',()=>{i2idlLocale=langSelect.value;document.documentElement.lang=i2idlLocale;"
G=swap(G,needle,needle,"lang change") if False else G
old="if(selected)focus(selected,false,false);if($('search').value)$('search').dispatchEvent(new Event('input'));"
new="if(selected)focus(selected,false,false);if($('search').value)$('search').dispatchEvent(new Event('input'));\n  if($('path-result').children.length)runPath();if($('compare-result').children.length)runCompare();if(!$('analytics-panel').hidden)renderAnalytics();"
G=swap(G,old,new,'rerender graph result panels')
# ResearchDiscovery: last successful response for locale-only rerender, no network call.
R=swap(R,"let exportSnapshot=null;const exportCSV=", "let exportSnapshot=null;let displayedWorks=null;let displayedCluster=false;let displayedQualifier='';const exportCSV=",'research cache state')
R=swap(R,"$('research-cluster-count').textContent=cluster.length+' of 5 selected'","$('research-cluster-count').textContent=ri().researchCount(cluster.length)",'cluster count')
R=swap(R,"status.textContent=mode.checked?'Ready to search '+cluster.length+'-concept intersection.':selected?'Ready to search '+selected.name+'.':'Select a concept to search.'", "displayedWorks=null;status.textContent=mode.checked?ri().researchReady(cluster.length):ri().researchStatus(selected?.name)",'research ready status')
R=swap(R,"$('research-topic').textContent='Selected concept: '+name", "$('research-topic').textContent=ri().researchTopic(name)",'research topic')
R=swap(R,"work.title||'Untitled publication'","work.title||ri().t('untitled')",'untitled')
R=swap(R,"(Number(work.citations)||0).toLocaleString()+' total citations (OpenAlex) · '+(work.citationsPerYear===null||work.citationsPerYear===undefined?'Annual rate unavailable':Number(work.citationsPerYear).toLocaleString(undefined,{maximumFractionDigits:2})+' citations/year')+(work.openAccess?' · Open access':'')", "ri().publicationMeta(work)",'publication metadata')
R=swap(R,"`${work.matchedTerms?.length||0} of ${cluster.length} concepts matched in indexed text: ${(work.matchedTerms||[]).join(', ')}`","ri().matchedText(work,cluster.length)",'matched count')
R=swap(R,"status.textContent=isCluster?'Searching across selected concepts…':'Searching scholarly metadata…'", "status.textContent=ri().researchSearching(isCluster)",'research searching')
R=swap(R,"status.textContent='Enter valid publication years (1900–'+(thisYear+1)+') with the start year before the end year.'", "status.textContent=ri().researchYears(thisYear+1)",'research year validation')
old="status.textContent=(isCluster?`${works.length} publications with at least two selected labels in indexed text.`:works.length?`Found ${works.length} papers for ${selected.name}.`:'No results found.')+(qualifier?' Filters: '+qualifier+'.':'')+' Discovery results are not editorially reviewed.';works.forEach(w=>list.append(item(w,isCluster)));"
new="displayedWorks=works;displayedCluster=isCluster;displayedQualifier=qualifier;renderDisplayedResearch();"
R=swap(R,old,new,'research success rendering')
R=swap(R,"status.textContent='Research search unavailable: '+err.message+'. Try Google Scholar instead.'", "status.textContent=ri().researchError(err.message)",'research error')
# Inject render function, preserves published results, does not issue HTTP requests.
anchor="// Export only successfully returned, displayed results. Nothing is written back to I2IDL."
renderer="""function renderDisplayedResearch(){
 if(!displayedWorks)return;
 const info=ri().researchOutcome(displayedWorks,selected?.name||'',displayedCluster);
 status.textContent=info+(displayedQualifier?' Filters: '+displayedQualifier+'.':'')+ri().researchFooter();
 list.replaceChildren();displayedWorks.forEach(w=>list.append(item(w,displayedCluster)));
}
document.getElementById('i2idl-language')?.addEventListener('change',()=>{
 if(selected)$('research-topic').textContent=ri().researchTopic(selected.name);
 $('research-cluster-count').textContent=ri().researchCount(cluster.length);
 if(displayedWorks)renderDisplayedResearch();else if(selected||mode.checked)status.textContent=mode.checked?ri().researchReady(cluster.length):ri().researchStatus(selected?.name);
});
"""
R=swap(R,anchor,renderer+anchor,'research locale refresh')
# Clear cached display on new requests / settings changes.
R=swap(R,"function clearExport(){exportSnapshot=null;exportCSV.disabled=true;exportBib.disabled=true;}","function clearExport(){exportSnapshot=null;exportCSV.disabled=true;exportBib.disabled=true;}",'export safety check') if False else R
# Keep previously returned data displayed if user only tweaks settings until next query, as existing behavior.
for p,s in ((h,G),(r,R),(d,D)):p.write_text(s,encoding='utf-8')
print('PASS: Phase 10 installed; source files updated; run test suite')
