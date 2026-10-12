#!/usr/bin/env python3
"""Remove CodeQL-flagged local-file import path from PR #50 production graph.
Run from the root of i2idl-linked-data on branch graph-explorer-production.
"""
from pathlib import Path

paths = [Path('public/graph.html'), Path('i2idl-graph-production/graph.html')]
updated = []
for path in paths:
    if not path.is_file():
        continue
    original = path.read_text(encoding='utf-8')
    content = original
    start = content.find('<div id="fallback"')
    marker = '\n<div class="toolbar">'
    stop = content.find(marker, start)
    if start < 0 or stop < 0:
        raise SystemExit(f'Expected fallback panel not found in {path}. No changes made.')
    content = content[:start] + content[stop+1:]
    start = content.find(";$('file').addEventListener('change'")
    stop = content.find(";fetch('https://id.i2idl.org/glossary.jsonld'", start)
    if start < 0 or stop < 0:
        raise SystemExit(f'Expected local file handler not found in {path}. No changes made.')
    content = content[:start] + content[stop:]
    old = "data===window.localGraph?'selected local graph':'published JSON-LD'"
    if old not in content:
        raise SystemExit(f'Expected local-graph status expression not found in {path}. No changes made.')
    content = content.replace(old, "'published JSON-LD'", 1)
    content = content.replace('Live graph unavailable in this preview (\'+err.message+\'). Load the JSON-LD file below to test.', 'Unable to load the published graph (\'+err.message+\'). Please try again later.')
    content = content.replace(";$('fallback').style.display='block'", '')
    for forbidden in ["$('file')", 'window.localGraph', 'file.text()', "$('fallback')", 'innerHTML']:
        if forbidden in content:
            raise SystemExit(f'Unsafe or unexpected reference remains in {path}: {forbidden}. No changes made.')
    updated.append((path, content))
if not updated:
    raise SystemExit('No graph explorer files found. Run from the repository root.')
for path, content in updated:
    path.write_text(content, encoding='utf-8')
    print('Fixed:', path)
print('Removed local file imports. The explorer now loads only the published JSON-LD.')
print('Next: npm run validate, then commit and push the changed HTML files.')
