# Phase 11 Manual Smoke Log（NON_VISUAL）

タスク種別 NON_VISUAL（fetch/transport 層 + 構造化ログのみ・UI 表現変更なし・代替証跡 = focused tests + staging 実機ログ）。local smoke は完了し、staging 実機 smoke は user-gated。

## Local（実装時 / user-gated）

- `bash -n scripts/diagnose-profile-session.sh`: pending（user-gated）。
- focused Vitest（T1-T5: transport / transport-select / authed / safe-fetch / env spec）: PASS（5 files / 70 tests）。
- `bash scripts/verify-no-localhost-bake.sh --src-only`（新規 localhost/8787/8888 リテラル 0）: pending（user-gated）。
- `git diff --stat -- apps/api`（空・apps/api 非接触・AC-9）: pending（user-gated）。

## Staging（user-gated）

- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`（MT-A）: pending（user-gated）。
- `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` で `server_fetch_failed` の `{transportKind, baseHost, status}` 観測（MT-B）: pending（user-gated）。
- `baseHost=service-binding.local`（localhost でない）確認（MT-C）: pending（user-gated）。
- 真因ステータス（410 / 5xx / transport）確定 + `bash scripts/diagnose-profile-session.sh` 突合（MT-D）: pending（user-gated）。

スクリーンショットは NON_VISUAL ゆえ取得しない。
