# Phase 12: ドキュメント更新

正本: `outputs/phase-12/`（strict 7 成果物）

この root entry は `validate-phase-output.js` が参照する Phase 12 仕様入口である。実体は `outputs/phase-12/` 配下の 7 ファイルを正本とする。

## メタ情報

| 項目 | 値 |
|------|------|
| taskId | `ADMIN-MEMBER-DETAIL-TAG-SOURCE-500-AND-DRAWER-RESILIENCE` |
| workflow_state | `implemented_local_evidence_captured` |

## 目的

実装ガイド（Part 1/Part 2）・システム仕様同期判定・変更履歴・未タスク検出・skill feedback・compliance check を揃え、後続の本実装サイクルが迷わず着手できる状態にする。

## 実行タスク

1. strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を `outputs/phase-12/` に揃える。
2. `artifacts.json` と `outputs/artifacts.json` を byte-identical に同期する。
3. `gate-metadata:validate` ERROR 0 / `verify:phase12-compliance` ok=true を確認する。

## 成果物

| Task | 成果物 |
|------|--------|
| index | `outputs/phase-12/main.md` |
| 12-1 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| 12-2 システム仕様更新 | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 変更履歴 | `outputs/phase-12/documentation-changelog.md` |
| 12-4 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 skill feedback | `outputs/phase-12/skill-feedback-report.md` |
| 12-6 compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`（契約不変＝更新なし）
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `_shared-context.md`（設計確定事実の単一ソース）

## 完了条件

- [x] strict 7 が全て present（`gate-metadata:validate` ERROR 0 / `verify:phase12-compliance` ok=true で確認済み）
- [x] `artifacts.json` と `outputs/artifacts.json` が byte-identical
- [x] system spec は契約不変のため更新なし（`system-spec-update-summary.md` に記録）
