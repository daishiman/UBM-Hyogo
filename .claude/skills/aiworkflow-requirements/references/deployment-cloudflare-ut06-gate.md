# Cloudflare デプロイメント — UT-06 実行前ゲート（2026-04-27）

> 親ファイル `deployment-cloudflare.md` の責務分離（500 行制約対応）。UT-06 本番デプロイ実行波の canonical 前提条件を集約する。

## canonical 実行ラッパー

UT-06 本番デプロイ実行では、Cloudflare CLI を直接実行せず、必ず `bash scripts/cf.sh ...` を使う。`scripts/cf.sh` は `scripts/with-env.sh` 経由で 1Password の `op://` 参照を解決し、`ESBUILD_BINARY_PATH` と `mise exec` を固定する。

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

## 実行前ゲート

UT-06 実行前に次を満たすこと。

| ゲート | 判定 |
| --- | --- |
| Web deploy 形式 | `apps/web/wrangler.toml` が OpenNext Workers 形式（`main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets"`）であること。`pages_build_output_dir` が残る場合は Pages 形式として扱い、UT-06 AC-1 の実行前ブロッカーにする |
| API D1 smoke | `apps/api` が D1 binding を受け取り、API 経由で `SELECT 1` 相当を確認できること。`/health/db` 未実装の場合は AC-4 の実行前ブロッカーにする |
| Health body | Phase 11 smoke の期待値と `GET /health` 実装の JSON shape が一致していること |
| Secret hygiene | `.env` に実値を書かず、`op://` 参照のみを置くこと |
| Screenshot evidence | 本番 smoke 後、実スクリーンショットを `outputs/phase-11/screenshots/` に保存すること。placeholder は証跡として扱わない |

## 関連

- 親: `deployment-cloudflare.md`
- 教訓: `lessons-learned-current-2026-04-ut06.md` L-UT06-001〜005
- ワークフロー: `task-workflow` UT-06
