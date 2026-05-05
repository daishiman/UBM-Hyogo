# Phase 11 — NON_VISUAL Evidence Contract

state: completed

## 判定

SPEC_CREATED_PASS_WITH_RUNTIME_SAMPLE_PENDING_USER_AUTH

本タスクは docs-only / NON_VISUAL decision workflow であり、Cloudflare account への認証付き runtime export はユーザー承認付き運用サイクルで取得する。今回サイクルでは、保存スキーマ・PII redaction command・公式 docs に基づく Free plan constraints・representative aggregate-only sample を実体化し、runtime sample 取得時に置換できる evidence contract を完成させた。

## 採用 query contract

保存対象は 4 metric groups / 5 scalar values に限定する。

```graphql
query AnalyticsLongTerm($accountTag: String!, $zoneTag: String!, $date: Date!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      d1AnalyticsAdaptiveGroups(limit: 100, filter: { date: $date }) {
        sum {
          readQueries
          writeQueries
        }
      }
      workersInvocationsAdaptive(limit: 100, filter: { date: $date }) {
        sum {
          requests
        }
      }
    }
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(limit: 1, filter: { date: $date }) {
        dimensions {
          date
        }
        sum {
          requests
          responseStatusMap {
            edgeResponseStatus
            requests
          }
        }
      }
    }
  }
}
```

`responseStatusMap` から 5xx 件数を合算し、`errors5xx / totalRequests` を error rate として保存する。実 field availability は対象 account / zone の schema settings に依存するため、runtime 取得時に `free-plan-constraints.md` の条件で確認する。

## Evidence files

- `evidence/sample-export/analytics-export-schema-sample.json`: aggregate-only representative sample
- `evidence/sample-export/analytics-export-schema-sample.redaction-check.md`: PII grep result

## Runtime boundary

この Phase は runtime production data を偽装しない。Cloudflare dashboard session / API token が必要なため、実 production sample は Phase 13 user approval 後の運用 cycle で取得し、同じ schema / redaction rules で保存する。
