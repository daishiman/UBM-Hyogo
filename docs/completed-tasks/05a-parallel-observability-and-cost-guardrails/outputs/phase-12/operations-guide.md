# Operations Guide — 運用ガイド

> パス: outputs/phase-12/operations-guide.md
> タスク: 05a-parallel-observability-and-cost-guardrails

## 概要

UBM兵庫支部会メンバーサイトの Cloudflare / GitHub Actions 無料枠を維持するための運用ガイド。

---

## 概念説明（中学生レベル）

| 用語 | たとえ話 |
| --- | --- |
| Google Sheets | 受付ノート（入力データの窓口） |
| Cloudflare D1 | 図書館の正本台帳（データの正式な保管場所） |
| Cloudflare Pages/Workers | 窓口（ユーザーへのサービス提供） |
| GitHub Actions | 変更履歴の自動チェック係 |
| 1Password | 鍵の保管庫（秘密情報の管理） |
| 無料枠 | 月ごとの無料サービス利用上限 |

---

## システム構成概要

```
[ユーザー] → Cloudflare Pages (apps/web / Next.js)
                      ↓
             Cloudflare Workers (apps/api / Hono)
                      ↓
               Cloudflare D1 (ubm-hyogo-db-prod)

[開発者] → GitHub → GitHub Actions CI/CD → Cloudflare デプロイ
```

---

## 環境構成

| 環境 | ブランチ | Pages プロジェクト | D1 DB |
| --- | --- | --- | --- |
| ローカル | feature/* | — | ローカル D1 |
| ステージング | dev | ubm-hyogo-web-staging | ubm-hyogo-db-staging |
| 本番 | main | ubm-hyogo-web | ubm-hyogo-db-prod |

---

## 無料枠観測 — クイックリファレンス

| サービス | 無料枠 | 警戒ライン | 確認先 |
| --- | --- | --- | --- |
| Pages builds | 500/月 | 400/月 | CF Dashboard → Pages |
| Workers req | 100k/日 | 80k/日 | CF Dashboard → Workers |
| D1 reads | 5M/日 | 4M/日 | CF Dashboard → D1 |
| D1 writes | 100k/日 | 80k/日 | CF Dashboard → D1 |
| D1 storage | 5GB | 4GB | CF Dashboard → D1 |
| KV reads | 100k/日 | 80k/日 | CF Dashboard → KV |
| KV writes | 1k/日 | 800/日 | CF Dashboard → KV |
| R2 storage | 10GB | 8GB | CF Dashboard → R2 |
| R2 Class A ops | 1M/月 | 800k/月 | CF Dashboard → R2 |
| R2 Class B ops | 10M/月 | 8M/月 | CF Dashboard → R2 |
| GH Actions | 2000 min/月* | 1600/月 | GitHub → Billing |

*public repo は無制限

---

## 定期確認スケジュール

| 頻度 | 確認項目 |
| --- | --- |
| 月1回 | Pages builds, GitHub Actions, KV/R2 operations |
| 週1回 | Workers requests, D1 reads/writes/storage |

詳細手順: [manual-ops-checklist.md](../phase-11/manual-ops-checklist.md)

注記: 現行 `apps/web/wrangler.toml` は Pages build output を使うため Pages builds を監視対象に含める。OpenNext Workers 方針との差分整理は `task-ref-cicd-workflow-topology-drift-001` で扱う。

---

## Rollback 手順

1. CF Dashboard → Pages → [プロジェクト] → Deployments
2. 戻したいデプロイを選択
3. "Rollback to this deployment" をクリック

---

## Secret 管理ルール

| 種別 | 置き場所 |
| --- | --- |
| ランタイム secret | Cloudflare Secrets |
| CI/CD secret | GitHub Secrets |
| ローカル secret の正本 | 1Password Environments |

**平文 `.env` はリポジトリにコミットしない。**

---

## 関連ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| [observability-matrix.md](../phase-02/observability-matrix.md) | 無料枠一覧・閾値・確認先 |
| [cost-guardrail-runbook.md](../phase-05/cost-guardrail-runbook.md) | 閾値別対処フロー・rollback・degrade 手順 |
| [manual-ops-checklist.md](../phase-11/manual-ops-checklist.md) | 月次・週次確認チェックリスト |
