# Phase 10 — 最終レビュー

## 判定: PASS_WITH_EXTERNAL_OPS_PENDING（user-gated step 待ち項目を除く全 acceptance 達成）

## 受入条件チェック

- [x] `apps/api/src/routes/internal/alert-relay.ts` から `seenAlerts` Map が削除されている
- [x] dedup は `c.env.ALERT_DEDUP_KV.get/put` 経由で動作する
- [x] dedup key は Slack 配信成功後にのみ保存される。Slack 失敗後 retry は dedup されない
- [x] TTL 経過後の再受信が deduped 解除される（TC-KV-01 PASS）
- [x] `apps/api/wrangler.toml` に staging / production 両 env の user-gated `kv_namespaces` template がコメント化されている。active placeholder id は置かない
- [x] `apps/api/src/env.ts` に `ALERT_DEDUP_KV: KVNamespace` が必須プロパティとして追加されている
- [x] `bash scripts/cf.sh` 以外で `wrangler` を直接呼び出していない（新規追加ゼロ）
- [x] `pnpm typecheck` / `pnpm lint` / alert-relay test が全 PASS

## 判定理由

- MAJOR / CRITICAL 指摘は本レビュー内で修正済み（Slack 失敗後 retry が dedup されるリスクを解消）
- MINOR: `wrangler.toml` の実 id は user-gated step で反映予定。本サイクル内で完結する範囲ではない（active placeholder は残さない）
- KV operation error metric / KV usage Dashboard 監視は、KV dedup 移行と独立した運用拡張のため Phase 12 Task 4 で user-gated follow-up として記録

## 残課題

| 項目 | 種別 | 取り扱い |
|------|------|----------|
| `wrangler.toml` の実 namespace_id 反映 | user-gated runtime op | Phase 13 PR 作成時にユーザー承認後に実施 |
| staging 実機 smoke test | user-gated runtime op | 同上 |
| KV operation error metric の Analytics 連携 | follow-up | 別 workflow（UT-17 親 analytics 拡張） |

## DoD

- [x] `PASS_WITH_EXTERNAL_OPS_PENDING` 判定が記録されている
- [x] MINOR 指摘の未タスク化方針が記録されている
