# SPARQL Query Guide

[Documentation index](README.md) · [Project overview](../README.md)

## SPARQL usage

### Browser interface

Open:

```text
https://id.i2idl.org/sparql
```

The browser interface includes a query editor and examples for the supported query forms.

### SELECT

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?concept ?label
WHERE {
  ?concept a skos:Concept ;
           skos:prefLabel ?label .
}
ORDER BY ?label
LIMIT 25
```

Example request:

```bash
curl -G \
  --data-urlencode 'query=SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 5' \
  https://id.i2idl.org/sparql
```

`SELECT` responses use:

```text
application/sparql-results+json
```

### ASK

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

ASK {
  <https://id.i2idl.org/concepts/data-privacy>
    a skos:Concept .
}
```

`ASK` responses also use:

```text
application/sparql-results+json
```

### CONSTRUCT

```sparql
CONSTRUCT {
  <https://id.i2idl.org/concepts/data-privacy> ?p ?o .
}
WHERE {
  <https://id.i2idl.org/concepts/data-privacy> ?p ?o .
}
```

### DESCRIBE

```sparql
DESCRIBE <https://id.i2idl.org/concepts/data-privacy>
```

`CONSTRUCT` and `DESCRIBE` responses are serialized as Turtle:

```text
text/turtle
```

### POST

The endpoint also accepts SPARQL queries by POST:

```bash
curl -X POST \
  -H "Content-Type: application/sparql-query" \
  --data 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 5' \
  https://id.i2idl.org/sparql
```

## SPARQL service limits

The endpoint is intentionally read-only and includes guardrails for public use.

Current limits:

- maximum query length: `12,000` characters
- maximum POST request body: `16 KB`
- execution guard: `10` seconds
- maximum `SELECT` result size: `5,000` rows
- maximum `CONSTRUCT` / `DESCRIBE` result size: `5,000` quads
- application rate limit: `30` requests per minute per client on a warm serverless instance
- SPARQL Update operations are not permitted
- `SERVICE` federation is not permitted
- `FROM` and `FROM NAMED` remote-dataset clauses are not permitted

These limits are implementation safeguards and may be adjusted as the service evolves.
