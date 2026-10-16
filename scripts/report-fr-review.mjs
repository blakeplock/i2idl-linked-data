#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
const read=x=>JSON.parse(fs.readFileSync(x,'utf8'));
const p=read('i18n/fr.proposals.json'),r=read('i18n/fr.reviewed.json');
const total=p.concepts.length,approved=Object.keys(r.concepts).length;
if(p.sourcePublicationVersion!==r.sourcePublicationVersion)throw Error('Catalog versions differ');
console.log(`French review: ${approved} approved, ${total-approved} proposed but unapproved, 420 total glossary concepts`);
for(const x of p.concepts){if(!r.concepts[x.id])console.log(`DRAFT  ${x.id}  |  ${x.fr.prefLabel}`)}
