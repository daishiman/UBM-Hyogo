# Phase 12 — ドキュメント更新 (implementation-guide)

PR 本文 (Phase 13) の元データとなる `outputs/phase-12/implementation-guide.md` の骨子。実装プロンプトは本タスク完了時に下記を反映した implementation-guide を生成する。

## Part 1 — 中学生レベルの概念説明 (canonical)

> Phase 12 必須: 専門用語を中学生でも理解できる比喩で説明する。

### この変更は何をするのか

GitHub Actions は、コードを push するたびに自動で動くロボットの工場のようなもの。今回直したのは「ステージング(本番じゃない練習場)に自動デプロイするロボット」が、Cloudflare(私たちのサーバー)に入るためのパスワードを見つけられず止まっていた問題。

### なぜ動かなかったのか

ロボットは 2 種類の方法でパスワードを受け取れる:

1. 「窓口で手渡し」(YAML の `with.apiToken`)
2. 「ポケットに入れて自分で取り出す」(環境変数 `CLOUDFLARE_API_TOKEN`)

これまでは 1 だけを使っていた。窓口担当がパスワードを忘れる(secret 未登録)と、ロボットはそれ以上動けなくなる。

### どう直したのか

1. **窓口にちゃんとパスワードを置く** (GitHub の environment secret 登録)
2. **同じパスワードをもう一つの読み取り口にも渡す** (YAML に step-level `env:` ブロック追加)

両方やることで、`wrangler-action` と内部の `wrangler` が同じ scoped secret を見られる。ただし別パスワードではないため、GitHub Secret が未登録なら正しく失敗する。

### なぜ両方やる必要があったのか

GitHub の secret 登録が真の復旧条件。YAML 側の env 併用は token 読み取り口の互換性対策で、secret が空のままなら根本解決にならない。だから secret 確認と YAML 整合を同時に扱う。

## Part 2 — 技術的詳細

### 変更ファイル

- `.github/workflows/backend-ci.yml` (+12 行)
  - `deploy-staging` / `deploy-production` job 内の D1 / Workers 4 step に `env:` 追加
- `scripts/__tests__/workflow-env-scope.test.sh`
  - backend-ci 4 step の `with.apiToken` と step-level `env.CLOUDFLARE_API_TOKEN` が同じ scoped secret を参照することを検証

### 追加された GitHub Environment Secret

| Name | Environment | Reference |
| ---- | ----------- | --------- |
| `CF_TOKEN_D1_STAGING` | staging | op://Cloudflare/UBM-Hyogo-D1-Staging/token |
| `CF_TOKEN_WORKERS_STAGING` | staging | op://Cloudflare/UBM-Hyogo-Workers-Staging/token |

### 設計判断の根拠

- **B1 + B2 併用**: secret 登録 (B1) が真の復旧条件。YAML 堅牢化 (B2) は同じ scoped secret を action input と env の両方へ渡す互換性対策
- **B3 不採用**: repository scope secret への統一は environment 分離 (staging/production) の governance を放棄するため却下
- **`deploy-production` 横展開**: 同じ failure mode を main path に残さないため同 cycle で適用

### 検証コマンド (再掲)

```bash
actionlint .github/workflows/backend-ci.yml
gh secret list --env staging --repo daishiman/UBM-Hyogo
gh run view <run-id> --log --job deploy-staging
```

### CLAUDE.md 規約遵守

- §シークレット管理: 実値は 1Password に保管、`.env` / docs / log に転記しない
- §Cloudflare 系 CLI 実行ルール: GitHub Actions 上は `wrangler-action` が canonical (ローカル `scripts/cf.sh` ルールとはドメインが異なる)
- §既定ブランチ: PR base = `dev`

### 残課題 (Follow-up)

| ID | 内容 |
| -- | ---- |
| UNASSIGNED-01 | `backend-ci.yml` に `workflow_dispatch` trigger を追加し pre-merge dry-run を可能にする |
| UNASSIGNED-02 | `deploy-production` job に同等 env fallback を適用する (production リリース pipeline 改修タスク) |

## implementation-guide 生成先

`docs/30-workflows/fix-ci-cache-and-cf-token-pr795/outputs/phase-12/implementation-guide.md` (本ワークフロー root 配下)。

> task-01 と task-02 は同 PR に同梱されるため、implementation-guide も 2 タスク合算で 1 ファイルに統合する想定。task-02 単独節として上記 Part 1/Part 2 を含める。
