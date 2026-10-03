# I2IDL Linked Data

The **I2IDL Linked Data service** publishes the [I2IDL Digital Learning Glossary](https://www.i2idl.org/glossary) as interoperable JSON-LD, provides stable dereferenceable semantic identifiers, and exposes the glossary graph through a read-only SPARQL endpoint.

Stable identifier namespace:

```text
https://id.i2idl.org/
```

Human-readable glossary:

```text
https://www.i2idl.org/glossary
```

SPARQL endpoint:

```text
https://id.i2idl.org/sparql
```

**Current glossary release:** `v0.0.55`

## Architecture

The publication model separates the human-readable glossary from its machine-readable representations:

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
          +---------+---------+
          |                   |
          v                   v
https://id.i2idl.org/   /sparql query service
```

GitHub is the publication repository. Vercel automatically deploys the `main` branch. Squarespace continues to host the public human-readable glossary.

## Semantic model

The glossary uses JSON-LD 1.1 as its canonical interchange representation. Its semantic model is based primarily on established vocabularies and standards:

- **SKOS** for concepts, concept schemes, preferred and alternate labels, definitions, and semantic relationships
- **Schema.org** for `DefinedTerm` and `DefinedTermSet`
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

Explicit JSON-LD representations are also available:

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

### SPARQL

```text
https://id.i2idl.org/sparql
```

The SPARQL endpoint provides read-only query access to the same graph published at `/glossary.jsonld`.

A browser request with no query displays a lightweight query interface.

Supported query forms:

- `SELECT`
- `ASK`
- `CONSTRUCT`
- `DESCRIBE`

SPARQL Update operations are disabled.

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

The service supports public cross-origin reads:

```text
Access-Control-Allow-Origin: *
```

## SPARQL usage

### Browser interface

Open:

```text
https://id.i2idl.org/sparql
```

The browser interface includes a query editor and examples for the supported query forms.

### SELECT

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?concept ?label
WHERE {
  ?concept a skos:Concept ;
           skos:prefLabel ?label .
}
ORDER BY ?label
LIMIT 25
```

Example request:

```bash
curl -G \
  --data-urlencode 'query=SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 5' \
  https://id.i2idl.org/sparql
```

`SELECT` responses use:

```text
application/sparql-results+json
```

### ASK

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

ASK {
  <https://id.i2idl.org/concepts/data-privacy>
    a skos:Concept .
}
```

`ASK` responses also use:

```text
application/sparql-results+json
```

### CONSTRUCT

```sparql
CONSTRUCT {
  <https://id.i2idl.org/concepts/data-privacy> ?p ?o .
}
WHERE {
  <https://id.i2idl.org/concepts/data-privacy> ?p ?o .
}
```

### DESCRIBE

```sparql
DESCRIBE <https://id.i2idl.org/concepts/data-privacy>
```

`CONSTRUCT` and `DESCRIBE` responses are serialized as Turtle:

```text
text/turtle
```

### POST

The endpoint also accepts SPARQL queries by POST:

```bash
curl -X POST \
  -H "Content-Type: application/sparql-query" \
  --data 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 5' \
  https://id.i2idl.org/sparql
```

## SPARQL service limits

The endpoint is intentionally read-only and includes guardrails for public use.

Current limits:

- maximum query length: `12,000` characters
- execution guard: `10` seconds
- maximum `SELECT` result size: `5,000` rows
- maximum `CONSTRUCT` / `DESCRIBE` result size: `5,000` quads
- SPARQL Update operations are not permitted

These limits are implementation safeguards and may be adjusted as the service evolves.

## Repository structure

```text
i2idl-linked-data/
├── api/
│   ├── resolve.mjs
│   └── sparql.mjs
├── public/
│   ├── glossary.jsonld
│   └── index.html
├── DATA-LICENSE.md
├── LICENSE
├── package.json
├── package-lock.json
├── vercel.json
├── .gitignore
└── README.md
```

### `public/glossary.jsonld`

The complete published glossary graph. This is the principal data artifact updated with each glossary release.

### `api/resolve.mjs`

Handles content negotiation and individual scheme, concept, definition, and source representations.

### `api/sparql.mjs`

Provides the read-only SPARQL service and browser query interface.

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
9. Verify `https://id.i2idl.org/glossary.jsonld`.
10. Spot-check at least one canonical concept URI and one explicit `.jsonld` representation.
11. Run at least one SPARQL query against `https://id.i2idl.org/sparql`.

A useful release commit message is:

```text
Publish glossary v0.0.55 JSON-LD
```

with the version changed for each release.

## Verification

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

### SPARQL SELECT

```bash
curl -s -D - -o /dev/null -G \
  --data-urlencode 'query=SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 1' \
  https://id.i2idl.org/sparql
```

Expected characteristics include:

```text
HTTP/2 200
content-type: application/sparql-results+json
```

### SPARQL read-only protection

```bash
curl -G \
  --data-urlencode 'query=INSERT DATA { <https://example.org/a> <https://example.org/b> <https://example.org/c> }' \
  https://id.i2idl.org/sparql
```

Expected response:

```json
{
  "error": "SPARQL Update operations are not permitted."
}
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
/sparql
```

Normal production publishing occurs automatically through GitHub after changes are pushed to `main`.

Manual production deployment remains available with:

```bash
npx vercel --prod
```

## Production infrastructure

- **Human glossary:** https://www.i2idl.org/glossary
- **Linked Data namespace:** https://id.i2idl.org/
- **SPARQL endpoint:** https://id.i2idl.org/sparql
- **Source repository:** https://github.com/blakeplock/i2idl-linked-data
- **Deployment:** Vercel
- **DNS:** `id.i2idl.org` is configured as a subdomain while the primary I2IDL website remains on Squarespace

Changes to the Linked Data service should not require changes to the root I2IDL domain or the `www` Squarespace records.

## Licensing

The software and deployment code in this repository are licensed under the Apache License 2.0. See `LICENSE`.

The I2IDL Digital Learning Glossary data and editorial content are governed separately. Unless otherwise noted, I2IDL-original glossary definitions, editorial explanations, semantic modeling, classifications, and compilation are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).

Third-party source-derived material remains subject to its original licensing and rights conditions.

See `DATA-LICENSE.md` for details.

The JSON-LD graph preserves source, citation, provenance, and rights information at the record level where available.

## Project status

### Phase 1: Linked Data publication

Complete.

Provides:

- stable identifiers under `id.i2idl.org`
- complete JSON-LD graph publication
- dereferenceable concept, definition, source, and scheme identifiers
- HTTP content negotiation
- human-readable redirects
- explicit JSON-LD endpoints
- public CORS access
- GitHub-based version control
- automatic Vercel deployment

### Phase 2: SPARQL query service

Complete.

Provides:

- production endpoint at `https://id.i2idl.org/sparql`
- browser query interface
- `SELECT`, `ASK`, `CONSTRUCT`, and `DESCRIBE`
- GET and POST query support
- SPARQL JSON result serialization
- Turtle graph serialization
- read-only enforcement
- query and result limits
- execution timeout protection
- public CORS access

Future work can build on this foundation without changing the stable `https://id.i2idl.org/` namespace.
