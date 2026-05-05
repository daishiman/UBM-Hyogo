# Phase 9 — Free plan 制約確認

## 目的

Cloudflare Free plan で採用方式（GraphQL Analytics API）が継続的に利用可能であることを公式ドキュメント引用で確定し、AC-5 を満たす。

## 確認項目

| 項目 | 確認内容 | 確認元 |
| --- | --- | --- |
| GraphQL Analytics API 利用可否 | Free plan で `httpRequests1dGroups` / `d1AnalyticsAdaptiveGroups` / `workersInvocationsAdaptive` が select 可能か | https://developers.cloudflare.com/analytics/graphql-api/ |
| API rate limit | 1 分あたりリクエスト上限 | 公式 docs |
| retention（API 側） | dataset ごとの保持期間（多くは 30 day） | 公式 docs |
| token 種別 | API Token に必要な permission（`Account Analytics:Read`） | dashboard token UI |
| Logpush 不採用確認 | Logpush は Free plan 外であり採用しないことを明記 | 公式 docs |
| D1 metrics | Free plan で D1 reads/writes 取得可否 | https://developers.cloudflare.com/d1/observability/metrics-analytics/ |

## 想定結論

- Free plan で `account.viewer` + `Account Analytics:Read` token を発行すれば、aggregate query は無料枠内で取得可能
- API 側 retention は dataset により 30〜90 day 程度のため、本タスクで採用する「月次取得 → repo 保存」運用と整合（repo 側で 12 件 retention することで API 側 retention 上限を補完）
- Logpush は Free plan 外のため不採用

## 出力

- `outputs/phase-09/main.md`: 確認結論
- `outputs/phase-09/free-plan-constraints.md`: 確認項目表 + 公式 URL + 取得日

## 完了条件

- [ ] AC-5: Free plan 制約 6 項目すべて公式 URL 引用で確認
- [ ] Logpush 不採用宣言が記述
- [ ] API 側 retention と repo 側 retention の補完関係が記述

## 受け入れ条件（AC mapping）

- AC-5

## 検証手順

```bash
grep -cE "https://developers.cloudflare.com" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-09/free-plan-constraints.md
# 期待: >= 2
```

## リスク

| リスク | 対策 |
| --- | --- |
| Cloudflare 公式 docs が将来仕様変更 | 取得日を free-plan-constraints.md に明記し、年次レビューを 09c parent ops checklist に追加（Phase 12） |
| GraphQL field 名が dataset 更新で drift | Phase 5 storage-policy の field 名を Phase 11 取得サンプルで実機確定 |
