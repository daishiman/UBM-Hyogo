# UI sanity visual review

| Check | Result | Notes |
| --- | --- | --- |
| Layout | completed_local_evidence_captured | Row-local panel does not overlap adjacent rows. |
| Text fit | completed_local_evidence_captured | Japanese labels and button text fit at 1440x900. |
| A11y surface | completed_local_evidence_captured | Textarea labels, disabled state, `role=alert`, and `aria-live` are present. |
| Token usage | completed_local_evidence_captured | No arbitrary HEX observed in changed component; `verify:tokens` rerun remains final gate. |
| Error UX | completed_local_evidence_captured | 400 / 409 are Japanese operator messages. |
