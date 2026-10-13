// SPDX-License-Identifier: Apache-2.0
// Bounded OpenAlex discovery proxy. No retrieved works enter canonical I2IDL data.
const DOMAIN='https://api.openalex.org/works';
const PUBLIC='https://id.i2idl.org/glossary-web.json';
const ordering={relevant:'relevance_score:desc',foundational:'cited_by_count:desc',recent:'publication_date:desc'};
const safeId=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function cleanURL(input){try{const u=new URL(input);return u.protocol==='https:'?u.href:null}catch{return null}}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=60, s-maxage=600');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'})}
  const concept=typeof req.query.concept==='string'?req.query.concept:'';
  const sort=typeof req.query.sort==='string'?req.query.sort:'relevant';
  if(!safeId.test(concept)||concept.length>150||!(sort in ordering))return res.status(400).json({error:'Invalid search parameters'});
  try{
    // Resolve the query from the I2IDL published concept index, never from arbitrary visitor text.
    const graphResponse=await fetch(PUBLIC,{signal:AbortSignal.timeout(6500)});
    if(!graphResponse.ok)throw Error('Glossary index unavailable');
    const index=await graphResponse.json();const entry=index.entries?.find(e=>e.id===concept);
    if(!entry)return res.status(404).json({error:'Unknown concept'});
    const query=String(entry.term||'').trim();if(!query||query.length>150)throw Error('Invalid concept label');
    const url=new URL(DOMAIN);url.searchParams.set('search',query);url.searchParams.set('per_page','15');url.searchParams.set('sort',ordering[sort]);
    if(process.env.OPENALEX_API_KEY)url.searchParams.set('api_key',process.env.OPENALEX_API_KEY);
    const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9500)});
    if(!response.ok){if(response.status===429)return res.status(503).json({error:'Scholarly search rate limit reached'});throw Error('OpenAlex returned '+response.status)}
    const data=await response.json();const works=(Array.isArray(data.results)?data.results:[]).map(w=>({
      title:String(w.title||'').slice(0,400),year:Number.isInteger(w.publication_year)?w.publication_year:null,
      citations:Number.isFinite(w.cited_by_count)?w.cited_by_count:0,
      authors:(w.authorships||[]).slice(0,5).map(a=>String(a.author?.display_name||'').slice(0,100)).filter(Boolean),
      venue:String(w.primary_location?.source?.display_name||'').slice(0,160),
      doi:cleanURL(w.doi),url:cleanURL(w.primary_location?.landing_page_url)||cleanURL(w.doi)||cleanURL(w.id),
      openAccess:Boolean(w.open_access?.is_oa)
    }));return res.status(200).json({concept,term:query,sort,works,provider:'OpenAlex',editorialStatus:'unreviewed_discovery'});
  }catch(err){console.error('Research discovery:',err.message);return res.status(502).json({error:'Scholarly search temporarily unavailable'})}
}
