# Phase 4: テスト作成（TDD Red） — Issue #57

> NON_VISUAL / 実装仕様書。kill-switch（AC-5）の RED テストを設計する。

## 1. 概要

`scripts/audit-log/__tests__/export-to-r2.spec.ts` に degrade kill-switch の振る舞いを固定するテストケースを追加する。実装前に RED を確認する。

## 2. 前提条件

Phase 1-3 完了。`mise exec -- pnpm install`（esbuild 整合）。

## 3. テストケース設計

| ID | 入力 | 期待結果 |
| --- | --- | --- |
| TC-PAUSE-01 | `paused: true` + R2 client 有 | status `paused`・R2 PUT 未呼出・manifest 未挿入・D1 SELECT 未実行相当 |
| TC-REG-01 | `paused` 未指定 | 既存 dry-run / apply path が継続 |
| TC-KV-00 | `ALERT_DEDUP_KV` 未設定 | alert-relay が Slack 送信を fail-open し、`dedupPersisted:false` |

## 4. テスト方針（モック・private アクセス）

- `FakeR2.puts.length === 0` と `FakeD1.manifests.length === 0` で pause の副作用ゼロを確認。
- alert-relay は `ALERT_DEDUP_KV` を omit した env で Slack 送信が継続することを確認。

## 5. 変更対象ファイル

| ファイル | 変更種別 |
| --- | --- |
| `scripts/audit-log/__tests__/export-to-r2.spec.ts` | 編集（TC-PAUSE-01〜04 追加） |

## 6. 実行コマンド

```bash
mise exec -- pnpm exec vitest run scripts/audit-log/__tests__/export-to-r2.spec.ts
```

> 実装前は TC-PAUSE-01/03/04 が RED（フラグ未実装のため通常動作してしまう）になることを確認する。

## 7. 成果物

| 成果物 | パス |
| --- | --- |
| テスト仕様 | `outputs/phase-04/main.md` |

## 8. 完了条件

- TC-PAUSE-01 と KV optional regression が定義され、RED 期待が記述されている。

## 9. 参照資料

- `phase-02.md`（判定セマンティクス）
- `scripts/audit-log/__tests__/export-to-r2.spec.ts`（既存テスト構造）


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 4 / taskType: implementation / visualEvidence: NON_VISUAL

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
