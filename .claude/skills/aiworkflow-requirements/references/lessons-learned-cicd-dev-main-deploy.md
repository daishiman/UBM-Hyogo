# Lessons Learned: UT-05 CI/CD パイプライン実装（dev / main 自動デプロイ）

> 親ファイル: [lessons-learned-current.md](lessons-learned-current.md)
> 関連 references: [deployment-gha.md](deployment-gha.md) / [deployment-core.md](deployment-core.md) / [deployment-branch-strategy.md](deployment-branch-strategy.md)

UT-05（CI/CD パイプライン実装）で `feature → dev → main` のブランチ戦略を GitHub Actions に落とし込む際に得た知見をまとめる。`web-cd.yml`（Cloudflare Pages）と `backend-ci.yml`（Cloudflare Workers + D1 migrations）を 2026-04-26 に追加した。

---

## L-CICD-001: Web CD と Backend CD のワークフロー分離

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 単一の `cd.yml` に Pages と Workers のデプロイを同居させると、`apps/web` のみ変更時にも Workers ジョブが走り、無駄な deploy が頻発する |
| 原因 | Cloudflare Pages（`wrangler pages deploy`）と Cloudflare Workers（`wrangler deploy`）はそれぞれデプロイ機構・対象 working directory・必要な API Token スコープが異なる |
| 解決 | `web-cd.yml`（apps/web 専用）と `backend-ci.yml`（apps/api 専用）にワークフローファイルを分離。`concurrency.group` を `web-cd-${{ github.ref_name }}` / `backend-ci-${{ github.ref_name }}` で別々に持たせ、ブランチごとに並列キャンセルを成立させる |
| 再発防止 | 新しい Workers / Pages を追加するときは、既存 cd ワークフローへ相乗りする前に「成果物パス」「`workingDirectory`」「必要 secrets」が共通かを必ず確認する |

## L-CICD-002: dev / main の job-level if 分岐で staging と production を一本化

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 環境ごとに別ファイル（`web-cd-staging.yml` / `web-cd-prod.yml`）を作ると、ビルド手順の差分が滲み出して保守が破綻する |
| 原因 | dev → staging / main → production は環境変数とプロジェクト名以外のステップ構造が同一なのに、ファイル分離はそれを強制的に複製する |
| 解決 | 1 ファイル内に `deploy-staging`（`if: github.ref_name == 'dev'`）と `deploy-production`（`if: github.ref_name == 'main'`）の 2 ジョブを置き、`environment: { name: staging | production }` で GitHub Environments の secrets / approval を切り替える |
| 再発防止 | 「環境ごとの差分が secrets / project-name 以下に収まるか」を分離前にレビューし、収まる場合は job-level if 分岐に倒す |

## L-CICD-003: D1 migrations apply は deploy より前に直列で実行する

| 項目 | 内容 |
| ---- | ---- |
| 症状 | `wrangler deploy` 後に `d1 migrations apply` を流すと、新コードが旧スキーマを読みにいく一瞬の窓ができ、リリース直後に 500 が出る |
| 原因 | Workers のデプロイは即時切り替え。migration が後追いだと、新ハンドラが期待するカラムがまだ存在しない |
| 解決 | `backend-ci.yml` の各 environment ジョブで `Apply D1 migrations` ステップを `Deploy Workers app` の前に配置し、`steps.<id>.outcome` を Discord 通知で両方確認する。staging は `--env staging` + DB 名 `ubm-hyogo-db-staging`、production は `--env production` + DB 名 `ubm-hyogo-db-prod` を厳格に分ける |
| 再発防止 | migration を伴うリリースのレビューでは「migration → deploy の順序」と「DB 名の env 整合」を 2 点必ずチェックする |

## L-CICD-004: Cloudflare Pages の deployment URL は alias を優先で拾う

| 項目 | 内容 |
| ---- | ---- |
| 症状 | Discord 通知の URL が毎回 hash 付きの preview URL になり、staging エイリアス（`*.pages.dev`）にリンクされない |
| 原因 | `wrangler-action@v3` は `deployment-url`（hash 付き）と `pages-deployment-alias-url`（branch alias）の 2 出力を返すが、デフォルトで前者だけ使うと alias が拾えない |
| 解決 | `web-cd.yml` の Notify Discord で `DEPLOY_URL=$(steps.deploy.outputs.pages-deployment-alias-url)` を優先し、空のときだけ `deployment-url` をフォールバックに使う |
| 再発防止 | 通知 / runbook 系の URL は「ユーザーが踏むエイリアス」と「一意な hash」を区別して扱い、どちらをデフォルトにするかドキュメント側で固定する |

## L-CICD-005: Discord 通知は Webhook 未設定でも CI を緑にする

| 項目 | 内容 |
| ---- | ---- |
| 症状 | `DISCORD_WEBHOOK_URL` を未設定の状態でワークフローを走らせると、Notify ステップで CI 全体が落ちる |
| 原因 | `secrets.DISCORD_WEBHOOK_URL` 参照時に空文字でも step は実行され、`curl` の URL 不正で exit code が非ゼロになる |
| 解決 | `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` で step ごとガードし、さらに `curl ... || true` でフォールバックする。デプロイ自体の成否は `steps.deploy.outcome` で判定し、通知失敗が deploy 結果を覆さないようにする |
| 再発防止 | 通知系 step は常に「設定が無くても落ちない」「outcome が deploy outcome を上書きしない」の 2 条件を満たすよう設計する |

## L-CICD-006: 1Password Environments と GitHub Secrets の同期手順は明文化する

| 項目 | 内容 |
| ---- | ---- |
| 症状 | ローカル正本（1Password Environments）と GitHub Secrets の値がズレ、staging だけ deploy が通らない事象が起きやすい |
| 原因 | GitHub Actions は 1Password と直接連携しておらず、`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` などを GitHub Secrets に手動同期する必要がある |
| 解決 | `deployment-secrets-management.md` に「1Password → GitHub Secrets / Variables」の同期手順と頻度を記載し、UT-19（branch protection 手動適用）と同列で「手動 runbook」として位置づける。CI 中で `op run` を使うかどうかは別途 UT を切る（本タスクではスコープ外） |
| 再発防止 | secrets 追加時は「1Password に保存」「GitHub Secrets に同期」「該当 environment に bind」をチェックリスト化する |

## L-CICD-007: ブランチ名の正本は `dev`（`develop` でない）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 旧ドキュメントが `develop` を使っており、ワークフローの `branches: [develop, main]` 指定でマージ時に CD が起動しない |
| 原因 | `deployment-branch-strategy.md` v1.1.0 で staging ブランチ名を `dev` に正規化したが、references / unassigned-task 周辺のテキストが追従しきれていなかった |
| 解決 | `web-cd.yml` / `backend-ci.yml` の `on.push.branches` を `[dev, main]` に統一し、`deployment-core.md` / `deployment-gha.md` の本文も `dev` 表記へ統一。L-GH-001〜003 と同じ「正本ドキュメント先行」の運用で揃える |
| 再発防止 | ブランチ命名の変更は `deployment-branch-strategy.md` を起点に、`deployment-core.md` → `deployment-gha.md` → ワークフロー本体の順で同一 wave に同期する |

---

## 関連未タスク・フォローアップ候補

| 候補 ID | 内容 | 出典 |
| ------- | ---- | ---- |
| UT-CICD-PATH-FILTER-001 | `apps/web` / `apps/api` の変更パスに基づくジョブフィルタリング（`paths-filter` アクション）の導入 | UT-05「monorepo でのジョブフィルタリング」 |
| UT-CICD-CI-GATE-001 | `ci.yml` の成功を `web-cd.yml` / `backend-ci.yml` の前提条件として明示的に連結する gating（現状は `on: push` で無条件デプロイ） | UT-05 完了条件「CI 失敗時のデプロイブロック」 |
| UT-CICD-OP-RUN-001 | GitHub Actions 中で `op run` 経由で 1Password Environments を直接参照するサービスアカウント方式の検討 | UT-05「1Password Environments との連携」 |

---

## 変更履歴

| Version | Date | Changes |
| ------- | ---- | ------- |
| 1.0.0 | 2026-04-26 | UT-05 CI/CD パイプライン実装（`web-cd.yml` / `backend-ci.yml` 追加・dev/main split deploy）に伴う L-CICD-001〜007 の 7 教訓を記録 |
