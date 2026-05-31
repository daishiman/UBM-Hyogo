# Phase 11: 手動テスト結果 — VISUAL_ON_EXECUTION

> local focused automated evidence と screenshot capture は取得済み。commit / push / PR / Issue close は user-gated のまま分離する。

## タスク種別宣言

- **タスク種別**: VISUAL_ON_EXECUTION
- **route**: `/admin/identity-conflicts`
- **対象 component**: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- **Issue**: #988（identity-conflicts merge optimistic update）
- **workflow_state**: `implemented_local_evidence_captured`

`/admin/identity-conflicts` の identity conflict row に対し、merge 二段階 confirm 後、server round-trip を待たず該当 row を一覧から即座に非表示にする（optimistic update）。server エラー時のみ rollback で row を復元し、inline error（`role="alert"`）を表示する。dismiss 側の挙動は不変。

## 証跡の主ソース（3層）

| 層 | ソース | 内容 |
| --- | --- | --- |
| 1. focused vitest | `outputs/phase-11/evidence/focused-vitest.log` | `optimisticMerged` state による `return null` 描画、`.catch` での rollback、dismiss 不変を component-local に検証済み |
| 2. Playwright | `admin-identity-conflicts` シナリオ | optimistic 消失 / server error rollback / inline error 表示 / authz を route 上で検証済み（8 tests PASS） |
| 3. screenshot | 下記 canonical 3 枚 | row の消失・復元という視覚状態遷移を視覚 evidence として固定 |

> screenshot は Playwright で local capture 済み。focused Vitest は PASS evidence 取得済み。

## 手動テスト項目チェックリスト

実施欄は 2026-05-30 の local focused Vitest / Playwright 実行結果に同期する。

| # | AC | テスト項目 | 期待挙動 | 実施 |
| --- | --- | --- | --- | --- |
| 1 | AC-1 | merge 二段階 confirm（確認 1/2 → 2/2）まで遷移 | 確認 2/2 で merge 理由 textarea +「merge 実行」ボタンが表示される | PASS |
| 2 | AC-2 | 「merge 実行」click 直後（server 応答前） | 該当 row が一覧から即座に消える（optimistic hide、round-trip 待ちなし） | PASS |
| 3 | AC-3 | server 成功応答後 | 消えた row はそのまま非表示を維持する（再表示されない） | PASS（focused Vitest） |
| 4 | AC-4 | dismiss 操作 | dismiss の挙動は本変更前と同一（optimistic 化されない・回帰なし） | PASS（focused Vitest） |
| 5 | AC-5 | server error 応答時 | `.catch` で `setOptimisticMerged(false)` により row が復元する | PASS |
| 6 | AC-6 | server error 応答時 | inline error（`role="alert"`）が表示され、再操作可能と読める | PASS |

## screenshot 取得理由（VISUAL 根拠）

本タスクは row の **消失（optimistic）** と **復元 + inline error（rollback）** という視覚的な UI 状態遷移を伴う。これらは DOM の有無・配色（danger トークン）・レイアウトの変化として視覚的に確認すべき性質であり、テキスト assertion だけでは操作体感（round-trip 待ち感の有無）を担保できない。したがって VISUAL タスクとして screenshot 3 枚を取得する。

## canonical screenshot（3 枚・実装後取得）

| TC-ID | canonical ファイル名 | 取得状態 | スクリーンショット |
| --- | --- | --- | --- |
| TC-VIS-01 | `identity-conflict-row-merge-final.png` | merge 確認 2/2 ダイアログ表示（merge 理由 textarea +「merge 実行」ボタン） | `outputs/phase-11/screenshots/identity-conflict-row-merge-final.png` |
| TC-VIS-02 | `identity-conflict-row-optimistic-removed.png` | 「merge 実行」click 直後、server 応答前に該当 row が一覧から消えた状態 | `outputs/phase-11/screenshots/identity-conflict-row-optimistic-removed.png` |
| TC-VIS-03 | `identity-conflict-row-rollback-error.png` | server error で row が復元し inline error（`role="alert"`）が表示された状態 | `outputs/phase-11/screenshots/identity-conflict-row-rollback-error.png` |

配置先: `outputs/phase-11/screenshots/`。命名・TC は `phase11-capture-metadata.json` / `screenshot-plan.json` と完全一致させる。

## 判定

**GATE: 手動テスト PASS** — VISUAL タスクとして 3 層 evidence を取得し、6 件のチェック項目を PASS として同期済み。
