# Phase 2 — 既存実装調査

## 調査対象 / 結果

| 対象 | 結果 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | Issue #518 HOLD 化済み。`workflow_dispatch` のみ + `dry_run=true` 既定 + schedule 削除済み。`env.CF_AUDIT_CLASSIFIER` 参照は既に存在 |
| `scripts/cf-audit-log/observation/post-switch-monitor.ts` | `--aggregate --input=<dir> --out=<file> --format={json,markdown}` を既にサポート（改修不要） |
| `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | `--threshold=<n>` `--window=<n>` `--input=<dir>` `--dry-run` をサポート。仕様書の `--consecutive-hours` は `--window` の別名相当として扱う |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | `--exit-on-detect` フラグ受理（既存 default 挙動も exit 1） |
| 親 #549 phase-13 | `legacy stub` 注記が残置。本タスクで「2026-05-09 update（Refs #586）」追記 |
| Issue #518 runbook | HOLD 状態を明記。本タスクで HOLD 解除に書き換え |

## 影響範囲

- D1 schema: 変更なし（forward-safe）
- `apps/{api,web}/src/`: 変更なし
- `.github/workflows/`: 1 編集 + 1 新規
- SSOT: 4 ファイル更新
