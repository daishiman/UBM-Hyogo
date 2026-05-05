# cf.sh tail cross-check

## 整合確認

本 script の `R2 Tail` セクションが返す target Worker 名は、`bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` が解決する Worker 名と一致する。

| 本 script の R2 出力 | cf.sh tail の解決先 |
| --- | --- |
| `target=ubm-hyogo-web-production` | `apps/web/wrangler.toml` `[env.production].name` = `ubm-hyogo-web-production` |
| `target=ubm-hyogo-web` | rename 前 entity (legacy) |

## 実行手順 (運用者向け)

1. observability target 機械検証:
   ```
   bash scripts/observability-target-diff.sh \
     --current-worker ubm-hyogo-web-production \
     --legacy-worker  ubm-hyogo-web
   ```
2. R2 Tail target が `ubm-hyogo-web-production` であることを確認
3. 必要に応じて `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` で実 tail を取得 (本 script は target 名解決のみで実 tail を行わない)

## 不整合検出のシナリオ

- `wrangler.toml` の `[env.production].name` が `ubm-hyogo-web-production` 以外に変更された場合、本 script の `--current-worker` 引数と乖離 → 運用者が `--current-worker` 引数を更新する責務
