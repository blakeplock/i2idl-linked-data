(()=>{'use strict';
const ROOT='dbpedia-context-pilot',DATA='/dbpedia-context-pilot.json';
const p=document.getElementById(ROOT);if(!p)return;
const info=p.querySelector('[data-pilot-summary]'),list=p.querySelector('[data-pilot-list]'),review=p.querySelector('[data-pilot-review]');
function a(url,label){const el=document.createElement('a');el.href=url;el.textContent=label;el.target='_blank';el.rel='noopener noreferrer';return el}
function line(tag,cls,txt){const el=document.createElement(tag);el.className=cls;el.textContent=txt;return el}
fetch(DATA,{cache:'default'}).then(x=>{if(!x.ok)throw Error('HTTP '+x.status);return x.json()}).then(data=>{
const candidates=data.candidates||[];info.textContent=`${candidates.length} curated candidates · 0 approved mappings · standalone pilot`;
for(const c of candidates){const section=document.createElement('section');section.className='external-pilot-entry';
section.append(line('h4','',c.conceptLabel));
section.append(line('p','small',c.status==='review_candidate'?'DBpedia page located; semantic equivalence not approved.':'Pending reliable DBpedia endpoint verification.'));
section.append(line('p','small',c.reviewNote));
const links=document.createElement('p');links.className='small';links.append(a('/explore?concept='+encodeURIComponent(c.conceptId),'Explore I2IDL concept'),document.createTextNode(' · '),a('https://www.i2idl.org/glossary?concept='+encodeURIComponent(c.conceptId),'Glossary card'),document.createTextNode(' · '),a(c.page,'DBpedia resource ↗'));section.append(links);list.append(section);
}review.textContent='These are editorial candidates only. No SKOS or OWL assertions have been added. Verify each DBpedia resource and compare its scope with the I2IDL definition before deciding on a mapping predicate.';
}).catch(e=>{info.textContent='Unable to load DBpedia pilot: '+e.message});
})();
