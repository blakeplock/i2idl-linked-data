# I2IDL Linked Data - Phase 1

This project publishes the I2IDL Digital Learning Glossary as JSON-LD and makes stable semantic identifiers dereferenceable.

## Local development

1. Install Node.js.
2. Run `npx vercel login`.
3. Run `npx vercel dev`.
4. Open the local URL shown by Vercel.

## Test

- `/`
- `/glossary.jsonld`
- `/scheme.jsonld`
- `/concepts/data-privacy.jsonld`
- `/concepts/data-privacy` (browser redirect to the human glossary)

## Production

Run `npx vercel --prod`, then add `id.i2idl.org` to the Vercel project and configure the exact CNAME that Vercel provides in Squarespace DNS.
# i2idl-linked-data
