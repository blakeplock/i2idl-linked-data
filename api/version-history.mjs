// SPDX-License-Identifier: Apache-2.0
// Historical concept revision API. Immutable versioning files are deployment inputs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Parser, Writer } from 'n3';

const BASE = 'https://id.i2idl.org';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERSION = /^v\d+\.\d+\.\d+$/;
const ROOT = path.resolve(process.env.I2IDL_VERSION_STORE || 'versioning');
const safe = value => typeof value === 'string' && SLUG.test(value) && value.length <= 160;
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const types = {jsonld:'application/ld+json; charset=utf-8', ttl:'text/turtle; charset=utf-8', nq:'application/n-quads; charset=utf-8'};
function headers(type='text/plain; charset=utf-8', extra={}) { return {'Content-Type':type,'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','Access-Control-Allow-Headers':'Accept','Vary':'Accept','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300',...extra}; }
function respond(body,method,status=200,type='text/plain; charset=utf-8',extra={}) { return new Response(method==='HEAD'?null:body,{status,headers:headers(type,extra)}); }
function availableReleases() {
  return fs.readdirSync(path.join(ROOT,'releases')).filter(name=>/^v\d+\.\d+\.\d+\.json$/.test(name)).map(name=>name.slice(0,-5)).sort((a,b)=>{
    const A=a.slice(1).split('.').map(Number),B=b.slice(1).split('.').map(Number);
    for(let i=0;i<3;i++) if(A[i]!==B[i])return B[i]-A[i];
    return 0;
  });
}
function manifest(release) {
  if(!VERSION.test(release)) throw new Error('Invalid release');
  const obj=JSON.parse(read(`releases/${release}.json`));
  if(obj.release!==release || !Array.isArray(obj.entries) || obj.canonicalization!=='RDFC-1.0')throw new Error('Invalid release manifest');
  return obj;
}
function history(slug) {
  const id=`${BASE}/concepts/${slug}`;
  const releases=availableReleases();
  const byRevision=new Map();
  let current=null;
  for(const release of releases) {
    const entry=manifest(release).entries.find(e=>e.concept===id);
    if(!entry)continue;
    if(!current)current={...entry,release};
    if(!Number.isSafeInteger(entry.revision)||entry.revision<1||entry.path!==`snapshots/${slug}/${entry.revision}.nq`||entry.graph!==`${BASE}/graphs/concepts/${slug}/versions/${entry.revision}`||entry.revisionUri!==`${id}/versions/${entry.revision}`||!/^[a-f0-9]{64}$/.test(entry.sha256))throw new Error('Invalid revision metadata');
    const prior=byRevision.get(entry.revision);
    if(prior && prior.sha256!==entry.sha256)throw new Error('Conflicting historical revision');
    if(!prior)byRevision.set(entry.revision,{...entry,release});
  }
  return {id,current,entries:[...byRevision.values()].sort((a,b)=>a.revision-b.revision)};
}
function verify(entry) {
  const text=read(entry.path);
  const sha=crypto.createHash('sha256').update(text).digest('hex');
  if(sha!==entry.sha256)throw new Error('Historical snapshot digest mismatch');
  const quads=new Parser({format:'N-Quads'}).parse(text);
  if(!quads.length||quads.some(q=>q.graph.termType!=='NamedNode'||q.graph.value!==entry.graph))throw new Error('Historical named graph mismatch');
  return {text,quads};
}
function expandedJsonld(quads,entry) {
  const nodes=new Map();
  function value(t) {
    if(t.termType==='NamedNode'||t.termType==='BlankNode')return {'@id':t.termType==='BlankNode'?`_:${t.value}`:t.value};
    const o={'@value':t.value};
    if(t.language)o['@language']=t.language;
    else if(t.datatype.value!=='http://www.w3.org/2001/XMLSchema#string')o['@type']=t.datatype.value;
    return o;
  }
  for(const q of quads) {
    const id=q.subject.termType==='BlankNode'?`_:${q.subject.value}`:q.subject.value;
    if(!nodes.has(id))nodes.set(id,{'@id':id});
    const node=nodes.get(id);
    if(q.predicate.value==='http://www.w3.org/1999/02/22-rdf-syntax-ns#type') { (node['@type']??=[]).push(q.object.value); continue; }
    (node[q.predicate.value]??=[]).push(value(q.object));
  }
  return {'@id':entry.revisionUri,'@type':'http://www.w3.org/ns/prov#Entity','http://purl.org/dc/terms/isVersionOf':{'@id':entry.concept},'https://glossarystudio.app/ns/versionGraph':{'@id':entry.graph},'https://glossarystudio.app/ns/contentDigest':entry.sha256,'@graph':[...nodes.values()]};
}
async function turtle(quads) {
  const writer=new Writer({format:'text/turtle'});
  for(const q of quads)writer.addQuad(q.subject,q.predicate,q.object);
  return await new Promise((resolve,reject)=>writer.end((err,out)=>err?reject(err):resolve(out)));
}
function format(request,url) {
  const explicit=url.searchParams.get('format');
  if(explicit==='ttl'||explicit==='jsonld'||explicit==='nq')return explicit;
  const accept=request.headers.get('accept')||'';
  const m=[...accept.matchAll(/(?:^|,)\s*([^;,]+)(?:;[^,]*)?/g)].map((a,i)=>({type:a[1].trim().toLowerCase(),q:(a[0].match(/;\s*q=([\d.]+)/i)?.[1]??'1')*1,index:i})).filter(x=>x.q>0).sort((a,b)=>b.q-a.q||a.index-b.index);
  for(const x of m){if(x.type==='text/turtle'||x.type==='application/x-turtle')return 'ttl';if(x.type==='application/n-quads')return 'nq';if(x.type==='application/ld+json'||x.type==='application/json')return 'jsonld';}
  return 'jsonld';
}
export default {
  async fetch(request) {
    const method=request.method.toUpperCase();
    if(method==='OPTIONS')return respond(null,method,204);
    if(method!=='GET'&&method!=='HEAD')return respond('Method Not Allowed',method,405,'text/plain; charset=utf-8',{'Allow':'GET, HEAD, OPTIONS'});
    const url=new URL(request.url);
    const slug=url.searchParams.get('id');
    const number=url.searchParams.get('revision');
    const kind=url.searchParams.get('kind');
    if(!safe(slug)||!['history','revision'].includes(kind)||kind==='revision'&&!/^[1-9]\d*$/.test(number||''))return respond('Invalid identifier',method,400);
    try {
      const found=history(slug);
      if(!found.current)return respond('Concept history not found',method,404);
      if(kind==='history') {
        const doc={'@context':{'dcterms':'http://purl.org/dc/terms/','prov':'http://www.w3.org/ns/prov#','gs':'https://glossarystudio.app/ns/'},'@id':`${found.id}/versions`,'@type':'prov:Collection','dcterms:isVersionOf':{'@id':found.id},'gs:currentRevision':{'@id':found.current.revisionUri},'prov:hadMember':found.entries.map(e=>({'@id':e.revisionUri})), 'gs:revisionHistory':found.entries.map(e=>({'@id':e.revisionUri,'gs:revisionNumber':e.revision,'gs:contentDigest':e.sha256,'gs:firstObservedRelease':e.release}))};
        const serialized=JSON.stringify(doc,null,2)+'\n';
        return respond(serialized,method,200,types.jsonld,{'Link':`<${found.id}>; rel="original"`});
      }
      const entry=found.entries.find(e=>e.revision===Number(number));
      if(!entry)return respond('Revision not found',method,404);
      const {text,quads}=verify(entry);
      const f=format(request,url);
      const body=f==='nq'?text:f==='ttl'?await turtle(quads):JSON.stringify(expandedJsonld(quads,entry),null,2)+'\n';
      return respond(body,method,200,types[f],{'ETag':`"${entry.sha256}"`,'Cache-Control':'public, max-age=3600, immutable','Link':`<${found.id}>; rel="original", <${found.id}/versions>; rel="version-history"`});
    } catch(err) {
      if(err.code==='ENOENT')return respond('Version history unavailable',method,503);
      console.error('Version history resolution error',err);
      return respond('Unable to resolve historical revision',method,500);
    }
  }
};
