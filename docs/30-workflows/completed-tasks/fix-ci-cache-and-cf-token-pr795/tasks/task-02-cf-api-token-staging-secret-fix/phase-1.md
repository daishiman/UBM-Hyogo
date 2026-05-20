# Phase 1 — 要件定義

> workflow root `outputs/phase-1/phase-1.md` を継承し、task-02 固有スコープに収束させた要件定義。

## task-02 固有スコープ

| 含む | 含まない |
| ---- | -------- |
| `.github/workflows/backend-ci.yml` の `deploy-staging` job のみ | `deploy-production` job (line 69-122) |
| `staging` environment 配下の secret 整備 (`CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING`) | `production` environment 配下の secret (`CF_TOKEN_D1_PRODUCTION` / `CF_TOKEN_WORKERS_PRODUCTION`) |
| `wrangler-action@v3` 入力経路の堅牢化 (`env.CLOUDFLARE_API_TOKEN` fallback) | `wrangler-action` バージョン昇格 |
| `Apply D1 migrations` / `Deploy Workers app` の 2 step | `Record post-migration deploy failure` step (summary 出力のみで token 不要) |

## 前提 — secret rotation 候補の整理

phase-1 (workflow root) の因果分析で抽出された 3 候補のうち、本タスクで扱うのは:

1. **(優先 1)** `staging` environment に `CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING` が未登録 — Phase 5 の gh CLI 登録手順で解消
2. **(優先 2)** secret は repository scope に存在するが environment scope にコピーされていない — 同上手順で environment scope 側を canonical 化して解消
3. **(優先 3)** secret 名が rotation で変わった可能性 — Phase 4 検証手順 `gh secret list --env staging` の結果差分で確認

候補 (3) が真である場合は Phase 5 の途中で `gh secret list` 結果を判断材料に旧名 secret を削除し、上記 2 件の正規名で再登録する。

## 1Password vault 参照ルール

| 項目 | 値 |
| ---- | -- |
| Vault | `Cloudflare` |
| D1 staging token Item | `UBM-Hyogo-D1-Staging`、Field `token` → reference: `op://Cloudflare/UBM-Hyogo-D1-Staging/token` |
| Workers staging token Item | `UBM-Hyogo-Workers-Staging`、Field `token` → reference: `op://Cloudflare/UBM-Hyogo-Workers-Staging/token` |
| 値の取り扱い | Phase 5 の `gh secret set ... --body "$(op read '<ref>')"` 経路でのみ参照。`echo` / `cat` / Read tool で表示禁止 |
| permission | tokens は Cloudflare API token (scope: `D1:Edit` / `Workers Scripts:Edit`, account scope `UBM-Hyogo`) を想定 |

## 受入条件 (DoD) — task-02 単独

workflow root の AC を task-02 視点に絞ったもの:

| ID  | 条件 | 検証方法 |
| --- | ---- | -------- |
| AC-1 | `deploy-staging` job が green になる | `gh run list --workflow=backend-ci.yml --branch=dev` で latest = success |
| AC-2 | `Apply D1 migrations` step success | `gh run view <run-id> --log --job deploy-staging` で該当 step exit 0 |
| AC-3 | `Deploy Workers app` step success | 同上 |
| AC-4 | `CLOUDFLARE_API_TOKEN environment variable` エラーログ消失 | 同 log の grep 0 件 |
| AC-5 | actionlint clean | `actionlint .github/workflows/backend-ci.yml` exit 0 |
| AC-6 | secret 2 件が environment scope に存在 | `gh secret list --env staging --repo daishiman/UBM-Hyogo` で 2 件確認 |
| AC-7 | 実 token 値がリポジトリ / docs / log に出現しない | `git diff` の grep, PR 本文の手動レビュー |

## 不変条件 (再掲)

1. `deploy-production` job 不変更 — production リリース pipeline は別タスク
2. `wrangler-action@v3` の `wranglerVersion: 4.85.0` を維持
3. CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール 遵守。本タスクは GitHub Actions 上の wrangler-action が canonical で、`scripts/cf.sh` ローカル規則とは別ドメイン
4. secret 値はコード / docs / コメント / log に転記しない

## NON_VISUAL 宣言

本タスクは **NON_VISUAL** (CI infra 修正)。Phase 11 のスクリーンショットは不要、`outputs/phase-11/screenshots/.gitkeep` も不要。Phase 11 evidence は CLI 出力で代替する。
