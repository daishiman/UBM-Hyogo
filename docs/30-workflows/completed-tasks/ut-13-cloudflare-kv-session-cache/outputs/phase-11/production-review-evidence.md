# Phase 11: production 環境レビュー証跡（書き込み回避）

## 方針

production 環境への put / get smoke test は本番データ汚染リスクのため **原則実施しない**。代わりに以下のレビュー観点で証跡を残す。

## production レビュー項目

| # | レビュー項目 | 確認方法 | 想定結果 |
| --- | --- | --- | --- |
| 1 | production Namespace の存在確認 | `wrangler kv:namespace list \| grep ubm-hyogo-kv-prod` | ヒットする |
| 2 | production binding 設定の存在確認 | `grep -A3 "env.production.kv_namespaces" apps/api/wrangler.toml` | `binding = "SESSION_KV"` を含む |
| 3 | production の id が staging と異なる | wrangler.toml の env.production.id と env.staging.id を比較 | 異なる |
| 4 | production には preview_id が**ない** | `grep -A4 "env.production.kv_namespaces" apps/api/wrangler.toml` | preview_id 行なし |
| 5 | production の Account ID 整合 | `wrangler whoami` の account ID と wrangler.toml の `account_id` 一致 | 一致 |

## production 書き込み例外手順（原則禁止）

万が一 production への動作確認が必要となった場合：

1. ステークホルダー承認を得る（インフラ責任者）
2. 検証用キー名を `verify:phase-05:<UTC-timestamp>` 形式で衝突回避
3. `--ttl=60` で必ず TTL を付与
4. put 直後に必ず delete でクリーンアップ
5. 完了後、`wrangler kv:key list --binding=SESSION_KV --env=production` で残存ゼロを確認

```bash
# 上記手順の例（実施時のみ使用）
TS=$(date -u +%Y%m%dT%H%M%SZ)
wrangler kv:key put --binding=SESSION_KV --env=production --ttl=60 \
  "verify:phase-05:${TS}" "production-review"
wrangler kv:key get --binding=SESSION_KV --env=production \
  "verify:phase-05:${TS}"
wrangler kv:key delete --binding=SESSION_KV --env=production \
  "verify:phase-05:${TS}"
wrangler kv:key list --binding=SESSION_KV --env=production | grep "verify:phase-05" || echo "no leftover"
```

## docs-only タスクでの結論

本タスクは spec_created / docs-only のため、上記レビュー観点の **手順定義** をもって production 動作確認の証跡とする。実コマンド実行は下流タスク（インフラ担当 / 認証実装タスク）に委譲する。
