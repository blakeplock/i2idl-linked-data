// SPDX-License-Identifier: Apache-2.0
// REST API v1 Phase 2; read-only projections of published glossary resources.
const BASE='https://id.i2idl.org';
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','Access-Control-Allow-Headers':'Accept, Content-Type','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=60, s-maxage=300'};
const array=x=>x==null?[]:Array.isArray(x)?x:[x];
const iri=x=>typeof x==='string'?x:x?.['@id'];
function out(data,status=200,method='GET'){return new Response(method==='HEAD'?null:JSON.stringify(data),{status,headers});}
function err(code,message,status,method){return out({error:{code,message}},status,method);}
async function json(url){const res=await fetch(url);if(!res.ok)throw new Error(`Unavailable index: ${res.status}`);return res.json();}
async function indexes(request){const [core,details]=await Promise.all([json(new URL('/glossary-core.json',request.url)),json(new URL('/glossary-details.json',request.url))]);if(!core.publicationVersion||core.publicationVersion!==details.publicationVersion||!core.sourceTag||core.sourceTag!==details.sourceTag||!Array.isArray(core.entries)||!Array.isArray(core.allCollections)||!details.entries||typeof details.entries!=='object')throw new Error('Mismatched published indexes');return {core,details};}
function slug(uri){return uri?.split('/').pop()||'';}
function refs(uris,lookup){return array(uris).map(uri=>{const id=slug(uri),e=lookup.get(id);return {id,uri,term:e?.term||null};});}
function ensureId(url,method){const id=url.searchParams.get('id');return !id||id.length>160||!ID.test(id)?err('invalid_id','Invalid identifier',400,method):null;}
function options(url,allowed,method){for(const key of url.searchParams.keys())if(!allowed.includes(key))return err('invalid_parameter',`Unknown parameter: ${key}`,400,method);return null;}
function bounded(url,name,def,max){const raw=url.searchParams.get(name);if(raw===null)return def;if(!/^(0|[1-9][0-9]*)$/.test(raw))return null;const n=Number(raw);return Number.isSafeInteger(n)&&n>=(name==='offset'?0:1)&&n<=max?n:null;}
export default {async fetch(request){const method=request.method.toUpperCase();if(method==='OPTIONS')return new Response(null,{status:204,headers});if(!['GET','HEAD'].includes(method))return err('method_not_allowed','Only GET and HEAD are supported',405,method);const url=new URL(request.url),route=url.searchParams.get('route');const routes={relationships:['route','id'],collections:['route','type','limit','offset'],collection:['route','type','id','limit','offset'],sources:['route'],source:['route','id'],versions:['route','id']};if(!Object.hasOwn(routes,route))return err('not_found','Unknown API route',404,method);const bad=options(url,routes[route],method);if(bad)return bad;if(['relationships','collection','source','versions'].includes(route)){const e=ensureId(url,method);if(e)return e;}
const limit=bounded(url,'limit',20,100),offset=bounded(url,'offset',0,100000);if(['collections','collection'].includes(route)&&(limit===null||offset===null))return err('invalid_parameter','Invalid limit or offset',400,method);
try{
 if(route==='versions'){
   const id=url.searchParams.get('id');const historyURL=new URL(`/concepts/${id}/versions`,request.url);const response=await fetch(historyURL,{headers:{Accept:'application/ld+json'}});
   if(response.status===404)return err('not_found','Concept history not found',404,method);
   if(!response.ok)throw new Error(`History endpoint returned ${response.status}`);
   const doc=await response.json();const hist=array(doc['gs:revisionHistory']);
   return out({apiVersion:'v1',conceptId:id,uri:`${BASE}/concepts/${id}`,currentRevision:slug(iri(doc['gs:currentRevision'])),revisions:hist.map(h=>({revision:h['gs:revisionNumber'],uri:h['@id'],sha256:h['gs:contentDigest'],firstObservedRelease:h['gs:firstObservedRelease']}))},200,method);
 }
 if(route==='sources'||route==='source'){
   const graph=await json(new URL('/glossary.jsonld',request.url));const nodes=graph['@graph'];if(!Array.isArray(nodes))throw new Error('Malformed canonical graph');const sources=nodes.filter(n=>typeof n['@id']==='string'&&n['@id'].startsWith(`${BASE}/sources/`)).map(n=>({id:slug(n['@id']),uri:n['@id'],title:n['dcterms:title']||'',url:n['schema:url']||null,license:n['dcterms:license']||null,metadata:n})).sort((a,b)=>a.title.localeCompare(b.title));
   if(route==='sources')return out({apiVersion:'v1',total:sources.length,items:sources.map(({metadata,...s})=>s)},200,method);
   const found=sources.find(s=>s.id===url.searchParams.get('id'));return found?out({apiVersion:'v1',source:found},200,method):err('not_found','Source not found',404,method);
 }
 const {core,details}=await indexes(request);const lookup=new Map(core.entries.map(e=>[e.id,e]));
 if(route==='relationships'){
   const id=url.searchParams.get('id'),entry=lookup.get(id);if(!entry)return err('not_found','Concept not found',404,method);const info=details.entries[id];if(!info)throw new Error('Missing concept details');return out({apiVersion:'v1',publicationVersion:core.publicationVersion,concept:{id,uri:`${BASE}/concepts/${id}`,term:entry.term},relationships:{broader:refs(info.broader,lookup),narrower:refs(info.narrower,lookup),related:refs(info.related,lookup)},externalMappings:info.externalMappings||[]},200,method);
 }
 if(route==='collections'){
   const type=url.searchParams.get('type');if(type!==null&&!['field','type','curated'].includes(type))return err('invalid_parameter','Invalid collection type',400,method);const all=core.allCollections.filter(c=>!type||c.id.startsWith(`${BASE}/collections/${type}/`));return out({apiVersion:'v1',publicationVersion:core.publicationVersion,total:all.length,limit,offset,nextOffset:offset+limit<all.length?offset+limit:null,items:all.slice(offset,offset+limit).map(c=>({id:c.slug,uri:c.id,label:c.label,description:c.description,count:c.members.length,type:c.id.split('/')[4]}))},200,method);
 }
 const type=url.searchParams.get('type'),id=url.searchParams.get('id');if(!['field','type','curated'].includes(type||''))return err('invalid_parameter','Invalid collection type',400,method);const c=core.allCollections.find(c=>c.id===`${BASE}/collections/${type}/${id}`);if(!c)return err('not_found','Collection not found',404,method);return out({apiVersion:'v1',publicationVersion:core.publicationVersion,collection:{id,uri:c.id,type,label:c.label,description:c.description},total:c.members.length,limit,offset,nextOffset:offset+limit<c.members.length?offset+limit:null,items:refs(c.members.slice(offset,offset+limit),lookup)},200,method);
 }catch(e){console.error('I2IDL API v1 graph error',e);return err('service_unavailable','Glossary API temporarily unavailable',503,method);}
 }};
