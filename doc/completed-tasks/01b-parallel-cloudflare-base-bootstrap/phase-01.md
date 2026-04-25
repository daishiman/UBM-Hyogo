# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-23 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

Cloudflare 基盤ブートストラップ における Phase 1 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。
本 Phase では「何を初回スコープに含め、何を後続タスクに委ねるか」を確定し、
インフラ担当者の手動セットアップミスを防ぐ構成方針を策定する。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ（プロジェクト名・コマンド） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割と無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement（GitHub Secrets vs Cloudflare Secrets） |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split（apps/web, apps/api 分離） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | dev→staging, main→production ブランチ対応 |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ・検証 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す（特に `develop` 表記と `dev` ブランチの統一確認）。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-01/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断（`develop` → `dev` 表記統一） |

## 多角的チェック観点（AIが判断）

- 価値性: インフラ担当者の手動セットアップミスを防ぎ、dev/main 環境の混乱を解消する。
- 実現性: Pages 無制限 / Workers 100k req/day / D1 5GB の無料枠で初回スコープが成立する。
- 整合性: dev→staging, main→production のブランチ/環境対応が一意に確定している。
- 運用性: Pages rollback（ダッシュボード 1 クリック）+ Workers rollback（`wrangler rollback` CLI）が分離されている。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 1 | pending | upstream を読む |
| 2 | 成果物更新 | 1 | pending | outputs/phase-01/main.md |
| 3 | 4条件確認 | 1 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 の主成果物 |
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

- 次: 2 (設計)
- 引き継ぎ事項: Cloudflare 基盤ブートストラップ の判断（プロジェクト名・ブランチ対応・シークレット配置方針）を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 真の論点

- OpenNext 統合（Pages + Workers 一体構成）を採用しないことによるデプロイ経路の分離を確定する。
  - apps/web（Next.js）は Cloudflare Pages 経由、apps/api（Hono）は Cloudflare Workers 経由と分離する。
- `develop` ブランチ表記（旧仕様）と `dev` ブランチ（現行ブランチ戦略）の統一を Phase 12 でドキュメント修正する。

## 依存関係・責務境界

- upstream / downstream / parallel の関係を index と同一に保つ。
- web / api / db / input source / secret owner を混在させない。
  - apps/web → Cloudflare Pages (`ubm-hyogo-web` / `ubm-hyogo-web-staging`)
  - apps/api → Cloudflare Workers (`ubm-hyogo-api` / `ubm-hyogo-api-staging`)
  - DB → Cloudflare D1 (`ubm-hyogo-db-prod` / `ubm-hyogo-db-staging`)

## 価値とコスト

- 初回価値: 実装前に迷いを消す。手動セットアップミスや環境の混同を構成方針で防ぐ。
- 初回で払わないコスト: 通知基盤の整備、有料プランへの移行、KV/R2 の初期設定。

## 改善優先順位

1. **branch/env**: dev→staging, main→production の対応表を phase-02 で確定する
2. **runtime split**: apps/web（Pages）vs apps/api（Workers）の分離を wrangler.toml で表現する
3. **source-of-truth**: Sheets→入力, D1→正本DB の責務分離を明記する
4. **secret placement**: CLOUDFLARE_API_TOKEN は GitHub Secrets、OPENAI_API_KEY 等ランタイムシークレットは Cloudflare Secrets に配置する
5. **handoff/unassigned**: CLOUDFLARE_API_TOKEN と CLOUDFLARE_ACCOUNT_ID の実投入は 04-cicd-secrets で行う

## 4条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか定義されているか | PASS | インフラ担当者の手動セットアップミスを防ぎ、dev/main 環境の混乱（staging/production の取り違え）を構成方針で解消する |
| 実現性 | 無料運用の初回スコープで成立するか | PASS | Pages 無制限リクエスト・500ビルド/月、Workers 100k req/日、D1 5GB の無料枠で初回スコープが成立する |
| 整合性 | branch / env / runtime / data / secret が矛盾しないか | PASS | dev→staging, main→production のブランチ/環境対応が deployment-branch-strategy.md で一意に確定している |
| 運用性 | 運用・rollback・handoff が破綻しないか | PASS | Pages は Dashboard 1クリックで rollback、Workers は `wrangler rollback` CLI で独立してロールバックでき、経路が分離されている |

## スコープ

### 含む

- Pages project 方針（`ubm-hyogo-web` / `ubm-hyogo-web-staging`）
- Workers service 方針（`ubm-hyogo-api` / `ubm-hyogo-api-staging`）
- D1 database 方針（`ubm-hyogo-db-prod` / `ubm-hyogo-db-staging`）
- Cloudflare API Token 最小権限（Pages:Edit + Workers:Edit + D1:Edit の3スコープ）
- ブランチ/環境対応方針（dev→staging, main→production）

### 含まない

- 本番デプロイの実行
- 通知基盤の導入
- 有料オプション（KV・R2 等）の導入
- CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID の実投入（→ 04-cicd-secrets で実施）

## 受入条件 (AC)

- **AC-1**: Pages が apps/web のみ、Workers が apps/api のみ担当することを wrangler.toml の `name` フィールド（`ubm-hyogo-web` / `ubm-hyogo-api`）で確認できる
- **AC-2**: staging は `dev` ブランチ、production は `main` ブランチに固定されていることを wrangler.toml の `[env.staging]` / `[env.production]` セクションおよび GitHub Actions の workflow トリガーで確認できる
- **AC-3**: Cloudflare API Token の scope が `Pages:Edit`・`Workers Scripts:Edit`・`D1:Edit` の3スコープのみであること（Cloudflare Dashboard > My Profile > API Tokens で確認）
- **AC-4**: Cloudflare Dashboard の Analytics で Pages build count / Workers request count を追跡可能な状態になっている
- **AC-5**: Pages は Dashboard の Deployments 画面から「Rollback to this deployment」でロールバック、Workers は `wrangler rollback` コマンドで独立してロールバックできる経路が分離されている

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 存在確認済み（2026-04-09 v1.0.0 作成） |
| 変更分 | `doc/01b-parallel-cloudflare-base-bootstrap/` として移動済み | 移動済み（旧: doc/01-infrastructure-setup） |
| legacy drift | `develop` ブランチ表記（旧仕様）と `dev` ブランチ（現行）の不一致 | Phase 12 でドキュメント修正予定 |
| 外部サービス | Cloudflare Pages / Workers / D1 | 新規作成前提（既存リソースなし） |

## 正本仕様参照表

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ（プロジェクト名・コマンド） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割と無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement（GitHub Secrets vs Cloudflare Secrets） |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split（apps/web, apps/api 分離） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | dev→staging, main→production ブランチ対応 |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ・検証 |
