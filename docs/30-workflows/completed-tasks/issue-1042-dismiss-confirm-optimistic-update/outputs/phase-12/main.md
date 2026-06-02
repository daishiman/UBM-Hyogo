**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 12: ドキュメント更新（main）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ワークフローは Issue #1042（FU-AIDC-006）の dismiss optimistic update を同一サイクルで実装し、focused tests と Playwright screenshots まで取得済みである。commit / push / PR / Issue 状態変更は user-gated。

## このフェーズの目的

dismiss optimistic update（`IdentityConflictRow.tsx`）の実装可能粒度を、実装ガイド・システム仕様判定・未タスク検出・skill フィードバック・compliance check として strict 7 outputs に固定する。本タスクは #988 / #1046（merge optimistic）の dismiss 側 mirror である。

## 実装・証跡結果

| 項目 | 結果 |
| --- | --- |
| 実装 | `IdentityConflictRow.tsx` に `optimisticDismissed` state を追加し、dismiss trigger 前に row を非表示、reject 時に rollback |
| focused Vitest | `outputs/phase-11/evidence/focused-vitest.log`（1 file / 14 tests PASS） |
| Playwright | `outputs/phase-11/evidence/playwright-dismiss.log`（desktop-chromium / 2 tests PASS） |
| screenshots | `identity-conflict-row-dismiss-optimistic-removed.png`, `identity-conflict-row-dismiss-rollback-error.png` |

## Phase 12 タスクサマリ（Task 12-1〜12-6）

| Task | 名称 | 本サイクルでの扱い | 成果物 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（2パート構成） | dismiss optimistic の確定コード・識別子・視覚証跡 boundary を記述 | `implementation-guide.md` |
| 12-2 | システム仕様書更新（Step 1 + 条件付き Step 2） | Step 1-A〜1-C を記述。Step 2 は新規 IF なしで N/A 判定 | `system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴作成 | workflow-local / global skill sync の予定を記録 | `documentation-changelog.md` |
| 12-4 | 未タスク検出（0件でも必須） | fade animation は別 Issue followup-005 へ分離済みとして formalize 0 件 | `unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | merge mirror 設計の知見 3 観点を記録 | `skill-feedback-report.md` |
| 12-6 | Phase 12 compliance check（canonical 9 headings + strict 7） | strict 7 全 present・workflow_state 一致を確認 | `phase12-task-spec-compliance-check.md` |

## strict 7 outputs 一覧

| # | ファイル | リンク | 役割 |
| --- | --- | --- | --- |
| 1 | `main.md` | （本ファイル） | Phase 12 全体サマリと strict 7 へのリンク |
| 2 | `implementation-guide.md` | [implementation-guide.md](implementation-guide.md) | Part 1（概念）+ Part 2（技術）+ 視覚証跡 |
| 3 | `system-spec-update-summary.md` | [system-spec-update-summary.md](system-spec-update-summary.md) | Step 1（完了記録・状況・関連タスク）+ Step 2 判定 |
| 4 | `documentation-changelog.md` | [documentation-changelog.md](documentation-changelog.md) | 全 Step 結果の個別記録 |
| 5 | `unassigned-task-detection.md` | [unassigned-task-detection.md](unassigned-task-detection.md) | 未タスク検出（formalize 0 件 + 関連タスク差分確認） |
| 6 | `skill-feedback-report.md` | [skill-feedback-report.md](skill-feedback-report.md) | テンプレート / ワークフロー / ドキュメント改善 |
| 7 | `phase12-task-spec-compliance-check.md` | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 headings + strict 7 present 確認 |

## 実装対象（参照）

| パス | 種別 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集 |

> API contract / D1 schema / page.tsx（Server Component）/ `useAdminMutation` hook / merge 側挙動は不変。

## Issue 状態の注記

- Issue #1042 は調査時点（2026-06-01）で **OPEN**。ユーザー認識（「クローズド」）と GitHub 実状態が乖離していたため明記する。
- 本ワークフローは Issue の open/close 状態を変更しない。close 判断は実装完了後 Phase 13（user-gated）。

## 不変条件（実装時の遵守事項）

1. 既存 API のみ接続（#1）
2. OKLch トークン正本（#2、HEX 直書き禁止）
3. `apps/web` から D1 直接アクセス禁止（#5）
4. admin form input は FormField / primitive 経由（#9）
5. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10、legacy `@/lib/useAdminMutation` 不使用）
