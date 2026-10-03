# I2IDL Linked Data

The **I2IDL Linked Data service** publishes the [I2IDL Digital Learning Glossary](https://www.i2idl.org/glossary) as interoperable JSON-LD and provides stable, dereferenceable semantic identifiers under:

```text
https://id.i2idl.org/
```

The human-readable glossary remains published on the I2IDL website. This repository provides the machine-readable publication layer used by linked-data clients, semantic applications, terminology systems, research workflows, and other software that needs stable identifiers and structured concept data.

**Current glossary release:** `v0.0.55`

## Architecture

The publication model separates the human-readable glossary from its machine-readable representation:

```text
I2IDL glossary source
        |
        +--> Squarespace
        |     https://www.i2idl.org/glossary
        |
        +--> JSON-LD publication file
              public/glossary.jsonld
                    |
                    v
                 GitHub
                    |
                    v
                 Vercel
                    |
                    v
          https://id.i2idl.org/
```

GitHub is the publication repository. Vercel deploys the `main` branch automatically. Squarespace continues to host the public glossary interface.

## Semantic model

The glossary uses JSON-LD 1.1 as its canonical interchange representation. Its semantic model is based primarily on established vocabularies and standards:

- **SKOS** for concepts, concept schemes, preferred and alternate labels, definitions, and semantic relationships
- **Schema.org** for `DefinedTerm` and `DefinedTermSet` representations
- **Dublin Core Terms** for titles, creators, sources, dates, rights, publishers, and bibliographic metadata
- **PROV-O** for provenance and derivation
- **Glossary Studio namespace** for application-specific properties that do not belong in the standard vocabularies above

A glossary concept has a stable identifier independent of any particular wording of its definition. Definitions, evidence, sources, classifications, and relationships can therefore be maintained as connected records rather than collapsed into a single display card.

The canonical concept scheme identifier is:

```text
https://id.i2idl.org/scheme
```

## URI conventions

Stable identifiers follow these patterns:

```text
https://id.i2idl.org/scheme
https://id.i2idl.org/concepts/{concept-id}
https://id.i2idl.org/definitions/{definition-id}
https://id.i2idl.org/sources/{source-id}
```

Example:

```text
https://id.i2idl.org/concepts/data-privacy
```

Explicit JSON-LD representations are also available by adding `.jsonld`:

```text
https://id.i2idl.org/concepts/data-privacy.jsonld
```

## Public endpoints

### Full glossary graph

```text
https://id.i2idl.org/glossary.jsonld
```

Returns the complete published JSON-LD graph.

### Concept scheme

```text
https://id.i2idl.org/scheme
https://id.i2idl.org/scheme.jsonld
```

### Concepts

```text
https://id.i2idl.org/concepts/{id}
https://id.i2idl.org/concepts/{id}.jsonld
```

### Definitions

```text
https://id.i2idl.org/definitions/{id}
https://id.i2idl.org/definitions/{id}.jsonld
```

### Sources

```text
https://id.i2idl.org/sources/{id}
https://id.i2idl.org/sources/{id}.jsonld
```

## Content negotiation

Canonical identifiers are dereferenceable.

For a concept URI such as:

```text
https://id.i2idl.org/concepts/data-privacy
```

a request that accepts JSON-LD:

```bash
curl -H "Accept: application/ld+json" \
  https://id.i2idl.org/concepts/data-privacy
```

returns the machine-readable JSON-LD representation.

A normal browser request or an explicit `Accept: text/html` request receives a `303 See Other` redirect to the corresponding concept in the human-readable glossary:

```text
https://www.i2idl.org/glossary#data-privacy
```

The explicit `.jsonld` URI always returns JSON-LD.

The service also supports public cross-origin reads:

```text
Access-Control-Allow-Origin: *
```

## Repository structure

```text
i2idl-linked-data/
├── api/
│   └── resolve.mjs
├── public/
│   ├── glossary.jsonld
│   └── index.html
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

### `public/glossary.jsonld`

The complete published glossary graph. This is the principal data artifact updated with each glossary release.

### `api/resolve.mjs`

The resolver used for content negotiation and individual scheme, concept, definition, and source representations.

### `vercel.json`

Defines public routes, rewrites, JSON-LD response headers, CORS behavior, and endpoint routing.

## Release workflow

The human-readable glossary and the Linked Data publication should remain synchronized.

For each glossary release:

1. Update the glossary source and increment its visible version number.
2. Update the visible Eastern Time "last updated" timestamp.
3. Generate the corresponding JSON-LD graph from the same semantic model.
4. Publish the new HTML/embed version to the I2IDL Squarespace glossary page.
5. Replace `public/glossary.jsonld` with the JSON-LD file for the same release.
6. Commit the change to `main`.
7. Push to GitHub.
8. Vercel automatically deploys the new `main` commit.
9. Verify the live publication at `https://id.i2idl.org/glossary.jsonld`.
10. Spot-check at least one canonical concept URI and one explicit `.jsonld` concept representation.

A useful commit message is:

```text
Publish glossary v0.0.55 JSON-LD
```

with the version changed for each new release.

## Verification

After a deployment, these commands provide a quick production check.

### Full graph

```bash
curl -I https://id.i2idl.org/glossary.jsonld
```

Expected characteristics include:

```text
HTTP/2 200
content-type: application/ld+json
access-control-allow-origin: *
```

### Explicit concept representation

```bash
curl -I https://id.i2idl.org/concepts/data-privacy.jsonld
```

### Content-negotiated JSON-LD

```bash
curl -I \
  -H "Accept: application/ld+json" \
  https://id.i2idl.org/concepts/data-privacy
```

Expected response:

```text
HTTP/2 200
content-type: application/ld+json
```

### Human redirect

```bash
curl -I \
  -H "Accept: text/html" \
  https://id.i2idl.org/concepts/data-privacy
```

Expected response:

```text
HTTP/2 303
location: https://www.i2idl.org/glossary#data-privacy
```

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
/concepts/data-privacy
/concepts/data-privacy.jsonld
```

Manual production deployment is available with:

```bash
npx vercel --prod
```

but normal production publishing should occur automatically through GitHub after changes are pushed to `main`.

## Production infrastructure

- **Human glossary:** https://www.i2idl.org/glossary
- **Linked Data namespace:** https://id.i2idl.org/
- **Source repository:** https://github.com/blakeplock/i2idl-linked-data
- **Deployment:** Vercel
- **DNS:** `id.i2idl.org` is configured as a subdomain while the primary I2IDL website remains on Squarespace

Changes to the Linked Data service should not require changes to the root I2IDL domain or the `www` Squarespace records.

## Provenance and licensing

The Linked Data graph preserves source, citation, provenance, and rights information at the record level.

I2IDL-original glossary definitions, editorial material, and compilation are published under **CC BY 4.0 unless otherwise noted**. Third-party material retains its source-specific rights and licensing conditions. Individual source and evidence records should be consulted for the terms that apply to source-derived material.

This repository does not currently declare a separate software license for the resolver/deployment code.

## Project status

Phase 1 provides:

- stable identifiers under `id.i2idl.org`
- a complete JSON-LD graph
- dereferenceable concept, definition, source, and scheme identifiers
- HTTP content negotiation
- human-readable redirects
- explicit JSON-LD endpoints
- public CORS access
- GitHub-based version control
- automatic Vercel deployment

A future Phase 2 may add an RDF query service such as SPARQL over the same published semantic graph without changing the stable identifier namespace.
