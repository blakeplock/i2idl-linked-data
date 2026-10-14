# Phase 5 — Concept version history in the Graph Explorer

The existing concept sidebar fetches its selected concept's historical revisions from the canonical Phase 4 endpoint `/concepts/{slug}/versions`. It does not infer or manufacture changes. As of v0.0.87 each concept has revision 1.

The component uses DOM-safe text insertion, constrained slugs, same-origin fetching, and a selection sequence token to ignore stale asynchronous results when the user selects another concept. It provides directly resolvable links to JSON-LD, Turtle and immutable N-Quads, plus the history resource.

This phase intentionally does not claim to offer visual RDF diffing while the published collection only contains one revision per concept. A future phase can use published revision data for trustworthy comparisons.

Test cases: expected revision 1, rapid selection changes, 404/service unavailable, small/mobile sidebar, no regressions in research actions or network rendering. The glossary dataset and Squarespace embed are unchanged.
