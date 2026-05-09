# Phase 8 Output: DRY 化（implementation cycle）

Canonical source: `../../phase-08.md`

- redact filter は `scripts/smoke/redact.sh` 単一実装に集約（runner / poster 共有）
- summary.json schema は `runtime-attendance-provider.sh` 側で生成し、`ci-summary-post.sh` は read-only で消費（責務分離）
- workflow / web-cd 双方の dispatch event-type を `staging-deployed` で統一
