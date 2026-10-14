// SPDX-License-Identifier: Apache-2.0
// Read-only public glossary API. Canonical JSON-LD remains the source of truth.
const BASE = 'https://id.i2idl.org';
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_Q = 160;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=60, s-maxage=300'
};
function respond(data, status = 200, method = 'GET') {
  return new Response(method === 'HEAD' ? null : JSON.stringify(data), {
    status, headers: {...cors, 'Content-Type': 'application/json; charset=utf-8'}
  });
}
function error(code, message, status, method) {
  return respond({error:{code,message}},status,method);
}
function intParam(url,name,fallback,min,max){
  const raw=url.searchParams.get(name);
  if(raw===null)return fallback;
  if(!/^(0|[1-9][0-9]*)$/.test(raw))return null;
  const n=Number(raw);
  return Number.isSafeInteger(n)&&n>=min&&n<=max?n:null;
}
async function load(url) {
  // Fixed same-origin resource paths, never user-influenced URLs.
  const [c,d] = await Promise.all([
    fetch(new URL('/glossary-core.json',url)),
    fetch(new URL('/glossary-details.json',url))
  ]);
  if(!c.ok||!d.ok)throw new Error('Presentation index unavailable');
  const [core,details]=await Promise.all([c.json(),d.json()]);
  if(!core.publicationVersion||core.publicationVersion!==details.publicationVersion||
     !core.sourceTag||core.sourceTag!==details.sourceTag||
     !Array.isArray(core.entries)||!details.entries||typeof details.entries!=='object')
    throw new Error('Presentation indexes do not match');
  return {core,details};
}
function project(entry,details){
  const full=details.entries[entry.id];
  if(!full)throw new Error('Missing concept detail');
  const {broader=[],narrower=[],related=[],sources=[],externalMappings=[]}=full;
  return {
    id:entry.id, uri:`${BASE}/concepts/${entry.id}`,term:entry.term,
    definition:entry.definition,why:entry.why,aka:entry.aka,
    field:entry.field,type:entry.type,collections:entry.collections,
    relationships:{broader,narrower,related},sources,externalMappings,
    links:{jsonld:`${BASE}/concepts/${entry.id}.jsonld`,turtle:`${BASE}/concepts/${entry.id}.ttl`,
      history:`${BASE}/concepts/${entry.id}/versions`,human:`https://www.i2idl.org/glossary?concept=${encodeURIComponent(entry.id)}`}
  };
}
export default {
  async fetch(request){
    const method=request.method.toUpperCase();
    if(method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(method!=='GET'&&method!=='HEAD')return error('method_not_allowed','Only GET and HEAD are supported',405,method);
    const url=new URL(request.url);
    const route=url.searchParams.get('route');
    if(route!=='concepts'&&route!=='concept')return error('not_found','Unknown API route',404,method);
    const allowed=route==='concepts'?new Set(['route','q','field','type','source','collection','limit','offset']):new Set(['route','id']);
    for(const key of url.searchParams.keys())if(!allowed.has(key))return error('invalid_parameter',`Unknown parameter: ${key}`,400,method);
    if(route==='concept'){
      const id=url.searchParams.get('id');
      if(!id||id.length>160||!ID.test(id))return error('invalid_id','Invalid concept identifier',400,method);
    }
    let limit=20,offset=0,q='';
    if(route==='concepts'){
      limit=intParam(url,'limit',20,1,100);offset=intParam(url,'offset',0,0,100000);
      q=(url.searchParams.get('q')||'').trim();
      if(limit===null||offset===null||q.length>MAX_Q)return error('invalid_parameter','Invalid limit, offset, or search query',400,method);
      for(const key of ['field','type','source','collection'])if((url.searchParams.get(key)||'').length>200)return error('invalid_parameter',`Invalid ${key}`,400,method);
    }
    try{
      const {core,details}=await load(request.url);
      if(route==='concept'){
        const id=url.searchParams.get('id');
        const entry=core.entries.find(e=>e.id===id);
        if(!entry)return error('not_found','Concept not found',404,method);
        return respond({apiVersion:'v1',publicationVersion:core.publicationVersion,concept:project(entry,details)},200,method);
      }
      const norm=s=>String(s||'').normalize('NFKD').toLocaleLowerCase('en').trim();
      const needle=norm(q);
      const filtered=core.entries.filter(e=>{
        const fields=['field','type','source','collection'];
        for(const key of fields){const value=url.searchParams.get(key);if(!value)continue;
          const matching=key==='source'?(details.entries[e.id]?.sources||[]).some(s=>norm(s.name)===norm(value)):
            key==='collection'?e.collections.some(c=>c===value||c.split('/').pop()===value):norm(e[key])===norm(value);
          if(!matching)return false;
        }
        return !needle||norm([e.term,e.aka,e.definition,e.why].join(' ')).includes(needle);
      }).sort((a,b)=>a.term.localeCompare(b.term)||a.id.localeCompare(b.id));
      const items=filtered.slice(offset,offset+limit).map(e=>({id:e.id,uri:`${BASE}/concepts/${e.id}`,term:e.term,definition:e.definition,field:e.field,type:e.type,aka:e.aka}));
      return respond({apiVersion:'v1',publicationVersion:core.publicationVersion,total:filtered.length,limit,offset,
        nextOffset:offset+limit<filtered.length?offset+limit:null,items},200,method);
    }catch(e){console.error('I2IDL API v1 error',e);return error('service_unavailable','Glossary API temporarily unavailable',503,method);}
  }
};
