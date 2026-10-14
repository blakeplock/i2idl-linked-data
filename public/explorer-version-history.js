// SPDX-License-Identifier: Apache-2.0
// Compact, accessible concept revision history, shown immediately beneath the definition.
(() => {
  'use strict';
  let requestSequence = 0;
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
    section.setAttribute('aria-label', 'Concept version history');
    section.append(el('h3', 'Version history'));
    const status = el('p', 'Loading revision history…', 'small');
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
      if (!records.length) { section.append(el('p','No published revision history is available.','small')); return; }
      const latest = records[0];
      const headline = el('p', undefined, 'concept-version-summary');
      headline.append(el('strong', `Revision ${latest.number}`));
      headline.append(el('span', ` · ${latest.release || 'Published release'}`, 'small'));
      section.append(headline);
      const details = el('details',undefined,'concept-version-disclosure');
      const summary = el('summary', records.length === 1 ? 'View historical record and RDF' : `Browse ${records.length} published revisions`);
      details.append(summary);
      const list = el('ul',undefined,'concept-version-list');
      for (const item of records) {
        const li = el('li');
        const heading = el('div',undefined,'concept-version-entry');
        heading.append(el('strong', `Revision ${item.number}`),el('span', `First recorded in ${item.release || 'unknown release'}`, 'small'));
        li.append(heading);
        const links = el('div',undefined,'concept-version-links');
        const prefix = `${BASE}/concepts/${slug}/versions/${item.number}`;
        links.append(link('JSON-LD',`${prefix}.jsonld`),link('Turtle',`${prefix}.ttl`),link('N-Quads',`${prefix}.nq`));
        li.append(links);
        list.append(li);
      }
      details.append(list);
      const full = el('p',undefined,'concept-version-footer');
      full.append(link('Full revision history ↗', `${BASE}/concepts/${slug}/versions`));
      details.append(full);
      if (records.length === 1) details.append(el('p','No subsequent revisions have been published yet.','small'));
      section.append(details);
    } catch (_) {
      if (selection !== requestSequence || !section.isConnected) return;
      status.textContent = 'Revision history is temporarily unavailable.';
    }
  }
  window.I2IDLVersionHistory = Object.freeze({render});
})();
