#!/usr/bin/env python3
"""Patch the I2IDL static concept page generator's Schema.org metadata."""
from pathlib import Path

file = Path('scripts/build-concept-pages.mjs')
if not file.is_file():
    raise SystemExit('Run from the i2idl-linked-data repository root.')
s = file.read_text(encoding='utf-8')
old = """  const metadata = {
    '@context':'https://schema.org', '@type':'DefinedTerm', '@id':conceptURI,
    name:tr.term, description:tr.definition, inLanguage:lang, url:htmlURL,
    inDefinedTermSet:`${BASE}/scheme`, mainEntityOfPage:htmlURL
  };"""
new = """  const metadata = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': htmlURL,
        url: htmlURL,
        name: `${tr.term} | ${t.glossary}`,
        inLanguage: lang,
        mainEntity: { '@id': conceptURI }
      },
      {
        '@type': 'DefinedTerm',
        '@id': conceptURI,
        name: tr.term,
        description: tr.definition,
        url: htmlURL,
        inDefinedTermSet: `${BASE}/scheme`,
        mainEntityOfPage: { '@id': htmlURL }
      }
    ]
  };"""
if s.count(old) != 1:
    if s.count(new) == 1:
        print('Schema.org generator already patched; nothing to change.')
        raise SystemExit(0)
    raise SystemExit('Expected metadata block not found exactly once. No files changed.')
file.write_text(s.replace(old, new), encoding='utf-8')
print('Updated scripts/build-concept-pages.mjs: WebPage inLanguage + DefinedTerm graph')
