# Cost Guardrail Runbook — 無料枠ガードレール runbook

> パス: outputs/phase-05/cost-guardrail-runbook.md
> 参照元: deployment-cloudflare.md, deployment-core.md, observability-matrix.md

## 概要

Cloudflare / GitHub Actions の無料枠を維持するための手動確認手順と対処フローを定義する。

---

## 1. 定期確認スケジュール

| 頻度 | 対象 | 確認先 |
| --- | --- | --- |
| 月1回 | Pages builds/月 | CF Dashboard → Pages → Deployments |
| 月1回 | GitHub Actions minutes/月 | GitHub → Settings → Billing |
| 週1回 | Workers requests/日 (直近7日) | CF Dashboard → Workers → Analytics |
| 週1回 | D1 reads/writes/日, storage | CF Dashboard → D1 → Metrics |
| 月1回 | KV reads/writes, R2 storage/Class A/Class B | CF Dashboard → KV/R2 → Metrics |

---

## 2. 閾値と対処フロー (AC-2, AC-5)

### 2-1. Cloudflare Pages builds

| 段階 | 閾値 | 対処 |
| --- | --- | --- |
| 正常 | < 400/月 | 対応不要 |
| 警戒 | 400〜479/月 | CI の冗長 run を見直す。不要な feature branch へのデプロイを停止 |
| 対処 | ≥ 480/月 | 手動デプロイを一時停止。main マージ CD のみ残す |

### 2-2. Cloudflare Workers requests

| 段階 | 閾値 | 対処 |
| --- | --- | --- |
| 正常 | < 80,000/日 | 対応不要 |
| 警戒 | 80,000〜94,999/日 | アクセスログ確認、Bot / クローラーの排除検討 |
| 対処 | ≥ 95,000/日 | 低優先 API エンドポイントを一時 503 degrade。キャッシュ強化 |

### 2-3. Cloudflare D1 reads

| 段階 | 閾値 | 対処 |
| --- | --- | --- |
| 正常 | < 4,000,000/日 | 対応不要 |
| 警戒 | 4,000,000〜4,749,999/日 | N+1 クエリ調査、クエリキャッシュ追加検討 |
| 対処 | ≥ 4,750,000/日 | 読み取り負荷の高い機能を一時無効化 |

### 2-4. D1 storage

| 段階 | 閾値 | 対処 |
| --- | --- | --- |
| 正常 | < 4GB | 対応不要 |
| 警戒 | 4〜4.74GB | 不要レコード・ログデータの確認 |
| 対処 | ≥ 4.75GB | アーカイブ / 削除実施。必要なら有料プラン検討 |

### 2-5. Cloudflare D1 writes

| 段階 | 閾値 | 対処 |
| --- | --- | --- |
| 正常 | < 80,000行/日 | 対応不要 |
| 警戒 | 80,000〜94,999行/日 | hourly cron、manual sync、backfill の実行回数を確認 |
| 対処 | ≥ 95,000行/日 | backfill と手動 sync を一時停止。必要なら翌日に分割実行 |

### 2-6. GitHub Actions minutes (private repo)

| 段階 | 閾値 | 対処 |
| --- | --- | --- |
| 正常 | < 1,600 min/月 | 対応不要 |
| 警戒 | 1,600〜1,999 min/月 | 不要 job / matrix の削減 |
| 対処 | ≥ 2,000 min/月 | CI を PR ラベル制御に切り替え、不要 run をスキップ |

### 2-7. KV / R2 operations

| 対象 | 段階 | 対処 |
| --- | --- | --- |
| KV reads/writes | 警戒 | 利用開始済みの場合のみ、feature flag / cache key の読み書き頻度を確認 |
| KV reads/writes | 対処 | 利用開始済みの場合のみ、低優先の読み書きを停止。現行 API に KV binding がない場合はコード変更 task として扱う |
| R2 storage / Class A / Class B | 警戒 | 利用開始済みの場合のみ、object upload / list / read の発生源を確認 |
| R2 storage / Class A / Class B | 対処 | 利用開始済みの場合のみ、upload や batch 処理を停止。現行 MVP で未利用なら発生源調査を優先 |

---

## 3. Rollback 手順 (AC-5)

### 3-1. Cloudflare Pages rollback

**ダッシュボードから（推奨）**
1. CF Dashboard → Pages → [プロジェクト名] → Deployments
2. 戻したいデプロイを選択 → 「Rollback to this deployment」

**CLI から**
```bash
wrangler pages deployment rollback <deployment-id> \
  --project-name ubm-hyogo-web
```

### 3-2. rollback 判断基準

| 状況 | 判断 |
| --- | --- |
| ビルド失敗 | CF Pages が自動で旧バージョン維持 → 手動不要 |
| エラー率 > 5% | rollback 検討 |
| パフォーマンス劣化 > 30% | rollback 検討 |
| マイナー不具合 | 次リリースで修正 |

---

## 4. Degrade 手順 (AC-5)

### 4-1. Workers API 一時停止

特定ルートを 503 Service Unavailable に切り替える（Hono middleware で制御）。

```typescript
// apps/api/src/index.ts — 一時的な degrade 例
app.use('/api/heavy-endpoint', (c) => {
  return c.json({ error: 'Service temporarily unavailable' }, 503);
});
```

### 4-2. 機能フラグによる degrade

Cloudflare KV の機能フラグで特定機能を無効化する設計は将来拡張である。現行 API に KV binding がない場合は、手動コード変更または後続 task の `task-imp-05a-kv-r2-guardrail-detail-001` で実装する。

---

## 5. 観測環境分離 (AC-4)

| 環境 | CF Dashboard 確認先 | 説明 |
| --- | --- | --- |
| dev (staging) | Pages: ubm-hyogo-web-staging / D1: ubm-hyogo-db-staging | PR / dev ブランチのビルド |
| main (production) | Pages: ubm-hyogo-web / D1: ubm-hyogo-db-prod | 本番のビルド・リクエスト |

dev / main は観測対象として分ける。ただし Pages builds、Workers requests、KV/R2 operations などはアカウントやプラン単位で合算確認が必要な項目がある。環境別の原因切り分けと、アカウント全体の残量確認を同じ日に実施する。

---

## 6. 新規 secret 非導入確認 (AC-3)

本タスクで追加する secret はない。以下の既存 secret のみ利用。

| secret 名 | 種別 | 置き場所 |
| --- | --- | --- |
| CLOUDFLARE_API_TOKEN | deploy auth | GitHub Secrets |
| CLOUDFLARE_ACCOUNT_ID | deploy auth | GitHub Secrets |

---

## 参照

- [observability-matrix.md](../phase-02/observability-matrix.md)
- [deployment-cloudflare.md](../../../../.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md)
- [deployment-core.md](../../../../.claude/skills/aiworkflow-requirements/references/deployment-core.md)
