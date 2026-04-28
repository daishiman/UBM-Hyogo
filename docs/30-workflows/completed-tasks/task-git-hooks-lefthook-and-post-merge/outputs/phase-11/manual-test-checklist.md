# Phase 11 — manual-test-checklist

## Status

completed

## NON_VISUAL 判定

本タスクは Git hook / package script / CLI runbook の変更であり、画面 UI を変更しない。screenshot は不要。検証は CLI 出力とファイル状態で行う。

## チェックリスト

- [x] `lefthook.yml` が schema validate を通る
- [x] `scripts/hooks/*.sh` が `bash -n` を通る
- [x] hook 経路から `generate-index.js` / `aiworkflow-requirements/scripts` への参照がない
- [x] Phase 11 の screenshot 非該当理由が `main.md` と `implementation-guide.md` にある
- [x] `outputs/phase-11/manual-smoke-log.md` に CLI smoke 手順がある
- [x] `outputs/phase-11/link-checklist.md` にリンク確認手順がある

