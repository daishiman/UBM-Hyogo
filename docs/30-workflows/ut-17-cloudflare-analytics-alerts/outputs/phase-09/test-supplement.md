# UT-17 Phase 9: Test Supplement

Phase 6/7 で計画した 27 ケースに加え、以下のエッジケースを補充済み。

## 追加カバレッジ

| 区分 | 追加ケース | 目的 |
| --- | --- | --- |
| slack-sender | SEND-05: fetch throw も retry 対象 | network error と HTTP 5xx を同等に扱うことの確認 |
| formatter | FMT-CRITICAL: 95% 比率での severity 自動引き上げ | severity payload が無い場合の判定経路 |
| formatter | FMT-08: ja-JP 数値整形 | 日本語ローカライゼーションの担保 |
| route | ROUTE-06: header 欠落 401 | middleware の明示的失敗経路 |
| route | ROUTE-07: secret 未設定で 500 | misconfiguration を依存サービス未設定（503）と区別 |

## 未補充の理由（意図的不足）

- HMAC / timestamp 署名検証は Phase 02 設計で「Cloudflare 公式契約として未公開のため不採用」と確定しているため、対応するテストは作らない。
- backoff の実時間スリープは `sleep` を inject 可能にし、テストでは即時解決させて決定論性を担保。実値（200 / 500 / 1500ms）の正確性は本コードでは検証しない（実装値そのもの）。

## カバレッジ目安

`apps/api/src/lib/{cf-webhook-auth,cloudflare-alert-formatter,slack-sender}.ts` および `apps/api/src/routes/internal/alert-relay.ts` は line/branch とも実質 100%（追加 27 ケースが全分岐を踏む）。
