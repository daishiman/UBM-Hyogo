# Implementation Guide

## Part 1

Account ID は住所、API Token は鍵として扱う。今回は住所を鍵用の入れ物から読もうとして空になっていたため、住所用の入れ物から読むように直す。

## Part 2

- `.github/workflows/backend-ci.yml`: 4 箇所の `secrets.CLOUDFLARE_ACCOUNT_ID` を `vars.CLOUDFLARE_ACCOUNT_ID` に変更する。
- `.github/workflows/web-cd.yml`: 2 箇所の `secrets.CLOUDFLARE_ACCOUNT_ID` を `vars.CLOUDFLARE_ACCOUNT_ID` に変更する。
- aiworkflow-requirements の UT-27 配置正本を Repository Variable に同期する。
- 検証コマンド:
  - `rg -n "secrets\\.CLOUDFLARE_ACCOUNT_ID" .github` が exit=1
  - `rg -n "vars\\.CLOUDFLARE_ACCOUNT_ID" .github/workflows | wc -l` が 6
  - `gh api repos/daishiman/UBM-Hyogo/actions/variables` で `CLOUDFLARE_ACCOUNT_ID` が存在
  - `gh api repos/daishiman/UBM-Hyogo/actions/secrets` で `CLOUDFLARE_ACCOUNT_ID` が出力されない
- Phase 11 証跡: `../phase-11/main.md` と `../phase-11/manual-smoke-log.md`。UI / UX 変更なしのためスクリーンショットは不要。
