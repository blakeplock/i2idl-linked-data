// SPDX-License-Identifier: Apache-2.0
// Verify bilingual publication artifacts before merging or deploying.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const BASE = 'https://id.i2idl.org';
const data = JSON.parse(fs.readFileSync('public/glossary-web.json','utf8'));
const entries = data.entries;
assert.equal(entries.length, 420, 'Expected 420 glossary concepts');
assert.equal(new Set(entries.map(e => e.id)).size, entries.length, 'Duplicate concept IDs');

const sitemap = fs.readFileSync('public/sitemap.xml','utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.equal(urls.length, entries.length * 2, 'Sitemap must list 840 HTML pages');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
assert.match(sitemap, /xmlns:xhtml="http:\/\/www.w3.org\/1999\/xhtml"/);
const robots = fs.readFileSync('public/robots.txt','utf8');
assert.ok(robots.includes(`Sitemap: ${BASE}/sitemap.xml`));
for (const e of entries) {
  for (const lang of ['en','fr']) {
    const file = path.join('public', ...(lang === 'fr' ? ['fr'] : []), 'terms', e.id, 'index.html');
    const page = fs.readFileSync(file,'utf8');
    const url = `${BASE}${lang === 'fr' ? '/fr' : ''}/terms/${e.id}/`;
    assert.ok(urls.includes(url), `Missing sitemap URL ${url}`);
    assert.ok(page.includes(`<html lang="${lang}">`), `Wrong page language ${file}`);
    assert.ok(page.includes(`<link rel="canonical" href="${url}">`), `Wrong canonical ${file}`);
    assert.ok(page.includes(`<link rel="alternate" hreflang="en" href="${BASE}/terms/${e.id}/">`));
    assert.ok(page.includes(`<link rel="alternate" hreflang="fr" href="${BASE}/fr/terms/${e.id}/">`));
    assert.ok(page.includes(`<link rel="alternate" type="application/ld+json" href="${BASE}/concepts/${e.id}.jsonld">`));
    assert.ok(page.includes('<script type="application/ld+json">'), `Missing structured data in ${file}`);
    assert.ok(page.includes('class="definition"'), `Missing visible definition in ${file}`);
    assert.ok(page.includes(`/glossary?concept=${e.id}`), `Missing glossary navigation in ${file}`);
    assert.ok(page.includes('concept-pages.css'), `Missing stylesheet ${file}`);
    assert.ok(!page.includes('noindex'), `Page unexpectedly noindexed ${file}`);
  }
}
console.log(`PASS: ${entries.length} concepts, ${urls.length} bilingual static pages, sitemap, robots and metadata`);
import './validate-concept-seo.mjs';
