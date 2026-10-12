# Security Controls

[Documentation index](README.md) · [Project overview](../README.md)

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
- collection members that resolve to concepts
- duplicate membership within a collection
- primary-field membership consistency
- support for concepts belonging to multiple field collections
- resolvable internal semantic relationships
- duplicate and self-referential relationship protection
- reciprocal broader/narrower and related relationships
- separation of hierarchical and related relationships
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
