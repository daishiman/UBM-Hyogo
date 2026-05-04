# Phase 9: observability / 監視 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

deploy 後の `/privacy` `/terms` 可用性監視と、OAuth verification 申請時に参照する evidence の保管を定義する。

## 監視項目

| 項目 | 手段 | 閾値 |
| --- | --- | --- |
| `/privacy` HTTP status | Cloudflare Workers Analytics (built-in) | 5xx 0% / 24h |
| `/terms` HTTP status | 同上 | 5xx 0% / 24h |
| OAuth consent URL 整合 | 月次手動確認（Cloud Console） | URL 一致 |

## 軽量定期確認（手動 runbook）

```bash
# 月次確認スクリプト（Phase 5 Step 6/8 と同じ curl）
for path in /privacy /terms; do
  for env in "$STAGING_HOST" "$PROD_HOST"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$env$path")
    echo "$env$path -> $code"
  done
done
```

期待: 全 200。non-200 の場合は Phase 8 rollback runbook へ遷移。

## evidence 保管

| evidence | 保管先 |
| --- | --- |
| HTTP smoke log | `outputs/phase-11/manual-smoke-log.md` |
| OAuth consent screen screenshot | `outputs/phase-11/consent-screen-screenshot.png` |
| 法務承認記録 | `outputs/phase-11/legal-review-note.md` |

## 既存 observability への統合

- 別途 sentry / slack alert は本タスクスコープ外（`09b-A-observability-sentry-slack-runtime-smoke` 側）
- 本タスクでは Cloudflare Workers 標準 analytics のみ依拠

## 完了条件

- [ ] 監視項目と閾値が明示されている
- [ ] evidence 保管 path が固定されている
- [ ] `outputs/phase-09/main.md` を作成する
