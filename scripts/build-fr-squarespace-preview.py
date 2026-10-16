#!/usr/bin/env python3
"""Generate an EN/FR Squarespace preview from the current complete embed.
Does not write to the production Squarespace site or modify canonical RDF.
"""
import argparse
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--input',required=True)
parser.add_argument('--output',default='preview/glossary-fr-preview.html')
a=parser.parse_args()
p=Path(a.input)
s=p.read_text(encoding='utf-8')
if 'id="i2idl-glossary"' not in s or 'data-version="v0.0.90"' not in s:
    raise SystemExit('Input must be the complete current v0.0.90 Squarespace embed')

def replace_once(old,new):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f'Expected 1 anchor, found {n}: {old[:90]}')
    s=s.replace(old,new)

replace_once('<!-- I2IDL Glossary of Digital Learning | Squarespace Code Block Embed | v0.0.90 | ERIC Thesaurus 2025 content release -->', '<!-- I2IDL EN/FR LANGUAGE PREVIEW | based on v0.0.90 | NOT A PUBLIC RELEASE -->')
replace_once('  <section class="i2-hero" id="i2-top">', '''  <style>
    #i2idl-glossary .i2-lang-switch {display:inline-flex;gap:4px;margin-top:17px;padding:4px;border:1px solid rgba(255,255,255,.4);border-radius:9px}
    #i2idl-glossary .i2-lang-switch button {background:transparent;color:white;border:0;border-radius:6px;padding:8px 13px;cursor:pointer;font-weight:800}
    #i2idl-glossary .i2-lang-switch button[aria-pressed="true"] {background:white;color:#24102d}
    #i2idl-glossary .i2-lang-note {font-size:12px;margin:8px 0 0;color:rgba(255,255,255,.8)}
  </style>
  <section class="i2-hero" id="i2-top">''')
replace_once('      <div class="i2-version-meta" aria-label="Glossary version information">', '''        <div class="i2-lang-switch" role="group" aria-label="Display language / Langue d’affichage">
          <button type="button" data-i2-lang="en" aria-pressed="true" lang="en">English</button>
          <button type="button" data-i2-lang="fr" aria-pressed="false" lang="fr">Français</button>
        </div>
        <p class="i2-lang-note" id="i2-lang-note" role="status">French translations appear when reviewed; remaining entries stay in English.</p>
      <div class="i2-version-meta" aria-label="Glossary version information">''')
replace_once('    const nodeById = new Map(entries.map(entry =>', '''    // Separate, reviewed translations. Fetch failures leave the existing English interface intact.
    let languageCatalog = null;
    try {
      const langResponse = await fetch(`https://id.i2idl.org/glossary-languages.json?release=${encodeURIComponent(root.dataset.version)}`, {cache:'no-cache'});
      if (langResponse.ok) {
        const candidate = await langResponse.json();
        if (candidate.publicationVersion === root.dataset.version && candidate.conceptCount === entries.length && candidate.entries)
          languageCatalog = candidate;
      }
    } catch(error) { console.warn('I2IDL language index unavailable; English fallback active.',error); }
    for (const entry of entries) {
      entry.i2English = {term:entry.term,definition:entry.definition,aka:entry.aka};
      entry.i2French = languageCatalog?.entries?.[entry.id]?.fr || null;
    }
    let displayLanguage = 'en';
    function applyDisplayLanguage(language) {
      displayLanguage = language === 'fr' ? 'fr' : 'en';
      root.lang = displayLanguage;
      for(const entry of entries) {
        const tr = displayLanguage === 'fr' ? entry.i2French : null;
        entry.term = tr?.prefLabel || entry.i2English.term;
        entry.definition = tr?.definition || entry.i2English.definition;
        entry.aka = tr?.altLabels?.join('; ') || entry.i2English.aka;
      }
      for(const entry of entries) {
        const node = nodeById?.get(`https://id.i2idl.org/concepts/${entry.id}`);
        if(node) node['skos:prefLabel'] = entry.term;
      }
    }
    const nodeById = new Map(entries.map(entry =>''')
# HTML references to UI labels after translations loaded; render and search are functions declared below.
replace_once('    const searchableText = new Map(entries.map(entry => {', '''    const searchableText = new Map(entries.map(entry => {''')
replace_once("      return [entry.id, normalize([entry.term, entry.aka, entry.definition, entry.why, entry.type, entry.field, sourceText].join(' '))];", "      const fr = entry.i2French;\n      return [entry.id, normalize([entry.term, entry.aka, entry.definition, entry.why, entry.type, entry.field, sourceText, entry.i2English.term, entry.i2English.definition, entry.i2English.aka, fr?.prefLabel, fr?.definition, ...(fr?.altLabels || [])].join(' '))];")
replace_once('      dailyTerm.textContent = entry.term;', '''      dailyLink.dataset.dailyEntryId = entry.id;
      dailyTerm.textContent = entry.term;''')
# Change listeners registered only after all functions have initialized.
replace_once('    renderDailyEntry();\n    updateSearchNavigation();', '''    renderDailyEntry();
    const langButtons = [...root.querySelectorAll('[data-i2-lang]')];
    const languageNote = root.querySelector('#i2-lang-note');
    function changeLanguage(lang) {
      applyDisplayLanguage(lang);
      langButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.i2Lang === displayLanguage)));
      const translated = languageCatalog?.frenchApprovedCount || 0;
      languageNote.textContent = displayLanguage === 'fr'
        ? `${translated} entrées disposent d’une traduction française relue sur ${entries.length}. Les autres restent en anglais.`
        : `${translated} reviewed French translations available; English is the default for other concepts.`;
      root.querySelector('#i2-search').placeholder = displayLanguage === 'fr'
        ? 'Rechercher un terme, un sigle ou une définition…'
        : 'Search terms, acronyms, definitions, or topics…';
      if (searchInput.value.trim() && selectedEntryId) {
        const selected = entries.find(e => e.id === selectedEntryId);
        if (selected) { searchInput.value = selected.term; state.query = selected.term; }
      }
      // Search uses both language columns, regardless of selected display language.
      normalizedQuery = normalize(state.query);
      renderFilters();
      render();
      const daily = entries.find(e => e.id === dailyLink.dataset.dailyEntryId);
      if (daily) {
        dailyTerm.textContent = daily.term;
        dailyDefinition.textContent = daily.definition;
        dailyLink.setAttribute('aria-label', `Explore ${daily.term}`);
      }
    }
    langButtons.forEach(button => button.addEventListener('click',() => changeLanguage(button.dataset.i2Lang)));
    // Preview default can be set using ?lang=fr; no global storage or redirects.
    if (new URLSearchParams(location.search).get('lang') === 'fr') changeLanguage('fr');
    else changeLanguage('en');
    updateSearchNavigation();''')
# Update source of hydrated details: otherwise English detail overwrites translated definition later.
replace_once('          Object.assign(entry, full);', '''          Object.assign(entry, full);
          const tr = displayLanguage === 'fr' ? entry.i2French : null;
          entry.term = tr?.prefLabel || entry.i2English.term;
          entry.definition = tr?.definition || entry.i2English.definition;
          entry.aka = tr?.altLabels?.join('; ') || entry.i2English.aka;''')
replace_once('          searchableText.set(entry.id, normalize([entry.term, entry.aka, entry.definition, entry.why, entry.type, entry.field,', '''          searchableText.set(entry.id, normalize([entry.term, entry.aka, entry.definition, entry.why, entry.type, entry.field, entry.i2English.term, entry.i2English.definition, entry.i2English.aka, entry.i2French?.prefLabel, entry.i2French?.definition, ...(entry.i2French?.altLabels || []),''')
# Keep definition chips etc intact. The browser index is independent from semantic JSON-LD.
out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(s,encoding='utf-8')
print(f'Created {out} ({len(s)} characters). Preview only; do not publish until reviewed translations and release are deployed.')
