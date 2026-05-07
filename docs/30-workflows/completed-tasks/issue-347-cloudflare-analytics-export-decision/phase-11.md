# Phase 11 — 実測 evidence（NON_VISUAL）

## 目的

採用方式（GraphQL Analytics API）で runtime sample を取得するための evidence contract を固定し、representative schema sample と redaction-check を保存する。Cloudflare dashboard session / API token が必要な実 production sample は user approval 後に同一 schema で取得する。AC-6 を満たす。

## 取得手順

1. Cloudflare dashboard にログイン
2. GraphQL Analytics API Explorer を開く（または `curl https://api.cloudflare.com/client/v4/graphql` を `op run --env-file=.env --` 経由で実行。本タスクでは dashboard 手動実行を canonical 手順とする）
3. 以下 query を実行（前日 1 日分の aggregate）

```graphql
query AnalyticsLongTerm($accountTag: String!, $date: Date!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      httpRequests1dGroups(
        limit: 1
        filter: { date: $date }
      ) {
        sum { requests }
        dimensions { date }
      }
      d1AnalyticsAdaptiveGroups(
        limit: 100
        filter: { date: $date }
      ) {
        sum { reads writes }
      }
    }
  }
}
```

4. レスポンス JSON を `outputs/phase-11/evidence/sample-export/analytics-export-YYYYMMDD-HHmm-UTC.json` として保存
5. `phase-06/redaction-rules.md` の grep コマンドを sample に対して実行し、結果を `outputs/phase-11/evidence/sample-export/analytics-export-YYYYMMDD-HHmm-UTC.redaction-check.md` に記録

## 出力

- `outputs/phase-11/main.md`: NON_VISUAL summary（PASS / 取得日時 / fields / PII 不在）
- `outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.json`: representative schema sample
- `outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.redaction-check.md`: redaction grep 結果

## 完了条件

- [ ] representative schema sample JSON が 1 件以上保存
- [ ] redaction-check が PASS（PII 候補 grep がすべて空 hit）
- [ ] T-1〜T-4 の検証マトリクス（phase-04）が PASS
- [ ] sample 内に email / token / IP / UA / requestBody / query string が含まれていない

## 受け入れ条件（AC mapping）

- AC-1（実機での GraphQL API 動作確認）, AC-4, AC-6

## 検証手順

```bash
# 1. サンプル存在
ls docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/*.json

# 2. PII 候補が含まれていないこと
grep -iE "clientIP|email|token|sessionId|requestBody|responseBody|userAgent" \
  docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/*.json \
  && echo "FAIL" || echo "PASS"

# 3. redaction-check.md 存在
ls docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/*.redaction-check.md
```

## リスク

| リスク | 対策 |
| --- | --- |
| API token 未発行で取得不可 | dashboard GUI の GraphQL Explorer は session 認証で実行可能。token 不要経路を canonical とする |
| dataset 仕様で field 名が drift | 取得サンプルの field 名で Phase 5 storage-policy.md を実機確定（Phase 12 で diff 反映） |
| Free plan 範囲外の dataset を誤って query | Phase 9 確認済みの 3 dataset 以外を query しない |
