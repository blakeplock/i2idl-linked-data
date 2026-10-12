# Validation and Verification

[Documentation index](README.md) · [Project overview](../README.md)

## Validation and monitoring

The repository includes graph, curated-collection, embed, live-service, and semantic-coverage tools.

### Graph validation

```bash
npm run validate
```

This runs both the glossary graph validator and curated-collection validator.

It checks graph integrity, identifiers, collection membership, semantic relationships, provenance, source metadata, and publication security requirements.

### Relationship coverage

```bash
npm run relationships:coverage
```

Reports overall and field-level semantic relationship coverage.

To show isolated concepts:

```bash
npm run relationships:coverage -- --isolated
```

### Embed validation

```bash
npm run validate:embed -- <glossary-html-file>
```

Checks the Squarespace glossary embed for known unsafe rendering patterns.

### Live validation

```bash
npm run validate:live
```

Verifies the deployed Linked Data and SPARQL services, including:

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

## Verification

### Local graph validation

```bash
npm run validate
```

### Relationship coverage

```bash
npm run relationships:coverage
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

### Cross-collection SPARQL

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?concept ?label
WHERE {
  <https://id.i2idl.org/collections/field/learning-engineering>
    skos:member ?concept .

  <https://id.i2idl.org/collections/field/learning-sciences>
    skos:member ?concept .

  ?concept skos:prefLabel ?label .
}
ORDER BY ?label
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
