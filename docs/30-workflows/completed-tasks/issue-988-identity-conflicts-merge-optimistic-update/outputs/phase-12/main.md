# Phase 12: ドキュメント更新（main）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ワークフローは automation-30 レビューで spec-only close-out から再分類し、実コード・focused tests・Playwright screenshots・same-wave sync を同一サイクルで反映した。commit / push / PR / Issue close は user-gated のまま維持する。

## このフェーズの目的

merge optimistic update（`IdentityConflictRow.tsx`）の実装結果、local evidence、ドキュメント・台帳・skill 同期を strict 7 outputs として固定する。

## Phase 12 タスクサマリ（Task 12-1〜12-6）

| Task | 名称 | 本サイクルでの扱い | 成果物 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（2パート構成） | 実装済み差分と視覚証跡 boundary を記録 | `implementation-guide.md` |
| 12-2 | システム仕様書更新（Step 1 + 条件付き Step 2） | Step 1-A〜1-C を same-wave 更新。Step 2 は新規 IF なしで N/A 判定 | `system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴作成 | workflow-local / global skill sync の結果を記録 | `documentation-changelog.md` |
| 12-4 | 未タスク検出（0件でも必須） | Phase 10 MINOR 2件を個別評価し、formalize 0 件として理由付き保留 | `unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | 本タスクで得た知見 3 観点を記録 | `skill-feedback-report.md` |
| 12-6 | Phase 12 compliance check（canonical 9 headings + strict 7） | strict 7 全 present・workflow_state 一致を確認 | `phase12-task-spec-compliance-check.md` |

## strict 7 outputs 一覧

| # | ファイル | リンク | 役割 |
| --- | --- | --- | --- |
| 1 | `main.md` | （本ファイル） | Phase 12 全体サマリと strict 7 へのリンク |
| 2 | `implementation-guide.md` | [implementation-guide.md](implementation-guide.md) | Part 1（概念）+ Part 2（技術）+ 視覚証跡 |
| 3 | `system-spec-update-summary.md` | [system-spec-update-summary.md](system-spec-update-summary.md) | Step 1（完了記録・状況・関連タスク）+ Step 2 判定 |
| 4 | `documentation-changelog.md` | [documentation-changelog.md](documentation-changelog.md) | 全 Step 結果の個別記録 |
| 5 | `unassigned-task-detection.md` | [unassigned-task-detection.md](unassigned-task-detection.md) | 未タスク検出（候補 1 件 + 関連タスク差分確認） |
| 6 | `skill-feedback-report.md` | [skill-feedback-report.md](skill-feedback-report.md) | テンプレート / ワークフロー / ドキュメント改善 |
| 7 | `phase12-task-spec-compliance-check.md` | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 headings + strict 7 present 確認 |

## 実装対象（参照）

| パス | 種別 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集 |

> API contract / D1 schema / page.tsx（Server Component）は不変。

## Issue 状態の注記

- Issue #988 は調査時点（2026-05-29）で **OPEN**。ユーザー認識（「クローズド」）と GitHub 実状態が乖離していたため明記する。
- 本ワークフローは Issue の open/close 状態を変更しない。close 判断は実装完了後 Phase 13（user-gated）。

## 不変条件（実装時の遵守事項）

1. 既存 API のみ接続（#1）
2. OKLch トークン正本（#2、HEX 直書き禁止）
3. admin form input は FormField / primitive 経由（#9）
4. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10、legacy `@/lib/useAdminMutation` 不使用）
