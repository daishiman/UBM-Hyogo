---
workflow_id: issue-1042-identity-conflicts-dismiss-optimistic-update
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-01
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-1042-identity-conflicts-dismiss-optimistic-update
issue: 1042
issue_state: CLOSED
parent_workflow: issue-988-identity-conflicts-merge-optimistic-update
---

# Issue #1042 — identity-conflicts dismiss confirm を optimistic update 化 (FU-AIDC-006)

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（`IdentityConflictRow.tsx` への dismiss 専用 optimistic state 追加 + focused vitest + Playwright）を伴う。
GitHub Issue #1042 はラベル上 `type:improvement` / `type:followup` であり docs-only ではない。CONST_004 の判定どおり、目的（dismiss 操作直後に row を一覧から消す + server error 時 rollback）はコード変更なしでは達成不可能であるため、**同一サイクルで実コードへ反映**した。

## Issue 状態に関する注記

- **Issue #1042 は調査時点（2026-06-01）で `CLOSED`**（`closedAt: 2026-06-01T12:10:19Z`）。
- ユーザー指示どおり **`CLOSED` のまま**タスク仕様書を作成する。Issue の reopen / close 状態変更は行わない。
- 本ワークフローの残 user-gate は commit / push / PR。

## 事前調査結論（実装済みか否か）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| dismiss optimistic（操作直後に row 非表示） | **実装済み** | `IdentityConflictRow.tsx` に `optimisticDismissed` を追加し、`onDismiss` 先頭で `setOptimisticDismissed(true)`、render guard を `optimisticMerged || optimisticDismissed` に統合 |
| dismiss server error 時 rollback | **実装済み** | `.catch` で `setOptimisticDismissed(false)`。dismiss dialog と `dismissReason` は保持され、inline error が表示される |
| merge optimistic（兄弟 #988） | **実装済み** | `optimisticMerged` state + `onMerge` 先頭の `setOptimisticMerged(true)` + `.catch` rollback。本タスクはこの pattern を dismiss へ対称適用する |
| 他タスクで解決済みか | **本サイクルで解決済み** | focused Vitest 12 件 PASS、Playwright focused 2 件 PASS、Phase 11 screenshot 3 PNG 取得 |

→ **Issue #1042 の実行は完了**。dismiss 側の optimistic 化は merge 側（#988）で確立した pattern の対称適用として、同一サイクルで実装・検証した。

## Issue 最適化（古いissueの現行コード整合）

調査時点で issue 本文と現行コードの整合を確認した結果、issue 内容は**現行コードと整合しており陳腐化していない**。下記のみ参照パスを最新化する（仕様書側で吸収済み）。

| issue 記載 | 現行 | 仕様書での扱い |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 同一（存在確認済み） | そのまま採用 |
| `optimisticMerged` で row を `return null` | 同一（`line 29` / `line 92`） | そのまま採用 |
| `dismissReason` state | 同一（`line 31`） | rollback 後保持対象として採用 |
| 苦戦箇所の参照パスが別 worktree（`task-20260529-211028-wt-18`）絶対パス | 当該 worktree は既に廃止 | repo 相対パス `apps/web/src/components/admin/IdentityConflictRow.tsx` に正規化 |
| 受け入れ基準の test path `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` / `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | いずれも存在確認済み | そのまま採用 |

## 目的

`/admin/identity-conflicts` の dismiss（別人マーク）confirm 完了直後、server round-trip を待たず該当 row を一覧から非表示にし、server error 時のみ rollback で再表示する。merge 側 optimistic update（#988）と挙動を対称化し、同一画面内の体感非対称を解消する。

## スコープ（CONST_007: 1 サイクル完了可能）

### 含むもの

- `IdentityConflictRow.tsx` に **dismiss 専用** optimistic state（`optimisticDismissed: boolean`）を追加し、`onDismiss` を「trigger 直後に row を消す → error 時のみ復元」へ差し替える
- render guard を `if (optimisticMerged || optimisticDismissed) return null;` に統合（**state 自体は分離**）
- focused vitest に dismiss optimistic hide / rollback（理由保持）/ success-stays-hidden ケースを追加。merge 既存 optimistic ケースの非回帰も確認
- Playwright e2e に「dismiss 後即座に row が消える」「server error で row 復元」シナリオを追加

### 含まないもの（スコープ外）

| 項目 | 理由 | 実施時期/場所 |
| --- | --- | --- |
| merge optimistic update の設計変更 | #988 で確立済み・本タスクは非回帰のみ | 対象外 |
| dismiss endpoint / API contract 変更 | 不変条件 #1（既存 API のみ） | 対象外 |
| D1 schema / shared schema 変更 | 不変条件 #1 | 対象外 |
| row fade animation 追加 | 別 followup `admin-identity-conflicts-followup-005-row-fade-animation` に明示分離（issue 本文スコープ宣言） | 別 Issue（本サイクル不要） |
| `useAdminMutation` hook への optimistic option 追加 | component-local state で要件充足（後方互換リスク回避） | 不要 |

> **CONST_007 確認**: 単一コンポーネントの state 1 個追加 + render guard 統合 + test であり、本サイクルで完了済み。先送り・分割なし。

## Phase 一覧

| Phase | 名称 | status | 成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 | completed (spec) | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | completed (spec) | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | completed (spec) | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成（TDD RED） | completed (spec) | `outputs/phase-4/phase-4.md` |
| 5 | 実装 | completed (spec) | `outputs/phase-5/phase-5.md` |
| 6 | テスト拡充 | completed (spec) | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | completed (spec) | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | completed (spec) | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | completed (spec) | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | completed (spec) | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト（VISUAL） | completed | `outputs/phase-11/phase-11.md` + screenshots 3 PNG |
| 12 | ドキュメント更新 | completed | `outputs/phase-12/*` (strict 7) |
| 13 | PR作成 | pending_user_approval | `outputs/phase-13/phase-13.md` |

> `implemented_local_evidence_captured`: 実コード実装、focused Vitest、Playwright focused、Phase 11 screenshot 3 PNG 取得まで完了。commit / push / PR は user-gated。

## 不変条件（実装時の遵守事項）

1. 既存 API のみ接続（#1）— dismiss endpoint / payload 不変
2. OKLch トークン正本（#2、HEX 直書き禁止）
3. admin form input は FormField / primitive 経由（#9）
4. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10、legacy `@/lib/useAdminMutation` 不使用）
