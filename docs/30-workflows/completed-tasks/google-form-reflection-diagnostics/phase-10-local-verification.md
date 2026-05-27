---
phase: 10
title: ローカル検証コマンド
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 10 — ローカル検証

[実装区分: 実装仕様書]

## 1. 順序付き実行コマンド

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260526-065023-wt-7

# 1. 依存導入 (初回 / lockfile 変更時)
mise exec -- pnpm install

# 2. 型チェック
mise exec -- pnpm --filter @ubm-hyogo/api typecheck 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/typecheck-api.log
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/typecheck-web.log

# 3. lint
mise exec -- pnpm lint 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/lint.log

# 4. diagnostics focused specs (unit + D1 route contracts)
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts apps/api/src/diagnostics/member-diagnosis.contract.spec.ts 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/diagnostics-focused-vitest.log

# 5. Phase 12 / gate-metadata / indexes
mise exec -- pnpm verify:phase12-compliance 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/verify-phase12-compliance.log
mise exec -- pnpm gate-metadata:validate 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/gate-metadata.log
mise exec -- pnpm indexes:rebuild

# 7. (user-gated) Playwright env-gated smoke
STAGING_SMOKE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin/sync-status.spec.ts 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/playwright-smoke.log

# 8. PR pre-flight
bash scripts/verify-pr-ready.sh 2>&1 | tee docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/verify-pr-ready.log
```

## 2. 期待 exit code

| 手順 | exit code | 失敗時の対応 |
| --- | --- | --- |
| 2 | 0 | 型不整合を最小差分で修正 (Phase 7 §4) |
| 3 | 0 | `pnpm lint --fix` → 残違反を手修正 |
| 4 | 0 | hypothesis flag 期待値を Phase 4 §2.2/§2.3 と照合 |
| 5 | 0 | D1 fixture seeding を `sync-forms-responses.contract.spec.ts` と揃える |
| 6 | 0 | OK > 0 / ERROR = 0 を確認 |
| 7 | 0 (staging credentials 揃った時のみ) | env 未設定なら skip 表示で OK |
| 8 | 0 | `pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照 |

## 3. 冪等性チェック

```bash
mise exec -- pnpm indexes:rebuild
md5sum .claude/skills/aiworkflow-requirements/indexes/topic-map.md .claude/skills/aiworkflow-requirements/indexes/keywords.json
mise exec -- pnpm indexes:rebuild
md5sum .claude/skills/aiworkflow-requirements/indexes/topic-map.md .claude/skills/aiworkflow-requirements/indexes/keywords.json
# 2 回の md5 が完全一致すること
```

## 4. ローカル検証の DoD

- 手順 2-6 がすべて exit 0
- 手順 8 が exit 0
- 手順 3 の冪等性チェックで md5 一致
- 手順 7 は user-gated (staging credentials 揃ったときに実施)
