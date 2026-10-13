#!/usr/bin/env python3
"""Apply small, reviewed I2IDL Graph Explorer hardening changes locally.
Run at the root of the i2idl-linked-data repository on a maintenance branch.
No third-party Python modules required.
"""
import json
import re
from pathlib import Path

root = Path.cwd()
html_path = root / 'public/graph.html'
js_path = root / 'public/graph-explorer.js'
vercel_path = root / 'vercel.json'
if not (html_path.exists() and vercel_path.exists()):
    raise SystemExit('Run from the i2idl-linked-data repository root.')
if js_path.exists():
    raise SystemExit('public/graph-explorer.js already exists; refusing to overwrite.')
html = html_path.read_text(encoding='utf-8')
vercel = json.loads(vercel_path.read_text(encoding='utf-8'))
match = re.search(r'<script>([\s\S]*?)</script>', html)
if not match or html.count('<script>') != 1:
    raise SystemExit('Expected exactly one inline explorer script; repository may have changed.')
js = match.group(1)
if js.count('renderAnalytics()}') != 1:
    raise SystemExit('Expected analytics initialization pattern not found.')
js = js.replace('renderAnalytics()}', "$('analytics-result').textContent='Open Graph analytics to calculate network statistics.'}", 1)
old_tab = "$(b.dataset.tab+'-panel').hidden=!yes}});"
new_tab = "$(b.dataset.tab+'-panel').hidden=!yes}if(btn.dataset.tab==='analytics'&&nodes.length)renderAnalytics()});"
if js.count(old_tab) != 1:
    raise SystemExit('Tab behavior differs; refusing to modify.')
js = js.replace(old_tab, new_tab)
old_fetch = "fetch('https://id.i2idl.org/glossary.jsonld',{headers:{Accept:'application/ld+json'},cache:'no-store'})"
new_fetch = "fetch('/glossary.jsonld',{headers:{Accept:'application/ld+json'},cache:'default'})"
if js.count(old_fetch) != 1:
    raise SystemExit('Graph fetching pattern differs; refusing to modify.')
js = js.replace(old_fetch, new_fetch)
# Restrict dataset concept links to the expected I2IDL namespace and known slug format.
needle = "uri.href=n['@id'];uri.target='_blank';"
replacement = "uri.href=/^https:\\/\\/id\\.i2idl\\.org\\/concepts\\/[a-z0-9-]+$/.test(n['@id'])?n['@id']:'#';uri.target='_blank';"
if js.count(needle) != 1:
    raise SystemExit('Expected concept-link assignment not found; refusing to modify.')
js = js.replace(needle, replacement)
new_html = html[:match.start()] + '<script src="/graph-explorer.js" defer></script>' + html[match.end():]
# A dedicated CSP for the explorer, leaving the non-explorer endpoints unchanged.
source = '/explore'
headers = vercel.setdefault('headers', [])
if any(h.get('source') == source for h in headers):
    raise SystemExit('Explorer-specific response headers already defined; refusing duplicate.')
csp = "; ".join([
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
])
# Vercel headers match the requested URL; add policy to both rewrite URL and its static target.
for target in ['/explore', '/graph.html']:
    headers.append({'source': target, 'headers': [
        {'key': 'Content-Security-Policy', 'value': csp},
        {'key': 'X-Frame-Options', 'value': 'DENY'},
    ]})
# Writes occur only after all expected source patterns are verified.
js_path.write_text(js.strip() + '\n', encoding='utf-8')
html_path.write_text(new_html, encoding='utf-8')
vercel_path.write_text(json.dumps(vercel, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Updated public/graph.html, created public/graph-explorer.js, updated vercel.json')
print('Run: node --check public/graph-explorer.js && npm run validate && npm audit')
