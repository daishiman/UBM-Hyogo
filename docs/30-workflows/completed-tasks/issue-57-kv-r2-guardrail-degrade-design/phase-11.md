# Phase 11: 手動テスト（NON_VISUAL） — Issue #57

> **NON_VISUAL 宣言**: タスク種別=インフラ guardrail + apps/api degrade ガード実装。UI/UX 変更が無いため Phase 11 スクリーンショットは不要。代替証跡=自動テスト（export-to-r2.spec.ts TC-PAUSE-01〜04）+ 手動 smoke ログ + リンクチェックリスト。

## 1. 概要

degrade kill-switch の振る舞いを自動テストで担保し、staging での実 pause 動作は手動 smoke 手順として記録する（runtime 実行は user-gated）。

## 2. 前提条件

Phase 5-10 完了。

## 3. 証跡の主ソース

- 自動テスト: `scripts/audit-log/__tests__/export-to-r2.spec.ts` の TC-PAUSE-01〜04（pause 200 / 通常動作 / pause 優先）。
- typecheck / lint green。
- スクリーンショットを作らない理由: API degrade フラグの挙動であり描画 UI が無い。

## 4. 手動 smoke（runtime, user-gated）

`outputs/phase-11/manual-smoke-log.md` の手順を staging で実行予定（ユーザー承認後）。

## 5. 成果物

| 成果物 | パス |
| --- | --- |
| 手動テスト結果 | `outputs/phase-11/main.md` |
| 手動 smoke 手順ログ | `outputs/phase-11/manual-smoke-log.md` |
| リンクチェックリスト | `outputs/phase-11/link-checklist.md` |

## 6. 完了条件

- 代替証跡（自動テスト名・件数）が記録され、スクショ不要理由が明記されている。

## 7. 参照資料

- `phase-04.md`（テスト設計）


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 11 / taskType: implementation / visualEvidence: NON_VISUAL

## 目的

KV/R2 guardrail drift と executable degrade を、実装・仕様・証跡の同一 wave で整合させる。

## 実行タスク

- 本文の「実行タスク」または該当する設計・検証セクションを参照。

## 参照資料

本文の「参照資料」セクション、index.md、outputs/artifacts.json を参照。

## 成果物/実行手順

本文の成果物表および outputs/phase-* 配下の対応成果物を参照。

## 完了条件

- [x] 本文の完了条件および artifacts.json の phase status を参照。

## 統合テスト連携

NON_VISUAL のため focused Vitest / typecheck / lint を統合証跡とし、UI screenshot は不要。
