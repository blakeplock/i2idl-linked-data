# I2IDL / CTDL consolidated discovery register — v0.0.85

Research-only crosswalk inventory assembled from the latest locally available audit and discovery datasets. No approval, publication, or branch merge is implied.

- **91 source records**: 6 proposed published baseline associations + 35 class candidates + 20 property candidates + 30 vocabulary/other candidates.
- **85 distinct I2IDL URI + external target URI pairs**; **6 duplicate-pair groups**. Duplicates are flagged, not silently discarded.
- **25 records** directly tied to one of the original six I2IDL concepts, including the baseline records themselves.
- All statuses remain **proposed**; `Retain`, `Reconsider`, `Retarget`, `Reject as proposed` refer to research screening recommendations, not formal approvals/rejections.
- Vocabulary discovery may mix concept, class, property, and scheme *context* references; **do not** convert all of them into `skos:closeMatch` or `relatedClass`.
- Target URIs, including supposedly corrected ASN terms, need final dereference, current release confirmation, RDF resource-type inspection, and meaning checks with Credential Engine.

## Included files

- `consolidated-inventory.csv` — 91 source records with type, rationale, screening recommendation, overlap flag, and next review question.
- `consolidated-inventory.xlsx` — formatted workbook with complete inventory, original-six focus, exact duplicates, summary.
- `original-six-focus.csv` — crosswalk proposals for the six baseline concepts, including relevant newer candidates.
- `README.md` — this process and release safety note.

This is a consolidated research index, **not** an additional 91 approved mappings. Published v0.0.84 remains untouched.

The source registers should remain in the same `research/ctdl-v0.0.85/` directory for auditability. Copy the files here without deleting the historical registers.
