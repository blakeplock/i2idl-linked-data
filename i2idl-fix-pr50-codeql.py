#!/usr/bin/env python3
"""Remove flagged innerHTML usage from both PR #50 explorer copies."""
from pathlib import Path

OLD = '''$('detail').innerHTML='<span class="caption">PREVIEW</span><h2>Load the glossary graph</h2><p>This prototype reads real SKOS relationships from the published graph. If local-file browser restrictions prevent fetching it directly, use the file chooser above.</p>' '''.rstrip()
NEW = '''const detail=$('detail');detail.replaceChildren();const caption=document.createElement('span');caption.className='caption';caption.textContent='PREVIEW';const heading=document.createElement('h2');heading.textContent='Load the glossary graph';const explanation=document.createElement('p');explanation.textContent='This prototype reads real SKOS relationships from the published graph. If local-file browser restrictions prevent fetching it directly, use the file chooser above.';detail.append(caption,heading,explanation)'''

paths = [Path('public/graph.html'), Path('i2idl-graph-production/graph.html')]
contents = []
for path in paths:
    if not path.is_file():
        raise SystemExit(f'ERROR: Missing {path}. Run this from the repository root on graph-explorer-production.')
    text = path.read_text(encoding='utf-8')
    if text.count(OLD) != 1:
        raise SystemExit(f'ERROR: Expected exactly one vulnerable HTML assignment in {path}; found {text.count(OLD)}. No files changed.')
    contents.append(text)
for path, text in zip(paths, contents):
    fixed = text.replace(OLD, NEW)
    assert 'innerHTML' not in fixed
    path.write_text(fixed, encoding='utf-8')
    print(f'Fixed {path}: removed innerHTML; kept the same fallback message.')
print('Both files patched. Run npm run validate and inspect GitHub Desktop before committing.')
