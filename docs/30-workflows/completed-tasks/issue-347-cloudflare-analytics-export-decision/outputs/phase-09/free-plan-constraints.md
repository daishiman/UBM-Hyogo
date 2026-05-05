# Phase 09 Free Plan Constraints

state: completed

確認日: 2026-05-05

## 公式確認結果

| 項目 | 結論 | 根拠 |
| --- | --- | --- |
| GraphQL Analytics API | 採用可。ただし dataset availability / node limits は account / zone settings に依存する | Cloudflare GraphQL API limits は global / user / node limits を分け、node availability は plan と対象 account / zone に紐づく |
| GraphQL rate limit | 月次手動取得には十分。user quota は短時間大量実行を避ける | Cloudflare GraphQL API の default quota は 5 分 window の複数 query 制限として定義される |
| Cloudflare API global rate | 月次 1 query 運用では問題にならない | Cloudflare API global rate limit は per user / token に適用される |
| D1 metrics | GraphQL または HTTP client で programmatic access 可能 | D1 metrics docs は dashboard charts が GraphQL Analytics API 由来であることを示す |
| Logpush | 不採用。Free / Pro / Business は availability No | Cloudflare Logs docs の Logpush availability table |
| Retention | API 側 retention は dataset / node limit 依存。repo 側 12 件 retention で長期比較を補完する | GraphQL API node limits は requestable history と maximum period を dataset ごとに持つ |

## 採用条件

- Query は aggregate `Groups` dataset に限定する。
- 対象 account / zone で dataset availability を GraphQL Explorer の schema / settings で確認する。
- 実取得 sample は user-approved Cloudflare dashboard session または API token 経由で取得する。
- Logpush / raw logs / request-level fields は使わない。

## 参照

- https://developers.cloudflare.com/analytics/graphql-api/limits/
- https://developers.cloudflare.com/fundamentals/api/reference/limits/
- https://developers.cloudflare.com/d1/observability/metrics-analytics/
- https://developers.cloudflare.com/logs/get-started/
- https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/
