#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Generates a DRAFT approval checklist, never signs or publishes it.
import fs from 'node:fs';
import crypto from 'node:crypto';
const [proposalPath,sourcePath,release,outPath]=process.argv.slice(2);
if(!proposalPath||!sourcePath||!/^v\d+\.\d+\.\d+$/.test(release||'')||!outPath)throw Error('Usage: node scripts/prepare-version-approval.mjs proposal.json candidate.jsonld vX.Y.Z approval.json');
const bytes=fs.readFileSync(proposalPath);
const proposal=JSON.parse(bytes);
const source=JSON.parse(fs.readFileSync(sourcePath));
const scheme=source['@graph']?.find(n=>n['@id']==='https://id.i2idl.org/scheme');
if(proposal.sourcePublicationVersion!==release||scheme?.['gs:publicationVersion']!==release)throw Error('Target version mismatch');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const approval={release,proposalSha256:sha(bytes),sourceSha256:sha(fs.readFileSync(sourcePath)),status:'draft',reviewer:'',reviewNote:'Review proposal.md and all proposed changes; then set status to approved, enter reviewer identity, and explicitly list approvedChanges.',approvedChanges:[]};
fs.writeFileSync(outPath,JSON.stringify(approval,null,2)+'\n',{flag:'wx'});
console.log(`Wrote DRAFT approval for ${proposal.changes.length} changed concept(s) to ${outPath}. Human review required.`);
