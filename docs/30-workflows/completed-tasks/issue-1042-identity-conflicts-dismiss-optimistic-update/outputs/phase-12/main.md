# Phase 12: ドキュメント更新（main）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ワークフローは実コード実装・focused vitest 実行・Playwright・screenshot 取得まで完了。commit・PR は user-gated。Issue #1042 は **CLOSED のまま維持**（open/close を変更しない）。
> 親 workflow（merge 側）`issue-988-identity-conflicts-merge-optimistic-update` の Phase 12 フォーマットを正本として踏襲する。ただし親は `implemented_local_evidence_captured`（screenshot present）であるのに対し、本タスクも `implemented_local_evidence_captured`（screenshot captured）である点が異なる。

## このフェーズの目的

dismiss optimistic update（`IdentityConflictRow.tsx` への dismiss 専用 `optimisticDismissed: boolean` 追加）の実装仕様、実コード差分、視覚証跡 boundary、ドキュメント同期済みを strict 7 outputs として固定する。

## Phase 12 タスクサマリ（Task 12-1〜12-6）

| Task | 名称 | 本サイクルでの扱い | 成果物 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（2パート構成） | dismiss optimistic の概念説明 + 実装可能粒度の確定コード + 視覚証跡 boundary を記録 | `implementation-guide.md` |
| 12-2 | システム仕様書更新（Step 1 + 条件付き Step 2） | Step 1-A〜1-C を implemented_local_evidence_captured の現状で記録。Step 2 は新規 IF なしで N/A 判定 | `system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴作成 | workflow-local / global skill sync の実施結果を別ブロックで記録 | `documentation-changelog.md` |
| 12-4 | 未タスク検出（0件でも必須） | row fade animation は既存 unassigned に分離済み。本サイクル新規 formalize 0 件 | `unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | 本タスクで得た知見 3 観点を記録 | `skill-feedback-report.md` |
| 12-6 | Phase 12 compliance check（canonical 9 headings + strict 7） | strict 7 全 present・workflow_state 一致を確認 | `phase12-task-spec-compliance-check.md` |

## strict 7 outputs 一覧

| # | ファイル | リンク | 役割 |
| --- | --- | --- | --- |
| 1 | `main.md` | （本ファイル） | Phase 12 全体サマリと strict 7 へのリンク |
| 2 | `implementation-guide.md` | [implementation-guide.md](implementation-guide.md) | Part 1（概念）+ Part 2（技術）+ 視覚証跡 |
| 3 | `system-spec-update-summary.md` | [system-spec-update-summary.md](system-spec-update-summary.md) | Step 1（完了記録・状況・関連タスク）+ Step 2 判定（N/A） |
| 4 | `documentation-changelog.md` | [documentation-changelog.md](documentation-changelog.md) | 全 Step 結果の個別記録（workflow-local / global skill sync 別ブロック） |
| 5 | `unassigned-task-detection.md` | [unassigned-task-detection.md](unassigned-task-detection.md) | 未タスク検出（候補 1 件 + 関連タスク差分確認） |
| 6 | `skill-feedback-report.md` | [skill-feedback-report.md](skill-feedback-report.md) | テンプレート / ワークフロー / ドキュメント改善 |
| 7 | `phase12-task-spec-compliance-check.md` | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 headings + strict 7 present 確認 |

## 実装対象（参照）

| パス | 種別 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集（dismiss 専用 `optimisticDismissed` state 追加 + `onDismiss` 差し替え + render guard 統合） |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集（dismiss optimistic hide / rollback+理由保持 / success-stays-hidden + merge 非回帰） |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集（dismiss 後 row 消失 + server error rollback） |

> dismiss endpoint / payload / `useAdminMutation` hook / `page.tsx`（Server Component）/ D1 schema / merge optimistic 設計（#988 で確立済み）は不変。

## Issue 状態の注記

- Issue #1042（FU-AIDC-006）は調査時点（2026-06-01）で **CLOSED**。
- 本ワークフローは Issue の open/close 状態を変更しない（reopen / close 操作を行わない）。ユーザー指示により CLOSED のまま仕様書を作成する。

## 不変条件（実装時の遵守事項）

1. 既存 API のみ接続（#1）— dismiss endpoint / payload 不変
2. OKLch トークン正本（#2、HEX 直書き禁止）— render guard 1 行追加のみで新規トークンなし
3. admin form input は FormField / primitive 経由（#9）
4. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10、legacy `@/lib/useAdminMutation` 不使用）
5. optimistic state は操作種別ごとに分離（`optimisticMerged` と `optimisticDismissed` を共有しない）。合流は render guard `if (optimisticMerged || optimisticDismissed) return null;` のみ
6. rollback（`.catch`）で `dismissReason` を clear しない（保持）

## 完了条件

- strict 7 outputs（`main.md` 含む 7 ファイル）がすべて present であること。
- 各ファイルの `workflow_state` が `implemented_local_evidence_captured` で一致していること。
- `implementation-guide.md` の識別子（`optimisticDismissed` / `onDismiss` / `dismissMutation` / `dismissReason` / `setStage`）が Phase 1 設計と一致していること。
- apps/web の実装差分、focused Vitest、Playwright、Phase 11 screenshot 3 PNG が本サイクルで揃っていること。
