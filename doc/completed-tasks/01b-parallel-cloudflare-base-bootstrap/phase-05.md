# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-23 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Cloudflare 基盤ブートストラップ における Phase 5 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。
Pages / Workers / D1 / API Token の作成手順を runbook として定義し、実際のリソース作成時に参照できる完全版 runbook を成果物として提供する。
`docs_only: true` のため、実際の Cloudflare リソース作成は行わず、手順書・プレースホルダーのみを成果物とする。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## 実行手順

### ステップ 1: input と前提の確認

- 上流 Phase（特に Phase 4 の pre-verification checklist）と index.md を読む。
- 正本仕様との差分を先に洗い出す。
- Phase 4 で確認した wrangler 環境・Account ID・スコープが問題ないことを前提とする。

### ステップ 2: Phase 成果物の作成

- 本 Phase の主成果物を `outputs/phase-05/main.md` に作成・更新する。
- 以下の runbook ドキュメントを成果物として定義する:
  - `outputs/phase-05/cloudflare-bootstrap-runbook.md`（Dashboard/CLI 手順の完全版）
  - `outputs/phase-05/token-scope-matrix.md`（API Token スコープ定義表）
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase（異常系検証）に渡す blocker と open question を記録する。

## Cloudflare Dashboard 手順

### Pages プロジェクト作成

1. Cloudflare Dashboard → Pages → Create a project → Connect to Git
2. GitHub リポジトリ選択 → `main` ブランチを production に設定
3. Build settings: `pnpm --filter @repo/web build`、output dir: `.next`
4. プロジェクト名: `ubm-hyogo-web`
5. 同様に staging プロジェクト（`ubm-hyogo-web-staging`）を作成し `dev` ブランチを接続
6. staging の Build settings も同様: `pnpm --filter @repo/web build`、output dir: `.next`

### Workers サービス作成

1. Cloudflare Dashboard → Workers & Pages → Create application → Create Worker
2. 名前: `ubm-hyogo-api`（本番）、`ubm-hyogo-api-staging`（staging）
3. wrangler.toml で定義済みのため Dashboard 確認のみ（実際のデプロイは CI/CD パイプライン経由）

### D1 データベース作成

1. `wrangler d1 create ubm-hyogo-db-prod`
2. `wrangler d1 create ubm-hyogo-db-staging`
3. 表示された database_id を wrangler.toml に記録（プレースホルダー）
4. 本番とstagingで異なる database_id を管理する

### API Token 作成

1. Dashboard → My Profile → API Tokens → Create Token
2. Template: Edit Cloudflare Workers を選択
3. スコープ: Account > Pages:Edit + Workers Scripts:Edit + D1:Edit（最小権限の原則）
4. IP フィルタリング: 任意（推奨: GitHub Actions の IP レンジ）
5. 生成されたトークンを GitHub Secrets の `CLOUDFLARE_API_TOKEN` に登録
   - 注意: Phase 5 は定義のみ。実際の Secret 投入は `04-serial-cicd-secrets-and-environment-sync` タスクで実施
6. `CLOUDFLARE_ACCOUNT_ID` も同様に GitHub Secrets に登録

### ランタイムシークレット設定

- ランタイムシークレット（DB接続情報等）は Cloudflare Workers Secrets に格納
- GitHub Secrets には **デプロイ認証用** の `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` のみ登録
- Workers Secrets への投入は `04-serial-cicd-secrets-and-environment-sync` で実施

## サンプルコマンド

```bash
# D1 データベース作成
wrangler d1 create ubm-hyogo-db-prod
wrangler d1 create ubm-hyogo-db-staging

# wrangler.toml への database_id 記録確認
grep -n "database_id" apps/api/wrangler.toml

# Pages プロジェクト確認
wrangler pages list

# Workers デプロイ確認（staging 環境）
wrangler deploy --env staging --config apps/api/wrangler.toml --dry-run

# Account ID 確認
wrangler whoami
```

## 設定ファイル全文

docs-first task のため以下のプレースホルダーを成果物として定義する:

- `apps/api/wrangler.toml` の `database_id` はフィールド名を確定（実値は Phase 5 実行後に記録）
  - `[[d1_databases]]` セクションに `database_id = "PLACEHOLDER_PROD_DB_ID"` と `database_id = "PLACEHOLDER_STAGING_DB_ID"` を定義
- `apps/web/wrangler.toml` の Pages 設定は Phase 2 topology を参照
  - `name = "ubm-hyogo-web"`（production）/ `name = "ubm-hyogo-web-staging"`（staging）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 5 | pending | Phase 4 pre-verification checklist と index.md の読み込み完了 |
| 2 | 成果物更新 | 5 | pending | outputs/phase-05/main.md + cloudflare-bootstrap-runbook.md + token-scope-matrix.md |
| 3 | 4条件確認 | 5 | pending | Phase 6（異常系検証）へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/cloudflare-bootstrap-runbook.md | Dashboard/CLI 手順の完全版 |
| ドキュメント | outputs/phase-05/token-scope-matrix.md | API Token スコープ定義表 |
| ドキュメント | outputs/phase-05/main.md | Phase 5 実行サマリー |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: Cloudflare 基盤ブートストラップ の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 各ステップ後の sanity check

- scope 外サービスを追加していない
- branch / env / secret placement が正本仕様に一致する
  - `dev` → staging、`main` → production の対応を確認
  - GitHub Secrets にはデプロイ認証用トークンのみ（ランタイムシークレット混入禁止）
- downstream task が参照できる path がある
- docs_only タスクとして、実際のリソース作成コマンドは runbook に留め、実行しない
