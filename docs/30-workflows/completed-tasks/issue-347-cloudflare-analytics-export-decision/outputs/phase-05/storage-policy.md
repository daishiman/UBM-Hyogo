# Phase 05 Storage Policy

state: completed

## 正本保存先

正本保存先:

`docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/`

Archive:

`docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/archive/YYYY-MM/`

## 命名規則

- export: `analytics-export-YYYYMMDD-HHmm-UTC.json`
- redaction check: `analytics-export-YYYYMMDD-HHmm-UTC.redaction-check.md`
- 1 回の取得は JSON と redaction-check の 2 ファイルで 1 ペアとする。

## Retention

- active directory は直近 12 件を保持する。
- 13 件目を追加する時点で最古のペアを `archive/YYYY-MM/` へ移動する。
- archive は無期限保持する。削除が必要な場合は別タスクではなく、同じ retention policy の更新としてレビューする。

## 保存対象

保存対象は **4 metric groups / 5 scalar values** に統一する。

| metric group | scalar value | 粒度 | 備考 |
| --- | --- | --- | --- |
| HTTP request volume | `requests` | 1 day | path / query は保存しない |
| HTTP error rate | `errors5xx`, `totalRequests` | 1 day | rate は保存時に計算または併記 |
| D1 reads/writes | `readQueries`, `writeQueries` | 1 day | D1 docs の field 名に合わせる |
| Worker cron/event volume | `invocations` | 1 day | cron 対象 worker の aggregate のみ |

## 保存禁止

- URL query string
- request body / response body
- IP address
- User-Agent 生値
- email / member ID / session token
- Google Form 回答内容

保存対象は aggregate metrics のみであり、raw request log / Logpush dataset は採用しない。
