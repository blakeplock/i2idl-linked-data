# Development and Publication

[Documentation index](README.md) · [Project overview](../README.md)

## Release workflow

The human-readable glossary and the Linked Data publication should remain synchronized.

For each glossary release:

1. Update the glossary source and increment its visible version number.
2. Update the visible Eastern Time "last updated" timestamp.
3. Generate or update the corresponding JSON-LD graph from the same semantic model.
4. Update `gs:publicationVersion` in the concept scheme.
5. Run:
   ```bash
   npm run validate
   ```
6. Review semantic relationship coverage:
   ```bash
   npm run relationships:coverage
   ```
7. Run the embed validator against the release HTML:
   ```bash
   npm run validate:embed -- <glossary-html-file>
   ```
8. Publish the new HTML/embed version to the I2IDL Squarespace glossary page.
9. Replace or update `public/glossary.jsonld` for the same release.
10. Create a branch and pull request.
11. Allow required GitHub checks to pass.
12. Merge into the protected `main` branch.
13. Vercel automatically deploys the new `main` commit.
14. Run:
   ```bash
   npm run validate:live
   ```
15. Confirm that the human-readable page and machine-readable publication report the same release version.

A useful release commit message is:

```text
Publish glossary v0.0.80
```

with the version changed for each release.

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

The I2IDL Digital Learning Glossary data and editorial content are governed separately. Unless otherwise noted, I2IDL-original glossary definitions, editorial explanations, semantic modeling, classifications, relationships, and compilation are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).

Third-party source-derived material remains subject to its original licensing and rights conditions.

See `DATA-LICENSE.md` for details.

The JSON-LD graph preserves source, citation, provenance, and rights information at the record level where available.
