#!/usr/bin/env python3
from pathlib import Path
p=Path('public/research-discovery.js')
h=Path('public/graph.html')
s=p.read_text(); html=h.read_text()
if 'research-export-csv' in s or 'research-export-csv' in html:
    raise SystemExit('Export feature already installed; no changes made.')
needle="let selected=null,cluster=[],sequence=0;"
assert s.count(needle)==1, 'Unexpected research state structure'
s=s.replace(needle,needle+"\nlet exportSnapshot=null;const exportCSV=$('research-export-csv'),exportBib=$('research-export-bib');\nfunction clearExport(){exportSnapshot=null;exportCSV.disabled=true;exportBib.disabled=true;}\n")
needle="function refresh(){++sequence;list.replaceChildren();renderTray();"
assert s.count(needle)==1, 'Unexpected refresh function'
s=s.replace(needle,"function refresh(){clearExport();++sequence;list.replaceChildren();renderTray();")
needle="run.addEventListener('click',async()=>{if(!selected)return;const request=++sequence;"
assert s.count(needle)==1, 'Unexpected run handler'
s=s.replace(needle,"run.addEventListener('click',async()=>{if(!selected)return;clearExport();const request=++sequence;")
needle="works.forEach(w=>list.append(item(w,isCluster)));"
assert s.count(needle)==1, 'Unexpected results display'
s=s.replace(needle,"works.forEach(w=>list.append(item(w,isCluster)));if(works.length){exportSnapshot={works:works.map(w=>({...w,authors:[...(w.authors||[])],matchedTerms:[...(w.matchedTerms||[])]})),concepts:ids.map((id,i)=>({id,label:data.terms?.[i]||id})),sort:sort.value,fromYear:a,toYear:b,openAccess:oa.checked,mode:isCluster?'intersection':'single',retrievedAt:new Date().toISOString()};exportCSV.disabled=false;exportBib.disabled=false;}")
needle="renderTray();\n})();"
assert s.count(needle)==1, 'Unexpected script end'
block=r'''// Export only successfully returned, displayed results. Nothing is written back to I2IDL.
const safeCell=v=>{let x=String(v??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"'};
const doiValue=value=>{try{const u=new URL(value);if(u.hostname.toLowerCase()!=='doi.org'&&u.hostname.toLowerCase()!=='dx.doi.org')return '';return decodeURIComponent(u.pathname.replace(/^\//,''))}catch{return ''}};
const bibValue=value=>String(value??'').replace(/[\\{}]/g,c=>({'\\':'\\textbackslash ', '{':'\\{','}':'\\}'}[c])).replace(/[\r\n]+/g,' ').trim();
const bibKey=(w,i)=>{const author=(w.authors?.[0]||'I2IDL').split(/\s+/).pop().replace(/[^a-zA-Z0-9]/g,'')||'I2IDL';return author+(w.year||'nd')+'_'+String(i+1).padStart(2,'0')};
function csvContent(s){const headings=['title','authors','publication_year','venue','doi','publication_url','total_citations','citations_per_year','open_access','matched_concept_labels','i2idl_concept_ids','i2idl_concept_labels','search_mode','ranking','from_year','through_year','open_access_only','retrieved_at','metadata_provider','editorial_status'];const rows=s.works.map(w=>[w.title,(w.authors||[]).join('; '),w.year,w.venue,doiValue(w.doi),w.url,w.citations,w.citationsPerYear,w.openAccess?'yes':'no',(w.matchedTerms||[]).join('; '),s.concepts.map(x=>x.id).join('; '),s.concepts.map(x=>x.label).join('; '),s.mode,s.sort,s.fromYear,s.toYear,s.openAccess?'yes':'no',s.retrievedAt,'OpenAlex','unreviewed discovery']);return '\ufeff'+[headings.join(','),...rows.map(r=>r.map(safeCell).join(','))].join('\r\n')+'\r\n'}
function bibContent(s){return s.works.map((w,i)=>{const parts=[`@misc{${bibKey(w,i)},`];const field=(k,v)=>{if(v!==null&&v!==undefined&&String(v).trim())parts.push('  '+k+' = {'+bibValue(v)+'},')};field('title',w.title);field('author',(w.authors||[]).join(' and '));field('year',w.year);field('howpublished',w.venue);field('doi',doiValue(w.doi));field('url',w.url);field('keywords',s.concepts.map(x=>'I2IDL: '+x.label).join('; '));field('note','I2IDL Research Discovery; unreviewed OpenAlex result; mode: '+s.mode+'; selected concept URIs: '+s.concepts.map(x=>'https://id.i2idl.org/concepts/'+x.id).join('; ')+'; matched terms: '+(w.matchedTerms||[]).join('; ')+'; citations at retrieval: '+w.citations+'; ranking: '+s.sort+'; publication years: '+(s.fromYear||'any')+'-'+(s.toYear||'any')+'; open access only: '+(s.openAccess?'yes':'no')+'; retrieved: '+s.retrievedAt);parts.push('}');return parts.join('\n')}).join('\n\n')+'\n'}
function downloadExport(format){if(!exportSnapshot||!exportSnapshot.works.length)return;const name='i2idl-research-'+exportSnapshot.mode+'-'+exportSnapshot.retrievedAt.slice(0,10)+'.'+(format==='csv'?'csv':'bib');const content=format==='csv'?csvContent(exportSnapshot):bibContent(exportSnapshot);const blob=new Blob([content],{type:format==='csv'?'text/csv;charset=utf-8':'application/x-bibtex;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.style.display='none';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
exportCSV.addEventListener('click',()=>downloadExport('csv'));
exportBib.addEventListener('click',()=>downloadExport('bib'));
// Any changed search controls invalidate the export until the user runs a new search.
for(const control of [sort,fromYear,toYear,oa])control.addEventListener('change',()=>{clearExport();status.textContent='Search settings changed. Find papers again to export the updated results.'});
renderTray();
})();'''
s=s.replace(needle,block)
needle='<p id="research-status" class="small" role="status" aria-live="polite"></p>'
assert html.count(needle)==1, 'Unexpected research status markup'
html=html.replace(needle,'<div class="research-export" role="group" aria-label="Export research results"><span class="small">Export displayed papers</span><button class="button" type="button" id="research-export-csv" disabled>Download CSV</button><button class="button" type="button" id="research-export-bib" disabled>Download BibTeX</button></div><p class="muted-note">Downloads include the selected I2IDL concept IDs and labels, DOI identifiers, and the search settings. Exports contain only the current results, not the entire scholarly index.</p>\n'+needle)
needle='</style></head><body>'
assert html.count(needle)==1,'Unexpected stylesheet markup'
html=html.replace(needle,'.research-export{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0 4px}.research-export .button{padding:8px 12px;font-size:13px}.research-export button:disabled{opacity:.45;cursor:not-allowed}\n'+needle)
p.write_text(s);h.write_text(html)
print('Updated public/research-discovery.js and public/graph.html')
