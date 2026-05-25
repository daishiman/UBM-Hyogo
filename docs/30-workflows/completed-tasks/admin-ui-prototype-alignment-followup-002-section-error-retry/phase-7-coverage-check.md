---
phase: 7
title: Quality gates
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 7: 品質ゲート

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 7 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

品質ゲートの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-7-coverage-check.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. ローカル gate（pre-PR）

| # | gate | コマンド | 期待 |
|---|------|---------|------|
| 1 | typecheck | `mise exec -- pnpm typecheck` | 0 error |
| 2 | lint | `mise exec -- pnpm lint` | 0 error / 0 warning |
| 3 | unit (existing) | `mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx` | all pass（regression assert 含む） |
| 4 | unit (new) | `mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx` | all pass（jest-axe 含む） |
| 5 | a11y (axe) | unit spec 内 axe scan | critical violation 0 |
| 6 | design-tokens | `mise exec -- pnpm verify:tokens` | green（既存 gate） |
| 7 | grep use-client | `rg -n '^"use client"' apps/web/app/\(admin\)/admin/` | diff で新規追加なし |
| 8 | pr-pre-flight | `bash scripts/verify-pr-ready.sh` | 全 green |
| 9 | gate-metadata | `mise exec -- pnpm gate-metadata:validate` | 0 error |
| 10 | phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` | green |

## 2. CI required status checks（候補・Phase 13 で明示）

| context | 必須/任意 |
|---------|-----------|
| typecheck | 必須 |
| lint | 必須 |
| vitest (web unit) | 必須 |
| verify-design-tokens | 必須 |
| verify-gate-metadata | 必須 |
| verify-phase12-compliance | 必須 |

> branch protection の `gh api -X PUT` は user 明示承認後のみ実行。本 spec では候補列挙にとどめる（CLAUDE.md「branch protection 実値が正本」方針）。

## 3. gate 失敗時の優先対処

1. typecheck → props 型不整合 / `Omit` の指定漏れを確認
2. lint → `pnpm lint --fix` で自動修復後、残違反を手修正
3. unit → Phase 6 §7 失敗時切り分け表を参照
4. design-tokens → 本 component 内 HEX 排除（Phase 6 §5）
5. pr-pre-flight → `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` 参照

## 4. 例外

- 本タスクは `visualEvidence: NON_VISUAL` のため visual baseline gate（`playwright-smoke / visual`）は適用外
- D1 lane gate は対象外（D1 / API 変更なし）
