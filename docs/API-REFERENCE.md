# Public API and Identifiers

[Documentation index](README.md) · [Project overview](../README.md)

## URI conventions

Stable identifiers follow these patterns:

```text
https://id.i2idl.org/scheme
https://id.i2idl.org/concepts/{concept-id}
https://id.i2idl.org/definitions/{definition-id}
https://id.i2idl.org/sources/{source-id}
https://id.i2idl.org/collections/field/{collection-id}
https://id.i2idl.org/collections/type/{collection-id}
https://id.i2idl.org/collections/curated/{collection-id}
```

Example:

```text
https://id.i2idl.org/concepts/data-privacy
```

Explicit machine-readable representations are available as JSON-LD and Turtle:

```text
https://id.i2idl.org/concepts/data-privacy.jsonld
https://id.i2idl.org/concepts/data-privacy.ttl
```

## Public endpoints

### Graph Explorer

```text
https://id.i2idl.org/explore
https://id.i2idl.org/explore?concept=competency
```

The browser-based read-only research interface uses the published JSON-LD graph.


### Full glossary graph

```text
https://id.i2idl.org/glossary.jsonld
```

Returns the complete published JSON-LD graph.

### Concept scheme

```text
https://id.i2idl.org/scheme
https://id.i2idl.org/scheme.jsonld
https://id.i2idl.org/scheme.ttl
```

### Concepts

```text
https://id.i2idl.org/concepts/{id}
https://id.i2idl.org/concepts/{id}.jsonld
https://id.i2idl.org/concepts/{id}.ttl
```

Concept JSON-LD and Turtle representations include the concept, its active definition, evidence, and referenced source nodes.

### Definitions

```text
https://id.i2idl.org/definitions/{id}
https://id.i2idl.org/definitions/{id}.jsonld
https://id.i2idl.org/definitions/{id}.ttl
```

Definition representations include the definition, evidence, and referenced source nodes.

### Sources

```text
https://id.i2idl.org/sources/{id}
https://id.i2idl.org/sources/{id}.jsonld
https://id.i2idl.org/sources/{id}.ttl
```

### SPARQL

```text
https://id.i2idl.org/sparql
```

The SPARQL endpoint provides read-only query access to the same graph published at `/glossary.jsonld`.

A browser request with no query displays a lightweight query interface.

Supported query forms:

- `SELECT`
- `ASK`
- `CONSTRUCT`
- `DESCRIBE`

SPARQL Update operations, federation, and remote-dataset clauses are disabled.

## Content negotiation

Canonical identifiers are dereferenceable.

For a concept URI such as:

```text
https://id.i2idl.org/concepts/data-privacy
```

a request that accepts JSON-LD:

```bash
curl -H "Accept: application/ld+json" \
  https://id.i2idl.org/concepts/data-privacy
```

returns the machine-readable JSON-LD representation.

A request that accepts Turtle:

```bash
curl -H "Accept: text/turtle" \
  https://id.i2idl.org/concepts/data-privacy
```

returns Turtle.

A normal browser request or an explicit `Accept: text/html` request receives a `303 See Other` redirect to the corresponding concept in the human-readable glossary:

```text
https://www.i2idl.org/glossary#data-privacy
```

Explicit `.jsonld` and `.ttl` URIs always return the requested serialization.

The service supports public cross-origin reads:

```text
Access-Control-Allow-Origin: *
```
