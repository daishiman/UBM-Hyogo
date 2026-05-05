# Rule Detection Spec

Status: COMPLETED (enforced_dry_run review baseline).

Rule ID candidate: `@ubm-hyogo/no-stablekey-literal`.

Detection contract:

1. Build a known stableKey set from source-of-truth modules.
2. Visit string literals and static template literals.
3. If the value exactly matches a known stableKey and the file is outside allow-list/exception globs, report an error.
4. Error message must direct the developer to import from a source-of-truth module.

Fallback: a manifest may be used only if CI also verifies manifest/source drift.
