# UT-04: D1 データスキーマ設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-04 |
| タスク名 | D1 データスキーマ設計 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract |

## 目的

Cloudflare D1 の初期スキーマ（テーブル定義 / インデックス / 制約）を設計し、マイグレーションファイルを作成する。Google Sheets を入力源として運用する UBM 兵庫支部会システムの正本 DB として D1 が機能するための基盤を確立する。

## スコープ

### 含む
- D1 テーブル定義（DDL）の設計
- インデックス・制約の定義（PRIMARY KEY / UNIQUE / NOT NULL / FOREIGN KEY）
- Wrangler マイグレーションファイルの作成（`migrations/*.sql`）
- Google Sheets の入力項目と D1 カラムのマッピング定義
- dev / main 環境向けのスキーマ適用手順の文書化

### 含まない
- 実データの投入（本番データ移行は別タスク）
- Sheets→D1 同期処理の実装（UT-09 のスコープ）
- WAL mode の設定（UT-02 のスコープ）
- アプリケーションコード側の ORM / クエリ実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03-serial-data-source-and-storage-contract | データ契約（Sheets/D1 の source-of-truth 定義）が確定してからスキーマ設計を行う |
| 上流 | 02-serial-monorepo-runtime-foundation | Wrangler 環境・D1 バインディングが整備されていることが前提 |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・D1 データベースインスタンスの作成が完了していること |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | スキーマが確定していないと同期ジョブの実装ができない |
| 下流 | UT-06 (本番デプロイ実行) | 本番デプロイ前にマイグレーション適用が必要 |

## 苦戦箇所・知見

**Google Sheets 構造の変動リスク**: Sheets の列構成が運用中に変わった場合、D1 スキーマとの乖離が発生する。カラム追加は ALTER TABLE で対応できるが、カラム削除・型変更はデータ損失リスクを伴う。スキーマ確定前に Sheets の「確定済み列」を明示的にフリーズしておくことが重要。

**SQLite の型システムの制限**: Cloudflare D1 は SQLite ベースのため、DATETIME 型が実質 TEXT として保存される。日時の比較・ソート処理での動作を事前に確認し、ISO 8601 形式での統一を仕様化しておく必要がある。

**マイグレーション番号管理**: Wrangler の `migrations/` ディレクトリではファイル名の番号順で適用されるため、dev/main 間でのマイグレーション番号の整合性管理が煩雑になりやすい。`0001_initial.sql` のような連番プレフィックス規約を早期に決定する。

**D1 の FOREIGN KEY 制約デフォルト無効**: SQLite / D1 では `PRAGMA foreign_keys = ON;` を明示しないと外部キー制約が有効にならない。Wrangler 経由での設定方法を確認し、マイグレーションファイルに明記する。

## 実行概要

- Google Sheets の入力フォーム設計（`doc/00-getting-started-manual/google-form/01-design.md`）を参照し、各フィールドを D1 テーブルのカラムにマッピングする
- UBM 兵庫支部会の業務ドメイン（バンド申請・メンバー管理・公演情報等）に基づいてテーブル間のリレーションを設計する
- Wrangler CLI を使用して `wrangler d1 migrations create` でマイグレーションファイルを生成し、DDL を記述する
- dev 環境（ローカル D1 / Cloudflare dev D1）と main 環境（本番 D1）の両方に対してマイグレーション適用手順を runbook 化する
- `03-serial-data-source-and-storage-contract` の Phase 2 成果物（`data-contract.md`）とスキーマの整合性をレビューし、source-of-truth の矛盾がないことを確認する

## 完了条件

- [ ] D1 テーブル定義（DDL）が設計ドキュメントとして文書化されている
- [ ] Wrangler マイグレーションファイル（`migrations/*.sql`）が作成されている
- [ ] Google Sheets の入力項目と D1 カラムのマッピング表が作成されている
- [ ] dev 環境でのマイグレーション適用が成功している（`wrangler d1 migrations apply --local`）
- [ ] インデックス・制約（PRIMARY KEY / NOT NULL / UNIQUE）が適切に定義されている
- [ ] `03-serial-data-source-and-storage-contract` の data-contract.md との整合性レビューが完了している
- [ ] マイグレーション適用手順（dev / main）が runbook として文書化されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/google-form/01-design.md | Sheets 入力フィールド定義（スキーマのベース） |
| 必須 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract/index.md | データ契約タスクの目的・スコープ確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 操作・Wrangler マイグレーション手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | DB レイヤーの位置づけ確認 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠制約・D1 選定理由 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | 未タスク検出元（UT-04 の出典） |
