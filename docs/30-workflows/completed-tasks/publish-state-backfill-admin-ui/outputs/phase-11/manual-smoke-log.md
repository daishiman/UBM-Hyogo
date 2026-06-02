# Phase 11 Manual Smoke Log

## Status

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / runtime pending`。

本サイクルでは authenticated staging 操作を実行しない。Task B の proxy Authorization 注入完了後、ユーザー承認を得て staging で実行する。

## Planned Smoke

| Step | Target | Expected |
|------|--------|----------|
| 1 | `/admin/sync-status` | 「公開状態 backfill」カードが表示される |
| 2 | dry-run | `scanned` / `candidates` / `skipped.*` が表示され、DB は変更されない |
| 3 | apply disabled | dry-run 前、または `candidates=0` では apply が disabled |
| 4 | apply | confirm OK 後に `applied` 件数が表示される |
| 5 | error | HTTP error または schema mismatch で `role="alert"` が表示される |

## Boundary

実 png / runtime 操作ログは user-gated。現時点では jsdom focused tests と Phase 11 plan を evidence とする。
