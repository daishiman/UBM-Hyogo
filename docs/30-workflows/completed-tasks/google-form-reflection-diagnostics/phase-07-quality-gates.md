---
phase: 7
title: 品質ゲート
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. ローカル必須ゲート

| # | gate | コマンド | 判定 |
| --- | --- | --- | --- |
| G-01 | typecheck (api) | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 |
| G-02 | typecheck (web) | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| G-03 | lint | `mise exec -- pnpm lint` | exit 0 |
| G-04 | diagnostics focused specs | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts apps/api/src/diagnostics/member-diagnosis.contract.spec.ts` | 全 green |
| G-05 | contract spec (D1 lane) | G-04 に含める | 全 green |
| G-06 | verify:phase12-compliance | `mise exec -- pnpm verify:phase12-compliance` | exit 0 |
| G-07 | gate-metadata:validate | `mise exec -- pnpm gate-metadata:validate` | OK > 0, ERROR = 0 |
| G-08 | indexes:rebuild idempotent | `mise exec -- pnpm indexes:rebuild` を 2 回連続実行し md5 diff なし | diff 0 |

## 2. CI required check 候補

本 Spec-A では新規 required check は追加しない。既存 CI gate (typecheck / lint / contract / verify-indexes / verify-gate-metadata / verify-phase12-compliance) で十分カバーされる。

## 3. user-gated (runtime) ゲート

| # | gate | 実施タイミング | 担当 |
| --- | --- | --- | --- |
| G-R-01 | staging deploy 後 `/admin/sync-status` 実アクセス | user 明示承認後 | user (daishiman) |
| G-R-02 | Playwright env-gated smoke 実行 + screenshot コミット | 同上 | user |
| G-R-03 | diagnostic result の Spec-B 起票判定 | 同上 | user |

## 4. ゲート失敗時の対応

| gate | 失敗パターン | 対応 |
| --- | --- | --- |
| G-01 / G-02 | 型不整合 | zod schema の `z.infer<>` から `type` を再 export、import パス修正 |
| G-04 / G-05 | hypothesis flag 期待値不一致 | Phase 4 truth table と Phase 6 §3 を照合し実装側を修正 |
| G-06 | canonical 9 headings 欠落 | `phase-12-compliance.md` / `outputs/phase-12/phase12-task-spec-compliance-check.md` を Phase 12 で確定する 9 headings に揃える |
| G-07 | `artifacts.json` zod schema violation | `gates[].evidence_path` が workflow root 相対か、`status` が enum 値か確認 |
| G-08 | indexes drift | `mise exec -- pnpm indexes:rebuild` を実行しコミット (手動 ledger には触らない) |

## 5. PR pre-flight

`bash scripts/verify-pr-ready.sh` で G-06 / G-07 / G-08 を一括検証可能。詳細は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照。
