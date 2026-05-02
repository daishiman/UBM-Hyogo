# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-27 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (本番デプロイ実行) |
| 状態 | pending |

## 目的

Phase 5 の本番デプロイ実行前に、wrangler CLI・Cloudflare アカウント権限・Pages project 存在・Workers サービス存在・D1 接続・Secrets 配置・ビルド可否・ロールバック対象 deployment ID をすべて事前検証する。
本番不可逆操作（D1 マイグレーション適用）を伴うため、verify suite の全項目 PASS が Phase 5 進行のブロック条件となる。
失敗発生時に Phase 5 で初めて気付くことを防ぎ、所要時間の予測可能性とロールバック性を確保する。

## 実行タスク

- wrangler CLI のバージョンと Cloudflare ログイン状態を確認する
- Pages project（`apps/web` 用）の存在を確認する
- Workers サービス（`apps/api`）の本番デプロイ履歴有無を確認する
- D1 本番データベースの存在と接続を確認する
- D1 未適用マイグレーション数を確認する
- `apps/api` / `apps/web` のローカルビルド成否を確認する
- 本番 Secrets の配置状況を `wrangler secret list --env production` で確認する
- `wrangler.toml` の `[env.production]` セクションのバインディング解決可否を確認する
- D1 export ドライランでバックアップ取得手順の実行可能性を確認する
- ロールバック対象の前バージョン deployment ID（Pages / Workers）を取得する
- 本番実行承認を `outputs/phase-04/production-approval.md` に記録する
- 各 verify suite チェック失敗時の対応フローを確定する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-02.md | 設計済みの手順・コマンド |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-03.md | 設計レビュー結果・GO 判定 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-01.md | AC・既存資産インベントリ |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | AC の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler コマンド・D1 操作手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | 本番 Secrets 配置確認 |
| 必須 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md | readiness checklist |
| 参考 | apps/api/wrangler.toml | `[env.production]` セクション構造 |
| 参考 | apps/web/wrangler.toml または next.config | Pages デプロイ対象設定 |

## 実行手順

### ステップ 1: wrangler CLI と Cloudflare アカウント確認

- `wrangler --version` で 3.x 以上を検証する
- `wrangler whoami` で本番 Cloudflare アカウントへのログイン状態を確認する
- 必要権限（Pages / Workers / D1 / Secrets）が付与されていることを確認する

### ステップ 2: Cloudflare リソースの存在確認

- `wrangler pages project list` で `apps/web` 用 project_name の存在を確認する
- 未存在の場合は Phase 5 ステップ前に `wrangler pages project create` の実行が必要である旨を記録する
- `wrangler deployments list` で Workers サービス（`apps/api`）の過去デプロイ有無を確認する
- 初回デプロイの場合は Workers ロールバック不可（前 version 不在）であることを記録する

### ステップ 3: D1 本番データベースの確認

- `wrangler d1 list` で本番 DB の存在と database_id を確認する
- `wrangler d1 migrations list <DB_NAME> --env production` で未適用マイグレーション数を確認する
- 未適用件数を `outputs/phase-04/preflight-checklist.md` に記録する

### ステップ 4: ローカルビルド検証

- `mise exec -- pnpm --filter @ubm-hyogo/api build`（または該当コマンド）で `apps/api` のビルド成功を確認する
- `mise exec -- pnpm --filter @ubm-hyogo/web build` で `@opennextjs/cloudflare` adapter 経由のビルド成功を確認する
- ビルド出力先（`apps/api/dist`、`apps/web/.open-next` 等）の存在を確認する

### ステップ 5: Secrets / Bindings 解決確認

- `wrangler secret list --env production` で expected secret 名（後述）の配置状況を確認する
- `wrangler.toml` の `[env.production]` セクションを読み、D1 binding / KV binding / R2 binding / Vars の解決可否を確認する

### ステップ 6: バックアップ取得・ロールバック対象の事前取得

- `wrangler d1 export <DB_NAME> --env production --output -` を head で確認する dry run を行う
- 初回適用時はテーブル未作成のため空 export になることを許容する
- `wrangler deployments list --config apps/web/wrangler.toml --env production` で前 version_id を取得・記録する（存在する場合）
- `wrangler deployments list --env production` で前 Workers version_id を取得・記録する（存在する場合）

### ステップ 7: verify suite の実行と記録

- 下記 verify suite の各チェックを順番に実行する
- 結果を `outputs/phase-04/verify-suite-result.md` に記録する
- 失敗があれば下記「verify suite 失敗時の対応フロー」に従い解消する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー GO 判定を前提に実行 |
| Phase 5 | verify suite 全件 PASS を Phase 5 進行のブロック条件とする |
| Phase 6 | ステップ 6 で取得したロールバック対象 deployment ID を異常系・ロールバック検証で再利用 |
| Phase 7 | verify suite 結果を AC matrix の根拠とする |
| Phase 11 | smoke test 用コマンドの構文検証を Phase 11 で再利用 |

## 多角的チェック観点（AIが判断）

- 価値性: verify suite が AC-1 〜 AC-8 全ての事前確認として機能しているか
- 実現性: wrangler@3.x で全チェックコマンドが動作する想定か・無料枠を消費しないか（dry run / list 系）
- 整合性: local / staging / production の binding 差異が verify suite 結果に表現されているか・`[env.production]` のみが対象になっているか
- 運用性: verify suite 失敗時に Phase 5 をブロックする判断フローが明示され、各失敗パターンの対応が記述されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler バージョン・whoami 確認 | 4 | pending | チェック 1 / 2 |
| 2 | Pages project / Workers サービス存在確認 | 4 | pending | チェック 3 / 4 |
| 3 | D1 本番 DB 存在・接続確認 | 4 | pending | チェック 5 |
| 4 | 未適用マイグレーション数確認 | 4 | pending | チェック 6 |
| 5 | api / web ローカルビルド検証 | 4 | pending | チェック 7 / 8 |
| 6 | 本番 Secrets 配置確認 | 4 | pending | チェック 9 |
| 7 | `[env.production]` バインディング解決確認 | 4 | pending | チェック 10 |
| 8 | D1 export ドライラン | 4 | pending | チェック 11 |
| 9 | ロールバック対象 deployment ID 取得 | 4 | pending | チェック 12 |
| 10 | verify suite 結果記録 | 4 | pending | outputs/phase-04/verify-suite-result.md |
| 11 | preflight checklist 記録 | 4 | pending | outputs/phase-04/preflight-checklist.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/verify-suite-result.md | verify suite 12 項目の実行結果（PASS/FAIL・実行時刻・ログ抜粋） |
| ドキュメント | outputs/phase-04/preflight-checklist.md | 事前確認結果（未適用マイグレーション数・前 deployment ID・初回デプロイ判定など） |
| ドキュメント | outputs/phase-04/production-approval.md | Phase 5 実行前の承認者・承認日時・対象 commit SHA・実行ウィンドウ・abort 条件 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- verify suite 12 項目すべてが PASS（または許容可能な「初回デプロイにつき該当なし」判定）である
- 未適用マイグレーション数が `preflight-checklist.md` に記録されている
- 初回デプロイか継続デプロイかの判定が記録されている
- ロールバック対象の前バージョン deployment ID（Pages / Workers）が記録されている（または初回不在を明記）
- 本番 Secrets が expected 一覧通りに配置されていることが確認されている
- `production-approval.md` に delivery 担当とレビュアー 1 名以上の承認、対象 commit SHA、実行予定時刻、abort 条件が記録されている
- 失敗があれば対応完了まで Phase 5 をブロックすることが明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- verify suite 失敗時の対応が記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 5 (本番デプロイ実行)
- 引き継ぎ事項: verify suite 結果・preflight-checklist・初回デプロイ判定・前 deployment ID を Phase 5 に渡す
- ブロック条件: verify suite に FAIL が残っている場合、または `production-approval.md` が未作成・未承認の場合は次 Phase に進まない

## verify suite

### チェックリスト

| # | チェック項目 | コマンド / 確認内容 | 期待結果 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | wrangler バージョン確認 | `wrangler --version` | `3.x.x` 以上 | TBD |
| 2 | Cloudflare ログイン確認 | `wrangler whoami` | 本番アカウントが表示される | TBD |
| 3 | Pages project 存在確認 | `wrangler pages project list` | `apps/web` 用 project_name が表示される（または初回作成必要を記録） | TBD |
| 4 | Workers サービス存在確認 | `wrangler deployments list --name <api-service>` | `apps/api` サービスが表示される（または初回デプロイ判定を記録） | TBD |
| 5 | D1 本番 DB 存在確認 | `wrangler d1 list` | 本番 DB が表示される | TBD |
| 6 | 未適用マイグレーション数確認 | `wrangler d1 migrations list <DB_NAME> --env production` | 適用済み・未適用件数が取得できる | TBD |
| 7 | apps/api ローカルビルド | `mise exec -- pnpm --filter @ubm-hyogo/api build` | exit 0・出力ディレクトリが生成される | TBD |
| 8 | apps/web ローカルビルド | `mise exec -- pnpm --filter @ubm-hyogo/web build`（`@opennextjs/cloudflare` adapter 経由） | exit 0・`.open-next/` 等の adapter 出力が生成される | TBD |
| 9 | 本番 Secrets 配置確認 | `wrangler secret list --env production` | expected secret 名（後述）が全て存在 | TBD |
| 10 | `[env.production]` バインディング解決 | `wrangler.toml` を読み D1 binding / KV binding / R2 binding / Vars が解決可能か検証 | 全 binding が解決できる | TBD |
| 11 | D1 export ドライラン | `wrangler d1 export <DB_NAME> --env production --output -` を head で確認 | export ストリームが生成される（初回はスキーマ空でも可） | TBD |
| 12 | ロールバック対象 deployment ID 取得 | `wrangler deployments list --config apps/web/wrangler.toml --env production` および `wrangler deployments list --env production` | 前 deployment ID / version_id を記録（初回不在は明記） | TBD |

### expected secret 名（チェック 9 の照合対象）

> 詳細値は 04-serial-cicd-secrets-and-environment-sync の出力を正本とする。本表は本タスクで配置確認すべき名称の例示。

| Secret 名 | 用途 |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Auth.js Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Auth.js Google OAuth |
| `AUTH_SECRET` | Auth.js セッション暗号化 |
| `GOOGLE_FORMS_API_KEY` または OAuth 用 token | Google Forms API 取得 |
| `GOOGLE_SERVICE_ACCOUNT_JSON`（必要な場合） | Sheets / Forms サービスアカウント認証 |
| `MAIL_PROVIDER_KEY` | Magic Link 配送 |

### 実行前提条件

- wrangler CLI がインストール済みであること
- `wrangler login` が完了していること
- 本番 Cloudflare アカウントへの権限が付与されていること
- 04-serial-cicd-secrets-and-environment-sync で Secrets が配置済みであること
- 03-serial-data-source-and-storage-contract で D1 マイグレーション SQL が確定済みであること
- 05b-parallel-smoke-readiness-and-handoff の readiness checklist が PASS であること

### verify suite 失敗時の対応フロー

```
チェック失敗
  ├── チェック 1-2 失敗: wrangler 再インストール / 再ログイン → 再実行
  ├── チェック 3 失敗: Pages project 未作成 → Phase 5 ステップ 0 として `wrangler pages project create` を追加
  ├── チェック 4 失敗（過去デプロイなし）: 初回デプロイ扱いとして記録 → Workers ロールバック不可を Phase 6 に申し送り
  ├── チェック 5-6 失敗: 03-serial / UT-04 に差し戻し（D1 未作成 / マイグレーション未確定）
  ├── チェック 7-8 失敗: 02-serial / monorepo 設定確認 → ビルドエラー解消後に再実行
  ├── チェック 9 失敗: 04-serial に差し戻し（Secrets 配置不備）
  ├── チェック 10 失敗: wrangler.toml の `[env.production]` セクション修正 → Phase 2 設計に反映
  ├── チェック 11 失敗: D1 接続権限・database_id を再確認
  └── チェック 12 失敗（前 deployment 不在）: 初回デプロイ扱いとして Phase 6 に申し送り（ロールバックは D1 リストアのみ）
```

### 統合判定

| 区分 | 条件 | Phase 5 進行可否 |
| --- | --- | --- |
| GO | 全 12 項目 PASS（または初回デプロイによる「該当なし」が明示記録されている） | 進行可 |
| 条件付き GO | チェック 3 / 4 / 12 のみ「初回扱い」、他は PASS | 進行可（初回手順を Phase 5 に追加） |
| NO-GO | チェック 5 / 6 / 7 / 8 / 9 / 10 のいずれかが FAIL | Phase 5 をブロックして該当 Phase / 上流タスクに差し戻し |

**最終判定:** TBD（verify suite 実行後に記入）
