I2IDL Graph Explorer - Production Candidate
===========================================

This is the existing tested Research & Analytics prototype packaged for hosting
on the I2IDL Linked Data Vercel deployment. It has not yet been deployed.

Before running:
* In GitHub Desktop, Fetch origin, switch to the latest main, then create a
  NEW feature branch named graph-explorer-production and publish it.
* Download this package and unzip it.

Installation:
1. Copy the folder containing graph.html and install-graph.py into your
   local i2idl-linked-data repository. Avoid placing it in public/.
2. Open Terminal in the root of your i2idl-linked-data repository.
3. Run (adjust path to match where you copied the folder):
      python3 i2idl-graph-production/install-graph.py
      npm run validate
4. In GitHub Desktop, commit ONLY public/graph.html and vercel.json.
   Commit message: Add standalone I2IDL graph explorer
5. Push the branch, create a pull request, check required CI, merge when ready.
6. Check https://id.i2idl.org/explore and the concept-specific link:
      https://id.i2idl.org/explore?concept=competency
7. Once confirmed, add a button or navigation link on Squarespace:
      Explore the Knowledge Graph -> https://id.i2idl.org/explore

Behavior:
* Reads the authoritative https://id.i2idl.org/glossary.jsonld at runtime.
* No changes to glossary definitions or semantic relationship assertions.
* No CTDL mappings added; research remains on its separate branch.
* Link to a focused view: /explore?concept=<canonical-concept-slug>.
* Buttons and metrics mirror the previously tested Research & Analytics trial.
* Local file-upload fallback is retained only for diagnostics.
* Automated check performed: JavaScript parses under node --check.
* Full browser/deployment testing still required.

Rollback:
Revert the merge containing public/graph.html and the /explore rewrite.
The glossary JSON-LD and Squarespace embed remain unaffected.
