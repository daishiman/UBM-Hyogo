# Phase 11: 手動テスト（NON_VISUAL）

[実装区分: 実装仕様書]

## NON_VISUAL 宣言

- タスク種別: **implementation / NON_VISUAL**
- 非視覚的理由: 本タスクは Cloudflare Workers の internal route（`POST /internal/alert-relay`）の挙動変更であり、UI 表示は一切伴わない。
- 代替証跡: 自動テスト結果（Phase 4-7）+ staging 実機 smoke test（後述）+ `manual-test-result.md` のチェックリスト

## 証跡の主ソース

- 自動テスト: `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` の全 PASS 件数
- 実機証跡: staging 環境への deploy + 擬似 webhook 2 連送の Slack 配信観測

## staging 実機 smoke test 手順

> 実 deploy を伴うため、ユーザー明示承認後のみ実施。仕様書段階では「手順を定義」までを完了とする。

```bash
# 1. staging deploy（cf.sh ラッパー経由）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 2. KV namespace に既存 dedup key が残っていないことを確認（任意）
bash scripts/cf.sh kv:key list ALERT_DEDUP_KV --env staging

# 3. 擬似 webhook を 2 回連続送信
curl -X POST "https://<staging api host>/internal/alert-relay" \
  -H "cf-webhook-auth: $STAGING_CF_WEBHOOK_AUTH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"alert_type":"test","policy_id":"manual-smoke-1","name":"smoke","ts":1715600000}'
sleep 2
curl -X POST "https://<staging api host>/internal/alert-relay" \
  -H "cf-webhook-auth: $STAGING_CF_WEBHOOK_AUTH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"alert_type":"test","policy_id":"manual-smoke-1","name":"smoke","ts":1715600001}'

# 4. Slack #alerts チャンネルに 1 件のみ届くこと、2 件目応答が { ok: true, deduped: true } を確認
```

`STAGING_CF_WEBHOOK_AUTH_SECRET` は 1Password 経由で取得。**`.env` から `cat` で読まない**（CLAUDE.md 禁止事項）。

## 手動テストチェックリスト

| 項目 | 期待 | 結果（記入） |
|------|------|------------|
| staging deploy 成功 | `bash scripts/cf.sh deploy` が exit 0 | — |
| 1 回目 webhook 応答 | `{ ok: true, attempts: N }` | — |
| 2 回目 webhook 応答 | `{ ok: true, deduped: true }` | — |
| Slack #alerts への配信 | 1 件のみ | — |
| KV key list に dedup key が存在 | 5 分以内に entry あり | — |
| 5 分経過後の再 webhook | Slack に 1 件追加配信される | — |

## 完了条件

- [ ] 上記手順とチェックリストが `outputs/phase-11/manual-test-result.md` に書かれている
- [ ] NON_VISUAL 宣言と代替証跡が同ファイル冒頭に記載されている
- [ ] スクリーンショットは作成しない（`outputs/phase-11/screenshots/` は作らない）
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 11
- status: completed

## 目的

NON_VISUAL local evidence と runtime smoke 手順を記録する。

## 実行タスク

- typecheck、lint、focused test evidence を保存する。

## 参照資料

- `outputs/phase-11/manual-test-result.md`

## 成果物/実行手順

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/evidence/api-test.txt`

## 完了条件

- [x] NON_VISUAL 宣言がある
- [x] focused test evidence がある

## 統合テスト連携

- UI screenshot は不要。runtime smoke は user-gated。
