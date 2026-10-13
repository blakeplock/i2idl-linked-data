// SPDX-License-Identifier: Apache-2.0
// Bounded concept and multi-concept scholarly discovery. No results alter I2IDL assertions.
const DOMAIN='https://api.openalex.org/works';
const PUBLIC='https://id.i2idl.org/glossary-web.json';
const ordering={relevant:'relevance_score:desc',foundational:'cited_by_count:desc',recent:'publication_date:desc'};
const safeId=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function cleanURL(input){try{const u=new URL(input);return u.protocol==='https:'?u.href:null}catch{return null}}
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function abstract(w){const idx=w.abstract_inverted_index;if(!idx||typeof idx!=='object')return '';const tokens=[];for(const [word,positions] of Object.entries(idx))for(const p of positions)if(Number.isInteger(p)&&p>=0&&p<4000)tokens[p]=word;return tokens.join(' ')}
function cleanTitle(term){return String(term||'').replace(/\s*\([^)]{1,12}\)\s*$/,'').trim()}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=60, s-maxage=600');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'})}
 const raw=typeof req.query.concepts==='string'?req.query.concepts:typeof req.query.concept==='string'?req.query.concept:'';
 const ids=raw.split(',');const sort=typeof req.query.sort==='string'?req.query.sort:'relevant';
 if(ids.length<1||ids.length>5||new Set(ids).size!==ids.length||ids.some(x=>!safeId.test(x)||x.length>150)||!Object.hasOwn(ordering,sort))return res.status(400).json({error:'Invalid search parameters'});
 try{
  const graphResponse=await fetch(PUBLIC,{signal:AbortSignal.timeout(6500)});if(!graphResponse.ok)throw Error('Glossary index unavailable');
  const index=await graphResponse.json();const entries=ids.map(id=>index.entries?.find(e=>e.id===id));if(entries.some(x=>!x))return res.status(404).json({error:'Unknown concept'});
  const terms=entries.map(e=>cleanTitle(e.term));if(terms.some(x=>!x||x.length>150))throw Error('Invalid concept label');
  const multi=terms.length>1;const searches=multi?terms.slice(1).map(term=>[terms[0],term].join(' ')):[terms[0]];
  const datasets=await Promise.allSettled(searches.map(async query=>{const url=new URL(DOMAIN);url.searchParams.set('search',query);url.searchParams.set('per_page',multi?'25':'15');url.searchParams.set('sort',multi?'relevance_score:desc':ordering[sort]);if(process.env.OPENALEX_API_KEY)url.searchParams.set('api_key',process.env.OPENALEX_API_KEY);const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9500)});if(!response.ok)throw Error('OpenAlex HTTP '+response.status);const data=await response.json();return Array.isArray(data.results)?data.results:[]}));
  const good=datasets.filter(x=>x.status==='fulfilled');if(!good.length)return res.status(503).json({error:'OpenAlex queries unavailable or rate limited'});
  const unique=new Map();for(const d of good)for(const w of d.value){const id=w.id||w.doi;if(id&&!unique.has(id))unique.set(id,w)}
  let works=[...unique.values()].map(w=>{const searchable=norm([w.title,abstract(w)].join(' '));const matchedTerms=terms.filter(t=>searchable.includes(norm(t)));return {title:String(w.title||'').slice(0,400),year:Number.isInteger(w.publication_year)?w.publication_year:null,citations:Number.isFinite(w.cited_by_count)?w.cited_by_count:0,authors:(w.authorships||[]).slice(0,5).map(a=>String(a.author?.display_name||'').slice(0,100)).filter(Boolean),venue:String(w.primary_location?.source?.display_name||'').slice(0,160),doi:cleanURL(w.doi),url:cleanURL(w.primary_location?.landing_page_url)||cleanURL(w.doi)||cleanURL(w.id),openAccess:Boolean(w.open_access?.is_oa),matchedTerms,matchCount:matchedTerms.length}});
  if(multi)works=works.filter(w=>w.matchCount>=2);
  works.sort((a,b)=>multi&&b.matchCount!==a.matchCount?b.matchCount-a.matchCount:sort==='foundational'?b.citations-a.citations:sort==='recent'?(b.year||0)-(a.year||0):0);
  return res.status(200).json({concepts:ids,terms,sort,works:works.slice(0,15),provider:'OpenAlex',queriesSucceeded:good.length,queriesAttempted:searches.length,editorialStatus:'unreviewed_discovery',matchRule:multi?'At least two distinct concept preferred labels appear in indexed title or abstract':'OpenAlex keyword search'});
 }catch(err){console.error('Research discovery:',err.message);return res.status(502).json({error:'Scholarly search temporarily unavailable'})}
}
