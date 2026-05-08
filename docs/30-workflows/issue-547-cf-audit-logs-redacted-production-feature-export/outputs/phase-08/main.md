# Phase 8 Output: Error Handling and Security

Verdict: `COMPLETED`

Fail-closed behavior implemented:

- Missing or short redaction secret throws before export.
- Invalid windows throw before D1 access.
- Schema validation failure blocks output publication.
- Redaction guard failure blocks output publication.
- Secret leakage scan failure blocks output publication.
- Production read-only export remains user-gated.

Final JSONL and manifest paths are published only after all local gates pass.
