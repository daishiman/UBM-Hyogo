# Phase 2: 設計 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 状態 | completed |
| 完了日 | 2026-04-26 |

## 設計方針

本タスクは **docs-first / spec_created** タスク。実インフラ変更はなく、観測・runbook・rollback の判断基準をドキュメントとして整備する。

## 構成図

```
Cloudflare Analytics (無料) ──→ 手動確認 (ops)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Pages build       Workers req      D1 quota
              budget check      /日チェック       チェック
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                          cost-guardrail-runbook.md
                          (閾値 & 対処フロー)
                                    │
                          ┌─────────┴─────────┐
                          ▼                   ▼
                     rollback 手順       degrade 判断
                  (CF ダッシュボード)    (pause / feature-off)
```

## 環境分離設計

| 項目 | dev (staging) | main (production) |
| --- | --- | --- |
| Pages プロジェクト | ubm-hyogo-web-staging | ubm-hyogo-web |
| D1 データベース | ubm-hyogo-db-staging | ubm-hyogo-db-prod |
| Workers | 同 worker, env:dev | 同 worker, env:production |
| 観測確認先 | CF ダッシュボード / staging project | CF ダッシュボード / production project |
| GitHub Actions | PRトリガー CI | main マージ CD |

## 観測対象と確認方法

| 観測対象 | 確認方法 | 頻度 |
| --- | --- | --- |
| Pages builds/月 | CF Dashboard → Pages → Deployments | 月1回 or デプロイ増加時 |
| Workers requests/日 | CF Dashboard → Workers → Analytics | 週1回 or 異常感知時 |
| D1 reads/日, storage | CF Dashboard → D1 → Metrics | 週1回 |
| GitHub Actions minutes/月 | GitHub → Settings → Billing | 月1回 |

## 主要成果物パス

| 成果物 | パス |
| --- | --- |
| 観測マトリクス | outputs/phase-02/observability-matrix.md |
| コスト runbook | outputs/phase-05/cost-guardrail-runbook.md |
| manual ops checklist | outputs/phase-11/manual-ops-checklist.md |
| operations guide | outputs/phase-12/operations-guide.md |

## secret 設計

本タスクで新規 secret は導入しない。既存の以下を参照のみ。

| secret 名 | 種別 | 置き場所 |
| --- | --- | --- |
| CLOUDFLARE_API_TOKEN | deploy auth | GitHub Secrets |
| CLOUDFLARE_ACCOUNT_ID | deploy auth | GitHub Secrets |

## downstream handoff

Phase 3 (設計レビュー) に本成果物を引き継ぐ。observability-matrix.md は Phase 2 で完成させる。
