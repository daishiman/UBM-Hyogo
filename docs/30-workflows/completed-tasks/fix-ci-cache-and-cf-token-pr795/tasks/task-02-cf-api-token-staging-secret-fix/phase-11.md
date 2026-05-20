# Phase 11 — 手動テスト

## NON_VISUAL 宣言

本タスクは **NON_VISUAL** (CI infra 修正、UI を含まない)。

- スクリーンショット **不要**
- `outputs/phase-11/screenshots/.gitkeep` **不要**
- evidence は CLI 出力ログで代替する (canonical 9 headings の Phase 11 evidence 表に CLI 出力を記載)

## Evidence 表

| ID | 種別 | 取得コマンド | 期待値 | 保存先 |
| -- | ---- | ----------- | ------ | ------ |
| EV-11-1 | secret 存在 | `gh secret list --env staging --repo daishiman/UBM-Hyogo` | `CF_TOKEN_D1_STAGING` と `CF_TOKEN_WORKERS_STAGING` の 2 行が存在 (値は表示されない) | PR 本文 / Phase 11 evidence セクションに **名前のみ** 転記 |
| EV-11-2 | Apply D1 migrations 成功 | `gh run view <run-id> --log --job deploy-staging \| sed -n '/Apply D1 migrations/,/Deploy Workers app/p'` | step 内に `Resource location: remote` を含み、エラー行なく完了 | 上記抜粋を PR 本文に貼付 |
| EV-11-3 | Deploy Workers app 成功 | `gh run view <run-id> --log --job deploy-staging \| sed -n '/Deploy Workers app/,/Record post-migration/p'` | wrangler の `Deployment complete!` 等の成功ログ | 同上 |
| EV-11-4 | CLOUDFLARE_API_TOKEN エラー消失 | `gh run view <run-id> --log \| grep -c 'CLOUDFLARE_API_TOKEN environment variable'` | `0` | 数値を PR 本文に明記 |
| EV-11-5 | runtime-smoke-staging 起動 | `gh run list --workflow=backend-ci.yml --branch=dev --limit=1` | `runtime-smoke-staging` job が deploy-staging 成功後に起動していること | 出力行を PR 本文に貼付 |

## evidence 取得手順

1. Phase 5 までを完了し dev に PR をマージする
2. `gh run list --workflow=backend-ci.yml --branch=dev --limit=1` で最新 run-id を取得
3. `gh run watch <run-id>` で完了を待つ
4. 上記 5 種 evidence を取得し、値を含まない形で PR 本文の "Phase 11 evidence" セクションに転記

## 値の取り扱い

- `gh secret list` の出力には secret **名前のみ** が含まれる (値は GitHub API が返さない仕様)
- `gh run view --log` のログに wrangler が token 値を echo することは無い (`wrangler-action` は環境変数として渡すのみ)
- 万が一ログに base64/hex 様の長文字列が見えた場合は、PR 本文に貼る前に該当行を **マスクする**

## 失敗時の手動再検証

| 観測 | 手動再検証コマンド |
| ---- | ----------------- |
| `Apply D1 migrations` fail | 再 push 前に `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` でローカルから token 単体検証 |
| `Deploy Workers app` fail | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` |

> 上記ローカル検証は `scripts/cf.sh` 経由で行い、`op` を介して値を揮発的に注入する。実値はログに残さない。
