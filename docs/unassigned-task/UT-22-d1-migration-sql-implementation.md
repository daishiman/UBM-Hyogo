# UT-22: D1 migration SQL 実体記述・本番適用

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-22 |
| タスク名 | D1 migration SQL 実体記述・本番適用 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | in-progress（03-serial セッションで SQL 作成・staging/production 適用済み・README・snapshot 未完） |
| 作成日 | 2026-04-26 |
| 既存タスク組み込み | なし（UT-04 はスキーマ設計、本タスクは migration SQL 実体記述と DB 適用） |
| 組み込み先 | - |
| 検出元 | doc/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-05) |

## 目的

03-serial-data-source-and-storage-contract で確定した D1 schema (members / sync_audit / 関連テーブル) の migration contract に基づき、`apps/api/migrations/0001_init.sql` を実体ファイルとして作成し、staging / production D1 へ wrangler 経由で適用するパイプラインを整備する。

## スコープ

### 含む
- `apps/api/migrations/0001_init.sql` の実体 DDL 記述（CREATE TABLE / INDEX / CHECK / FK）
- 03-serial `outputs/phase-02/data-contract.md` のテーブル定義との完全一致
- `wrangler d1 migrations apply` を用いた dev / staging / production への適用手順整備
- migration 適用の冪等性確認（重複実行で失敗しない）
- 03-serial `outputs/phase-05/d1-bootstrap-runbook.md` の手順への準拠と更新
- ロールバック方針の明文化（D1 は down migration を持たないため snapshot ベース）

### 含まない
- スキーマの新規設計判断（UT-04 / 03-serial で確定済み・本タスクは実体化のみ）
- WAL mode 設定（UT-02 のスコープ）
- sync 実装コード（UT-21 のスコープ）
- backfill データ投入（運用フェーズ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03-serial-data-source-and-storage-contract | schema 契約と migration contract が source-of-truth |
| 上流 | UT-04（D1 データスキーマ設計） | 論理スキーマ設計が完了していること |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント / D1 binding が確定済み |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | CI から wrangler 適用するためのシークレット配置 |
| 下流 | UT-21（sync endpoint 実装） | audit テーブル含む schema 適用が前提 |
| 下流 | UT-02（D1 WAL mode 設定） | schema 適用後にチューニング可能 |

## 着手タイミング

> **着手前提**: 03-serial がマージ済みかつ Cloudflare D1 instance が dev / staging / production で発行済みであること。

| 条件 | 理由 |
| --- | --- |
| 03-serial マージ済み | data-contract.md が正本として参照可能 |
| 01b 完了 | D1 instance が存在しないと適用できない |
| 04 進行中以降 | CI からの自動適用には secret 配置が必要（手動適用は先行可） |

## 苦戦箇所・知見

**03-serial セッションで SQL 作成・staging / production 適用済み（2026-04-26）**
03-serial フェーズ中に `apps/api/migrations/0001_init.sql` を作成し、`wrangler d1 migrations apply --remote` で staging / production 両方に適用完了。作成された5テーブル:
- `member_responses` — Google Forms 回答の正規化データ
- `member_status` — 管理者が管理するステータスフィールド
- `admin_overrides` — 管理者が上書き可能なフィールド
- `sync_audit` — 同期実行ごとの audit ログ
- `member_status_history` — ステータス変更履歴

残作業: `apps/api/migrations/README.md` 作成・`wrangler d1 export` による snapshot 取得・5点同期ルール文書化・CHECK 制約の境界テスト。

**wrangler コマンドの実行ディレクトリ**
`wrangler d1 migrations apply` は `apps/api/` ディレクトリから実行する必要がある（`wrangler.toml` が存在する場所）。monorepo ルートから実行すると wrangler.toml が見つからずエラーになる。`cd apps/api && wrangler d1 migrations apply DB --remote` または `pnpm --filter @ubm-hyogo/api exec wrangler d1 migrations apply DB --remote` で実行すること。

**wrangler.toml の DB binding 設計**
production と staging で同名の "DB" binding を使うが、参照する database_id が異なる。`[env.staging]` セクションで binding 上書きを行う設計。migration apply 時は `--env staging` フラグで staging DB を対象にできる。

**D1 は down migration を持たない**
Cloudflare D1 の `wrangler d1 migrations` は up only。誤適用したスキーマは ALTER TABLE で打ち消すか、最悪は database を作り直すしかない。本番適用前に必ず staging で検証し、「適用前 snapshot を `wrangler d1 export` で取得」を runbook 上の必須手順とすること。

**契約 (docs-only) と SQL ファイルの双方向同期**
03-serial の data-contract.md がテーブル定義の正本だが、SQL ファイルがコードとして存在すると「正本がどちらか」が曖昧になりがち。本タスクでは SQL ファイル冒頭コメントに「正本: doc/03-serial.../phase-02/data-contract.md」と明示し、SQL を直接編集する PR は data-contract.md 同時更新を必須とする運用 (5点同期) を README で文書化する。

**CHECK 制約と D1 の SQLite サポート差分**
D1 のベースは SQLite だが、一部の高度な CHECK / 部分 INDEX / generated column が Workers ランタイムで挙動差を持つことがある。03-serial で確定した契約のうち、CHECK 制約は dev D1 上で実 INSERT による境界テストを行ってから production 適用すること。

**SERVICE_ACCOUNT JSON / migration SQL の secrets 混入リスク**
migration SQL に seed データやサンプル ID を埋め込むと、それが本番適用後に消えない。SQL ファイルには DDL のみを記述し、seed / sample は別ファイル (`apps/api/seeds/`) に分離して管理すること。

## 実行概要

- `apps/api/migrations/0001_init.sql` を新規作成し、03-serial `phase-02/data-contract.md` のテーブル定義を DDL 化
- 冒頭コメントに正本パスを明記、5点同期義務を README に記述
- `wrangler d1 migrations apply <DB_NAME> --local` で dev 検証
- staging → production の順で `--remote` 適用、適用前に `wrangler d1 export` で snapshot 取得
- 03-serial `outputs/phase-05/d1-bootstrap-runbook.md` の手順差分があれば runbook を更新（5点同期）
- README.md (`apps/api/migrations/README.md`) に運用ルールを集約

## 完了条件

- [x] `apps/api/migrations/0001_init.sql` が存在し、03-serial の data-contract.md と完全一致 — 03-serial で完了
- [x] staging D1 への migration apply 成功（5テーブル: member_responses, member_status, admin_overrides, sync_audit, member_status_history）— 03-serial で完了
- [x] production D1 への migration apply 成功 — 03-serial で完了
- [x] UT-21 が依存する audit テーブルが production に存在することを確認 — 03-serial で完了
- [ ] dev ローカル D1 への migration apply 成功（`--local` フラグ）
- [ ] 重複適用が「No migrations to apply」で safe failure になることを確認
- [ ] 各環境で適用前 snapshot を `wrangler d1 export` で取得し、保管場所を runbook に記録
- [ ] `apps/api/migrations/README.md` に正本パスと 5点同期ルールを記述
- [ ] CHECK 制約の境界テストを dev D1 で実施し、結果を 03-serial 配下に追記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | スキーマ定義の正本 |
| 必須 | doc/03-serial-data-source-and-storage-contract/outputs/phase-05/d1-bootstrap-runbook.md | D1 bootstrap 手順 |
| 必須 | doc/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-05) | 検出原典 |
| 参考 | UT-04 仕様書 | スキーマ設計の論理側 |
| 参考 | https://developers.cloudflare.com/d1/reference/migrations/ | wrangler d1 migrations 公式 |
| 参考 | https://developers.cloudflare.com/d1/wrangler-commands/#export | snapshot export 手順 |
