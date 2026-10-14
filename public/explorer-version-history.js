// SPDX-License-Identifier: Apache-2.0
// Phase 5: lazy-loading concept revision history for the existing explorer sidebar.
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
  function link(label, url) {
    const anchor = el('a', label);
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  }
  function historyRecords(payload) {
    const rows = payload?.['gs:revisionHistory'];
    return Array.isArray(rows) ? rows : rows ? [rows] : [];
  }
  function revisionNumber(value) {
    const n = Number(typeof value === 'object' ? value?.['@value'] : value);
    return Number.isSafeInteger(n) && n >= 1 ? n : null;
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
      const response = await fetch(`/concepts/${encodeURIComponent(slug)}/versions`, {headers:{Accept:'application/ld+json'}});
      if (selection !== requestSequence || !section.isConnected) return;
      if (!response.ok) throw Error(`History service returned ${response.status}`);
      const data = await response.json();
      const records = historyRecords(data)
        .map(item => ({number:revisionNumber(item?.['gs:revisionNumber']), release:item?.['gs:firstObservedRelease'], uri:item?.['@id'], digest:item?.['gs:contentDigest']}))
        .filter(item => item.number !== null && item.uri === `${conceptUri}/versions/${item.number}`)
        .sort((a,b) => b.number - a.number);
      status.remove();
      if (!records.length) {
        section.append(el('p','No published revision history is available.', 'small'));
        return;
      }
      const summary = el('p', records.length === 1 ? 'Revision 1 · Original published baseline' : `${records.length} published revisions`, 'small');
      section.append(summary);
      const list = el('ol',undefined,'concept-version-list');
      for (const item of records) {
        const li = el('li');
        li.append(el('strong', `Revision ${item.number}`));
        const release = el('span', ` · First recorded in ${String(item.release || 'unknown release')}`, 'small');
        li.append(release);
        const links = el('div',undefined,'concept-version-links');
        const prefix = `${BASE}/concepts/${slug}/versions/${item.number}`;
        links.append(link('JSON-LD', prefix + '.jsonld'),link('Turtle',prefix+'.ttl'),link('N-Quads',prefix+'.nq'));
        li.append(links);
        list.append(li);
      }
      section.append(list);
      section.append(link('Full revision history ↗', `${BASE}/concepts/${slug}/versions`));
      if (records.length < 2) section.append(el('p','Comparison becomes available when a later revision is published.', 'small'));
    } catch (error) {
      if (selection !== requestSequence || !section.isConnected) return;
      status.textContent = 'Revision history is temporarily unavailable.';
    }
  }
  window.I2IDLVersionHistory = Object.freeze({render});
})();
