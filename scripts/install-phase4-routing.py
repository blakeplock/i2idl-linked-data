# SPDX-License-Identifier: Apache-2.0
"""Idempotently add Phase 4 routes and function bundling to vercel.json."""
import json
from pathlib import Path

root = Path('.')
config_file = Path('vercel.json')
if not config_file.is_file():
    raise SystemExit('Run from the repository root (vercel.json not found).')
config = json.loads(config_file.read_text())
new_rules = json.loads((root / 'vercel-rewrites.json').read_text())
existing = config.get('rewrites', [])
for rule in new_rules:
    previous = next((r for r in existing if r.get('source') == rule['source']), None)
    if previous is not None and previous != rule:
        raise SystemExit('Conflicting route: ' + rule['source'])
config['rewrites'] = new_rules + [r for r in existing if r['source'] not in {n['source'] for n in new_rules}]
funcs = config.setdefault('functions', {})
expected = {'includeFiles': 'versioning/**'}
if 'api/version-history.mjs' in funcs and funcs['api/version-history.mjs'] != expected:
    raise SystemExit('Conflicting function configuration')
funcs['api/version-history.mjs'] = expected
config_file.write_text(json.dumps(config, indent=2) + '\n')
print('Phase 4 routes and includeFiles added to vercel.json')
