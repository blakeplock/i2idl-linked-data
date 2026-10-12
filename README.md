# I2IDL Linked Data

Open, interoperable Linked Data publication and exploration services for the [I2IDL Digital Learning Glossary](https://www.i2idl.org/glossary).

The project publishes a canonical JSON-LD graph with persistent identifiers, provenance, SKOS relationships and editorial collections. It provides browser-readable concept links, machine-readable representations, a read-only SPARQL service, and an interactive Knowledge Graph Explorer.

**Documentation target: v0.0.85 — Knowledge Graph Explorer & External Mappings.** The current `main` branch's `public/glossary.jsonld` still declares `gs:publicationVersion: "v0.0.84.1"`; the v0.0.85 publication is not fully synchronized until that artifact is updated, validated, and deployed. The semantic application profile remains `0.4.0`.

## Explore the services

- **[Digital Learning Glossary](https://www.i2idl.org/glossary)** — human-readable concepts and source citations
- **[Knowledge Graph Explorer](https://id.i2idl.org/explore)** — interactive relationships and research tools
- **[Published JSON-LD](https://id.i2idl.org/glossary.jsonld)** — full machine-readable graph
- **[SPARQL endpoint](https://id.i2idl.org/sparql)** — read-only graph queries
- **[Persistent namespace](https://id.i2idl.org/)** — stable identifiers and resolvable concept URIs

To focus the explorer on a concept, use its canonical slug as the `concept` query parameter, for example: [Competency in the Graph Explorer](https://id.i2idl.org/explore?concept=competency).

## Key capabilities

- **397 concepts**, each participating in internal semantic relationships; **31** broader/narrower pairs and **644** related pairs
- **17 external mapping assertions**, connecting selected concepts to external vocabularies
- SKOS concepts, reciprocal broader/narrower and related relationships, and editorial collections with multi-field membership
- Structured definitions, citations, rights metadata, and evidence provenance
- JSON-LD and Turtle representations with content negotiation
- Read-only SPARQL query access
- Interactive Graph Explorer with relevance-ranked concept search, field filtering and clustering, one- and two-hop visualization, shortest paths, concept comparisons, and analytics
- Concept-specific links between the human-readable glossary and the Graph Explorer
- Automated graph validation, dependency monitoring, and CodeQL security analysis

The Knowledge Graph Explorer loads the published JSON-LD graph; it does not maintain a separate semantic dataset.

## Quick start

```bash
npm ci
npm run validate
npm run relationships:coverage
```

For production smoke tests, use `npm run validate:live`.

## Documentation

**[Documentation index](docs/README.md)** — architecture, semantic model, Graph Explorer, API reference, SPARQL, security, validation, publication, and roadmap.

Additional authoritative references: [semantic relationship policy](SEMANTIC-RELATIONSHIPS.md) · [data licensing](DATA-LICENSE.md).

## Publishing v0.0.85

To complete the v0.0.85 release:

1. Confirm the Squarespace glossary displays `v0.0.85` and includes concept-specific Graph Explorer links.
2. Update `gs:publicationVersion` in `public/glossary.jsonld` to `v0.0.85` without changing concept content or the semantic profile version.
3. Run `npm run validate` and review `npm run relationships:coverage`.
4. Open a pull request and wait for validation and security checks to pass before merging.
5. After deployment, run `npm run validate:live` and verify the published graph's version.
6. Create the `v0.0.85` GitHub tag/release only after the artifacts are synchronized.

Changes should be proposed through pull requests. See [Publication](docs/PUBLICATION.md) and [Validation](docs/VALIDATION.md) for the full workflow.
