#!/usr/bin/env python3
"""Read-only audit for deprecated public-facing glossary naming."""
import subprocess
from pathlib import Path

BAD = ("Digital Learning Glossary", "digital learning glossary")
ROOT = Path(__file__).resolve().parents[1]
try:
    paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).split(b'\0')
    names = [Path(x.decode('utf-8')) for x in paths if x]
except (OSError, subprocess.CalledProcessError):
    names = list(Path('docs').rglob('*.md')) + [Path('README.md')]
found = []
for name in names:
    if name.suffix.lower() not in {'.md', '.html', '.js', '.mjs', '.json', '.jsonld', '.txt'}:
        continue
    if name.name == 'package-lock.json' or name.parts[0] == 'versioning':
        continue
    try:
        content = (ROOT / name).read_text(encoding='utf-8')
    except (UnicodeError, OSError):
        continue
    for lineno, line in enumerate(content.splitlines(), 1):
        if any(phrase in line for phrase in BAD):
            found.append((str(name), lineno, line.strip()[:175]))
for name, line, content in found:
    print(f'{name}:{line}: {content}')
if found:
    raise SystemExit(f'FAIL: {len(found)} deprecated-name occurrence(s). Use Glossary of Digital Learning.')
print('PASS: no deprecated glossary name in tracked display/docs sources')
