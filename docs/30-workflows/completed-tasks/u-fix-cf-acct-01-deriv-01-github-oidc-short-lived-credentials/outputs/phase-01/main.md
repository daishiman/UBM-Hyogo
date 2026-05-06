# Phase 1 Output: 要件定義

## Status

SPEC_CREATED

## Summary

GitHub Actions の長命 `secrets.CLOUDFLARE_API_TOKEN` 参照を、GitHub OIDC を起点にした短命 Cloudflare credential 経路へ置換する要件を定義した。U-FIX-CF-ACCT-01 で確定した最小 4 scope を維持し、credential lifetime は 1 時間以内、staging-first、24h 並行運用、旧長命 Token 失効、rollback runbook を必須条件にした。

## Canonical Decisions

| Topic | Decision |
| --- | --- |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| provider | AWS STS を一次候補、1Password Connect / Cloudflare 直接 API は代替案 |
| workflow inventory | 現行実在 workflow は `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml`。旧ドラフトの deploy 専用名は使わない |
| approval gates | G1 trust policy, G2 staging cutover, G3 production cutover, G4 long-lived token revoke。commit / push / PR は別 user approval |
