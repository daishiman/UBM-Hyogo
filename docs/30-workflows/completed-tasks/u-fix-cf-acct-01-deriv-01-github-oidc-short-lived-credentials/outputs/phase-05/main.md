# Phase 5 Output: 実装ランブック

## Status

SPEC_CREATED_RUNTIME_PENDING

## Runbook Boundary

This phase defines the execution runbook only. It does not execute AWS, GitHub, Cloudflare, commit, push, or PR operations in this spec-created cycle.

## Canonical Execution Gates

| Gate | Meaning | Runtime Boundary |
| --- | --- | --- |
| G1 | trust policy / IdP approval | before configuring AWS STS / equivalent provider |
| G2 | staging cutover approval | before replacing staging deploy workflow credential path |
| G3 | production cutover approval | after 7 consecutive staging green days |
| G4 | long-lived token revoke approval | after 24h parallel run with no old-token use |

