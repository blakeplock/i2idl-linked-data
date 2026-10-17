#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Prepare the v0.0.91 platform-only publication.

import fs from "node:fs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const previous = "v0.0.90";
const next = "v0.0.91";
const read = (path) =>
  JSON.parse(fs.readFileSync(path, "utf8"));

const sourcePath = "public/glossary.jsonld";
const releasePath = `versioning/releases/${next}.json`;
const registryPath = `versioning/registry/${next}.jsonld`;

assert(!fs.existsSync(releasePath), "Release already exists");
assert(!fs.existsSync(registryPath), "Registry already exists");

const source = fs.readFileSync(sourcePath, "utf8");
const graph = JSON.parse(source);
const scheme = graph["@graph"].find(
  (node) => node["@id"] === "https://id.i2idl.org/scheme"
);

assert(scheme, "Concept scheme missing");
assert.equal(scheme["gs:publicationVersion"], previous);

const oldManifest = read(
  `versioning/releases/${previous}.json`
);

assert.equal(oldManifest.conceptCount, 420);
assert.equal(oldManifest.entries.length, 420);

const oldRegistry = read(
  `versioning/registry/${previous}.jsonld`
);

// Change only the publication version in the canonical graph.
const pattern = /"gs:publicationVersion"\s*:\s*"v0\.0\.90"/g;
const matches = source.match(pattern) || [];
assert.equal(matches.length, 1, "Expected one version field");

const updatedSource = source.replace(
  pattern,
  '"gs:publicationVersion": "v0.0.91"'
);

// Confirm no other graph data changed.
const updatedGraph = JSON.parse(updatedSource);
const updatedScheme = updatedGraph["@graph"].find(
  (node) => node["@id"] === "https://id.i2idl.org/scheme"
);
updatedScheme["gs:publicationVersion"] = previous;
assert.deepEqual(updatedGraph, graph);

// Reuse every existing concept revision and content hash.
const manifest = {
  ...oldManifest,
  release: next,
  entries: oldManifest.entries
};

// No new concept revisions in a platform-only release.
const registry = {
  "@context": oldRegistry["@context"],
  "@graph": []
};

fs.writeFileSync(sourcePath, updatedSource);
fs.writeFileSync(
  releasePath,
  JSON.stringify(manifest, null, 2) + "\n"
);
fs.writeFileSync(
  registryPath,
  JSON.stringify(registry, null, 2) + "\n"
);

// Regenerate presentation payloads and validate.
execFileSync(
  process.execPath,
  ["scripts/build-glossary-staged.mjs"],
  { stdio: "inherit" }
);

execFileSync(
  process.execPath,
  ["scripts/validate-version-release.mjs", "--release", next],
  { stdio: "inherit" }
);

execFileSync(
  "npm",
  ["run", "validate"],
  { stdio: "inherit" }
);

console.log(`Prepared ${next} platform release.`);
console.log("Review all changes before committing.");
