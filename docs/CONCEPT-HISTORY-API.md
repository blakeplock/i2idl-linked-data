# Phase 4: concept history resolution (API)

This phase adds historical resolution **without changing the existing current-concept routes**. The canonical `/concepts/{slug}` route still resolves through `api/resolve.mjs` and redirects to the human glossary for browser requests.

* `/concepts/{slug}/versions` — version-history collection, JSON-LD response.
* `/concepts/{slug}/versions/{n}` — revision resource, JSON-LD by default, Turtle with `Accept: text/turtle`, raw named-graph N-Quads with `Accept: application/n-quads`.
* `.jsonld`, `.ttl`, `.nq` suffixes on individual revisions explicitly select a representation.

History is derived from immutable Git release manifests. Revision files are read from `versioning/snapshots/{slug}/{n}.nq` and verified against the manifest's SHA-256 before delivery. A historical resource includes provenance identifiers and content digest; the revision graph contains the concept, active definition, and collection membership assertions as captured at publication. Shared source nodes are not copied into version snapshots.

The router accepts `GET`, `HEAD`, and `OPTIONS`. Unknown concepts/revisions return 404; invalid slugs return 400. Content negotiation defaults to JSON-LD, including browser requests. Full history does not yet appear in the Graph Explorer or Squarespace glossary.

The function needs `versioning/**` packaged as serverless function assets; the associated `vercel.json` `includeFiles` setting must be tested on a Vercel preview before merge. It should never expose `versioning/proposals/`, which is local and ignored.

### Local smoke tests

```bash
node --check api/version-history.mjs
node scripts/test-version-history.mjs
npm run validate
```

### Preview checks (after deployment)

```bash
curl -i 'https://PREVIEW-DOMAIN/concepts/learning-engineering/versions'
curl -i -H 'Accept: text/turtle' 'https://PREVIEW-DOMAIN/concepts/learning-engineering/versions/1'
curl -i 'https://PREVIEW-DOMAIN/concepts/learning-engineering/versions/2'
```

Expected status codes: `200`, `200`, `404` while the only published revision is revision 1.

**Note:** this phase does not assert that old revision links exist in SPARQL; separate RDF ingest or federated graph handling is needed for that capability.
