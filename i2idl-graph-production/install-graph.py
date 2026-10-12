#!/usr/bin/env python3
"""Install the I2IDL graph explorer in a local i2idl-linked-data checkout."""
import json
from pathlib import Path
from shutil import copy2

root = Path.cwd()
source = Path(__file__).resolve().parent / 'graph.html'
config_path = root / 'vercel.json'
public = root / 'public'
if not (root / 'package.json').is_file() or not config_path.is_file() or not public.is_dir():
    raise SystemExit('Run this script in the root of your i2idl-linked-data repository.')
if not source.is_file():
    raise SystemExit('Place install-graph.py next to graph.html in the same folder.')
config = json.loads(config_path.read_text(encoding='utf-8'))
rewrites = config.get('rewrites', [])
if not isinstance(rewrites, list):
    raise SystemExit('vercel.json rewrites must be a list; no changes made.')
route = {'source': '/explore', 'destination': '/graph.html'}
existing = next((r for r in rewrites if r.get('source') == route['source']), None)
if existing and existing.get('destination') != route['destination']:
    raise SystemExit('An existing /explore route points elsewhere; no changes made.')
target = public / 'graph.html'
if target.exists() and target.read_bytes() != source.read_bytes():
    raise SystemExit('public/graph.html already exists with different contents; no changes made.')
if not existing:
    rewrites.insert(0, route)
    config['rewrites'] = rewrites
    # Avoid rewriting the entire configuration if the route already exists.
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
copy2(source, target)
print('Installed: public/graph.html')
print('Configured: /explore -> /graph.html')
print('Public URL after deployment: https://id.i2idl.org/explore')
print('Example concept URL: https://id.i2idl.org/explore?concept=competency')
print('Next: npm run validate; commit public/graph.html and vercel.json on a feature branch.')
