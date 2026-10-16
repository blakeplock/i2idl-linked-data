// SPDX-License-Identifier: Apache-2.0
// Compact, accessible concept revision history, shown immediately beneath the definition.
(() => {
  'use strict';
  let requestSequence = 0;
  const lang = () => document.getElementById('i2idl-language')?.value === 'fr' ? 'fr' : 'en';
  const tr = (en, fr) => lang() === 'fr' ? fr : en;
  const BASE = 'https://id.i2idl.org';
  const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function link(text, href) {
    const a = el('a', text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }
  function rows(payload) {
    const x = payload?.['gs:revisionHistory'];
    return Array.isArray(x) ? x : x ? [x] : [];
  }
  function rev(value) {
    const n = Number(typeof value === 'object' ? value?.['@value'] : value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  async function render(conceptUri, root) {
    const selection = ++requestSequence;
    if (typeof conceptUri !== 'string' || !conceptUri.startsWith(`${BASE}/concepts/`)) return;
    const slug = conceptUri.slice(`${BASE}/concepts/`.length);
    if (!safeSlug.test(slug)) return;
    const section = el('section', undefined, 'section concept-version-history');
    section.setAttribute('aria-label', tr('Concept version history', 'Historique des versions du concept'));
    section.append(el('h3', tr('Version history', 'Historique des versions')));
    const status = el('p', tr('Loading revision history…', 'Chargement de l’historique des versions…'), 'small');
    status.setAttribute('role', 'status');
    section.append(status);
    root.append(section);
    try {
      const response = await fetch(`/concepts/${encodeURIComponent(slug)}/versions`, {headers: {Accept: 'application/ld+json'}});
      if (selection !== requestSequence || !section.isConnected) return;
      if (!response.ok) throw Error(`History service returned ${response.status}`);
      const data = await response.json();
      const records = rows(data).map(item => ({number:rev(item?.['gs:revisionNumber']), release:item?.['gs:firstObservedRelease'], uri:item?.['@id']}))
        .filter(item => item.number !== null && item.uri === `${conceptUri}/versions/${item.number}`)
        .sort((a,b) => b.number-a.number);
      status.remove();
      if (!records.length) { section.append(el('p',tr('No published revision history is available.','Aucun historique des versions publié n’est disponible.'),'small')); return; }
      const latest = records[0];
      const headline = el('p', undefined, 'concept-version-summary');
      headline.append(el('strong', `${tr('Revision','Révision')} ${latest.number}`));
      headline.append(el('span', ` · ${latest.release || 'Published release'}`, 'small'));
      section.append(headline);
      const details = el('details',undefined,'concept-version-disclosure');
      const summary = el('summary', records.length === 1 ? tr('View historical record and RDF','Afficher l’historique et les données RDF') : `${tr('Browse','Consulter')} ${records.length} ${tr('published revisions','révisions publiées')}`);
      details.append(summary);
      const list = el('ul',undefined,'concept-version-list');
      for (const item of records) {
        const li = el('li');
        const heading = el('div',undefined,'concept-version-entry');
        heading.append(el('strong', `${tr('Revision','Révision')} ${item.number}`),el('span', `${tr('First recorded in','Première apparition dans')} ${item.release || tr('unknown release','version inconnue')}`, 'small'));
        li.append(heading);
        const links = el('div',undefined,'concept-version-links');
        const prefix = `${BASE}/concepts/${slug}/versions/${item.number}`;
        links.append(link('JSON-LD',`${prefix}.jsonld`),link('Turtle',`${prefix}.ttl`),link('N-Quads',`${prefix}.nq`));
        li.append(links);
        list.append(li);
      }
      details.append(list);
      const full = el('p',undefined,'concept-version-footer');
      full.append(link(tr('Full revision history ↗','Historique complet des versions ↗'), `${BASE}/concepts/${slug}/versions`));
      details.append(full);
      if (records.length === 1) details.append(el('p',tr('No subsequent revisions have been published yet.','Aucune révision ultérieure n’a encore été publiée.'),'small'));
      section.append(details);
    } catch (_) {
      if (selection !== requestSequence || !section.isConnected) return;
      status.textContent = tr('Revision history is temporarily unavailable.','L’historique des versions est temporairement indisponible.');
    }
  }
  window.I2IDLVersionHistory = Object.freeze({render});
})();
