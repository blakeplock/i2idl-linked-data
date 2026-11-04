# Competency framework: proposed content addition

Status: an unreleased editorial contribution, not an approved I2IDL concept or release. The proposed concept/definition and external class association remain `proposed`. The base is main at a446e80e06afeb2ea40bfd05fd8de8426b604060, publication v0.0.93. Do not merge this draft as publication-ready while the French/editorial release gates below remain pending.

Proposed concept: `https://id.i2idl.org/concepts/competency-framework`.
Proposed active definition: `https://id.i2idl.org/definitions/competency-framework-1`.

> A structured set of related competency definitions, organized by grouping, hierarchy or progression and often paired with proficiency levels or performance indicators, used as a shared reference to plan learning, assess performance and judge readiness.

This is a framework, distinct from an individual competency, the standard used to represent it, or evidence that a learner has demonstrated it. The primary field is Standards & Interoperability; secondary field memberships are Assessment & Measurement and Learning Engineering. It joins Framework and the existing Competency and Assessment curated collection. Eight associative relations are reciprocal. A narrower AI teacher framework hierarchy and a separate proficiency-level concept are deliberately left for editorial decision.

The definition is an editorial synthesis with a new Credential Engine bibliographic source and supporting existing IEEE LTSC evidence. The [CTDL-ASN 2024-08-30 schema](https://www.credreg.com/ctdlasn/terms?releaseid=20240830) identifies CompetencyFramework as a stable `rdfs:Class` and is CC BY 4.0. Its proposed GS `relatedClass` annotation does not assert SKOS equivalence, class identity, instance typing, subsumption or mapping ratification. All 17 existing SKOS mappings are unchanged. See [ONTOLOGY-ASSOCIATIONS.md](../ONTOLOGY-ASSOCIATIONS.md).

Actual checks:

- Graph and curated validators pass: 421 concepts, 421 definitions, 16 sources, 567 evidence records.
- RDFC-1.0 comparison against immutable v0.0.93: 412 unchanged concepts, eight existing concepts changed only by the added reciprocal relation, one new concept, zero removals. No snapshots, release manifests or registries were changed.
- Relationship coverage: 421 connected, zero isolated.
- The actual page generator/validator regression accepts canonical membership independently of a fixed release count, rejects missing or same-count foreign IDs, and still refuses missing approved French.
- The three JSON indexes are generated. Full `npm run indexes:build` intentionally refuses `Missing approved French label/active definition for competency-framework`. This contribution does not claim complete publication CI, live checks, dependency audit, or a release passed.

Unreviewed French candidate, provided for an authorized translator/editor to assess:

- Preferred label: Référentiel de compétences
- Alternate label: Cadre de compétences
- Definition: Ensemble structuré de définitions de compétences connexes, organisé par regroupement, hiérarchie ou progression et souvent associé à des niveaux de maîtrise ou à des indicateurs de performance, qui sert de référence commune pour planifier l’apprentissage, évaluer la performance et apprécier le degré de préparation.

No French review, reviewer identity, review date or approved status is asserted. Do not copy this candidate into an approved translation artifact until it is actually reviewed.

Before publication, follow [PUBLICATION.md](PUBLICATION.md), [CONCEPT-CHANGE-DETECTION.md](CONCEPT-CHANGE-DETECTION.md), and [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md). An authorized editor must review the concept/relations, review French with the actual reviewer and date, choose the next Content release after checking tags, and synchronize scheme publication metadata, full Squarespace embed, release manifest and public tag. Existing French review metadata currently names source v0.0.90; verify the unchanged prior English labels/definitions before deliberately carrying it forward, preserving the original reviewers/dates. Regenerate the language catalog, French overlay, JSON indexes and complete bilingual pages/sitemap. A 421-concept release requires 842 pages, with exact canonical ID membership rather than a magic count.

The existing revision tooling requires a draft proposal, matching source/proposal digests, a named actual reviewer, and explicit approval of all nine changed concept IDs before appending the one new revision, eight incremented revisions, and 412 reused revisions. No approval, immutable publication, Vercel deployment, Squarespace update or tag is performed by this patch. The current v0.0.93 publication metadata is retained solely as the unreleased proposal's base; this candidate is not a new 421-concept v0.0.93 release.
