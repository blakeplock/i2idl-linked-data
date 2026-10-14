#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Explicitly approved, append-only publication of revision snapshots and release manifests.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as rdfCanonize from 'rdf-canonize';

const BASE='https://id.i2idl.org';
const SHA=/^[a-f0-9]{64}$/;
const RELEASE=/^v\d+\.\d+\.\d+$/;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const argv=process.argv.slice(2);
const allowed=new Set(['--proposal','--approval','--source','--release','--store']);
function value(k){const i=argv.indexOf(k);if(i<0||!argv[i+1]||argv[i+1].startsWith('--'))throw Error(`Missing ${k}`);return argv[i+1];}
for(let i=0;i<argv.length;i+=2){if(!allowed.has(argv[i])||!argv[i+1])throw Error(`Unknown or incomplete argument: ${argv[i]}`);}
const proposalPath=path.resolve(value('--proposal'));
const approvalPath=path.resolve(value('--approval'));
const sourcePath=path.resolve(value('--source'));
const target=value('--release');
const store=path.resolve(value('--store'));
if(!RELEASE.test(target))throw Error('Invalid release identifier');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const proposalBytes=fs.readFileSync(proposalPath);
const proposal=JSON.parse(proposalBytes);
const approval=read(approvalPath);
const source=read(sourcePath);
const sourceVersion=source['@graph']?.find(n=>n['@id']===`${BASE}/scheme`)?.['gs:publicationVersion'];
if(sourceVersion!==target||proposal.sourcePublicationVersion!==target)throw Error('Candidate graph and proposal must declare target release');
if(approval.release!==target||approval.proposalSha256!==sha(proposalBytes)||approval.sourceSha256!==sha(fs.readFileSync(sourcePath)))throw Error('Approval digest or target does not match reviewed proposal/source');
if(!RELEASE.test(proposal.comparedAgainst)||proposal.comparedAgainst===target)throw Error('Invalid predecessor release');
if(approval.status!=='approved')throw Error('Publication requires explicit approval status: approved');
if(typeof approval.reviewer!=='string'||!approval.reviewer.trim())throw Error('Publication requires a named reviewer');
if(typeof approval.reviewNote!=='string'||!approval.reviewNote.trim())throw Error('Publication requires a review note');
const approved=approval.approvedChanges;
if(!Array.isArray(approved)||approved.length!==proposal.changes.length||new Set(approved).size!==approved.length)throw Error('Approval must explicitly list every proposed changed concept');
const changes=proposal.changes;
if(changes.some(c=>c.status==='removed'))throw Error('Concept removals require a separate lifecycle protocol; publication refused');
const proposedIds=changes.map(c=>c.concept).sort();
if(JSON.stringify([...approved].sort())!==JSON.stringify(proposedIds))throw Error('Approval list differs from proposal');
if(changes.some(c=>!['changed','added'].includes(c.status)))throw Error('Unexpected change state');
const graphIds=new Set(source['@graph'].filter(n=>[n['@type']].flat().includes('skos:Concept')).map(n=>n['@id']));
if(proposal.counts.unchanged+proposal.counts.changed+proposal.counts.added!==graphIds.size||proposal.counts.removed!==0)throw Error('Proposal counts do not reconcile');
// Re-run current comparison to prevent publishing a stale or modified proposal.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'i2idl-verify-'));
let staging;
const created=[];
try{
  const compare=path.join(tmp,'comparison');
  execFileSync(process.execPath,[path.resolve('scripts/propose-concept-revisions.mjs'),'--from',proposal.comparedAgainst,'--source',sourcePath,'--out',compare],{stdio:'pipe'});
  const replay=read(path.join(compare,'proposal.json'));
  if(JSON.stringify(replay.changes)!==JSON.stringify(changes)||JSON.stringify(replay.counts)!==JSON.stringify(proposal.counts))throw Error('Proposal no longer matches the candidate graph and predecessor');
  const before=read(path.join(store,'releases',`${proposal.comparedAgainst}.json`));
  if(before.release!==proposal.comparedAgainst||before.canonicalization!=='RDFC-1.0')throw Error('Predecessor manifest invalid');
  const prior=new Map(before.entries.map(e=>[e.concept,e]));
  if(prior.size!==before.entries.length)throw Error('Duplicate predecessor concepts');
  const updated=new Map(prior);
  const newEntities=[];
  const payloads=[];
  for(const c of changes){
    const uri=c.concept;
    const slug=uri.startsWith(`${BASE}/concepts/`)?uri.slice(`${BASE}/concepts/`.length):'';
    if(!SLUG.test(slug)||!graphIds.has(uri))throw Error('Invalid changed concept');
    const p=prior.get(uri);
    const rev=p?p.revision+1:1;
    if(c.proposedRevision!==rev||(p&&c.previousSha256!==p.sha256)||(!p&&c.status!=='added')||(p&&c.status!=='changed'))throw Error(`Incorrect revision sequence: ${slug}`);
    const graphUri=`${BASE}/graphs/concepts/${slug}/versions/${rev}`;
    const oldGraph=p?.graph??graphUri;
    const oldText=p?fs.readFileSync(path.join(store,p.path),'utf8'):'';
    if(p&&sha(oldText)!==p.sha256)throw Error(`Historical hash mismatch: ${slug}`);
    const initial=new Set(oldText.split('\n').filter(Boolean));
    for(const line of c.removedAssertions??[]){if(!initial.delete(line))throw Error(`Removed assertion is absent: ${slug}`);}
    for(const line of c.addedAssertions??[]){if(initial.has(line))throw Error(`Added assertion already exists: ${slug}`);initial.add(line);}
    if(!initial.size)throw Error('Empty revised graph refused');
    const replacement=`<${graphUri}> .`;
    const former=`<${oldGraph}> .`;
    const lines=[...initial].map(line=>{if(!line.endsWith(` ${former}`))throw Error(`Unexpected graph name in delta: ${slug}`);return line.slice(0,-former.length)+replacement;});
    const canonical=await rdfCanonize.canonize(lines.join('\n')+'\n',{algorithm:'RDFC-1.0',inputFormat:'application/n-quads',format:'application/n-quads'});
    if(!canonical.trim()||canonical.split('\n').filter(Boolean).some(line=>!line.endsWith(` ${replacement}`)))throw Error('Generated graph validation failed');
    const relative=`snapshots/${slug}/${rev}.nq`;
    if(fs.existsSync(path.join(store,relative)))throw Error(`Revision already exists: ${relative}`);
    const entry={concept:uri,revision:rev,revisionUri:`${uri}/versions/${rev}`,graph:graphUri,sha256:sha(canonical),path:relative};
    updated.set(uri,entry);payloads.push({relative,canonical});
    newEntities.push({'@id':entry.revisionUri,'@type':'prov:Entity','dcterms:isVersionOf':{'@id':uri},'prov:wasDerivedFrom':{'@id':`${BASE}/releases/${target}`},...(p?{'prov:wasRevisionOf':{'@id':p.revisionUri}}:{}),'gs:revisionNumber':{'@value':rev,'@type':'xsd:integer'},'gs:versionGraph':{'@id':graphUri},'gs:contentDigest':entry.sha256,'gs:publicationVersion':target});
  }
  if(updated.size!==graphIds.size||[...updated.keys()].some(k=>!graphIds.has(k)))throw Error('New manifest does not cover candidate concepts');
  const manifest={...before,release:target,conceptCount:updated.size,entries:[...updated.values()].sort((a,b)=>a.concept.localeCompare(b.concept))};
  const registry={'@context':{'dcterms':'http://purl.org/dc/terms/','prov':'http://www.w3.org/ns/prov#','gs':source['@context'].gs,'xsd':'http://www.w3.org/2001/XMLSchema#'},'@graph':newEntities};
  const releaseFile=path.join(store,'releases',`${target}.json`);
  const registryFile=path.join(store,'registry',`${target}.jsonld`);
  if(fs.existsSync(releaseFile)||fs.existsSync(registryFile))throw Error('Release already published; immutable history cannot be rewritten');
  staging=fs.mkdtempSync(path.join(store,'.publish-stage-'));
  const items=[...payloads.map(({relative,canonical})=>({relative,content:canonical})),{relative:`registry/${target}.jsonld`,content:JSON.stringify(registry,null,2)+'\n'},{relative:`releases/${target}.json`,content:JSON.stringify(manifest,null,2)+'\n'}];
  for(const item of items){const at=path.join(staging,item.relative);fs.mkdirSync(path.dirname(at),{recursive:true});fs.writeFileSync(at,item.content,{flag:'wx'});}
  // Release manifest installed last. Restore newly added files if a move fails.
  for(const item of items){const dest=path.join(store,item.relative);if(fs.existsSync(dest))throw Error(`Would overwrite immutable file: ${dest}`);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.renameSync(path.join(staging,item.relative),dest);created.push(dest);}
  console.log(`Published ${target}: ${changes.length} new revision(s), ${graphIds.size-changes.length} reused; ${graphIds.size} concepts in manifest`);
}catch(e){for(const file of created.reverse())fs.rmSync(file,{force:true});throw e;}
finally{fs.rmSync(tmp,{recursive:true,force:true});if(staging)fs.rmSync(staging,{recursive:true,force:true});}
