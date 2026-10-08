# I2IDL Glossary Semantic Relationships

The I2IDL Digital Learning Glossary publishes editorially reviewed semantic relationships among concepts as part of its Linked Data graph.

Beginning with release `v0.0.80`, every published glossary concept participates in at least one internal semantic relationship.

## Editorial principle

Relationships are intended to express defensible conceptual structure.

They are not generated automatically from lexical similarity, shared keywords, embedding similarity, vector proximity, or automated clustering.

Automated methods may assist editors in identifying candidates for review, but publication of a semantic relationship requires editorial judgment.

Field membership and curated-collection membership are not treated as semantic relationships by themselves. A concept may belong to one or more collections without implying hierarchy or conceptual equivalence.

## Internal concept relationships

The internal relationship model currently uses three SKOS properties:

```text
skos:broader
skos:narrower
skos:related