# Phase 6 Output: Failure Cases

| Failure | Planned Handling |
| --- | --- |
| Unknown stableKey | `Result.err({ kind: "unknownStableKey" })` and drift log |
| Alias queue unavailable | generated static manifest baseline |
| Conflicting section | fail verification and block Phase 10 GO |
| Migration mismatch | stop D1 path and use baseline resolver |

