# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## 目的

受入条件・blocker・MINOR 指摘を判定し、Phase 11 着手可否を決める。

## 受入条件チェック

- [ ] `apps/api/src/routes/internal/alert-relay.ts` から `seenAlerts` Map が削除されている
- [ ] dedup は `c.env.ALERT_DEDUP_KV.get/put` 経由で動作する
- [ ] TTL 経過後の再受信が deduped 解除される（TC-KV-01 PASS）
- [ ] `apps/api/wrangler.toml` に staging / production 両 env の `kv_namespaces` が記載されている
- [ ] `apps/api/src/env.ts` に `ALERT_DEDUP_KV: KVNamespace` が必須プロパティとして追加されている
- [ ] `bash scripts/cf.sh` 以外で `wrangler` を直接呼び出していない
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm --filter @repo/api test` が全 PASS

## レビュー判定基準

| 判定 | 条件 |
|------|------|
| PASS | 全受入条件が PASS、MAJOR/CRITICAL 指摘ゼロ |
| MINOR 指摘あり | MAJOR 未満の改善余地。今回の受入条件に必要なものは同サイクル内で修正し、KV operation metrics / Dashboard 監視のように本タスクの信頼性移行と独立した運用拡張のみ Phase 12 Task 4 で user-gated follow-up 判定する |
| FAIL | 受入条件未達。Phase 5/6 へ戻す |

## 想定される MINOR

- KV operation の error metric（`get` / `put` 失敗率の Analytics 送信）は本タスクの acceptance blocker ではない。実施する場合は UT-17 親 analytics の運用拡張として別 workflow で扱う。
- KV usage の Cloudflare Dashboard モニタリング設定は、本タスクの KV dedup 移行と独立した外部運用設定のため user-gated。

## 完了条件

- [ ] PASS 判定または MINOR 指摘の未タスク化方針が記録されている
- [ ] `outputs/phase-10/final-review.md` に判定とチェック結果が記載されている
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 10
- status: completed

## 目的

最終レビューで 4 条件と残境界を確認する。

## 実行タスク

- acceptance と user-gated items を分類する。

## 参照資料

- `outputs/phase-10/final-review.md`

## 成果物/実行手順

- `outputs/phase-10/final-review.md`

## 完了条件

- [x] PASS_WITH_EXTERNAL_OPS_PENDING が記録されている

## 統合テスト連携

- Phase 11 evidence と対応する。
