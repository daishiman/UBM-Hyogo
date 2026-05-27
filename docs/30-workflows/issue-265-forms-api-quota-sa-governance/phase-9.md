---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 9
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 9 (root pointer)

正本: `outputs/phase-9/phase-9.md`。

## サマリ

- 観測経路 4 種（呼び出し回数 / 429 / SA 認証失敗 / cron 成否）の取得元を明文化。
- SLO 3 指標（余裕率 ≤70% / 429 <1% / 連続失敗 ≤3）。
- 観測ログアクセスは `bash scripts/cf.sh tail` のみ（wrangler 直接呼び禁止）。
- dashboard / alert 実装は UT-08 範囲。
