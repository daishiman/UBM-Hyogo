# Phase 11 manual checklist

| Scenario | Expected | Result |
| --- | --- | --- |
| idle list | Two fixture rows, merge and dismiss buttons visible | completed_local_evidence_captured |
| inline confirm open | `確認 1/2` panel opens in the selected row | completed_local_evidence_captured |
| merge final | reason textarea is labeled and `merge 実行` requires non-empty reason | completed_local_evidence_captured |
| success | hook success path closes panel and calls router.refresh / toast | completed_local_evidence_captured |
| error 409 | panel remains open, reason retained, Japanese alert visible | completed_local_evidence_captured |
| error 400 | panel remains open, reason retained, Japanese alert visible | completed_local_evidence_captured |
