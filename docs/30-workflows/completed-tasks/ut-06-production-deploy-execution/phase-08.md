# Phase 8: 設定 DRY 化・runbook 整備

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化・runbook 整備 |
| 作成日 | 2026-04-27 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

`apps/api/wrangler.toml` および `apps/web` の Pages 設定における重複（`[[d1_databases]]` / `[[kv_namespaces]]` / `[[r2_buckets]]` / `vars` / build 設定）を洗い出し、staging / production 間で DRY に管理する方針を確定する。
さらに 02-serial（monorepo 基盤）/ 04-serial（CI/CD・Secrets）の runbook と整合する形で、本タスク独自の `deploy-runbook.md` を統合稿として整備し、Phase 5 / Phase 11 / Phase 12 の参照基準を一本化する。

## 実行タスク

- `wrangler.toml` の重複設定を検出し DRY 化対象テーブルを作成する
- env-binding-matrix（Phase 2 成果物）を DRY 化方針として確定する
- 02-serial / 04-serial の runbook と章立てを整合させる
- deploy-runbook.md の統合稿を作成する（前提・事前確認・実行・smoke test・ロールバック・付録）
- DRY 化前後（Before / After）の構造を文書化する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-02.md | 設計（env-binding-matrix の構造） |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-07.md | AC matrix / coverage-report |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/env-binding-matrix.md | 環境別 binding 差分（Phase 2 成果物） |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/deploy-design.md | デプロイ設計 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/rollback-runbook.md | ロールバック設計 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler.toml 構造・binding 設定方法 |
| 必須 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md | monorepo 基盤の runbook 章立て |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | Secrets / 環境変数 runbook |
| 参考 | CLAUDE.md | シークレット管理方針 |

## 実行手順

### ステップ 1: wrangler.toml 重複設定の検出

- `apps/api/wrangler.toml` のセクション構成（既定 / `[env.staging]` / `[env.production]`）を整理する
- `[[d1_databases]]` / `[[kv_namespaces]]` / `[[r2_buckets]]` / `[vars]` / `[build]` の重複箇所を列挙する
- `apps/web` 側の Pages 設定（`wrangler.toml` または `pages.toml`、project_name、build コマンド）の重複も整理する

### ステップ 2: env-binding-matrix の DRY 化方針確定

- 共通値（binding name / database_name の命名規則 / build コマンド）をトップレベルに集約する方針を確定する
- 環境固有値（database_id / namespace_id / bucket / Vars / Secrets）のみ `[env.*]` セクションに記載する方針を確定する
- Phase 2 で作成した env-binding-matrix.md を本方針に沿って改訂し、DRY 化後の推奨構造として確定する

### ステップ 3: 02-serial / 04-serial の runbook との整合

- 02-serial の runbook 章立て（前提・セットアップ・検証・運用）を確認する
- 04-serial の Secrets 配置 runbook を確認し、本タスクの「事前確認」章で参照する形に整える
- 重複記述を排除し、本タスク runbook は「本番デプロイ固有手順」のみを保持する設計とする

### ステップ 4: deploy-runbook.md 統合稿作成

- 前提・事前確認・実行・smoke test・ロールバック・付録の 6 章構成で統合稿を作成する
- Phase 2 / Phase 4 / Phase 5 / Phase 6 / Phase 11 の手順を統合し、再現可能な単一ドキュメントとする
- 02-serial / 04-serial / 05b-parallel への参照リンクで重複を回避する

## DRY 化対象テーブル【必須】

| 設定種別 | 重複箇所（想定） | DRY 化ルール | 配置先 |
| --- | --- | --- | --- |
| `[[d1_databases]]` | `[env.staging.d1_databases]` / `[env.production.d1_databases]` で binding name / database_name 命名規則が重複 | binding name は全環境 `DB` に統一・database_name は `ubm-hyogo-{env}` 命名規則をコメント記載 | 環境固有値（database_id）のみ各 `[env.*]` |
| `[[kv_namespaces]]` | 各 env で binding name 重複 | binding name は全環境共通（例: `KV` / `SESSION_KV`）・命名規則をコメント化 | 環境固有値（namespace_id）のみ各 `[env.*]` |
| `[[r2_buckets]]` | 各 env で binding name 重複 | binding name は共通・bucket 命名規則を `ubm-hyogo-{env}-{purpose}` でコメント化 | 環境固有値（bucket_name）のみ各 `[env.*]` |
| `[vars]` | 環境固有値が `[env.*.vars]` にあり、共通値が散在する可能性 | 共通値（`APP_NAME` / `LOG_LEVEL` 既定値）は既定 `[vars]`・環境差分のみ `[env.*.vars]` で上書き | 共通: 既定 `[vars]` / 差分: `[env.*.vars]` |
| `[build]` | 各環境で同一 build コマンドが重複指定される可能性 | build コマンドは既定セクションで一度だけ定義 | 既定セクション |
| Pages project_name | `apps/web` の本番／staging で重複設定 | project_name は環境ごとに分離（`<project>` / `<project>-staging`）し命名規則をコメント化 | Pages 設定（環境固有値） |
| Workers service name | Workers の本番／staging で重複設定 | name フィールドは既定で本番、`[env.staging]` で `name` を上書き | 既定 / `[env.staging]` |
| Secrets | `wrangler secret put --env <env>` で各環境に同一 key を重複登録 | key 一覧を deploy-runbook 付録で一元管理・実値はコミット禁止 | Cloudflare Secrets / GitHub Secrets / 1Password |

## env-binding-matrix DRY 化方針サマリー

| 項目 | DRY 化前（懸念） | DRY 化後（推奨） |
| --- | --- | --- |
| binding name | 環境ごとに重複定義 | 全環境共通名（`DB` / `KV` / `R2` 等） |
| database_name 命名規則 | 各環境にハードコード | `ubm-hyogo-{env}` ルールをコメント記載 |
| database_id / namespace_id | 環境固有値として分離済（維持） | `[env.*]` に集約・実値は Cloudflare Dashboard 管理 |
| Vars 共通値 | 各 env で重複の可能性 | 既定 `[vars]` に集約・差分のみ `[env.*.vars]` |
| Pages project_name | 重複設定 | 環境ごとに 1 行のみ |
| Secrets キー一覧 | 散在 | deploy-runbook 付録で一元化 |

## runbook 構成案【必須】

deploy-runbook.md の章立ては以下とする。各章は他タスクの runbook を参照リンクで補い、本タスクは「本番デプロイ固有手順」のみを保持する。

| 章 | 内容 | 参照先 |
| --- | --- | --- |
| 1. 前提 | 上流タスク完了状態（02/03/04-serial / 05b-parallel）/ Cloudflare アカウント権限 / wrangler ver / Node ver | Phase 1 既存資産インベントリ / 02-serial / 04-serial / 05b-parallel |
| 2. 事前確認 | 本番 Secrets 配置確認 / Pages project 存在確認 / Workers サービス存在確認 / D1 database_id 確認 / readiness checklist PASS 確認 | 04-serial / 05b-parallel |
| 3. 実行 | (3-1) D1 バックアップ → (3-2) D1 migrations apply → (3-3) Workers deploy → (3-4) Pages deploy → (3-5) deploy-execution-log 記録 | Phase 2 deploy-design.md |
| 4. smoke test | AC-1 (Pages 200) / AC-2 (/health) / AC-4 (D1 SELECT) / AC-5 (全件 PASS) のチェックリスト | Phase 2 smoke test 設計 / Phase 11 |
| 5. ロールバック | OpenNext Workers / API Workers / D1 各系統の切戻しコマンド・発動条件・判断者 | Phase 2 rollback-runbook.md / Phase 6 |
| 6. 付録 | A. Secrets キー一覧 / B. wrangler コマンドリファレンス / C. 環境別 binding マトリクス / D. トラブルシューティング | env-binding-matrix.md / deployment-cloudflare.md |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | DRY 化方針を deploy-design.md / env-binding-matrix.md に反映するための差分を確定 |
| Phase 5 | DRY 化後の wrangler.toml 構造に基づいて本番デプロイを実行 |
| Phase 9 | DRY 化後の設定が secret hygiene / 無料枠の品質基準を満たすか確認 |
| Phase 10 | deploy-runbook.md 統合稿を GO/NO-GO 判定の根拠とする |
| Phase 11 | deploy-runbook の smoke test 章を手動 smoke test の実行手順とする |
| Phase 12 | runbook を spec 更新の対象として close-out に反映 |

## 多角的チェック観点（AIが判断）

- 価値性: DRY 化により設定変更時の修正箇所が減り、本番事故リスクが下がるか
- 実現性: wrangler.toml の制約内で DRY 化が成立し、OpenNext Workers / API Workers / D1 各系統で動作するか
- 整合性: 02-serial / 04-serial / 05b-parallel の runbook と章立て・参照関係が矛盾しないか
- 運用性: 新環境追加（例: preview env）時に最小限の変更で済む構造か・runbook が単一ソースとして機能するか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler.toml 重複設定検出 | 8 | pending | DRY 化対象テーブル作成 |
| 2 | env-binding-matrix DRY 化方針確定 | 8 | pending | Phase 2 成果物の改訂方針 |
| 3 | 02-serial / 04-serial runbook との整合確認 | 8 | pending | 章立て・参照関係 |
| 4 | deploy-runbook.md 統合稿作成 | 8 | pending | 6 章構成 |
| 5 | DRY 化 Before / After 文書化 | 8 | pending | dry-config-policy.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/dry-config-policy.md | DRY 化対象テーブル / Before-After / env-binding-matrix DRY 化方針 |
| ドキュメント | outputs/phase-08/deploy-runbook.md | 6 章構成の統合 runbook（前提・事前確認・実行・smoke test・ロールバック・付録） |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- DRY 化対象テーブルが `[[d1_databases]]` / `[[kv_namespaces]]` / `[[r2_buckets]]` / `vars` / `build` 全項目について作成されている
- env-binding-matrix の DRY 化方針が Before / After で文書化されている
- 02-serial / 04-serial の runbook と章立てが整合し、重複記述が排除されている
- deploy-runbook.md が 6 章構成で完成し、Phase 5 / Phase 11 から参照可能である
- Secrets キー一覧が runbook 付録で一元管理されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（重複箇所の見落とし・runbook 章立ての不整合・参照リンク切れ）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: dry-config-policy.md / deploy-runbook.md を Phase 9 に引き継ぎ、無料枠 / secret hygiene の観点で再点検する
- ブロック条件: deploy-runbook.md の 6 章すべてが揃っていない、または DRY 化対象テーブルに抜けがある場合は次 Phase に進まない
