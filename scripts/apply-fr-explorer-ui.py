#!/usr/bin/env python3
"""Idempotently register the additive Graph Explorer UI translation script."""
from pathlib import Path
root = Path('public/graph.html')
s = root.read_text(encoding='utf-8')
needle = '<script src="/graph-explorer.js" defer></script>'
insertion = '<script src="/graph-explorer-i18n.js" defer></script>' + needle
if insertion in s:
    print('PASS: Graph Explorer UI localization already registered')
elif s.count(needle) != 1:
    raise SystemExit('ERROR: Could not uniquely find Graph Explorer script; no changes made')
else:
    root.write_text(s.replace(needle, insertion),encoding='utf-8')
    print('PASS: Added Graph Explorer UI translation script; no other HTML changed')
