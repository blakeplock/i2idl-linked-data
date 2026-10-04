# I2IDL Linked Data

The **I2IDL Linked Data service** publishes the [I2IDL Digital Learning Glossary](https://www.i2idl.org/glossary) as interoperable Linked Data, provides stable dereferenceable semantic identifiers, and exposes the glossary graph through a read-only SPARQL endpoint.

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

**Current glossary release:** `v0.0.68`

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

GitHub is the publication repository. Vercel automatically deploys the protected `main` branch. Squarespace continues to host the public human-readable glossary.

The human-facing glossary and the machine-readable graph are versioned together and should remain synchronized at each release.

## Semantic model

The glossary uses JSON-LD 1.1 as its canonical interchange representation. Its semantic model is based primarily on established vocabularies and standards:

- **SKOS** for concepts, concept schemes, preferred and alternate labels, definitions, and semantic relationships
- **Schema.org** for `DefinedTerm` and `DefinedTermSet`
- **Dublin Core Terms** for titles, creators, sources, dates, rights, publishers, and bibliographic metadata
- **PROV-O** for provenance and derivation
- **Glossary Studio namespace** for application-specific properties that do not belong in the standard vocabularies above

A glossary concept has a stable identifier independent of any particular wording of its definition. Definitions, evidence, sources, classifications, and relationships can therefore be maintained as connected records rather than collapsed into a single display card.

Definitions are first-class graph entities. Evidence records distinguish between `direct` and `supporting` source relationships and preserve source identifiers, source titles, citation details, URLs, and provenance.

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

Explicit machine-readable representations are available as JSON-LD and Turtle:

```text
https://id.i2idl.org/concepts/data-privacy.jsonld
https://id.i2idl.org/concepts/data-privacy.ttl
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
https://id.i2idl.org/scheme.ttl
```

### Concepts

```text
https://id.i2idl.org/concepts/{id}
https://id.i2idl.org/concepts/{id}.jsonld
https://id.i2idl.org/concepts/{id}.ttl
```

Concept JSON-LD and Turtle representations include the concept, its active definition, evidence, and referenced source nodes.

### Definitions

```text
https://id.i2idl.org/definitions/{id}
https://id.i2idl.org/definitions/{id}.jsonld
https://id.i2idl.org/definitions/{id}.ttl
```

Definition representations include the definition, evidence, and referenced source nodes.

### Sources

```text
https://id.i2idl.org/sources/{id}
https://id.i2idl.org/sources/{id}.jsonld
https://id.i2idl.org/sources/{id}.ttl
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

SPARQL Update operations, federation, and remote-dataset clauses are disabled.

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

A request that accepts Turtle:

```bash
curl -H "Accept: text/turtle" \
  https://id.i2idl.org/concepts/data-privacy
```

returns Turtle.

A normal browser request or an explicit `Accept: text/html` request receives a `303 See Other` redirect to the corresponding concept in the human-readable glossary:

```text
https://www.i2idl.org/glossary#data-privacy
```

Explicit `.jsonld` and `.ttl` URIs always return the requested serialization.

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
- maximum POST request body: `16 KB`
- execution guard: `10` seconds
- maximum `SELECT` result size: `5,000` rows
- maximum `CONSTRUCT` / `DESCRIBE` result size: `5,000` quads
- application rate limit: `30` requests per minute per client on a warm serverless instance
- SPARQL Update operations are not permitted
- `SERVICE` federation is not permitted
- `FROM` and `FROM NAMED` remote-dataset clauses are not permitted

These limits are implementation safeguards and may be adjusted as the service evolves.

## Security

The service is designed as a public, read-only Linked Data publication and query system with a deliberately constrained attack surface.

### Data and query isolation

- The service does not use SQL or an ORM.
- SPARQL queries run against an in-memory RDFJS/N3 store built from the fixed local `/glossary.jsonld` publication.
- User input is never used to select an arbitrary graph URL, filesystem path, command, or database query.
- SPARQL Update operations are rejected.
- `SERVICE`, `FROM`, and `FROM NAMED` are rejected to prevent federation and server-side retrieval of arbitrary remote resources.
- Resolver identifiers must match a restricted lowercase slug pattern before lookup.

### Input and execution controls

- SPARQL query length is limited.
- POST request bodies are size-limited before processing.
- Query execution is time-bounded.
- Result rows and graph quads are capped.
- Unsupported SPARQL request media types are rejected.
- Unsafe resolver identifiers are rejected.
- Application-level rate limiting provides an additional abuse-control layer on warm serverless instances.

### Graph and embed controls

The publication validator checks for:

- unique canonical identifiers
- safe canonical identifier slugs
- resolvable active definitions
- complete evidence provenance
- classified `direct` / `supporting` evidence relationships
- resolvable source references
- source titles
- HTTPS-only rendered external URLs
- inline JSON-LD context use
- dangerous object keys
- unsafe script-closing sequences

The human-readable glossary embed also validates source URLs before creating clickable links and safely handles fragment identifiers.

### HTTP security controls

Responses include baseline hardening headers such as:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

The SPARQL browser interface also uses a restrictive Content Security Policy and frame protection.

### Automated validation

The repository includes three validation tools:

```bash
npm run validate
npm run validate:embed -- <glossary-html-file>
npm run validate:live
```

`npm run validate` checks graph integrity and publication security requirements.

`npm run validate:embed` checks the Squarespace glossary embed for known unsafe rendering patterns.

`npm run validate:live` verifies the deployed Linked Data and SPARQL services, including:

- full JSON-LD publication
- concept provenance subgraphs
- Turtle serialization
- source provenance
- human redirects
- read-only SPARQL operation
- security headers
- blocked `SERVICE`
- blocked `FROM`
- blocked SPARQL Update
- oversized POST rejection
- unsafe resolver identifier rejection

### Dependency security

Dependency monitoring is automated through GitHub.

The repository includes:

```text
.github/dependabot.yml
.github/workflows/dependency-security.yml
```

The Dependency Security workflow:

- runs on pull requests targeting `main`
- runs on pushes to `main`
- runs on a weekly schedule
- can be run manually
- uses the committed `package-lock.json`
- performs a locked install with `npm ci --ignore-scripts`
- runs `npm audit`

Dependabot checks both npm packages and GitHub Actions dependencies and opens update pull requests for review.

The `main` branch is protected so changes flow through pull requests and required checks before merge.

## Repository structure

```text
i2idl-linked-data/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── dependency-security.yml
├── api/
│   ├── resolve.mjs
│   └── sparql.mjs
├── public/
│   ├── glossary.jsonld
│   └── index.html
├── scripts/
│   ├── validate-embed.mjs
│   ├── validate-glossary.mjs
│   └── validate-live.mjs
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

Handles content negotiation and individual scheme, concept, definition, source, JSON-LD, and Turtle representations.

### `api/sparql.mjs`

Provides the read-only SPARQL service, browser query interface, query restrictions, execution limits, and response security controls.

### `scripts/validate-glossary.mjs`

Validates graph structure, identifiers, evidence provenance, source metadata, URL safety, and publication security requirements.

### `scripts/validate-embed.mjs`

Validates the human-readable glossary embed for unsafe source URL handling, unsafe fragment handling, and script-embedding issues.

### `scripts/validate-live.mjs`

Tests the deployed Linked Data and SPARQL service, including security regression checks.

### `vercel.json`

Defines public routes, rewrites, JSON-LD response headers, CORS behavior, content security policies, and endpoint routing.

## Release workflow

The human-readable glossary and the Linked Data publication should remain synchronized.

For each glossary release:

1. Update the glossary source and increment its visible version number.
2. Update the visible Eastern Time "last updated" timestamp.
3. Generate the corresponding JSON-LD graph from the same semantic model.
4. Run the graph validator:
   ```bash
   npm run validate
   ```
5. Run the embed validator against the release HTML:
   ```bash
   npm run validate:embed -- <glossary-html-file>
   ```
6. Publish the new HTML/embed version to the I2IDL Squarespace glossary page.
7. Replace `public/glossary.jsonld` with the JSON-LD file for the same release.
8. Create a branch and pull request.
9. Allow required GitHub checks to pass.
10. Merge into the protected `main` branch.
11. Vercel automatically deploys the new `main` commit.
12. Run the live deployment validator:
   ```bash
   npm run validate:live
   ```
13. Confirm the human-readable page and machine-readable publication report the same release version.

A useful release commit message is:

```text
Publish glossary v0.0.68 JSON-LD
```

with the version changed for each release.

## Verification

### Local graph validation

```bash
npm run validate
```

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

### Turtle representation

```bash
curl -I https://id.i2idl.org/concepts/data-privacy.ttl
```

Expected response:

```text
HTTP/2 200
content-type: text/turtle
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

### SPARQL federation protection

```bash
curl -G \
  --data-urlencode 'query=SELECT * WHERE { SERVICE <https://example.org/sparql> { ?s ?p ?o } } LIMIT 1' \
  https://id.i2idl.org/sparql
```

Expected response is HTTP `400`.

### Live service validation

```bash
npm run validate:live
```

Expected final line:

```text
LIVE VALIDATION PASSED
```

### Dependency audit

```bash
npm audit
```

The same audit is also run automatically in GitHub Actions.

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

## Production infrastructure

- **Human glossary:** https://www.i2idl.org/glossary
- **Linked Data namespace:** https://id.i2idl.org/
- **SPARQL endpoint:** https://id.i2idl.org/sparql
- **Source repository:** https://github.com/blakeplock/i2idl-linked-data
- **Deployment:** Vercel
- **DNS:** `id.i2idl.org` is configured as a subdomain while the primary I2IDL website remains on Squarespace
- **Primary branch:** protected `main`
- **Dependency monitoring:** GitHub Actions + Dependabot

Changes to the Linked Data service should not require changes to the root I2IDL domain or the `www` Squarespace records.

## Licensing

The software and deployment code in this repository are licensed under the Apache License 2.0. See `LICENSE`.

The I2IDL Digital Learning Glossary data and editorial content are governed separately. Unless otherwise noted, I2IDL-original glossary definitions, editorial explanations, semantic modeling, classifications, and compilation are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).

Third-party source-derived material remains subject to its original licensing and rights conditions.

See `DATA-LICENSE.md` for details.

The JSON-LD graph preserves source, citation, provenance, and rights information at the record level where available.

## Project status

### Phase 1: Linked Data publication

**Complete.**

Provides:

- stable identifiers under `id.i2idl.org`
- complete JSON-LD graph publication
- Turtle serialization
- dereferenceable concept, definition, source, and scheme identifiers
- HTTP content negotiation
- human-readable redirects
- explicit JSON-LD and Turtle endpoints
- concept and definition provenance subgraphs
- public CORS access
- GitHub-based version control
- automatic Vercel deployment

### Phase 2: SPARQL query service

**Complete.**

Provides:

- production endpoint at `https://id.i2idl.org/sparql`
- browser query interface
- `SELECT`, `ASK`, `CONSTRUCT`, and `DESCRIBE`
- GET and POST query support
- SPARQL JSON result serialization
- Turtle graph serialization
- read-only enforcement
- federation and remote-dataset blocking
- query, body, result, and rate limits
- execution timeout protection
- public CORS access

### Phase 3: Security hardening and validation

**Complete.**

Provides:

- restricted resolver identifiers
- fixed local graph loading
- HTTPS-only rendered source links
- safe fragment handling
- hardened semantic-model embedding
- baseline security headers
- Content Security Policy on the SPARQL interface
- graph validation
- embed validation
- live deployment validation
- automated regression checks for blocked SPARQL attack surfaces

### Phase 4: Dependency and maintenance monitoring

**Active.**

Provides:

- committed `package-lock.json`
- automated `npm audit` in GitHub Actions
- weekly dependency-security runs
- Dependabot npm updates
- Dependabot GitHub Actions updates
- protected `main` branch
- pull-request-based dependency review

Future work can build on this foundation without changing the stable `https://id.i2idl.org/` namespace.
