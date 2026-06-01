# Phase 7: カバレッジ確認 — Issue #57

> NON_VISUAL / 実装仕様書。

## 1. 概要

変更ブロックに限定したカバレッジを確認する（FB: 広域指定でなく変更行の line/branch を実測）。

## 2. 前提条件

Phase 5-6 完了。

## 3. 対象範囲（明示）

- 対象: `scripts/audit-log/export-to-r2.ts` の **pause 判定ブロックのみ**（新規 if 分岐の line/branch 100% を目標）。
- 対象外: export-to-r2.ts のその他既存ロジック・他ファイル（変更なし）。

## 4. 実行コマンド

```bash
mise exec -- pnpm exec vitest run scripts/audit-log/__tests__/export-to-r2.spec.ts --coverage --coverage.include="scripts/audit-log/export-to-r2.ts"
```

## 5. 成果物

| 成果物 | パス |
| --- | --- |
| カバレッジ検証結果 | `outputs/phase-07/main.md` |

## 6. 完了条件

- pause 判定ブロックの line/branch カバレッジ実測値が記録されている（目標 100%）。

## 7. 参照資料

- `phase-06.md`


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 7 / taskType: implementation / visualEvidence: NON_VISUAL

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
