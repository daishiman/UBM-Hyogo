# UT-28: Cloudflare Pages プロジェクト（staging / production）作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-28 |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap |

## 目的

`web-cd.yml` が dev / main それぞれの push で参照する 2 つの Cloudflare Pages プロジェクト（`<base>` / `<base>-staging`）を Cloudflare 側に作成し、`production_branch` / 互換性フラグ / アップロード先ビルド成果物の方針を確定する。Workers 側（`apps/api/wrangler.toml`）には既に `[env.staging]` が定義されているのに対し、Pages 側のプロジェクト分離が未整備のため CD ワークフローを起動しても deploy が失敗する状態にある。これを解消する。

## スコープ

### 含む
- Cloudflare Pages プロジェクトを 2 件作成（production: `<base>` / staging: `<base>-staging`）
- それぞれの `production_branch` 設定（production プロジェクトは `main`、staging プロジェクトは `dev`）
- `nodejs_compat` 互換性フラグの ON 化と `compatibility_date` の決定（既存 Workers の `2025-01-01` と整合）
- `web-cd.yml` がアップロードする成果物ディレクトリの確定（`.next` をそのまま渡すか、OpenNext の `.open-next` を使うか）
- プロジェクト命名規則の文書化と Variable `CLOUDFLARE_PAGES_PROJECT` への値確定情報の引き渡し

### 含まない
- `apps/api` 側 Workers プロジェクトの作成（既存設定済み）
- カスタムドメインの本登録（UT-16 のスコープ）
- ワークフローファイル自体の編集（UT-05 のスコープ）
- Secrets / Variables 配置（UT-27 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・API Token・Account ID の前提条件 |
| 上流 | UT-05 (CI/CD パイプライン実装) | `web-cd.yml` のプロジェクト名参照仕様が確定していること |
| 下流 | UT-27 (GitHub Secrets / Variables 配置) | `CLOUDFLARE_PAGES_PROJECT` Variable の値はこのタスクで確定する命名と一致させる必要がある |
| 下流 | UT-06 (本番デプロイ実行) | プロジェクト作成済みでなければ main → production deploy が失敗 |
| 下流 | UT-16 (カスタムドメイン) | カスタムドメインは Pages プロジェクト存在が前提 |
| 下流 | UT-29 (CD 後スモーク) | スモーク URL はプロジェクト名から組み立てる |

## 苦戦箇所・知見

**`@opennextjs/cloudflare` 採用時のアップロード先のぶれ**: `apps/web` は OpenNext を採用している。素の Next.js は `.next/` を Pages にアップロードするが、OpenNext は `.open-next/assets/` + `_worker.js` の構成を生成する。現状の `web-cd.yml` は `pages deploy .next` で素の Next.js 出力を渡しており、OpenNext のランタイム構造と衝突する可能性がある。本タスクでアップロード対象ディレクトリを明示確定し、必要に応じて UT-05 にフィードバックする。

**`production_branch` の落とし穴**: production プロジェクトは `production_branch=main`、staging プロジェクトは `production_branch=dev` に設定する。これを忘れると、Pages 側がブランチを「Preview」と認識して production スコープの環境変数・カスタムドメインを反映しない、URL がプレビュー用エイリアスになる、といった問題が起きる。

**`compatibility_date` の Workers との同期**: `apps/api/wrangler.toml` で `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` としているため、Pages 側もこれに合わせる。バージョンがずれると Workers と Pages で `process` / `node:*` モジュールの可用性が変わり、共有 util を経由したコードが片側だけで壊れる事故になる。

**プロジェクト命名規則の固定**: 命名は `production = ubm-hyogo-web` / `staging = ubm-hyogo-web-staging` のように suffix `-staging` 方式に統一する。Variable `CLOUDFLARE_PAGES_PROJECT` の値は production 名（suffix なし）に揃え、`web-cd.yml` 側で suffix を連結する設計と整合させる。命名で揺れが出ると Variable 値とワークフロー内連結の両方を直す羽目になる。

**Pages の自動ブランチデプロイ機能との衝突**: Pages プロジェクトは Git 連携を ON にすると、Pages 側が独自に各ブランチを自動デプロイしようとする。本構成は GitHub Actions 主導での deploy を採用しているため、Git 連携は OFF のままにするか、production_branch だけに限定する必要がある。両方に任せると同一ブランチに対して二重 deploy が走り、ログが分散して原因追跡が困難になる。

## 実行概要

- Cloudflare Dashboard または `wrangler pages project create` でプロジェクトを 2 件作成する
- `wrangler pages project create ubm-hyogo-web --production-branch=main --compatibility-flags=nodejs_compat` を雛形に、staging 側は `ubm-hyogo-web-staging --production-branch=dev` で作成
- `compatibility_date` を Workers と同じ値に揃える（Dashboard or `wrangler.toml` 側で管理）
- `apps/web/wrangler.toml` の現状を再確認し、Pages 側でビルドアセットとして渡すべきディレクトリ（`.next` か `.open-next` か）を確定し、必要に応じて UT-05 へフィードバックする
- 命名確定値を UT-27 の `CLOUDFLARE_PAGES_PROJECT` Variable に渡せるようドキュメント化する

## 完了条件

- [ ] production プロジェクト（`<base>`）が作成され、`production_branch=main` で設定済み
- [ ] staging プロジェクト（`<base>-staging`）が作成され、`production_branch=dev` で設定済み
- [ ] 両プロジェクトに `nodejs_compat` フラグが ON で適用済み
- [ ] `compatibility_date` が Workers 側と整合（`2025-01-01` 以降の同一値）
- [ ] アップロード対象ディレクトリ（`.next` / `.open-next`）の方針が確定し、必要に応じて UT-05 に反映済み
- [ ] `dev` push で staging プロジェクトに deploy 成功
- [ ] `main` push で production プロジェクトに deploy 成功
- [ ] Pages 側 Git 連携の有無方針が決定・文書化されている
- [ ] 命名確定値が UT-27 に引き渡せる状態になっている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .github/workflows/web-cd.yml | プロジェクト名参照仕様（dev/main 切替）の確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | デプロイ設計の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CD ワークフロー仕様の正本 |
| 必須 | apps/web/wrangler.toml | Pages 側互換性設定の整合確認 |
| 必須 | apps/web/open-next.config.ts | OpenNext 採用時のビルド出力構造確認 |
| 参考 | apps/api/wrangler.toml | Workers 側の `compatibility_date` / `nodejs_compat` 値の参照 |
| 参考 | docs/unassigned-task/UT-05-cicd-pipeline-implementation.md | CI/CD 本体タスクとの境界 |
| 参考 | docs/unassigned-task/UT-27-github-secrets-variables-deployment.md | Variable 値の引き渡し先 |
