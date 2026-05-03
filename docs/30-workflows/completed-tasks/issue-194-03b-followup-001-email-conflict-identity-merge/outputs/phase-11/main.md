# Phase 11 Evidence Boundary

## 実装区分

[実装区分: 実装仕様書]

`visualEvidence: VISUAL_ON_EXECUTION`。spec 段階では境界記録のみ。

## Status

- State: `PENDING_RUNTIME_EVIDENCE`
- 実環境 smoke は user gate 後にのみ実行する
- 実行内容: screenshot / curl matrix / wrangler tail / axe-core / PII 目視

## Required Runtime Evidence

| Evidence | Runtime path |
| --- | --- |
| candidate list screenshot | `outputs/phase-11/admin-identity-conflicts-list.png` |
| merge confirmation screenshot | `outputs/phase-11/admin-identity-merge-confirm.png` |
| merge success screenshot | `outputs/phase-11/admin-identity-merge-success.png` |
| curl matrix 結果 | `outputs/phase-11/curl-results.md` |
| wrangler tail 抜粋 | `outputs/phase-11/wrangler-tail.log` |
| axe a11y scan | `outputs/phase-11/axe-result.json` |
| 手動 smoke log | `outputs/phase-11/manual-smoke-log.md` |
| link 確認 | `outputs/phase-11/link-checklist.md` |

## 実環境 smoke 実行手順（再掲）

1. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev`
2. EMAIL_CONFLICT を発生させる二重回答 seed
3. admin cookie で `/admin/identity-conflicts` 開き screenshot
4. curl matrix（200 / 400 / 403 / 409 / 500）実行
5. `bash scripts/cf.sh tail` で `identity_merge_audit` / `audit_log` insert 確認
6. axe-core 実行
7. PII 目視確認

## 境界

本ファイルは pre-execution boundary のみを記録する。runtime PASS evidence として扱わない。
