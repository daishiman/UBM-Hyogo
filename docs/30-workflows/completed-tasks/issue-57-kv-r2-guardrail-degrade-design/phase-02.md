# Phase 2: 設計 — Issue #57

> NON_VISUAL / 実装仕様書。

## 1. 概要

AC-1〜AC-6 を満たす最小実装の設計を固定する。binding 追加はせず、既存 binding に対する guardrail / executable degrade と正本同期に閉じる。

## 2. 前提条件

Phase 1 完了（AC・inventory 確定）。

## 3. degrade kill-switch 設計（AC-5）

### 3.1 状態所有権

| 要素 | 所有者 |
| --- | --- |
| pause フラグ値 | GitHub repository variable `AUDIT_COLD_STORAGE_EXPORT_PAUSED`（`.github/workflows/audit-log-cold-storage.yml` から script env へ渡す） |
| CLI 判定 | `process.env.AUDIT_COLD_STORAGE_EXPORT_PAUSED === "true"` を `exportAuditLogToR2(..., { paused })` に渡す |
| 判定ロジック | `scripts/audit-log/export-to-r2.ts`（D1 SELECT / manifest / R2 PUT の前に short-circuit） |

### 3.2 判定セマンティクス

- `AUDIT_COLD_STORAGE_EXPORT_PAUSED === "true"` のときのみ pause。未設定 / `"false"` / その他は通常動作（既定=稼働）。
- pause 時は D1 SELECT / manifest write / R2 PUT を呼ばず `ExportRunResult.status = "paused"` を返す。
- 判定は D1 / R2 client 実処理より前に置く（R2 資格情報や D1 状態に依存しない停止）。

### 3.3 既存 guard との順序（export-to-r2.ts）

```
1. CLI が `AUDIT_COLD_STORAGE_EXPORT_PAUSED` を読む
2. `exportAuditLogToR2(..., { paused: true })` で呼び出す
3. paused なら `status: "paused"` を返して終了
4. 非 paused のみ D1 SELECT -> gzip -> R2 PUT -> manifest
```

## 4. env.ts 型整合設計（AC-4）

- `ALERT_DEDUP_KV: KVNamespace`（必須）→ `ALERT_DEDUP_KV?: KVNamespace`（optional）へ変更。
- 前提: `apps/api/src/routes/internal/alert-relay.ts` が `ALERT_DEDUP_KV` 不在を guard している（toml コメントアウト=未活性で deploy 済のため guard が無ければ既に壊れている）。Phase 5 着手時に `grep -n ALERT_DEDUP_KV alert-relay.ts` で absence guard を確認してから optional 化。
- これは binding の活性化ではなく型整合のみ（ut-17-followup-002 の責務を侵さない）。

## 5. ドキュメント設計

### 5.1 specs/08-free-database.md（AC-1）

無料枠前提テーブルへ KV / R2 行追加（確認日: 実行日記入）:

| サービス | 想定用途 | 無料枠（要実行日再確認） |
| --- | --- | --- |
| Cloudflare KV | 将来 session/dedup cache（ALERT_DEDUP_KV は現状未活性） | reads 100k/day・writes 1k/day・deletes 1k/day・list 1k/day・storage 1GB/account・namespaces 1k |
| Cloudflare R2 | audit log cold storage（#514/#315、稼働中） | Standard storage 10GB-month・Class A 1M/month・Class B 10M/month・egress free |

### 5.2 deployment-cloudflare.md（AC-1, AC-2）

- 「R2 binding 未適用」→「audit cold-storage R2 binding（`UBM_AUDIT_COLD_STORAGE` #514 / `UBM_AUDIT_APP_COLD_STORAGE` #315）は prod/staging に適用済。UT-12 の汎用 `R2_BUCKET` は未適用」へ是正。
- 「KV binding 未追加」→「`ALERT_DEDUP_KV` は型宣言済・wrangler.toml ではコメントアウト（ut-17-followup-002 で user-gated）。UT-13 `SESSION_KV` は未適用」へ是正。
- KV/R2 free-tier limit を確認日付きで追記。

### 5.3 cost-guardrail-runbook.md（AC-3, AC-6）

- §2-7 を数値閾値テーブルへ昇格（無料枠に対し 警戒=80% / 対処=95% 段階。Pages/Workers/D1 と同書式）。
- §4-2 を「GitHub repository variable `AUDIT_COLD_STORAGE_EXPORT_PAUSED=true` を設定し scheduled export を停止」の実行可能手順へ書き換え。
- 05a/05b handoff 表記を current facts へ同期（R2 稼働中である旨）。

## 6. 既存コンポーネント再利用可否（FB-SDK-07-1）

- 新規 util/モジュールは作らない。`export-to-r2.ts` の `ExportOptions.paused` と CLI env bridge のみ。

## 7. 成果物

| 成果物 | パス |
| --- | --- |
| 設計書 | `outputs/phase-02/main.md` |

## 8. 完了条件

- kill-switch の判定セマンティクス・順序が確定。
- env.ts 型整合方針が確定。
- 3 ドキュメントの編集箇所が特定。

## 9. 参照資料

- `phase-01.md`
- `scripts/audit-log/export-to-r2.ts`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 2 / taskType: implementation / visualEvidence: NON_VISUAL

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
