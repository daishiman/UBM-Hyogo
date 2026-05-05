# Phase 6 — 異常系・PII 検証

## 目的

万が一 PII（URL query / request body / user identifier）が export に混入した場合の検出・除去ルールを定義する。

## 禁止データ列挙（保存禁止）

- URL query string（`?token=`, `?email=`, `?id=` 等を含む完全 URL）
- request body / response body 全文
- IP address（`clientIP`, `originIP` 等の field）
- User-Agent 文字列の生値
- email address / member ID / session token
- form 回答内容（Google Form 由来の任意 user input）

## 許可データ（aggregate のみ）

- 日次集計値（count, sum, avg）
- HTTP status code 集計（2xx / 4xx / 5xx の count）
- D1 reads/writes の count
- cron invocation の count

## redaction-check 手順

```bash
# 1. export ファイルに禁止 field が含まれていないことを確認
SAMPLE=outputs/phase-11/evidence/sample-export/analytics-export-*.json
grep -iE "clientIP|originIP|userAgent|email|token|sessionId|requestBody|responseBody|query" "$SAMPLE" \
  && echo "FAIL: PII candidate found" \
  || echo "PASS: no PII"

# 2. URL を含む field が path のみで query を含まないことを確認
grep -oE '"[a-zA-Z]+":"[^"]*\?[^"]*"' "$SAMPLE" \
  && echo "FAIL: URL with query string" \
  || echo "PASS: no query string"
```

## fallback B（手動 CSV）採用時の追加手順

- CSV を保存する前に必ず Excel / numbers で開き、URL query / IP / UA 列を物理削除
- 削除前後の列名 diff を `redaction-check.md` に記録

## 出力

- `outputs/phase-06/main.md`: 異常系定義要旨
- `outputs/phase-06/redaction-rules.md`: 禁止 / 許可リスト + redaction-check 手順

## 完了条件

- [ ] 禁止 field が 6 件以上列挙
- [ ] redaction-check の grep コマンドが具体化
- [ ] fallback B 採用時の手動削除手順が記述

## 受け入れ条件（AC mapping）

- AC-4, AC-6

## 検証手順

```bash
grep -cE "clientIP|email|token|requestBody" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-06/redaction-rules.md
# 期待: >= 4
```

## リスク

| リスク | 対策 |
| --- | --- |
| 新規 field 追加で禁止リスト漏れ | Phase 11 redaction-check で exit 0 確認 + 不明 field を手動レビュー |
