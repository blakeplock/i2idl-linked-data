# Knowledge Graph Explorer

[Documentation index](README.md) · [Project overview](../README.md)

The public Graph Explorer is available at **https://id.i2idl.org/explore** and uses the published JSON-LD at `https://id.i2idl.org/glossary.jsonld`.

A concept can be selected directly with the `concept` query parameter, for example:

```text
https://id.i2idl.org/explore?concept=competency
```

The explorer provides interactive SKOS relationships (one- and two-hop navigation), field-based clustering and filtering, concept search, shortest-path analysis, concept comparison, and graph analytics.

The production explorer is served from `public/graph.html` through the `/explore` Vercel rewrite. It consumes the published graph rather than introducing a second canonical dataset.

The production implementation does **not** accept uploaded JSON-LD files. The local file-upload test path was removed following CodeQL security review.

Search behavior and releases should be checked against the current `public/graph.html` implementation. Follow pull-request checks for unmerged improvements.
