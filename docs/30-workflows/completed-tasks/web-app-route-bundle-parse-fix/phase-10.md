# Phase 10: デプロイ / rollback

## 目的

staging → production の 2 段デプロイ手順と rollback 経路を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## デプロイ作業

| 段階 | コマンド | gate | 備考 |
| --- | --- | --- | --- |
| D-1 | `mise exec -- pnpm install`（lockfile 変更想定なし） | exit 0 | 念のためのワークツリーセットアップ |
| D-2 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0、`.open-next/worker.js` 生成 | DoD-T01-2 |
| D-3 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | `Current Version ID` 発行 | NFR-3（`wrangler` 直接実行禁止） |
| D-4 | staging smoke + tail（Phase 9 R-1 / R-2） | 全 PASS | **production deploy gate** |
| D-5 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` | `Current Version ID` 発行 | D-4 PASS 時のみ |
| D-6 | production smoke（Phase 9 R-3） | 全 PASS | DoD-T01-8 |

## rollback 経路

| 状況 | 手順 |
| --- | --- |
| local build fail（D-2 で fail） | `apps/web/package.json` の `--webpack` 追加を戻す。Worker 無変更 |
| staging smoke fail（D-4 で fail） | `bash scripts/cf.sh rollback efc4051e-160b-4c77-93ca-6a5751e952f3 --config apps/web/wrangler.toml --env staging` で直前バージョンに戻す。production deploy には進まない |
| production smoke fail（D-6 で fail） | `bash scripts/cf.sh rollback e608d54e-37a8-414d-865c-798ebfd71735 --config apps/web/wrangler.toml --env production` で直前バージョンに戻す |

## 直前 Version ID（rollback target）

| 環境 | Version ID | deploy 日 | 状態 |
| --- | --- | --- | --- |
| staging | `efc4051e-160b-4c77-93ca-6a5751e952f3` | 2026-05-08 | Server Component pages 200 / App Route 500 |
| production | `e608d54e-37a8-414d-865c-798ebfd71735` | 2026-05-08 | 同上（構造的） |

> rollback すると本不具合は再発するが、Server Component pages の 200 状態は維持される。再修正までの一時凌ぎとして許容。

## 環境変数 / Secrets

本タスクは env / secret を変更しない。`wrangler.toml` `[vars]` / `[env.<env>.vars]` も無編集。

## 完了条件

- [x] D-1〜D-6 を順序固定
- [x] rollback target Version ID を staging / production で確定
- [x] env / secret 無編集を宣言

## 出力

- `phase-10.md`

## 参照資料

- `outputs/phase-04/task-01-switch-next-build-to-webpack.md` §6 / §8
- `phase-03.md` §3.5
