#!/usr/bin/env python3
"""Split the existing I2IDL README into topic docs without discarding its content.
Run from the repository root. No third-party dependencies.
"""
from pathlib import Path
import re
import sys

ROOT = Path.cwd()
readme = ROOT / 'README.md'
if not readme.is_file() or not (ROOT / 'package.json').is_file() or not (ROOT / 'vercel.json').is_file():
    sys.exit('ERROR: Run this script from the i2idl-linked-data repository root.')
text = readme.read_text(encoding='utf-8')
if '# I2IDL Linked Data' not in text:
    sys.exit('ERROR: README does not look like the I2IDL Linked Data README.')
if 'See the documentation' in text and '[Documentation index](docs/README.md)' in text:
    sys.exit('ERROR: README appears to have already been reorganized. No changes made.')

# Group the original sections without rewriting their factual claims or deleting detail.
assignment = {
    'Architecture': 'ARCHITECTURE.md',
    'Repository structure': 'ARCHITECTURE.md',
    'Production infrastructure': 'ARCHITECTURE.md',
    'Development principle': 'ARCHITECTURE.md',
    'Semantic model': 'SEMANTIC-MODEL.md',
    'Multi-collection concept model': 'SEMANTIC-MODEL.md',
    'Semantic relationships': 'SEMANTIC-MODEL.md',
    'Curated collections': 'SEMANTIC-MODEL.md',
    'Human-readable concept neighborhoods': 'SEMANTIC-MODEL.md',
    'URI conventions': 'API-REFERENCE.md',
    'Public endpoints': 'API-REFERENCE.md',
    'Content negotiation': 'API-REFERENCE.md',
    'SPARQL usage': 'SPARQL.md',
    'SPARQL service limits': 'SPARQL.md',
    'Security': 'SECURITY.md',
    'Validation and monitoring': 'VALIDATION.md',
    'Verification': 'VALIDATION.md',
    'Release workflow': 'PUBLICATION.md',
    'Local development': 'PUBLICATION.md',
    'Licensing': 'PUBLICATION.md',
    'Project status': 'ROADMAP.md',
    'Next development priorities': 'ROADMAP.md',
    'Graph Explorer': 'GRAPH-EXPLORER.md',
    'Knowledge Graph Explorer': 'GRAPH-EXPLORER.md',
    'Interactive Graph Explorer': 'GRAPH-EXPLORER.md',
    'Explorer': 'GRAPH-EXPLORER.md',
    'External vocabulary mappings': 'SEMANTIC-MODEL.md',
    'External mappings': 'SEMANTIC-MODEL.md',
}
sections = re.split(r'(?=^## (?!#).+$)', text, flags=re.MULTILINE)
intro = sections[0]
groups = {}
unknown = []
for item in sections[1:]:
    m = re.match(r'^## (.+?)\s*$', item, re.MULTILINE)
    if not m:
        unknown.append(item)
        continue
    heading = m.group(1).strip()
    dest = assignment.get(heading)
    if dest is None:
        # Keep any new/unrecognized sections intact and visible in a dedicated file.
        dest = 'ADDITIONAL-TOPICS.md'
        unknown.append(heading)
    groups.setdefault(dest, []).append(item.strip() + '\n')
if len(sections) < 12:
    sys.exit('ERROR: README does not have expected documentation structure; no changes made.')

# Keep the original preamble for archival traceability if it contains material beyond links.
if intro.strip():
    groups.setdefault('ORIGINAL-INTRODUCTION.md', []).append(intro.strip() + '\n')

names = {
    'ARCHITECTURE.md': 'Architecture and Repository Structure',
    'SEMANTIC-MODEL.md': 'Semantic Model and Relationships',
    'GRAPH-EXPLORER.md': 'Knowledge Graph Explorer',
    'API-REFERENCE.md': 'Public API and Identifiers',
    'SPARQL.md': 'SPARQL Query Guide',
    'SECURITY.md': 'Security Controls',
    'VALIDATION.md': 'Validation and Verification',
    'PUBLICATION.md': 'Development and Publication',
    'ROADMAP.md': 'Project Status and Roadmap',
    'ADDITIONAL-TOPICS.md': 'Additional Documentation Topics',
    'ORIGINAL-INTRODUCTION.md': 'Original README Introduction',
}

docs = ROOT / 'docs'
docs.mkdir(exist_ok=True)
# Avoid overwriting a preexisting docs tree; this script is a reorganization, not a destructive update.
for filename in groups:
    if (docs / filename).exists():
        sys.exit(f'ERROR: docs/{filename} exists already. No document files overwritten.')

for filename, parts in groups.items():
    title = names[filename]
    body = '\n\n'.join(p.strip() for p in parts)
    # Relative links to project-root documents and public assets are left as references
    # only if URL/commands are already present in source; no code changes here.
    (docs / filename).write_text(f'# {title}\n\n[Documentation index](README.md) · [Project overview](../README.md)\n\n{body}\n', encoding='utf-8')

# Explorer guide exists even when older READMEs lacked this section.
explorer = docs / 'GRAPH-EXPLORER.md'
if not explorer.exists():
    explorer.write_text('''# Knowledge Graph Explorer

[Documentation index](README.md) · [Project overview](../README.md)

The public Graph Explorer is available at **https://id.i2idl.org/explore** and uses the published JSON-LD at `https://id.i2idl.org/glossary.jsonld`.

A concept can be selected directly with the `concept` query parameter, for example:

```text
https://id.i2idl.org/explore?concept=competency
```

The explorer provides interactive SKOS relationships (one- and two-hop navigation), field-based clustering and filtering, concept search, shortest-path analysis, concept comparison, and graph analytics.

The production explorer is served from `public/graph.html` through the `/explore` Vercel rewrite. It consumes the published graph rather than introducing a second canonical dataset.

The production implementation does **not** accept uploaded JSON-LD files. The local file-upload test path was removed following CodeQL security review.

Search behavior and releases should be checked against the current `public/graph.html` implementation. Follow pull-request checks for unmerged improvements.
''', encoding='utf-8')

index_items = [
    ('Architecture', 'ARCHITECTURE.md', 'Hosting, repository layout, components, and infrastructure'),
    ('Semantic model', 'SEMANTIC-MODEL.md', 'JSON-LD, SKOS, collections, concepts, evidence, and relationships'),
    ('Graph Explorer', 'GRAPH-EXPLORER.md', 'Interactive browser, concept links, and research tools'),
    ('Public endpoints', 'API-REFERENCE.md', 'Canonical URIs, representations, and content negotiation'),
    ('SPARQL', 'SPARQL.md', 'Queries, supported operations, examples, and limits'),
    ('Security', 'SECURITY.md', 'Threat boundaries and service hardening'),
    ('Validation', 'VALIDATION.md', 'Validation scripts, tests, and verification examples'),
    ('Publication', 'PUBLICATION.md', 'Local development and release workflow'),
    ('Roadmap', 'ROADMAP.md', 'Completed phases and proposed work'),
]
index = '# I2IDL Linked Data Documentation\n\n[Project overview](../README.md)\n\nThe technical documentation is organized by topic. Existing detailed explanations and examples were moved from the original root README into these files.\n\n'
for title, filename, explanation in index_items:
    if (docs / filename).exists():
        index += f'- **[{title}]({filename})** — {explanation}.\n'
for title in ['ADDITIONAL-TOPICS.md', 'ORIGINAL-INTRODUCTION.md']:
    if (docs / title).exists():
        index += f'- **[{names[title]}]({title})** — retained source material.\n'
index += '''\n## Existing authoritative policies\n\n- [Semantic relationship editorial policy](../SEMANTIC-RELATIONSHIPS.md)\n- [Data licensing and attribution](../DATA-LICENSE.md)\n\nThese existing policy files remain in the repository root.\n'''
(docs / 'README.md').write_text(index, encoding='utf-8')

release = re.search(r'\*\*Current glossary release:\*\*\s*`([^`]+)`', text)
version = release.group(1) if release else None
lines = [
    '# I2IDL Linked Data',
    '',
    'Open, interoperable Linked Data publication and exploration services for the [I2IDL Digital Learning Glossary](https://www.i2idl.org/glossary).',
    '',
    'The project publishes a canonical JSON-LD graph with persistent identifiers, provenance, SKOS relationships and editorial collections. It provides browser-readable concept links, machine-readable representations, a read-only SPARQL service, and an interactive Knowledge Graph Explorer.',
    '',
    '## Explore the services',
    '',
    '- **[Digital Learning Glossary](https://www.i2idl.org/glossary)** — human-readable concepts and source citations',
    '- **[Knowledge Graph Explorer](https://id.i2idl.org/explore)** — interactive relationships and research tools',
    '- **[Published JSON-LD](https://id.i2idl.org/glossary.jsonld)** — full machine-readable graph',
    '- **[SPARQL endpoint](https://id.i2idl.org/sparql)** — read-only graph queries',
    '- **[Persistent namespace](https://id.i2idl.org/)** — stable identifiers and resolvable concept URIs',
    '',
]
if version:
    lines.extend([f'**Version stated in the source README:** `{version}`. For the deployed release, verify `gs:publicationVersion` in the published concept scheme.', ''])
lines.extend([
    '## Key capabilities', '',
    '- SKOS concepts, broader/narrower and related relationships, collections, and external mappings',
    '- Structured definitions, citations, rights metadata, and evidence provenance',
    '- JSON-LD and Turtle representations with content negotiation',
    '- Read-only SPARQL query access',
    '- Interactive Graph Explorer with search, filtering, shortest paths, comparisons, and analytics',
    '- Automated graph validation, dependency monitoring, and security analysis',
    '', '## Quick start', '',
    '```bash', 'npm ci', 'npm run validate', 'npm run relationships:coverage', '```', '',
    'For production smoke tests, use `npm run validate:live`.', '',
    '## See the documentation', '',
    '**[Documentation index](docs/README.md)** — architecture, semantic model, Graph Explorer, API reference, SPARQL, security, validation, publication, and roadmap.', '',
    'Additional authoritative references: [semantic relationship policy](SEMANTIC-RELATIONSHIPS.md) · [data licensing](DATA-LICENSE.md).', '',
    '## Contributing and publishing', '',
    'Changes should be proposed through pull requests. The human-readable Squarespace glossary and machine-readable graph are related publications and should be checked for version consistency when either is revised. See [Publication](docs/PUBLICATION.md) and [Validation](docs/VALIDATION.md).', '',
])
readme.write_text('\n'.join(lines), encoding='utf-8')
print('Documentation reorganized successfully.')
print(f'Root README: {len(lines)} lines')
for p in sorted(docs.glob('*.md')):
    print(f'  docs/{p.name}: {len(p.read_text(encoding="utf-8").splitlines())} lines')
print('Review changes and commit README.md plus the docs/ directory. Do not commit this script.')
