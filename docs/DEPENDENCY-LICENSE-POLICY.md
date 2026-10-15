# Dependency license policy

I2IDL permits commercial-use-permissive, non-copyleft open-source software dependencies. The approved lockfile license identifiers are: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, BlueOak-1.0.0, and `(WTFPL OR MIT)` / `(MIT OR WTFPL)` **using the MIT option**.

These identifiers do **not** waive copyright notices, license text reproduction, attribution, non-endorsement terms, or other license obligations. BSD, ISC and BlueOak permissions and notice provisions still apply. Patent permissions vary by license; permissive licenses are not identical.

An undeclared or ambiguous lockfile license is not automatically permitted. Review the installed package's actual license text and source, record the evidence in `docs/LICENSE-REVIEWS.json`, and approve only when its verified license meets policy. The pre-existing `negotiate@1.0.1` record identifies BSD-2-Clause in `node_modules/negotiate/negotiate.js` and is approved on that evidence. Future package versions must be reviewed separately.

Run `node scripts/check-licenses.mjs --strict` to fail on any unapproved exception. CI runs `--baseline`, which blocks any newly unapproved license. The baseline is empty after the policy update. `npm audit` is a separate vulnerability check and does not establish license compliance. SPDX license expressions beyond those expressly listed require manual review; do not interpret arbitrary OR/AND combinations as automatically allowed.

The repository software remains Apache-2.0; this policy governs **dependencies only**. The glossary's CC BY and third-party content rights are governed separately by `DATA-LICENSE.md`.
