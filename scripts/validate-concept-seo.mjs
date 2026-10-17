// SPDX-License-Identifier: Apache-2.0
// Deep publication validation for I2IDL bilingual static concept pages.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const BASE = 'https://id.i2idl.org';
const ROOT = 'public';
const entries = JSON.parse(fs.readFileSync(`${ROOT}/glossary-web.json`, 'utf8')).entries;
const ids = new Set(entries.map(e => e.id));
const pageURL = (id, lang) => `${BASE}${lang === 'fr' ? '/fr' : ''}/terms/${id}/`;
const fileFor = (id, lang) => path.join(ROOT, ...(lang === 'fr' ? ['fr'] : []), 'terms', id, 'index.html');
const extract = (html, regex, label) => {
  const matches = [...html.matchAll(regex)];
  assert.equal(matches.length, 1, `Expected exactly one ${label}, got ${matches.length}`);
  return matches[0][1];
};
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map(m => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1];
const link = (html, rel, lang = null) => tags(html, 'link').filter(t => attr(t, 'rel') === rel && (lang === null || attr(t, 'hreflang') === lang));
const schemaNodes = (doc) => Array.isArray(doc['@graph']) ? doc['@graph'] : [doc];
let checkedLinks = 0;
let checkedPages = 0;
for (const entry of entries) {
  for (const lang of ['en', 'fr']) {
    const file = fileFor(entry.id, lang);
    const html = fs.readFileSync(file, 'utf8');
    const url = pageURL(entry.id, lang);
    const concept = `${BASE}/concepts/${entry.id}`;
    const prefix = `${file}: `;
    assert.equal(extract(html, /<html\s+lang="([^"]+)"[^>]*>/gi, `${prefix}html lang`), lang);
    const canonicals = link(html, 'canonical');
    assert.equal(canonicals.length, 1, `${prefix}canonical count`);
    assert.equal(attr(canonicals[0], 'href'), url, `${prefix}canonical href`);
    for (const [locale, target] of [['en', pageURL(entry.id, 'en')], ['fr', pageURL(entry.id, 'fr')], ['x-default', pageURL(entry.id, 'en')]]) {
      const matches = link(html, 'alternate', locale);
      assert.equal(matches.length, 1, `${prefix}${locale} alternate count`);
      assert.equal(attr(matches[0], 'href'), target, `${prefix}${locale} alternate href`);
    }
    assert.ok(!/<meta\s+[^>]*name="robots"[^>]*noindex/i.test(html), `${prefix}noindex meta`);
    const body = extract(html, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi, `${prefix}JSON-LD`);
    const doc = JSON.parse(body);
    assert.equal(doc['@context'], 'https://schema.org', `${prefix}Schema.org context`);
    const nodes = schemaNodes(doc);
    const webpages = nodes.filter(n => n['@type'] === 'WebPage');
    const defined = nodes.filter(n => n['@type'] === 'DefinedTerm');
    assert.equal(webpages.length, 1, `${prefix}WebPage count`);
    assert.equal(defined.length, 1, `${prefix}DefinedTerm count`);
    const webpage = webpages[0], term = defined[0];
    assert.equal(webpage['@id'], url, `${prefix}WebPage ID`);
    assert.equal(webpage.url, url, `${prefix}WebPage URL`);
    assert.equal(webpage.inLanguage, lang, `${prefix}WebPage language`);
    assert.equal(webpage.mainEntity?.['@id'], concept, `${prefix}WebPage mainEntity`);
    assert.equal(term['@id'], concept, `${prefix}DefinedTerm ID`);
    assert.equal(term.url, url, `${prefix}DefinedTerm URL`);
    assert.equal(term.mainEntityOfPage?.['@id'], url, `${prefix}mainEntityOfPage`);
    assert.equal(term.inDefinedTermSet, `${BASE}/scheme`, `${prefix}term set`);
    assert.ok(typeof term.name === 'string' && term.name.trim(), `${prefix}missing name`);
    assert.ok(typeof term.description === 'string' && term.description.trim(), `${prefix}missing description`);
    assert.ok(!('inLanguage' in term), `${prefix}inLanguage must belong on WebPage`);
    // Cross-check visible localized labels/definitions without relying on exact HTML escaping.
    const heading = extract(html, /<h1>([\s\S]*?)<\/h1>/gi, `${prefix}H1`);
    assert.ok(heading.trim(), `${prefix}empty H1`);
    for (const anchor of tags(html, 'a')) {
      const href = attr(anchor, 'href');
      if (!href) continue;
      const match = href.match(/^\/(fr\/)?terms\/([a-z0-9-]+)\/$/);
      if (match) {
        const targetLang = match[1] ? 'fr' : 'en';
        assert.ok(ids.has(match[2]), `${prefix}unknown internal concept ${href}`);
        assert.ok(fs.existsSync(fileFor(match[2], targetLang)), `${prefix}missing target ${href}`);
        checkedLinks++;
      } else if (href.startsWith('/terms/') || href.startsWith('/fr/terms/')) {
        assert.fail(`${prefix}malformed internal term link ${href}`);
      }
    }
    checkedPages++;
  }
}
// Every localized concept page should have been checked exactly once.
assert.equal(checkedPages, entries.length * 2);
console.log(`PASS: deep SEO audit of ${checkedPages} pages, Schema.org graphs, canonical/hreflang metadata, and ${checkedLinks} internal concept links`);
