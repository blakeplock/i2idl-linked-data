#!/usr/bin/env python3
from pathlib import Path
import json

resolver = Path('api/resolve.mjs')
config = Path('vercel.json')
if not resolver.is_file() or not config.is_file():
    raise SystemExit('Run from the root of i2idl-linked-data')
r = resolver.read_text()
v = config.read_text()
old_import = "import { Readable } from 'node:stream';"
new_import = old_import + "\nimport { readFile } from 'node:fs/promises';"
old_graph = '''async function loadGraph(request) {
  // Fixed same-origin URL only. Request parameters never influence this fetch.
  const url =
    new URL(
      '/glossary.jsonld',
      request.url
    );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to load glossary graph (${response.status})`
    );
  }

  const graph =
    await response.json();

  assertInlineContext(graph);

  return graph;
}'''
new_graph = '''async function loadGraph() {
  // Use the bundled publication snapshot, avoiding protected preview self-fetches.
  const graph = JSON.parse(
    await readFile(new URL('../public/glossary.jsonld', import.meta.url), 'utf8')
  );
  assertInlineContext(graph);
  return graph;
}'''
old_redirect = '`${BASE}/terms/${encodeURIComponent(decodedId)}/`'
new_redirect = 'new URL(`/terms/${encodeURIComponent(decodedId)}/`, url.origin).href'
old_config = '''"functions": {
    "api/version-history.mjs": {'''
new_config = '''"functions": {
    "api/resolve.mjs": {
      "includeFiles": "public/glossary.jsonld"
    },
    "api/version-history.mjs": {'''
for label, body, needle in [
    ('resolver import', r, old_import),
    ('resolver graph loader', r, old_graph),
    ('resolver redirect', r, old_redirect),
    ('Vercel configuration', v, old_config),
]:
    if body.count(needle) != 1:
        raise SystemExit(f'{label}: expected exactly one match; no files changed')
r = r.replace(old_import, new_import).replace(old_graph, new_graph).replace(old_redirect, new_redirect)
v = v.replace(old_config, new_config)
json.loads(v)
resolver.write_text(r)
config.write_text(v)
print('Updated api/resolve.mjs and vercel.json')
print('The resolver now reads its bundled glossary data and redirects to the request host.')
