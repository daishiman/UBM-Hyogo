# Phase 4 Output: 検証コマンド Suite

## RED Suite

```bash
rg -n "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md

grep -iE "discord|webhook|notif" \
  .github/workflows/ci.yml \
  .github/workflows/backend-ci.yml \
  .github/workflows/validate-build.yml \
  .github/workflows/verify-indexes.yml \
  .github/workflows/web-cd.yml

rg -n "workflow file|display name|job id|required status context" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
```

## 完了条件

Phase 5 適用後に 5 workflow 名、4 列分離表、Discord 通知未実装注記が確認できること。
