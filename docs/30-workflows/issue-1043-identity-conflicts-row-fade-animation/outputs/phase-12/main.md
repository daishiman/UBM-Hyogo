# Phase 12: ドキュメント更新（main）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ワークフローは Issue #1043（FU-AIDC-007）の Phase 1-13 実装仕様書を作成する implemented_local_evidence_captured タスクである。`IdentityConflictRow.tsx` の exiting 相追加、focused Vitest、local Playwright、Phase 11 screenshot 3 PNG 取得は完了。commit・push・PR・Issue mutation は user-gated。

## このフェーズの目的

merge optimistic hide の row 消失を「即時 `return null`」から「短い fade / collapse による退場（exiting 相）→ DOM 除去（removed 相）」へ置き換える実装仕様の close-out を canonical 7 成果物として固定する。設計核心（`isExiting` boolean + `exitTimerRef` + `finalizeRemoval` + `transitionend`/timeout fallback の二重化 + reduced-motion 3 重保証）を identifier drift なく記録する。

## Phase 12 タスクサマリ（Task 12-1〜12-6）

| Task | 名称 | 本サイクルでの扱い（implemented_local_evidence_captured） | 成果物 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（2パート構成） | 設計核心の識別子・挙動・定数を記録。screenshot canonical 3 名は captured | `implementation-guide.md` |
| 12-2 | システム仕様書更新（Step 1 + 条件付き Step 2） | Step 1-A〜1-C を implemented_local_evidence_captured で同期。Step 2 は新規 IF なしで N/A | `system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴作成 | workflow-local / global skill sync の結果を別ブロックで記録 | `documentation-changelog.md` |
| 12-4 | 未タスク検出（0件でも必須） | Phase 3 MINOR-1/MINOR-2 を個別評価。新規未タスク 0 件 | `unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | 本 spec で得た知見 3 観点を記録 | `skill-feedback-report.md` |
| 12-6 | Phase 12 compliance check（canonical 9 見出し + strict 7） | canonical 9 見出し逐語・strict 7 全 present・implemented_local_evidence_captured 一致を確認 | `phase12-task-spec-compliance-check.md` |

## strict 7 outputs 一覧

| # | ファイル | リンク | 役割 |
| --- | --- | --- | --- |
| 1 | `main.md` | （本ファイル） | Phase 12 全体サマリと strict 7 へのリンク |
| 2 | `implementation-guide.md` | [implementation-guide.md](implementation-guide.md) | Part 1（概念）+ Part 2（技術）+ 視覚証跡 |
| 3 | `system-spec-update-summary.md` | [system-spec-update-summary.md](system-spec-update-summary.md) | Step 1（完了記録・状況・関連タスク）+ Step 2 判定 |
| 4 | `documentation-changelog.md` | [documentation-changelog.md](documentation-changelog.md) | 全 Step 結果の個別記録 |
| 5 | `unassigned-task-detection.md` | [unassigned-task-detection.md](unassigned-task-detection.md) | 未タスク検出（新規 0 件 + MINOR 評価 + 関連タスク差分確認） |
| 6 | `skill-feedback-report.md` | [skill-feedback-report.md](skill-feedback-report.md) | テンプレート / ワークフロー / ドキュメント改善 |
| 7 | `phase12-task-spec-compliance-check.md` | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 見出し + strict 7 present 確認 |

## 実装対象（参照・本 WF で編集済み）

| パス | 種別 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集済み |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集済み |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集済み |

> API contract / D1 schema / `page.tsx`（Server Component）/ `useAdminMutation` / `globals.css` / `tokens.css` は一切変更しない（不変条件 #1 / #2 / #10）。

## 設計核心（implementation-guide と一致させる識別子）

| 項目 | 値 |
| --- | --- |
| 新規 state | `isExiting: boolean`（exiting 相）/ `exitTimerRef: useRef<...>`（fallback timer） |
| 既存維持 | `optimisticMerged: boolean`（removed 相 = `return null`）/ `stage`（dialog 制御・不変） |
| 主要ハンドラ | `onMerge`（exiting 開始 + timer + trigger）/ `finalizeRemoval`（clearTimeout + optimisticMerged=true） |
| 定数 | `EXIT_ANIMATION_MS = 200` / `EXIT_FALLBACK_BUFFER_MS = 50`（合計 250ms の fallback timer） |
| CSS | `transition-[opacity,transform] duration-200 motion-reduce:transition-none` + exiting 時 `opacity-0 scale-[0.99]` |

## Issue 状態の注記

- Issue #1043 は Phase 12 作成時点（2026-06-02）で GitHub 上 **OPEN** と記録していたが、close-out の read-only 再確認では **CLOSED**。本 close-out では Issue mutation を実行しない。
- 本ワークフローは Issue の open/close 状態を変更しない（reopen も close もしない）。close 判断はPhase 13（user-gated）。

## 不変条件（実装時の遵守事項）

1. 既存 API のみ接続（#1。merge endpoint / payload 不変）
2. OKLch トークン正本（#2。HEX 直書き / inline `style={{}}` 禁止。新規 token / keyframes なし）
3. admin form input は FormField / primitive 経由（#9）
4. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10。legacy `@/lib/useAdminMutation` 不使用）
5. D1 直接アクセス禁止（#5。`apps/web` から D1 binding 不可）

## 残 user-gated 境界

- `git commit` / `git push` / `gh pr create --base dev`
- GitHub Issue #1043 の状態変更
