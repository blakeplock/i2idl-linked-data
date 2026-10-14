// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import fs from 'node:fs';
const spec=JSON.parse(fs.readFileSync('public/api/openapi.json','utf8'));
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const expected=['/api/v1/concepts','/api/v1/concepts/{id}','/api/v1/concepts/{id}/relationships','/api/v1/concepts/{id}/versions','/api/v1/collections','/api/v1/collections/{type}/{id}','/api/v1/sources','/api/v1/sources/{id}'];
assert.equal(spec.openapi,'3.1.0');
assert.deepEqual(Object.keys(spec.paths).sort(),expected.sort());
for(const path of expected){
 const op=spec.paths[path].get;
 assert(op?.responses?.['200']?.content?.['application/json']?.schema,`Missing 200 schema for ${path}`);
 for(const name of [...path.matchAll(/\{([^}]+)\}/g)].map(m=>m[1])) assert(op.parameters.some(p=>p.name===name&&p.in==='path'&&p.required),`Missing path parameter ${name}`);
 const source=path.replace(/\{([^}]+)\}/g,':$1');
 assert(vercel.rewrites.some(x=>x.source===source),`Missing deployed Vercel rewrite ${source}`);
}
assert(vercel.rewrites.some(x=>x.source==='/api/docs'&&x.destination==='/api/docs.html'));
const html=fs.readFileSync('public/api/docs.html','utf8');
assert(html.includes('api/openapi.json'));
assert(!/https?:\/\/(?:unpkg|cdnjs|cdn\.jsdelivr)/.test(html),'No third-party JavaScript dependencies');
console.log('PASS REST API v1 Phase 3: eight endpoints, schemas, parameters, rewrites, docs');
