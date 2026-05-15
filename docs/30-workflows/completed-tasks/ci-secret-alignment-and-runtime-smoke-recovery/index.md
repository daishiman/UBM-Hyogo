# CI pipeline secret alignment & runtime smoke recovery workflow

## ワークフロー概要

`web-cd` の `deploy-staging` が `[cf.sh] 1Password CLI (op) が見つかりません` で失敗、
`backend-ci` の `runtime smoke staging / smoke` が `STAGING_API_BASE is required` で失敗している
（PR #648 マージ後の `dev` push, run #374）。

両 job の失敗を**実コード変更（workflow YAML）と GitHub Environment 設定変更**で恒久解消する。
本ワークフローはデプロイ経路から 1Password 依存を外し、CI 内では `secrets`/`vars` のみで完結させる。

## スコープ

| In | Out |
|---|---|
| `.github/workflows/web-cd.yml` の secret 参照名統一 | `apps/web` / `apps/api` のソース変更 |
| `.github/workflows/runtime-smoke-staging.yml` の事前 readiness gate 追加 | runtime smoke スクリプト本体ロジックの再設計 |
| GitHub Environments (`staging` / `production` / `staging-runtime-smoke`) の secret provisioning runbook（[`staging`](runbooks/staging-secret-provisioning.md) / [`production`](runbooks/production-secret-provisioning.md) / [`staging-runtime-smoke`](runbooks/secret-provisioning.md)） | Cloudflare 本番デプロイの再実行 |
| `scripts/cf.sh` の CI 経路ドキュメント補強（op skip 条件の明示） | `scripts/cf.sh` のロジック書き換え |

## 含む不変条件

1. **CI 内では 1Password CLI (`op`) を呼ばない**。`CLOUDFLARE_API_TOKEN` は GitHub Environment Secret から直接 env に注入する。`cf.sh` は env 既存時に op を skip する既存分岐 (`CF_SH_SKIP_WITH_ENV=1`) に乗せる。
2. **ローカル開発では従来どおり 1Password 経由**。`scripts/cf.sh` 自体のロジックは変えず、CI workflow 側で `CLOUDFLARE_API_TOKEN` を必ず env に渡す責務を満たす。
3. `runtime-smoke-staging.yml` は**必須 env が空のとき early-fail で readiness 不足を明示**し、再実行可能にする（不正な「smoke 通過」を許さない）。
4. secret 値そのものは仕様書・ドキュメント・コミットメッセージに**一切記載しない**（CONST: secrets を docs に残さない）。

## 正本順位（衝突時の優先度）

1. 本 `index.md` のスコープ・不変条件
2. `outputs/phase-{1,2,3}.md`（設計）
3. `task-01..02/phase-*.md`（実装仕様）
4. `CLAUDE.md` のシークレット管理セクション

## サブタスク一覧

| ID | タイトル | 実装区分 | 並列性 |
|----|---------|---------|--------|
| task-01 | web-cd workflow の secret 名を実 Environment に整合させる | implemented_local_runtime_pending | task-02 と並列可 |
| task-02 | staging-runtime-smoke 環境の readiness gate と secret provisioning | implemented_local_runtime_pending | task-01 と並列可 |

両タスクとも 1 サイクルで完了させる（CONST_007）。先送り対象なし。

## 実行 DoD（ワークフロー全体）

- [ ] `dev` 上で `web-cd / deploy-staging` が成功すること（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` が `[cf.sh] 1Password CLI...` を出さず正常終了）
- [ ] `dev` 上で `backend-ci` 配下 `runtime-smoke-staging / smoke` が成功するか、または readiness 不足を明示する exit でユーザーに必要 secret を伝えていること
- [ ] `staging` / `production` / `staging-runtime-smoke` の必要 secret 一覧と現状（登録済み / 未登録）が runbook に記載されていること（[`staging`](runbooks/staging-secret-provisioning.md) / [`production`](runbooks/production-secret-provisioning.md) / [`staging-runtime-smoke`](runbooks/secret-provisioning.md)）
- [ ] secret 実値はリポジトリ・コミット・PR 本文・コメントのいずれにも残っていないこと
