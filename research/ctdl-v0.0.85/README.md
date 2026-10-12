# I2IDL × CTDL / CTDL-ASN — v0.0.85 candidate discovery

**Editorial status: research only. None of these associations is approved.**

This register contains **35 new candidate class associations**, separate from the six proposed associations in v0.0.84. The cumulative potential is 41, subject to identifier and semantic verification. It is *not* a set of approved mappings or an authoritative crosswalk.

## Files

- `candidate-register.csv` — canonical exchangeable candidate register (UTF-8).
- `candidate-register.xlsx` — editorial review workbook containing the same candidate rows.

## Safeguards

- Keep every `Editorial status` value `proposed` until an I2IDL editorial decision following discussions with Credential Engine.
- Class associations do not imply `owl:equivalentClass`, `rdf:type`, `rdfs:subClassOf` or any SKOS match.
- `Identifier evidence` is a provisional research classification; confirm each exact URI, class type, label, and published definition against the current vocabulary.
- Record provenance, reviewer, review date, and decision notes before any editorial status change.
- Do **not** import these candidates into `public/glossary.jsonld`, modify the live `.84` graph, or increment its version as part of the discovery branch.

## Review workflow

1. Verify the canonical external URI and whether the target is a class, property, or concept.
2. Compare definitions and document the nature and limitations of the I2IDL connection.
3. Ask Credential Engine to comment on domain semantics and vocabulary best practices.
4. Have I2IDL explicitly accept or reject each candidate; preserve the review record.
5. Only then evaluate publishing vetted associations in a subsequent release.

Reference sources: https://www.credreg.net/ctdl/terms and https://www.credreg.net/ctdlasn/terms
