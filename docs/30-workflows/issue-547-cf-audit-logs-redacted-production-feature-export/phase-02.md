# Phase 2: Existing Implementation Survey

## Purpose

既存の Issue #514 / #515 実装を調査し、#547 で新設する範囲と再利用する範囲を分離する。

## Existing Files To Read

| Path | Finding |
| --- | --- |
| `scripts/cf-audit-log/export-to-r2.ts` | Cold storage JSONL.gz exporter。R2 保存と `cf_audit_log_export_manifest` 更新が責務。ML feature dataset とは分ける。 |
| `scripts/cf-audit-log/redaction-guard.ts` | JSONL 全文の fail-closed redaction guard。 |
| `scripts/cf-audit-log/features/extract.ts` | `extractFeatures(event, { redactSecret })` が redacted feature を生成済み。 |
| `scripts/cf-audit-log/features/schema.ts` | `RedactedFeatures` と JSON schema 正本。 |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | file path 入力の leakage scanner。 |
| `scripts/cf-audit-log/evaluation/offline-replay.ts` | labeled JSONL を classifier 評価に使う既存 harness。 |
| `scripts/cf-audit-log/d1-client.ts` | `recentEventsInWindow()` は ms window。feature export 用の明示関数を追加する。 |
| `.github/workflows/cf-audit-log-cold-storage.yml` | Production gate と dry-run 参考。 |

## Required Boundary

#547 は `export-to-r2.ts` を置換しない。cold storage は raw store retention 補完、#547 は ML dataset 生成であり、出力 schema と validation が異なる。

## Completion

- 新規 feature exporter の責務が既存 cold storage exporter と分離されている。
- 既存 `extractFeatures()` を再利用する方針が確定している。
