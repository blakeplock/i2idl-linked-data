#!/usr/bin/env python3
"""One-time maintenance patch for automated I2IDL presentation index synchronization."""
import json
from pathlib import Path

root = Path.cwd()
required = [
    'package.json',
    'scripts/build-glossary-web.mjs',
    'scripts/build-glossary-staged.mjs',
    '.github/workflows/glossary-validation.yml',
]
for item in required:
    if not (root / item).is_file():
        raise SystemExit(f'Missing {item}. Run this from the repository root.')

package_path = root / 'package.json'
package = json.loads(package_path.read_text())
scripts = package.setdefault('scripts', {})
if 'indexes:build' in scripts and scripts['indexes:build'] != 'node scripts/build-glossary-staged.mjs':
    raise SystemExit('indexes:build already has a different value; refusing to overwrite.')
scripts['indexes:build'] = 'node scripts/build-glossary-staged.mjs'

web_path = root / 'scripts/build-glossary-web.mjs'
web = web_path.read_text()
old_web = "if (entries.length !== 397) throw new Error(`Expected 397 concepts, found ${entries.length}`);"
new_web = "if (!entries.length || !allCollections.length) throw new Error('Glossary index has no concepts or collections');"
if old_web not in web and new_web not in web:
    raise SystemExit('Unexpected web index builder structure; no files changed.')
web = web.replace(old_web, new_web)

staged_path = root / 'scripts/build-glossary-staged.mjs'
staged = staged_path.read_text()
old_staged = "if (!publicationVersion || entries.length !== 397 || allCollections.length !== 31) throw Error('Unexpected glossary data; aborting staged build');"
new_staged = "if (!publicationVersion || !entries.length || !allCollections.length) throw Error('Unexpected glossary data; aborting staged build');"
if old_staged not in staged and new_staged not in staged:
    raise SystemExit('Unexpected staged builder structure; no files changed.')
staged = staged.replace(old_staged, new_staged)

workflow_path = root / '.github/workflows/glossary-validation.yml'
workflow = workflow_path.read_text()
anchor = '      - name: Validate glossary graph\n        run: npm run validate\n'
addition = '''
      - name: Regenerate glossary presentation indexes
        run: npm run indexes:build

      - name: Check committed indexes match canonical JSON-LD
        run: |
          if ! git diff --quiet -- public/glossary-web.json public/glossary-core.json public/glossary-details.json; then
            echo "ERROR: Generated glossary indexes are stale."
            echo "Run: npm run indexes:build"
            echo "Commit the resulting changes to all three public/glossary-*.json files."
            git diff --stat -- public/glossary-web.json public/glossary-core.json public/glossary-details.json
            exit 1
          fi
          for file in public/glossary-web.json public/glossary-core.json public/glossary-details.json; do
            if [ ! -f "$file" ]; then
              echo "ERROR: Missing generated file: $file"
              exit 1
            fi
            if ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
              echo "ERROR: Generated file not committed: $file"
              exit 1
            fi
          done
'''
if 'Regenerate glossary presentation indexes' not in workflow:
    if workflow.count(anchor) != 1:
        raise SystemExit('Cannot locate validation workflow insertion point; no files changed.')
    workflow = workflow.replace(anchor, anchor + addition)

# All checks succeeded. Apply changes atomically enough for this local one-time tool.
package_path.write_text(json.dumps(package, indent=2) + '\n')
web_path.write_text(web)
staged_path.write_text(staged)
workflow_path.write_text(workflow)
print('Updated package.json, both generators, and glossary-validation workflow.')
print('Run: npm run validate && npm run indexes:build && git diff --check')
