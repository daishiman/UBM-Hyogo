# Phase 11 — 手動テスト結果（NON_VISUAL）

## NON_VISUAL 宣言

- タスク種別: **implementation / NON_VISUAL**
- 非視覚的理由: Cloudflare Workers の internal route（`POST /internal/alert-relay`）挙動変更で UI 表示を伴わない
- 代替証跡: 自動テスト + staging 実機 smoke test 手順（user-gated）+ 本チェックリスト

## 主証跡

- 自動テスト: `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` 21 PASS（`evidence/api-test.txt`）
- typecheck: PASS（`evidence/typecheck.txt`）
- lint: PASS（`evidence/lint.txt`）

## staging 実機 smoke test 手順（user-gated）

> 実 deploy を伴うため、ユーザー明示承認後のみ実施。本サイクルでは手順定義までを完了とする。

```bash
# 1. KV namespace 作成
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env staging
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env production
# 出力 id を apps/api/wrangler.toml のコメント化済み block に反映し、コメント解除

# 2. staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 3. 既存 dedup key の存在確認（任意）
bash scripts/cf.sh kv:key list --binding ALERT_DEDUP_KV --env staging

# 4. 擬似 webhook 2 連送
curl -X POST "https://ubm-hyogo-api-staging.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: $STAGING_CF_WEBHOOK_AUTH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"alert_type":"test","policy_id":"manual-smoke-1","name":"smoke","ts":1715600000}'
sleep 2
curl -X POST "https://ubm-hyogo-api-staging.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: $STAGING_CF_WEBHOOK_AUTH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"alert_type":"test","policy_id":"manual-smoke-1","name":"smoke","ts":1715600001}'

# 5. 5 分経過後の再 webhook で deduped 解除を確認
sleep 305
curl -X POST "https://ubm-hyogo-api-staging.<account>.workers.dev/internal/alert-relay" \
  -H "cf-webhook-auth: $STAGING_CF_WEBHOOK_AUTH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"alert_type":"test","policy_id":"manual-smoke-1","name":"smoke","ts":1715600400}'
```

`STAGING_CF_WEBHOOK_AUTH_SECRET` は 1Password 経由（`op run --env-file=.env -- ...`）で取得する。`.env` の値を `cat` で読まない。

## 手動テストチェックリスト

| 項目 | 期待 | 結果 |
|------|------|------|
| staging deploy 成功 | `bash scripts/cf.sh deploy` が exit 0 | — (user-gated) |
| 1 回目 webhook 応答 | `{ ok: true, attempts: N }` | — (user-gated) |
| 2 回目 webhook 応答 | `{ ok: true, deduped: true }` | — (user-gated) |
| Slack #alerts への配信 | 1 件のみ | — (user-gated) |
| KV key list に dedup key が存在 | 5 分以内に entry あり | — (user-gated) |
| 5 分経過後の再 webhook | Slack に 1 件追加配信される | — (user-gated) |

## 自動テスト結果（本サイクル内で確認済み）

| ケース | 結果 |
|--------|------|
| ROUTE-01〜07, ROUTE-04b, ROUTE-05b, INDEX-01 | PASS |
| TC-03（異 metric は dedup されない） | PASS |
| TC-KV-01（TTL 経過 deduped 解除） | PASS |
| TC-KV-02（value="1" 固定） | PASS |
| TC-KV-03（expirationTtl=ceil(ms/1000)） | PASS |
| TC-KV-04（per-request put 高々 1 回） | PASS |
| TC-KV-05（KV get throw → Slack 配信なし） | PASS |
| ROUTE-05a（Slack 失敗後 retry は dedup されない） | PASS |
| TC-KV-06（policy_id 欠落時 fallback） | PASS |
| TC-KV-07（minuteBucket 境界跨ぎ） | PASS |
| TC-KV-08（dedupeTtlMs 上書き反映） | PASS |
| TC-KV-09（KV put throw after Slack success → 200 / dedupPersisted=false） | PASS |

## DoD

- [x] 手順とチェックリストを記載
- [x] NON_VISUAL 宣言を冒頭に記載
- [x] スクリーンショット不要（UI 変更なし）
