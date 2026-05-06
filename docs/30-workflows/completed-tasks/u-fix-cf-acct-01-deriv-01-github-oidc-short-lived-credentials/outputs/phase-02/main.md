# Phase 2 Output: 設計

## Status

SPEC_CREATED

## Summary

AWS STS を一次候補として、GitHub OIDC `sub` / `aud` claim を repo・branch・environment 単位に絞り、短命 STS credential から Cloudflare API Token を job 内だけで解決する設計を採用する。1Password Connect と Cloudflare 直接 API は PoC 成立時のみ差し替える代替経路として残す。

## Normalized Contract

| Axis | Canonical Value |
| --- | --- |
| provider | AWS STS |
| max lifetime | 3600 seconds |
| deploy workflows | `web-cd.yml`, `backend-ci.yml`; D1 verification is `d1-migration-verify.yml` |
| local CLI | `scripts/cf.sh` + `scripts/with-env.sh` remains the local legacy path |
| CI auth mode | `CF_AUTH_MODE=oidc-short-lived` |

