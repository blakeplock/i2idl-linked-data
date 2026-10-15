# Development and Publication

[Documentation index](README.md) · [Project overview](../README.md)

## Public release and concept-versioning policy

I2IDL maintains **one public release sequence**, using Git tags `v0.0.88`, `v0.0.89`, etc. Each release is labeled **Content** (curated knowledge changed), **Platform** (interfaces, APIs, security, performance, or documentation changed), or **Combined**. Do not introduce a competing `platform-v*` tag sequence.

A public release advances the release tag, `gs:publicationVersion` in the canonical concept scheme, and the Squarespace embed's displayed/publication version **together**. For a **Platform** release, update only publication-level metadata in the canonical graph, not curated concept assertions: concept identities, definitions, evidence, sources, classifications, and semantic links must remain unchanged. Rebuild presentation indexes and release manifests as required, and verify concept hashes/revision numbers have not changed. Existing immutable release manifests and snapshots are append-only.

The npm `package.json` version and the MCP registry/server version are **compatibility identifiers**, not an independent public I2IDL release sequence; update them only when their own contracts change. Never infer a concept revision from a change in the public publication number.

## Release workflow

1. Establish release type (Content, Platform, Combined) and scope; review existing Git tags and deployed version. Update the release checklist before publication.
2. Review and merge code/documentation housekeeping on a dedicated pull request. Do **not** tag or bump canonical publication data while auditing.
3. Prepare the publication change for the chosen version: synchronize the `gs:publicationVersion` in `public/glossary.jsonld`, publication-level metadata and generated indexes, plus the full Squarespace embed displayed version and updated timestamp. For Content/Combined releases, also apply and review curated data edits; for Platform releases, do **not** change curated concept assertions.
4. Generate and validate the immutable release manifest and unchanged-concept revision hashes using the existing versioning scripts; inspect diffs for accidental semantic changes.
5. Run the full [release checklist](RELEASE-CHECKLIST.md), including `npm run validate`, index reproducibility, schema and endpoint regression tests, embed validation, licensing/security checks, and live/preview verification.
6. Merge the publication pull request after all required GitHub checks pass. Deploy via Vercel and confirm the intended `main` commit is live.
7. Verify Squarespace, canonical JSON-LD, the GitHub tag target, and the release manifest represent the **same public release version**. Publish the Squarespace embed and recheck the displayed version.
8. Create **one** Git tag and GitHub Release for the version, explicitly describing its type, content changes (or none), platform changes, and compatibility impact. Verify the release links.

For a platform-only release such as proposed `v0.0.89`, the 397 curated concepts must retain their existing concept revisions. A publication version bump alone must not generate artificial concept revisions.

## Local development

Requirements:

- Node.js
- Vercel CLI
- access to the associated Vercel project

From the repository directory:

```bash
npx vercel login
npx vercel dev
```

Open the local URL displayed by Vercel.

Useful local routes include:

```text
/
/glossary.jsonld
/scheme
/scheme.jsonld
/scheme.ttl
/concepts/data-privacy
/concepts/data-privacy.jsonld
/concepts/data-privacy.ttl
/sparql
```

Normal production publishing occurs automatically through GitHub after changes are merged into `main`.

Manual production deployment remains available with:

```bash
npx vercel --prod
```

## Licensing

The software and deployment code in this repository are licensed under the Apache License 2.0. See `LICENSE`.

The I2IDL Glossary of Digital Learning data and editorial content are governed separately. Unless otherwise noted, I2IDL-original glossary definitions, editorial explanations, semantic modeling, classifications, relationships, and compilation are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).

Third-party source-derived material remains subject to its original licensing and rights conditions.

See `DATA-LICENSE.md` for details.

The JSON-LD graph preserves source, citation, provenance, and rights information at the record level where available.
