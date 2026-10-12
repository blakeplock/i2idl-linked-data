# CTDL Property and Controlled-Vocabulary Discovery — v0.0.85

Research-only addendum to the class candidate register. 20 new property candidates, all `proposed`; **do not** import these records into `public/glossary.jsonld` or treat them as approved mappings.

The new target type is `rdf:Property`, distinct from the existing `rdfs:Class` associations. A future profile extension needs an appropriate relationship type (for example `relatedProperty`) and review rules rather than reusing `relatedClass`.

**Research scope:** I2IDL concepts relating to delivery methods, assessments, competencies, learning resources, and learning metadata. The list is intentionally provisional. Candidate CTDL property names appear in the official vocabulary and mapping guidance, but individual URI dereference, class/domain/range checks, controlled value selections, and conceptual appropriateness are pending.

**Sources**
- https://www.credreg.net/ctdl/mapping
- https://www.credreg.net/ctdl/terms
- https://www.credreg.net/ctdlasn/mapping

**Next review**
1. Check the URI and whether each named term is an `rdf:Property` in the current release.
2. Evaluate the property's domain and range; a link from an I2IDL concept is an editorial pointer, not a claim that the concept uses the property directly.
3. Identify valid controlled vocabulary schemes and actual instances for delivery and learning method types.
4. Record substantive semantic commentary from Credential Engine and I2IDL before approval.
