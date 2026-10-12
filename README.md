# I2IDL Linked Data

Open, interoperable Linked Data publication and exploration services for the [I2IDL Digital Learning Glossary](https://www.i2idl.org/glossary).

The project publishes a canonical JSON-LD graph with persistent identifiers, provenance, SKOS relationships and editorial collections. It provides browser-readable concept links, machine-readable representations, a read-only SPARQL service, and an interactive Knowledge Graph Explorer.

## Explore the services

- **[Digital Learning Glossary](https://www.i2idl.org/glossary)** — human-readable concepts and source citations
- **[Knowledge Graph Explorer](https://id.i2idl.org/explore)** — interactive relationships and research tools
- **[Published JSON-LD](https://id.i2idl.org/glossary.jsonld)** — full machine-readable graph
- **[SPARQL endpoint](https://id.i2idl.org/sparql)** — read-only graph queries
- **[Persistent namespace](https://id.i2idl.org/)** — stable identifiers and resolvable concept URIs

## Key capabilities

- SKOS concepts, broader/narrower and related relationships, collections, and external mappings
- Structured definitions, citations, rights metadata, and evidence provenance
- JSON-LD and Turtle representations with content negotiation
- Read-only SPARQL query access
- Interactive Graph Explorer with search, filtering, shortest paths, comparisons, and analytics
- Automated graph validation, dependency monitoring, and security analysis

## Quick start

```bash
npm ci
npm run validate
npm run relationships:coverage
```

For production smoke tests, use `npm run validate:live`.

## See the documentation

**[Documentation index](docs/README.md)** — architecture, semantic model, Graph Explorer, API reference, SPARQL, security, validation, publication, and roadmap.

Additional authoritative references: [semantic relationship policy](SEMANTIC-RELATIONSHIPS.md) · [data licensing](DATA-LICENSE.md).

## Contributing and publishing

Changes should be proposed through pull requests. The human-readable Squarespace glossary and machine-readable graph are related publications and should be checked for version consistency when either is revised. See [Publication](docs/PUBLICATION.md) and [Validation](docs/VALIDATION.md).
