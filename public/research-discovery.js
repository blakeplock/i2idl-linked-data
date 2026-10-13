(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('research-discovery');if(!root)return;
const status=$('research-status'),list=$('research-results'),run=$('research-run'),sort=$('research-sort'),scholar=$('research-scholar');
let selected=null,sequence=0;
const validUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:null}catch{return null}};
function searchLink(q){return 'https://scholar.google.com/scholar?q='+encodeURIComponent('"'+q+'"')}
function setTopic(id,name){selected={id,name};$('research-topic').textContent='Selected concept: '+name;run.disabled=false;scholar.href=searchLink(name);list.replaceChildren();status.textContent='Ready to search '+name+'.'}
document.addEventListener('click',event=>{const btn=event.target.closest('[data-research-concept]');if(!btn)return;setTopic(btn.dataset.researchConcept,btn.dataset.researchLabel);root.scrollIntoView({behavior:'smooth',block:'start'});run.click()});
function item(work){const article=document.createElement('article');article.className='research-item';const title=document.createElement('h4');title.textContent=work.title||'Untitled publication';article.append(title);
const authors=document.createElement('p');authors.className='small';authors.textContent=[(work.authors||[]).join(', '),work.year,work.venue].filter(Boolean).join(' · ');article.append(authors);
const meta=document.createElement('p');meta.className='small';meta.textContent=(Number(work.citations)||0).toLocaleString()+' citations (OpenAlex)'+(work.openAccess?' · Open access':'');article.append(meta);
const links=document.createElement('div');links.className='research-links';for(const [name,url] of [['Publication',work.url],['DOI',work.doi]]){const good=validUrl(url);if(!good)continue;const a=document.createElement('a');a.href=good;a.textContent=name+' ↗';a.target='_blank';a.rel='noopener noreferrer';links.append(a)}article.append(links);return article}
run.addEventListener('click',async()=>{if(!selected)return;const request=++sequence;const topic={...selected};run.disabled=true;status.textContent='Searching scholarly metadata…';list.replaceChildren();const params=new URLSearchParams({concept:topic.id,sort:sort.value});
try{const response=await fetch('/api/research?'+params,{headers:{Accept:'application/json'}});const data=await response.json();if(request!==sequence)return;if(!response.ok)throw Error(data.error||'Research service unavailable');const works=Array.isArray(data.works)?data.works:[];status.textContent=works.length?`Found ${works.length} papers for ${topic.name}. Results are not editorially reviewed.`:'No results found. Try Google Scholar.';works.forEach(w=>list.append(item(w)))}catch(err){if(request===sequence)status.textContent='Research search unavailable: '+err.message+'. Use Google Scholar instead.'}finally{if(request===sequence)run.disabled=false}});
})();
