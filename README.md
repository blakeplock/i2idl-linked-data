# I2IDL Linked Data

**Current glossary release: v0.0.85**  
**Semantic profile: 0.4.0**

Open, interoperable Linked Data publication and exploration services for the [I2IDL Digital Learning Glossary](https://www.i2idl.org/glossary).

The project publishes a canonical JSON-LD knowledge graph with persistent identifiers, provenance, semantic relationships, editorial collections, and external vocabulary mappings. It provides human-readable concept references, machine-readable representations, a read-only SPARQL endpoint, and an interactive Knowledge Graph Explorer.

## Explore the services

- **[Digital Learning Glossary](https://www.i2idl.org/glossary)** — Search and browse concepts, definitions, citations, and semantic relationships.
- **[Knowledge Graph Explorer](https://id.i2idl.org/explore)** — Visualize relationships, find shortest paths, compare concepts, and explore graph analytics.
- **[Published JSON-LD](https://id.i2idl.org/glossary.jsonld)** — Access the complete machine-readable knowledge graph.
- **[SPARQL endpoint](https://id.i2idl.org/sparql)** — Query the knowledge graph through a read-only interface.
- **[Persistent namespace](https://id.i2idl.org/)** — Access stable semantic identifiers and resolvable concept URIs.

## Current knowledge graph

The v0.0.85 release includes:

| Component | Count |
|---|---:|
| Concepts | 397 |
| Definitions | 397 |
| Source records | 14 |
| Evidence records | 541 |
| SKOS collections | 31 |
| Concepts in multiple field collections | 171 |
| Concepts with internal semantic relationships | 397 |
| Broader/narrower relationship pairs | 31 |
| Related relationship pairs | 644 |
| External vocabulary mapping assertions | 17 |

Every concept participates in the internal semantic relationship graph. External mappings connect selected concepts to authoritative vocabularies while preserving distinctions between equivalence, close correspondence, and relatedness.

## Key capabilities

- **Semantic interoperability:** JSON-LD, SKOS, Schema.org, Dublin Core Terms, and PROV-O.
- **Knowledge organization:** Stable concept identifiers, editorial collections, hierarchical and associative relationships.
- **External mappings:** Curated links to external vocabularies, including UNESCO Thesaurus and Schema.org.
- **Provenance:** Structured definitions, source evidence, citation details, attribution, and rights metadata.
- **Machine-readable access:** JSON-LD, Turtle, content negotiation, and read-only SPARQL.
- **Graph exploration:** Interactive visualization, concept search, field filtering, shortest paths, comparison tools, and graph analytics.
- **Publication integrity:** Automated validation, dependency monitoring, and CodeQL security analysis.

## Knowledge Graph Explorer

The [Knowledge Graph Explorer](https://id.i2idl.org/explore) provides a browser-based interface to the published glossary graph. It uses the canonical JSON-LD publication rather than maintaining a separate dataset.

Individual concepts can be opened directly using their stable identifier slugs.

For example:

`https://id.i2idl.org/explore?concept=competency`

The explorer is a read-only research interface. Its visualizations and analytical features do not modify the underlying semantic graph or introduce inferred semantic relationships.

## Quick start

```bash
npm ci
npm run validate
npm run relationships:coverage
```

For deployed-service validation:

```bash
npm run validate:live
```

## Documentation

Detailed technical and editorial documentation is maintained separately.

**[Documentation index](docs/README.md)**

The documentation covers architecture, the semantic model, Graph Explorer, API reference, SPARQL, security, validation, publication workflows, and roadmap.

Additional authoritative references:

- [Semantic relationship policy](SEMANTIC-RELATIONSHIPS.md)
- [Data licensing and attribution](DATA-LICENSE.md)

## Contributing and publishing

Changes are proposed through pull requests and reviewed through repository validation and security checks before merging into the protected `main` branch.

The Squarespace glossary and machine-readable Linked Data publication should remain synchronized for coordinated releases.

See the [publication guide](docs/PUBLICATION.md) and [validation guide](docs/VALIDATION.md) for details.

## Licensing

Repository software is licensed under Apache License 2.0.

Unless otherwise noted, I2IDL-original glossary content and editorial contributions are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Third-party material retains its applicable source-specific rights and licensing conditions.

See [DATA-LICENSE.md](DATA-LICENSE.md) for details.