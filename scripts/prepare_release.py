#!/usr/bin/env python3
"""Prepare v0.0.88 canonical data from reviewed candidate; never approve/publish history."""
import hashlib
import json
from pathlib import Path

ROOT = Path.cwd()
source = ROOT / 'versioning/proposals/v0.0.88-prep/candidate.jsonld'
target = ROOT / 'public/glossary.jsonld'
assert source.is_file() and target.is_file(), 'Run from repo root, after candidate preparation'
raw = source.read_bytes()
candidate = json.loads(raw)
original = json.loads(target.read_bytes())
uri = 'https://id.i2idl.org/scheme'
get_scheme = lambda g: next(n for n in g['@graph'] if n.get('@id') == uri)
assert get_scheme(original)['gs:publicationVersion'] == 'v0.0.87', 'Expected current publication v0.0.87'
assert get_scheme(candidate)['gs:publicationVersion'] == 'v0.0.88', 'Expected candidate publication v0.0.88'
assert get_scheme(candidate)['dcterms:title'] == 'I2IDL Glossary of Digital Learning', 'Unexpected candidate title'
# Guard: must be *exactly* the two scheme metadata changes already reviewed.
expected = json.loads(target.read_bytes())
expected_scheme = get_scheme(expected)
expected_scheme['gs:publicationVersion'] = 'v0.0.88'
expected_scheme['dcterms:title'] = 'I2IDL Glossary of Digital Learning'
assert expected == candidate, 'Candidate includes extra changes: STOP and review'
assert not (ROOT / 'versioning/releases/v0.0.88.json').exists(), 'Release manifest already exists; STOP'
# Copy bytes so approval source digest can be compared with the reviewed candidate.
target.write_bytes(raw)
print('Updated public/glossary.jsonld with reviewed candidate bytes')
print('sha256', hashlib.sha256(raw).hexdigest())
print('Next: build indexes, validate, review approval. No history published.')
