# Phase 5 — 保存ポリシー定義（保存先 / retention / 命名）

## 目的

採用 export 方式での「保存先パス・retention・命名規則・取得指標」を正本化し、AC-2 / AC-3 / AC-4 を満たす。

## 保存先

- 正本: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/`
  - 09c の post-release verification と物理連続性を保つ
- archive: `docs/30-workflows/completed-tasks/09c-.../outputs/phase-11/long-term-evidence/archive/YYYY-MM/`
  - retention 超過分の移送先

## 命名規則

- ファイル名: `analytics-export-YYYYMMDD-HHmm-UTC.json`（GraphQL レスポンスの aggregate JSON）
- redaction-check: `analytics-export-YYYYMMDD-HHmm-UTC.redaction-check.md`
- 1 取得 = 1 ペア

## retention

- 直近 12 件（≒12 か月分の月次取得想定）を `long-term-evidence/` に保持
- 13 件目以降を取得した時点で最古を `archive/YYYY-MM/` へ mv
- archive 自体は無期限保持（repo 内のため git history で復元可能）

## 取得指標（4 metric groups / 5 scalar values）

| 指標 | GraphQL field | 集計粒度 |
| --- | --- | --- |
| req/day | `httpRequests1dGroups.sum.requests` | 1 day |
| error rate | `httpRequests1dGroups.sum.responseStatusMap[5xx]` / total | 1 day |
| D1 reads | `d1AnalyticsAdaptiveGroups.sum.reads` | 1 day |
| D1 writes | `d1AnalyticsAdaptiveGroups.sum.writes` | 1 day |
| cron / event volume | `workersInvocationsAdaptive.sum.requests`（cron-triggered のみ filter） | 1 day |

> Note: 上記 GraphQL field 名は Phase 9 で公式ドキュメント実機照合により最終確定する。Phase 5 ではポリシー意図（aggregate field 限定）を確定し、field 名 drift は Phase 9 で吸収する。

## 出力

- `outputs/phase-05/main.md`: 保存ポリシー要旨
- `outputs/phase-05/storage-policy.md`: 保存先 / 命名 / retention / 指標表

## 完了条件

- [ ] AC-2: 保存先 1 つに正本化
- [ ] AC-3: retention の数値定義（12 件 / 月次取得）
- [ ] AC-4: 4 metric groups / 5 scalar values の列挙と URL query / body / user data 非保存ルール明示
- [ ] archive 運用ルール記述

## 受け入れ条件（AC mapping）

- AC-2, AC-3, AC-4

## 検証手順

```bash
grep -E "long-term-evidence|archive" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-05/storage-policy.md
grep -E "12 件|12件|月次" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-05/storage-policy.md
```

## リスク

| リスク | 対策 |
| --- | --- |
| 09c phase-11 ディレクトリが存在しない | Phase 10 で `mkdir -p` 手順を runbook 化 |
| GraphQL field 名が dataset 変更で drift | Phase 9 で field 名最終確定、ポリシー側は aggregate 限定の意図を保持 |
