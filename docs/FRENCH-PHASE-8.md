# French Phase 8: Graph Explorer interface strings

This drop-in package adds *static interface-copy translation*, without editing the canonical glossary, the JSON-LD overlay or the main Explorer JavaScript. The localization script is loaded before `graph-explorer.js` and listens to the existing `#i2idl-language` dropdown. It leaves element IDs, option values, links, interaction handlers and graph nodes unchanged.

## Install

Start from an up-to-date `main` branch **after PR #109**. In GitHub Desktop, create a fresh branch named `french-phase8-interface`. Extract this ZIP into the root of the checkout, preserving directories.

```sh
python3 scripts/apply-fr-explorer-ui.py
node --check public/graph-explorer-i18n.js
node scripts/test-fr-explorer-ui.mjs
npm run validate
```

Commit through GitHub Desktop and push the branch. Open a pull request; do not merge before browser tests.

## Preview checklist

- `/explore?lang=fr&concept=learning-engineering` — French title, definition and translated navigation controls.
- Switch from French to English and back. Labels, buttons, ranking options and search placeholder should switch both ways without duplication.
- Type `ingenierie` and `learning engineering`; French concept is found regardless of accent.
- Compare concepts, shortest path, Research Discovery and exports continue working.
- `/explore?lang=en&concept=learning-engineering` preserves existing English behavior.

## Known limitations

This phase localizes **a subset of static UI strings**, not all application-generated messages or OpenAlex results. Existing Phase 7 dynamically generated graph/tool text can remain English. The approved French translations still cover two concepts only, with English fallback for the remaining 418. This is an incremental preview, not a completed French-language release. Runtime browser testing is required.
