# I2IDL Linked Data

Open, interoperable Linked Data publication and research services for the [I2IDL Glossary of Digital Learning](https://www.i2idl.org/glossary). The project combines a curated semantic reference graph with browser-based exploration and experimental scholarly discovery.

> **Versioning:** The GitHub release tag, the glossary's `gs:publicationVersion`, and the Squarespace embed version must be verified independently before publication. See the [release checklist](docs/RELEASE-CHECKLIST.md). The npm package version is not the glossary publication version.

## Public resources

| Resource | Purpose |
|---|---|
| [Glossary of Digital Learning](https://www.i2idl.org/glossary) | Human-readable curated concepts, definitions, sources and evidence |
| [Knowledge Graph Explorer](https://id.i2idl.org/explore) | Navigate semantic relationships, compare concepts, analyze graph structure and discover scholarship |
| [Explorer Activity](https://id.i2idl.org/activity) | Public 30-day aggregate engagement counts |
| [JSON-LD graph](https://id.i2idl.org/glossary.jsonld) | Canonical machine-readable publication |
| [SPARQL](https://id.i2idl.org/sparql) | Read-only knowledge-graph queries |
| [Persistent namespace](https://id.i2idl.org/) | Resolvable concept, definition, source and scheme identifiers |

## What the project provides

- **Curation and provenance:** Persistent identifiers, definitions, evidence records, editorial collections, citations, rights and source attribution.
- **Semantic interoperability:** JSON-LD, SKOS, Dublin Core Terms, Schema.org, PROV-O, controlled relationships and selected external mappings.
- **Graph exploration:** Search and navigate a one- or two-hop concept network, shortest paths, comparison tools, field and source analytics.
- **Scholarly discovery:** Single-concept and two-to-five-concept OpenAlex searches with publication year, open-access, and citation ranking controls. Results remain **uncurated discovery candidates**, separate from I2IDL's assertions.
- **Research export:** CSV and BibTeX downloads of displayed publications with DOI and selected concept identifiers.
- **Public aggregate activity:** Daily pageviews, concept selections, successful research searches, and returned publication counts. These are not unique visitors or unique papers.
- **Machine access:** JSON-LD and Turtle representations with content negotiation and bounded read-only SPARQL.

## Quick start

```bash
npm ci
npm run validate
npm run relationships:coverage
```

See [validation](docs/VALIDATION.md), [deployment](docs/PUBLICATION.md), and the [release checklist](docs/RELEASE-CHECKLIST.md) before publication. For deployed-service checks, run `npm run validate:live`.

## Documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md) and [semantic model](docs/SEMANTIC-MODEL.md)
- [Explorer](docs/GRAPH-EXPLORER.md) and [scholarly discovery](docs/RESEARCH-DISCOVERY.md)
- [Explorer Activity: metrics and privacy](docs/EXPLORER-ACTIVITY.md)
- [API reference](docs/API-REFERENCE.md), [SPARQL](docs/SPARQL.md), and [security](docs/SECURITY.md)
- [Release checklist](docs/RELEASE-CHECKLIST.md) and [roadmap](docs/ROADMAP.md)

## Editorial boundary and licenses

Interactive analytics and OpenAlex search results do not write new statements into the canonical JSON-LD graph. New definitions, evidence, mappings and relationships require separate editorial review and validation.

Repository software is distributed under Apache License 2.0. I2IDL-original glossary material is generally CC BY 4.0 unless otherwise noted; third-party content retains source-specific rights. See [data licensing](DATA-LICENSE.md), [semantic relationship policy](SEMANTIC-RELATIONSHIPS.md), and [external mappings](EXTERNAL-MAPPINGS.md).
