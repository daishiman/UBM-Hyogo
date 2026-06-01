# Phase 6: テスト拡充 — Issue #57

> NON_VISUAL / 実装仕様書。

## 1. 概要

fail path と回帰 guard を追加する。

## 2. 前提条件

Phase 5 実装完了（GREEN）。

## 3. 実行タスク

- 回帰 guard: 既存の application audit_log export テスト（dry-run / apply / idempotent skip / redaction guard）が pause 追加後も GREEN であることを確認。
- 共存確認: pause は `exportAuditLogToR2(..., { paused: true })` のみで有効化し、既存 dry-run / apply path と分離する。
- 値の堅牢性: CLI では `AUDIT_COLD_STORAGE_EXPORT_PAUSED === "true"` の完全一致のみ pause とする。

## 4. 実行コマンド

```bash
mise exec -- pnpm exec vitest run scripts/audit-log/__tests__/export-to-r2.spec.ts apps/api/src/routes/internal/__tests__/alert-relay.spec.ts apps/api/src/routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts
```

## 5. 成果物

| 成果物 | パス |
| --- | --- |
| テスト拡充記録 | `outputs/phase-06/main.md` |

## 6. 完了条件

- 既存テスト regression ゼロ。fail path（厳密一致）テスト追加済。

## 7. 参照資料

- `phase-04.md` / `phase-05.md`


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 6 / taskType: implementation / visualEvidence: NON_VISUAL

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
