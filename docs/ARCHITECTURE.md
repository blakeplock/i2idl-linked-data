# Architecture and Repository Structure

[Documentation index](README.md) · [Project overview](../README.md)

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

## Repository structure

```text
i2idl-linked-data/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── dependency-security.yml
│       └── glossary-validation.yml
├── api/
│   ├── resolve.mjs
│   └── sparql.mjs
├── lib/
│   └── sparql-query-worker.mjs
├── public/
│   ├── glossary.jsonld
│   ├── graph.html
│   └── index.html
├── scripts/
│   ├── report-relationship-coverage.mjs
│   ├── validate-curated-collections.mjs
│   ├── validate-embed.mjs
│   ├── validate-glossary.mjs
│   └── validate-live.mjs
├── DATA-LICENSE.md
├── LICENSE
├── README.md
├── SEMANTIC-RELATIONSHIPS.md
├── package.json
├── package-lock.json
├── vercel.json
└── .gitignore
```

### `public/graph.html`

Standalone, read-only interactive Knowledge Graph Explorer served through the `/explore` rewrite. Includes ranked concept search, semantic network visualization, shortest-path finding, concept comparison, and graph analytics.

### `public/glossary.jsonld`

The complete published glossary graph. This is the principal data artifact updated with each glossary release.

### `api/resolve.mjs`

Handles content negotiation and individual scheme, concept, definition, source, JSON-LD, and Turtle representations.

### `api/sparql.mjs`

Provides the read-only SPARQL service, browser query interface, query restrictions, execution limits, and response security controls.

### `lib/sparql-query-worker.mjs`

Executes bounded SPARQL queries separately from the HTTP request handler.

### `scripts/validate-glossary.mjs`

Validates graph structure, identifiers, collection memberships, semantic relationships, evidence provenance, source metadata, URL safety, and publication security requirements.

### `scripts/validate-curated-collections.mjs`

Validates identifiers, metadata, and membership requirements for curated editorial collections.

### `scripts/report-relationship-coverage.mjs`

Reports overall and field-level semantic relationship coverage.

### `scripts/validate-embed.mjs`

Validates the human-readable glossary embed for unsafe source URL handling, unsafe fragment handling, and script-embedding issues.

### `scripts/validate-live.mjs`

Tests the deployed Linked Data and SPARQL service, including security regression checks.

### `SEMANTIC-RELATIONSHIPS.md`

Documents the glossary's editorial relationship policy, internal semantic model, integrity rules, coverage model, and principles for future external vocabulary mappings.

### `vercel.json`

Defines public routes, rewrites, JSON-LD response headers, CORS behavior, content security policies, and endpoint routing.

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

## Development principle

Future work should preserve the existing lightweight architecture unless scale or operational requirements justify additional infrastructure.

The canonical graph remains JSON-LD, with RDFJS/N3 and Comunica providing serialization and query capabilities in the current Vercel-based deployment.

The stable `https://id.i2idl.org/` namespace should remain independent of any future implementation change.
