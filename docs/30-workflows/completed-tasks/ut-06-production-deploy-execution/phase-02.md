# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-27 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC と既存資産インベントリを入力として、OpenNext Workers / API Workers / D1 の本番デプロイ実行手順・ロールバック手順・smoke test 手順・環境別 binding マトリクスを設計し、Phase 4（事前検証）以降の実行根拠を確定する。
特に「不可逆操作（D1 マイグレーション本番適用）」に対するバックアップ取得→マイグレーション→デプロイ→smoke test→記録／失敗ロールバックのフローを Mermaid で図示し、抜け漏れをゼロにする。

## 実行タスク

- OpenNext Workers（`apps/web`）のデプロイ手順を設計する
- API Workers（`apps/api`）のデプロイ手順を設計する
- D1 マイグレーション適用手順を設計する
- ロールバック手順（OpenNext Workers / API Workers / D1）を設計する
- smoke test 手順（AC-1 〜 AC-5 をカバー）を設計する
- 環境別 wrangler binding マトリクス（local / staging / production）を作成する
- Mermaid 設計図（デプロイ実行フロー）を作成する
- dependency matrix を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-01.md | Phase 1 の AC・スコープ・既存資産インベントリ |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | タスク概要・AC・依存関係 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | OpenNext Workers / API Workers / D1 デプロイコマンド・binding 設定例 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md | D1 runbook |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | Secrets 配置確認 |
| 必須 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md | readiness checklist の AC との整合 |
| 参考 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md | wrangler.toml の構造設計 |

## 実行手順

### ステップ 1: OpenNext Workers デプロイ手順設計

- 初回デプロイ要否判定（`wrangler pages project list` で `apps/web` 用 project が存在するか）を整理する
- 必要に応じて `wrangler pages project create <project-name> --production-branch main` の事前実行手順を含める
- ビルドコマンド（`mise exec -- pnpm --filter @ubm-hyogo/web build` 等）と `@opennextjs/cloudflare` adapter の出力先（`.open-next/` 等）を確定する
- デプロイコマンド: `wrangler deploy --config apps/web/wrangler.toml --env production` を設計する
- 本番 URL（`*.pages.dev` または カスタムドメイン）の確認方法を設計する

### ステップ 2: Workers デプロイ手順設計

- `apps/api/wrangler.toml` の `[env.production]` セクション設計（D1 binding・KV binding・R2 binding・Vars）
- ビルド有無（Hono は通常ビルド不要、TypeScript transpile を wrangler が実施）を確認する
- デプロイコマンド: `wrangler deploy --env production` を設計する
- デプロイ後の `/health` エンドポイント疎通確認手順を設計する

### ステップ 3: D1 マイグレーション適用手順設計

- バックアップ取得: `wrangler d1 export <DB_NAME> --env production --output backup-<timestamp>.sql` を必須前置きとして設計する（AC-7）
- 初回適用時はテーブル未作成のため空 export になることを許容する設計
- マイグレーション適用: `wrangler d1 migrations apply <DB_NAME> --env production` を設計する
- 適用後確認: `wrangler d1 migrations list <DB_NAME> --env production` で履歴記録を確認（AC-3）
- 適用後検証: `wrangler d1 execute <DB_NAME> --env production --command "SELECT name FROM sqlite_master WHERE type='table';"` でテーブル存在確認

### ステップ 4: ロールバック設計

- Pages: `wrangler deploy --config apps/web/wrangler.toml --env production list --project-name <project-name>` で前 deployment を特定し、Cloudflare ダッシュボードまたは `wrangler pages rollback` で切戻し
- Workers: `wrangler deployments list --env production` で前 version_id を取得し、`wrangler rollback <version_id> --env production` で切戻し
- D1: マイグレーション適用前に取得した `backup-<timestamp>.sql` を `wrangler d1 execute <DB_NAME> --env production --file backup-<timestamp>.sql` で手動リストア
- ロールバック発動条件（smoke test FAIL・/health unhealthy・D1 SELECT 失敗）を runbook に明記する

### ステップ 5: smoke test 設計

- AC-1: `curl -sI <web-url>` で 200 OK を確認
- AC-2: `curl -s <workers-url>/health` で healthy レスポンスを確認
- AC-4: API 経由で D1 SELECT が 1 件成功することを確認するエンドポイント（例: `/health/db`）の利用または専用 smoke クエリ
- AC-5: 上記 3 件を一括実行する shell スクリプトまたは手順チェックリストを設計する
- 結果記録テンプレ（PASS/FAIL・実行時刻・レスポンス内容）を設計する

### ステップ 6: env-binding-matrix 作成

- local / staging / production の D1 database_id・KV namespace_id・R2 bucket・Vars の差分表を作成する
- `wrangler.toml` のセクション構造（`[env.staging]` / `[env.production]` / 既定セクション）と対応関係を整理する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 本 Phase の設計を設計レビューの入力として使用 |
| Phase 4 | 本 Phase の手順を verify suite（事前 dry run）の対象として利用 |
| Phase 5 | 本 Phase の手順設計を本番デプロイ実行の根拠とする |
| Phase 6 | 本 Phase の rollback-runbook.md を異常系・ロールバック検証の根拠とする |
| Phase 8 | env-binding-matrix.md を runbook 整備のインプットとする |
| Phase 11 | smoke test 設計を手動 smoke test 実行の根拠とする |

## 多角的チェック観点（AIが判断）

- 価値性: 設計が AC-1 〜 AC-8 全てを直接トレース可能な構造になっているか
- 実現性: wrangler@3.x 系で全コマンドが動作する想定か、無料枠超過リスクが評価されているか
- 整合性: local / staging / production の binding 差異が env-binding-matrix.md に全て記載されているか
- 運用性: ロールバック手順が「失敗発生時に 5 分以内に判断・実行可能」な粒度で書かれているか・バックアップ取得が必須前置き手順として組み込まれているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | OpenNext Workers デプロイ手順設計 | 2 | pending | 初回 project create 要否判定を含む |
| 2 | Workers デプロイ手順設計 | 2 | pending | `[env.production]` 構造確定 |
| 3 | D1 マイグレーション適用手順設計 | 2 | pending | バックアップ取得を必須前置きに |
| 4 | ロールバック設計 | 2 | pending | OpenNext Workers / API Workers / D1 の 3 系統 |
| 5 | smoke test 設計 | 2 | pending | AC-1 / AC-2 / AC-4 / AC-5 をカバー |
| 6 | env-binding-matrix 作成 | 2 | pending | local / staging / production |
| 7 | Mermaid 設計図作成 | 2 | pending | デプロイ実行フロー全体 |
| 8 | dependency matrix 作成 | 2 | pending | 上流・下流タスクとの依存 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/deploy-design.md | OpenNext Workers / API Workers / D1 デプロイ手順設計（Mermaid 図含む） |
| ドキュメント | outputs/phase-02/rollback-runbook.md | ロールバック手順（OpenNext Workers / API Workers / D1） |
| ドキュメント | outputs/phase-02/env-binding-matrix.md | 環境別 wrangler binding 差分表 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- OpenNext Workers / API Workers / D1 各デプロイ手順設計が完成している
- ロールバック手順（3 系統）が runbook 化されている
- smoke test 手順が AC-1 / AC-2 / AC-4 / AC-5 を全てカバーしている
- env-binding-matrix が local / staging / production を全て記載している
- Mermaid 設計図が作成されている
- dependency matrix が作成されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（Pages 初回 project 未作成・Workers binding 解決失敗・D1 マイグレーション失敗・smoke test FAIL）も設計に含まれているか確認
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: deploy-design.md / rollback-runbook.md / env-binding-matrix.md / Mermaid 図 / dependency matrix を設計レビューに渡す
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない

## Mermaid 設計図

### デプロイ実行フロー

```mermaid
flowchart TD
    A[Phase 4 事前検証 PASS<br/>readiness checklist PASS] --> B[Step 1: D1 バックアップ取得<br/>wrangler d1 export --env production<br/>→ backup-{timestamp}.sql]
    B --> C{バックアップ取得<br/>成功?}
    C -->|NO| Z[中止<br/>Phase 1 へ差し戻し]
    C -->|YES| D[Step 2: D1 マイグレーション適用<br/>wrangler d1 migrations apply --env production]
    D --> E{適用成功?}
    E -->|NO| R1[ロールバック D1<br/>backup から手動リストア]
    E -->|YES| F[Step 3: Workers デプロイ<br/>wrangler deploy --env production]
    F --> G{デプロイ成功?}
    G -->|NO| R2[ロールバック Workers<br/>前 version_id へ rollback<br/>+ D1 リストア検討]
    G -->|YES| H[Step 4: OpenNext Workers デプロイ<br/>wrangler deploy --config apps/web/wrangler.toml --env production<br/>--project-name web --branch main]
    H --> I{デプロイ成功?}
    I -->|NO| R3[ロールバック Pages<br/>前 deployment へ切戻し<br/>+ Workers/D1 ロールバック検討]
    I -->|YES| J[Step 5: smoke test 実行<br/>AC-1 Pages 200 / AC-2 /health / AC-4 D1 SELECT]
    J --> K{smoke test<br/>全件 PASS?}
    K -->|NO| R4[全系統ロールバック<br/>原因切り分け]
    K -->|YES| L[Step 6: 成功記録<br/>deploy-execution-log.md に<br/>日時・SHA・wrangler ver・結果]
    L --> M[Phase 6 へ<br/>異常系・ロールバック検証]
    R1 --> N[Phase 6 で異常系記録]
    R2 --> N
    R3 --> N
    R4 --> N
```

## 環境別 wrangler binding マトリクス（サマリー）

> 詳細値は `outputs/phase-02/env-binding-matrix.md` に記録。本表は構造のみを示す。

| binding 種別 | local (wrangler dev) | staging | production |
| --- | --- | --- | --- |
| D1 (`[[d1_databases]]`) | local SQLite emulation | staging database_id | production database_id |
| KV (`[[kv_namespaces]]`) | local KV emulation | staging namespace_id | production namespace_id |
| R2 (`[[r2_buckets]]`) | local R2 emulation | staging bucket name | production bucket name |
| Vars (`[vars]`) | `.dev.vars` | `[env.staging.vars]` | `[env.production.vars]` |
| Secrets | `.dev.vars`（gitignore） | `wrangler secret put --env staging` | `wrangler secret put --env production` |
| Pages project_name | n/a（local dev） | `<project>-staging` | `<project>` |
| Workers service name | n/a（local dev） | `<service>-staging` | `<service>` |

## ロールバック手順サマリー（後段 Phase 6 で参照）

> 詳細手順は `outputs/phase-02/rollback-runbook.md` に記録。

| 系統 | 切戻しコマンド | 前提 | 所要時間目安 |
| --- | --- | --- | --- |
| Pages | `wrangler deploy --config apps/web/wrangler.toml --env production list --project-name <name>` → ダッシュボードまたは `wrangler pages rollback` | 前 deployment が存在 | 1-2 分 |
| Workers | `wrangler deployments list --env production` → `wrangler rollback <version_id> --env production` | 前 version_id が存在（初回デプロイ時は不可） | 1-2 分 |
| D1 | `wrangler d1 execute <DB> --env production --file backup-<timestamp>.sql` | バックアップ SQL が手元にある | スキーマサイズ依存（数分〜数十分） |

**発動条件:** smoke test FAIL / `/health` unhealthy / D1 SELECT 失敗 / 想定外のエラーログ検出
**判断者:** delivery 担当（Phase 5 実行者）+ レビュアー 1 名

## dependency matrix

| タスク | 種別 | 依存内容 | Phase |
| --- | --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | 上流 | ビルド可能な monorepo 環境 | 本 Phase 開始前に完了必須 |
| 03-serial-data-source-and-storage-contract | 上流 | D1 runbook・スキーマ確定 | 本 Phase 開始前に完了必須 |
| 04-serial-cicd-secrets-and-environment-sync | 上流 | 本番 Secrets 配置 | 本 Phase 開始前に完了必須 |
| 05b-parallel-smoke-readiness-and-handoff | 上流 | readiness checklist PASS | Phase 5 実行前に PASS 必須 |
| UT-04 | 上流 | D1 マイグレーション SQL 確定 | 本 Phase 開始前に完了必須 |
| UT-05 | 上流（推奨） | CI/CD パイプライン | 未完なら手動デプロイで代替可 |
| UT-09 | 下流 | 本番 D1 稼働を前提に同期ジョブ実装 | 本タスク完了後 |
| UT-08 | 下流 | 本番稼働を前提にモニタリング設計 | 本タスク完了後 |
| 02-application-implementation 全体 | 下流 | 本番稼働を前提に実装 | 本タスク完了後 |
