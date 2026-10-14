# Additional Documentation Topics

[Documentation index](README.md) · [Project overview](../README.md)

## Current platform: glossary, semantic services, and graph explorer

The I2IDL Glossary of Digital Learning has three complementary public interfaces:

| Interface | URL | Purpose |
| --- | --- | --- |
| Human-readable glossary | https://www.i2idl.org/glossary | Search, browse, filter, read definitions and citations, follow semantic neighborhoods and graph links |
| Knowledge Graph Explorer | https://id.i2idl.org/explore | Interactively examine concept networks and research relationships |
| Machine-readable Linked Data | https://id.i2idl.org/glossary.jsonld | Canonical published semantic graph, with per-resource representations and SPARQL access |

The Graph Explorer was introduced through [PR #50](https://github.com/blakeplock/i2idl-linked-data/pull/50). The deployed entry point is `/explore`, rewritten by `vercel.json` to `public/graph.html`.

### Knowledge Graph Explorer

The standalone explorer loads the published JSON-LD graph from `https://id.i2idl.org/glossary.jsonld`; it does not maintain a separate concept dataset or accept user-supplied local graph uploads. Its user-facing features include:

- Interactive concept-centered visualization with one- or two-hop expansion
- Broader, narrower, and related SKOS edges, retaining their distinct meanings
- Optional clustering and filtering by primary field
- Search across concept names, including relevance-ranked matching and alternative labels/acronyms
- Clickable concept detail views and connections back to persistent URIs and glossary cards
- Shareable, deep-linked concept views
- Shortest-path exploration between two concepts
- Side-by-side concept comparison and shared-neighbor exploration
- Graph analytics calculated from the published relationships

Open a concept directly with the `concept` query parameter, using its canonical identifier slug:

```text
https://id.i2idl.org/explore?concept=competency
https://id.i2idl.org/explore?concept=learning-analytics
```

The explorer is a **read-only visualization and research interface**. It does not edit the graph or infer new semantic equivalences. An absent or unrecognized concept slug falls back to the explorer's default concept.

### Glossary-to-graph navigation

The Squarespace glossary includes a top-level **Explore Knowledge Graph** entry point and an **Explore in Graph** link on each concept card. The per-card link uses the same stable concept slug as the Linked Data record.

The human-readable embed is maintained separately from the Vercel publication repository. Its presentation version may advance independently of the machine-readable graph release when a revision changes only layout, navigation, or search. Verify `gs:publicationVersion` in the deployed concept scheme before declaring a new graph/data release.

### Current semantic coverage

At the documented 397-concept graph baseline:

- 397 concepts with 397 definitions
- 14 source records and 541 evidence records
- 31 total collections, including three curated collections
- 171 concepts belonging to more than one field collection
- 397 concepts participating in semantic relationships; zero isolated concepts
- 31 distinct broader/narrower pairs and 644 distinct related pairs
- 17 external vocabulary mapping assertions, with editorially supported targets
- No CTDL ontology associations or external ontology-association assertions

Relationship **pairs** are counted once, although SKOS reciprocal assertions appear in both directions. External mapping assertions are distinct from internal `skos:broader`, `skos:narrower`, and `skos:related` edges and should not be interpreted as automatic equivalence.

### Explorer search behavior

Explorer search is concept-oriented, not a general full-text or web search. Its ranked search favors exact names and identifiers, preferred-name matches, alternate labels/acronyms, and then weaker matches; it limits the suggestion list to 12 results. Choosing a suggestion recenters the visualization on that canonical concept. Search does not create new relationships or modify graph data.

### Security and deployment notes

- The explorer renders glossary-derived text through DOM text APIs rather than treating it as arbitrary HTML.
- The production explorer reads only the published graph; the former local JSON-LD upload/testing path was removed following CodeQL review.
- CodeQL, dependency auditing, graph validation, and Vercel previews are part of the pull-request review workflow.
- Keep the viewer and JSON-LD release separate: editing `/explore` changes the interface, not the canonical concept data.

For a smoke test after changing `public/graph.html`, verify the live explorer loads, search returns the intended concept, graph navigation and research tools work, and a deep link such as `/explore?concept=competency` opens the intended concept.

<!-- END GRAPH EXPLORER AND CURRENT PLATFORM UPDATE -->
