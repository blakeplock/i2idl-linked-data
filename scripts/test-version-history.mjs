// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import handler from '../api/version-history.mjs';
const BASE='https://id.i2idl.org';
async function check(url,accept='application/ld+json',method='GET'){
  return handler.fetch(new Request(url,{method,headers:{Accept:accept}}));
}
const list=await check(`${BASE}/api/version-history?kind=history&id=learning-engineering`);
assert.equal(list.status,200);const body=await list.json();
assert.equal(body['gs:revisionHistory'].length,1);
const endpoint=`${BASE}/api/version-history?kind=revision&id=learning-engineering&revision=1`;
const version=await check(endpoint);
assert.equal(version.status,200);assert.equal((await version.json())['@id'],`${BASE}/concepts/learning-engineering/versions/1`);
const turtle=await check(endpoint,'text/turtle');assert.equal(turtle.status,200);assert.match(turtle.headers.get('content-type'),/text\/turtle/);assert.match(await turtle.text(),/learning-engineering/);
const nquads=await check(endpoint,'application/n-quads');assert.equal(nquads.status,200);assert.match(await nquads.text(),/graphs\/concepts\/learning-engineering\/versions\/1/);
const missing=await check(`${BASE}/api/version-history?kind=revision&id=learning-engineering&revision=2`);assert.equal(missing.status,404);
const invalid=await check(`${BASE}/api/version-history?kind=revision&id=..%2Fetc&revision=1`);assert.equal(invalid.status,400);
const head=await check(endpoint,'application/ld+json','HEAD');assert.equal(head.status,200);assert.equal(await head.text(),'');
console.log('PASS Phase 4: history, JSON-LD, Turtle, N-Quads, unknown revision, invalid identifier, HEAD');
