# Scholarly Research Discovery

[Documentation index](README.md) · [Project overview](../README.md)

The [Knowledge Graph Explorer](https://id.i2idl.org/explore) includes experimental scholarly discovery powered by OpenAlex. Results are exploratory, **not part of the curated I2IDL glossary**, and are not endorsed by I2IDL.

## Workflows

- **Single concept:** choose a node in the Explorer and select **Find papers on this concept**; or use the Research Discovery panel with a selected concept.
- **Research cluster:** add two to five concepts, then enable **Search intersection** and run the search.
- **Quality controls:** restrict publication years, require open access, and rank by relevance, total citations, publication date, or average citations per year.
- **Export:** download the currently displayed results in CSV or BibTeX. The export includes I2IDL concept identifiers/labels and the search settings. BibTeX includes concept URIs in notes and concepts as keywords for reference managers such as Zotero.

## How matches are determined

The service resolves concept labels from the published I2IDL glossary index; it does not accept arbitrary search labels as trusted concept identifiers. For a cluster search, the API runs bounded OpenAlex searches and reports label occurrences found in indexed titles or abstracts. Candidate results must match at least two distinct selected preferred labels. These are **lexical discovery signals**, not evidence that a work integrates the concepts or that I2IDL has asserted new semantic relationships.

The API returns up to 15 papers per search. This is a bounded discovery sample, not an exhaustive literature review. OpenAlex indexing and coverage may be incomplete, especially for abstracts and older publications. Ranking in a multi-concept search operates on this retrieved candidate pool.

## Citation metrics

- **Total citations** are the OpenAlex-reported count when retrieved.
- **Citations per year** equals total citations divided by the inclusive number of years since publication, through the current UTC year, with a minimum divisor of one.
- Neither metric establishes scholarly quality, causal influence, or field-normalized impact.

Publication metadata, DOI identifiers, citation counts, and open-access flags are supplied by OpenAlex and may change. Validate relevant records independently before citing them. Some exported BibTeX items use `@misc` because the discovery response does not contain enough type-specific bibliographic fields for faithful journal/book/conference classifications.

## API

`GET /api/research` accepts:

| Parameter | Purpose |
|---|---|
| `concepts` | One to five comma-separated canonical concept slugs |
| `sort` | `relevant`, `foundational`, `recent`, `annual` |
| `fromYear`, `toYear` | Optional inclusive publication-year bounds |
| `openAccess` | `any` or `only` |

The server uses OpenAlex through a bounded, same-origin proxy. Configure `OPENALEX_API_KEY` on Vercel if needed. Do not expose it in browser scripts or commit credentials.

## Data integrity

OpenAlex results are never inserted into `public/glossary.jsonld`, its evidence records, its semantic relationships, or its editorial collections by this feature. The researcher decides whether to use any discovery result; entry into the curated glossary requires a separate editorial process.
