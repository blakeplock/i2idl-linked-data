# Project Status and Roadmap

[Documentation index](README.md) · [Project overview](../README.md)

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
- deterministic SPARQL query-type parsing
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
- CodeQL analysis for JavaScript/TypeScript and GitHub Actions

### Phase 5: Multi-collection semantic classification

**Complete.**

The glossary supports many-to-many concept membership across all 12 field collections while retaining one stable identifier and one primary field for each concept.

Provides:

- cross-field `skos:Collection` membership
- stable concept identity across classifications
- preservation of primary field assignments
- collection-member validation
- duplicate-membership protection
- multi-field integrity checks
- pairwise field intersections through SPARQL
- support for comparative analysis of field overlap
- 600 field memberships across 397 concepts
- 171 concepts represented in more than one field collection

### Phase 6: Semantic relationships and graph navigation

**Complete in v0.0.80.**

The glossary now operates as an explicitly connected knowledge graph.

Provides:

- editorially reviewed `skos:broader`
- editorially reviewed `skos:narrower`
- editorially reviewed `skos:related`
- reciprocal relationship validation
- protection against duplicate relationships and self-references
- separation of hierarchical and associative relationships
- 397 of 397 concepts participating in the semantic graph
- 31 broader/narrower relationship pairs
- 644 related relationship pairs
- 100% internal semantic relationship coverage
- permanent relationship-coverage reporting
- human-readable concept neighborhoods
- broader, narrower, and related concept navigation

### Phase 7: Curated semantic pathways

**Complete.**

Provides:

- three curated SKOS collections
- stable curated collection URIs
- curated collection validation
- human-readable collection exploration
- machine-readable collection membership
- separation of curated pathways from semantic hierarchy

## Next development priorities

### 1. Expand and review external vocabulary mappings

Initial externally linked mappings are published (17 assertions at the documented baseline). Further coverage and editorial review remain future work.

Continue mapping concepts to authoritative external vocabularies only where equivalence or correspondence can be editorially justified.

Priority targets include:

- UNESCO Thesaurus and related UNESCO vocabularies
- Schema.org
- IEEE learning-technology terminology
- xAPI terminology and concepts
- other relevant controlled vocabularies and standards

External mappings should use SKOS mapping predicates carefully:

```text
skos:exactMatch
skos:closeMatch
skos:relatedMatch
```

Internal semantic relationships and external vocabulary mappings should remain distinct.

The objective is to make the I2IDL glossary a semantic bridge across learning-technology ecosystems while avoiding overstated equivalence.

### 2. Add an ordinary-user API/query layer

SPARQL remains the canonical graph-query interface, but most application developers and ordinary users will not write SPARQL.

A lightweight API layer could expose routes such as:

```text
/api/concepts?q=competency
/api/concepts/data-privacy
/api/related/data-privacy
```

This would make the glossary easier to integrate into:

- applications
- research tools
- RAG systems
- AI agents
- future Glossary Studio namespaces

The API should remain a projection of the same canonical graph rather than creating a second source of truth.

### 3. Continue improving human-readable provenance

The glossary already distinguishes `direct` and `supporting` evidence relationships and exposes entry-level citations.

Further explanation of editorial lineage and evidence confidence remains an enhancement opportunity.

Examples:

```text
Definition provenance: Direct source definition
```

or:

```text
Definition provenance: I2IDL synthesis supported by source evidence
```

This exposes editorial lineage as a feature of the glossary and helps users distinguish source-derived definitions from I2IDL synthesis.

### 4. Add machine-readable change history

The project already versions every published release.

A machine-readable change dataset should record events such as:

- concept added
- definition revised
- source changed
- relationship added
- collection membership changed
- evidence reclassified
- external mapping added or revised

This would improve scholarly traceability, standards work, reproducibility, and downstream synchronization.

The change history should use stable identifiers and, where practical, provenance terms already present in the graph.
