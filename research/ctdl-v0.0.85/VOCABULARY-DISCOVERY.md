# CTDL / CTDL-ASN controlled-vocabulary discovery (v0.0.85)

**Research only. All 30 links are proposed, none approved.** This tranche supplements `candidate-register.csv` and `property-candidates.csv`; it does not replace or change either register. No `public/glossary.jsonld` changes.

The six original v0.0.84 I2IDL concepts are deliberately included: **Assessment, Competency, AI competency framework for teachers (AI CFT), Micro-credential, Digital credential, and Massive open online course (MOOC)**. `Origin` distinguishes these cases from expansion to other I2IDL concepts.

## Key findings

- Formative and Summative assessment have named concepts in the CTDL `AssessmentUse` scheme: `https://purl.org/ctdl/vocabs/assessUse/Formative` and `.../Summative`.
- CTDL `Delivery` scheme contains individually identified concepts for Synchronous, Asynchronous, Online Only, Blended Delivery, and Mixed Synchronous.
- The six original class associations remain useful but are supplemented by *different kinds* of resources: property-level functions, specific SKOS values, narrower classes, and controlled concept schemes.
- A class/property/scheme/concept connection does **not** imply equivalence. Do not import `closeMatch candidate` or `relatedMatch candidate` as SKOS predicates without editorial review and appropriate mapping policy.
- An original-six concept may have multiple external connections without double-counting original class-association records.

## Review gates

1. Confirm each URI dereferences and represents the stated kind of resource. Candidate property identifiers not shown with complete domain/range here require separate validation.
2. Compare each official target definition with the *I2IDL definition*, not only its label.
3. Resolve whether it is best published as a SKOS concept mapping, an ontology-class association, a property-context reference, or a vocabulary-scheme reference. The v0.0.84 `relatedClass` structure currently supports **only classes**.
4. Record Credential Engine feedback, I2IDL decision, and provenance before approval. No status is advanced by this discovery.

Sources: https://credreg.net/page/typeslist; https://www.credreg.net/ctdlasn/terms; https://credreg.net/ctdl/handbook
