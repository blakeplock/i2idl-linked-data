// SPDX-License-Identifier: Apache-2.0
// Generate static EN/FR concept pages from published I2IDL data.
// node scripts/build-concept-pages.mjs          -> Learning Engineering sample
// node scripts/build-concept-pages.mjs --all    -> all concepts
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://id.i2idl.org';
const GLOSSARY = 'https://www.i2idl.org/glossary';
const OUTPUT = 'public';
const EXPECTED_CONCEPTS = 420;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const index = JSON.parse(fs.readFileSync('public/glossary-web.json', 'utf8'));
const overlay = JSON.parse(fs.readFileSync('public/glossary-fr-preview.jsonld', 'utf8'));
const graph = JSON.parse(fs.readFileSync('public/glossary.jsonld', 'utf8'));
const entries = index.entries;
const byId = new Map(entries.map(e => [e.id, e]));
if (byId.size !== entries.length || entries.some(e => !ID_PATTERN.test(e.id))) throw Error('Duplicate or invalid concept identifiers');
const french = new Map(overlay['@graph'].map(n => [n['@id'], n]));
const canonical = new Map(graph['@graph'].map(n => [n['@id'], n]));
const asArray = v => v == null ? [] : Array.isArray(v) ? v : [v];
const ref = v => typeof v === 'string' ? v : v?.['@id'];
const literal = v => typeof v === 'string' ? v : v?.['@value'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeHref = s => { try { const u = new URL(s); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
const termPath = (id, lang) => `${lang === 'fr' ? '/fr' : ''}/terms/${encodeURIComponent(id)}/`;

function translated(entry) {
  const conceptURI = `${BASE}/concepts/${entry.id}`;
  const concept = canonical.get(conceptURI);
  const definitionURI = ref(concept?.['gs:activeDefinition']);
  if (!definitionURI) throw Error(`Missing active definition for ${entry.id}`);
  const label = french.get(conceptURI)?.['skos:prefLabel'];
  const definition = french.get(definitionURI)?.['rdf:value'];
  if (label?.['@language'] !== 'fr' || definition?.['@language'] !== 'fr' || !literal(label) || !literal(definition)) {
    throw Error(`Missing approved French label/active definition for ${entry.id}`);
  }
  return {term: literal(label), definition: literal(definition)};
}

const UI = {
  en: {glossary:'I2IDL Glossary of Digital Learning', explore:'Explore the full glossary ↗', definition:'Definition', why:'Editorial explanation', related:'Related concepts', sources:'Sources and evidence', linked:'Linked Data', continue:'Continue exploring', introduction:'Explore related concepts, research, and semantic relationships in the full I2IDL Glossary of Digital Learning.', open:'Open this concept in the glossary →', data:'Canonical concept identifier', english:'English', french:'Français', untranslated:'The following editorial explanation is currently available in English.'},
  fr: {glossary:'Glossaire I2IDL de l’apprentissage numérique', explore:'Explorer le glossaire complet ↗', definition:'Définition', why:'Explication éditoriale', related:'Concepts associés', sources:'Sources et preuves', linked:'Données liées', continue:'Poursuivre l’exploration', introduction:'Explorez les concepts associés, les travaux de recherche et les relations sémantiques dans le glossaire I2IDL complet.', open:'Ouvrir ce concept dans le glossaire →', data:'Identifiant canonique du concept', english:'English', french:'Français', untranslated:'L’explication éditoriale suivante est actuellement disponible en anglais.'}
};

function relatedItems(entry, lang) {
  const links = [...new Set([...(entry.broader || []), ...(entry.narrower || []), ...(entry.related || [])])];
  return links.map(uri => {
    const id = String(uri).split('/').pop();
    const target = byId.get(id);
    if (!target) return '';
    const label = lang === 'fr' ? translated(target).term : target.term;
    return `<li><a href="${termPath(id, lang)}">${esc(label)}</a></li>`;
  }).filter(Boolean).join('\n');
}

function sourceItems(entry) {
  return (entry.sources || []).map(source => {
    const url = safeHref(source.url);
    const name = esc(source.name);
    const title = url ? `<a href="${esc(url)}" rel="noopener noreferrer">${name}</a>` : name;
    return `<li>${title}${source.detail ? ` — ${esc(source.detail)}` : ''}${source.relation ? ` <small class="muted">(${esc(source.relation)})</small>` : ''}</li>`;
  }).join('\n');
}

function buildPage(entry, lang) {
  const t = UI[lang];
  const tr = lang === 'fr' ? translated(entry) : {term:entry.term, definition:entry.definition};
  const conceptURI = `${BASE}/concepts/${entry.id}`;
  const htmlURL = `${BASE}${termPath(entry.id, lang)}`;
  const enURL = `${BASE}${termPath(entry.id, 'en')}`;
  const frURL = `${BASE}${termPath(entry.id, 'fr')}`;
  const glossaryURL = `${GLOSSARY}?concept=${encodeURIComponent(entry.id)}`;
  const related = relatedItems(entry, lang);
  const sources = sourceItems(entry);
  const metadata = {
    '@context':'https://schema.org', '@type':'DefinedTerm', '@id':conceptURI,
    name:tr.term, description:tr.definition, inLanguage:lang, url:htmlURL,
    inDefinedTermSet:`${BASE}/scheme`, mainEntityOfPage:htmlURL
  };
  const jsonLD = JSON.stringify(metadata).replace(/</g, '\\u003c');
  const explanation = entry.why ? `<section><h2>${esc(t.why)}</h2>${lang === 'fr' ? `<p class="muted">${esc(t.untranslated)}</p>` : ''}<p${lang === 'fr' ? ' lang="en"' : ''}>${esc(entry.why)}</p></section>` : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tr.term)} | ${esc(t.glossary)}</title>
<meta name="description" content="${esc(tr.definition.slice(0, 160))}">
<link rel="canonical" href="${htmlURL}">
<link rel="alternate" hreflang="en" href="${enURL}">
<link rel="alternate" hreflang="fr" href="${frURL}">
<link rel="alternate" hreflang="x-default" href="${enURL}">
<link rel="alternate" type="application/ld+json" href="${conceptURI}.jsonld">
<link rel="alternate" type="text/turtle" href="${conceptURI}.ttl">
<link rel="stylesheet" href="/concept-pages.css">
<script type="application/ld+json">${jsonLD}</script>
</head>
<body>
<header class="concept-header">
  <div class="concept-header-inner">
    <a class="concept-brand" href="${GLOSSARY}">${esc(t.glossary)}</a>
    <nav class="concept-header-actions" aria-label="${lang === 'fr' ? 'Navigation' : 'Navigation'}">
      <div class="concept-language" aria-label="Language / Langue"><span>Language / Langue</span><a href="${termPath(entry.id,'en')}" lang="en" hreflang="en" ${lang === 'en' ? 'aria-current="page"' : ''}>English</a><a href="${termPath(entry.id,'fr')}" lang="fr" hreflang="fr" ${lang === 'fr' ? 'aria-current="page"' : ''}>Français</a></div>
      <a class="concept-glossary-button" href="${GLOSSARY}">${esc(t.explore)}</a>
    </nav>
  </div>
</header>
<main>
<p class="concept-kicker">${esc(entry.field)} / ${esc(entry.type)}</p>
<h1>${esc(tr.term)}</h1>
<section class="concept-definition" aria-labelledby="definition-heading">
  <h2 id="definition-heading" class="concept-definition-label">${esc(t.definition)}</h2>
  <p class="definition">${esc(tr.definition)}</p>
</section>
<section class="concept-continue">
  <h2>${esc(t.continue)}</h2>
  <p>${esc(t.introduction)}</p>
  <a href="${glossaryURL}">${esc(t.open)}</a>
</section>
${explanation}
${related ? `<section><h2>${esc(t.related)}</h2><ul class="concept-related">${related}</ul></section>` : ''}
${sources ? `<section><h2>${esc(t.sources)}</h2><ul>${sources}</ul></section>` : ''}
<section class="concept-data"><h2>${esc(t.linked)}</h2>
<p><a href="${conceptURI}.jsonld">JSON-LD</a> · <a href="${conceptURI}.ttl">Turtle</a> · <a href="${conceptURI}">${esc(t.data)}</a></p>
</section>
</main>
<footer>© 2026 Institute for Infrastructure and Interoperable Data in Learning (I2IDL)</footer>
</body>
</html>\n`;
}

const all = process.argv.includes('--all');
if (all && entries.length !== EXPECTED_CONCEPTS) throw Error(`Expected ${EXPECTED_CONCEPTS} concepts, found ${entries.length}; review publication count before generating`);
const selected = all ? entries : [byId.get('learning-engineering')];
if (selected.some(x => !x)) throw Error('Missing concept entry');
// Validate translations before writing pages, avoiding a half-generated set.
for (const entry of selected) translated(entry);
for (const entry of selected) {
  for (const lang of ['en', 'fr']) {
    const dir = path.join(OUTPUT, ...(lang === 'fr' ? ['fr'] : []), 'terms', entry.id);
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), buildPage(entry,lang));
  }
}
if (all) {
  const paths = entries.flatMap(entry => [termPath(entry.id, 'en'), termPath(entry.id, 'fr')]);
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.flatMap(entry => {
      const enURL = `${BASE}${termPath(entry.id, 'en')}`;
      const frURL = `${BASE}${termPath(entry.id, 'fr')}`;
      return ['en', 'fr'].map(lang => {
        const url = `${BASE}${termPath(entry.id, lang)}`;
        return `  <url><loc>${esc(url)}</loc>` +
          `<xhtml:link rel="alternate" hreflang="en" href="${esc(enURL)}"/>` +
          `<xhtml:link rel="alternate" hreflang="fr" href="${esc(frURL)}"/>` +
          `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(enURL)}"/>` +
          '</url>';
      });
    }).join('\n') + '\n</urlset>\n';
  if (paths.length !== EXPECTED_CONCEPTS * 2) throw Error('Unexpected sitemap URL count');
  fs.writeFileSync(path.join(OUTPUT, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(OUTPUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
  console.log(`Generated sitemap.xml with ${paths.length} language-specific URLs and robots.txt`);
}
console.log(`Generated ${selected.length} concepts / ${selected.length * 2} English and French HTML pages (version ${index.publicationVersion})`);
