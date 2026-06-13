# Phase 11 Manual Smoke Log

## Local（local 実施済み）

- `bash -n scripts/diagnose-profile-session.sh`: PASS（2026-06-12 実行・exit 0）。
- Focused Vitest（env / transport / authed / safe-fetch / profile page の 5 spec）: PASS（72 tests・2026-06-12 再検証）。

## Staging（user-gated・計画のみ）

- RT-A: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` — pending。
- RT-B: `bash scripts/diagnose-profile-session.sh`（web `/api/me` + API direct `/me` の 2 系統 probe） — pending。
- RT-C: ログイン済みブラウザで `/profile` 正常描画確認 + screenshot — pending（認証必須）。
- RT-D: 非復旧時のみ `bash scripts/cf.sh` tail で新構造化ログを読み S1〜S4 を確定 — pending。
