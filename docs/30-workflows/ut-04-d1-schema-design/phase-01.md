# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel（UT-01 / UT-02 / UT-03 と並列着手可能） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク分類 | implementation（DDL ファイル / migration / runbook の成果物作成） |
| visualEvidence | NON_VISUAL |

## 目的

Cloudflare D1 の初期 schema 設計タスクの「真の論点」を確定させ、`apps/api/migrations/` 配下に追加する DDL / migration の境界・前提・受入条件を docs として固定する。設計フェーズ (Phase 2) が WAL 非前提・admin-managed data 分離・data-contract.md との整合性を制約のもとで一意に判断できる入力を作成する。

## 真の論点 (true issue)

- 「テーブルを作ること」ではなく、「Sheets schema 変動・SQLite 型制約・FK デフォルト無効・migration 番号管理という 4 大リスクを抱えた状態でも、後続 UT-09（同期ジョブ）と UT-21（audit）が確定 schema に依存できる契約を提供すること」が本タスクの本質。
- 副次的論点として、03-serial-data-source-and-storage-contract の data-contract.md と本タスク schema-design.md の役割境界を明示し、source-of-truth の二重管理を避けること。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は DDL ファイル / migration SQL / runbook MD のみ。UI スクリーンショット対象なし |
| 成果物の物理形態 | テキスト（SQL / Markdown） | `apps/api/migrations/*.sql` と `outputs/phase-XX/*.md` |
| 検証方法 | `wrangler d1 migrations apply --local` 実行ログ・SQL lint・schema 整合性レビュー | Phase 11 manual smoke で実機検証 |

artifacts.json の `metadata.visualEvidence` を `NON_VISUAL` で確定する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 03-serial-data-source-and-storage-contract | data-contract.md（Sheets / D1 source-of-truth 定義） | schema は data-contract.md の implementation refinement と位置付ける |
| 上流 | 02-serial-monorepo-runtime-foundation | Wrangler 環境・D1 binding 定義 | binding 名・DB 名を migration コマンドに反映 |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | D1 instance（dev / production）作成済 | migration 適用対象の DB 名を確定 |
| 並列 | UT-01（同期方式定義） | 差分 vs 全件の判断 | unique key / dedup index の設計に反映 |
| 下流 | UT-09（同期ジョブ実装） | upsert 対象 schema | 確定 DDL を提供 |
| 下流 | UT-21（audit endpoint） | sync_audit_logs / sync_audit_outbox の有無 | 監査系テーブル要否を Phase 3 で判断 |
| 下流 | UT-06（本番デプロイ） | production 適用 runbook | runbook を提供 |

## スキーマ要件（Phase 2 入力）

### テーブル候補一覧（暫定 / Phase 2 で確定）

| # | テーブル名 | 役割 | 想定主キー | 想定 unique key |
| --- | --- | --- | --- | --- |
| 1 | `members` | バンドマン会員（admin-managed data 正本） | `id`（surrogate, TEXT UUID） | `sheets_row_id`（natural key from Sheets） |
| 2 | `sync_job_logs` | 同期ジョブ実行ログ | `id`（INTEGER AUTOINCREMENT） | - |
| 3 | `sync_locks` | 同期 lock（二重実行防止） | `lock_name`（TEXT） | - |
| 4 | `members_history`（任意） | 変更履歴（soft delete 含む） | `id` + `version` | Phase 3 で要否判断 |

### 想定カラムと制約候補

| テーブル | カラム | 型 | NOT NULL | UNIQUE | FK | INDEX |
| --- | --- | --- | --- | --- | --- | --- |
| members | id | TEXT (UUID) | YES | PK | - | - |
| members | sheets_row_id | TEXT | YES | YES | - | INDEX |
| members | display_name | TEXT | YES | - | - | - |
| members | email | TEXT | NO | - | - | INDEX |
| members | created_at | TEXT (ISO 8601) | YES | - | - | - |
| members | updated_at | TEXT (ISO 8601) | YES | - | - | INDEX |
| members | deleted_at | TEXT (ISO 8601) | NO | - | - | - |
| sync_job_logs | id | INTEGER AUTOINCREMENT | YES | PK | - | - |
| sync_job_logs | job_name | TEXT | YES | - | - | INDEX |
| sync_job_logs | started_at | TEXT (ISO 8601) | YES | - | - | INDEX |
| sync_job_logs | finished_at | TEXT (ISO 8601) | NO | - | - | - |
| sync_job_logs | status | TEXT (running/success/failed) | YES | - | - | INDEX |
| sync_job_logs | fetched_count | INTEGER | NO | - | - | - |
| sync_job_logs | upserted_count | INTEGER | NO | - | - | - |
| sync_job_logs | error_message | TEXT | NO | - | - | - |
| sync_locks | lock_name | TEXT | YES | PK | - | - |
| sync_locks | acquired_at | TEXT (ISO 8601) | YES | - | - | - |
| sync_locks | expires_at | TEXT (ISO 8601) | YES | - | - | INDEX |
| sync_locks | holder_id | TEXT | NO | - | - | - |

> 上記は Phase 2 で確定する暫定値。Sheets フィールド一覧（google-form/01-design.md）との突合結果で増減する。

### Schema / migration ownership 宣言

| 物理位置 | ownership | reader | writer |
| --- | --- | --- | --- |
| `apps/api/migrations/*.sql` | 本タスク UT-04 | UT-09 / UT-21 / UT-06 | UT-04 のみ（後続変更は別 migration を追加する） |
| `apps/api/src/db/schema.ts`（drizzle 等の TS schema は対象外） | - | - | -（本タスクでは TS schema は作らない） |
| `outputs/phase-02/sheets-d1-mapping.md` | 本タスク UT-04 | UT-09 mapper 実装 | UT-04 |

## 価値とコスト

- 価値: Sheets 正本主義のもと、後続実装タスク（UT-09 / UT-21）が確定 schema に対してコードを書ける状態を提供。schema 不確定状態での実装スタート（手戻り）を防止。
- コスト: migration ファイル作成と D1 dev 適用の検証時間のみ。ランニングコストは D1 無料枠内で完結。
- 機会コスト: 過剰正規化（過度な FK / lookup table 化）を選んだ場合、SQLite 性能制約と運用複雑性が上がる。Phase 3 で正規化レベルを評価する。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 後続 UT-09 / UT-21 / UT-06 が依存できる確定 schema を最小コストで提供 |
| 実現性 | PASS | Wrangler D1 migrations は既に CLI として確立。`scripts/cf.sh` 経由で 1Password Secret 注入も自動化済み |
| 整合性 | PASS | 不変条件 #1（schema 固定回避）/ #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api 限定）を全て満たす設計が可能 |
| 運用性 | PASS | 連番 migration 規約と runbook により dev / production 双方で再現性ある適用が可能 |

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence が `NON_VISUAL` で確定
- [ ] 真の論点が「テーブル作成」ではなく「契約提供 + 4 大リスク管理」に再定義
- [ ] 4条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 3 / 並列 1 / 下流 3 すべて前提と出力付きで記述
- [ ] テーブル候補一覧（4 個以内）が暫定列挙されている
- [ ] 想定カラム表（PK / UK / NOT NULL / FK / INDEX）が 3 主要テーブル分作成されている
- [ ] Schema / migration ownership 宣言が `apps/api/migrations/` 配下に固定
- [ ] AC-1〜AC-12 が index.md と完全一致
- [ ] 不変条件 #1 / #4 / #5 のいずれにも違反しない要件定義

## 実行手順

### ステップ 1: 上流前提の確認

- `docs/01-infrastructure-setup/03-serial-data-source-and-storage-contract/` の `data-contract.md`（あれば Phase 2 成果物）を確認する。
- `apps/api/wrangler.toml` の D1 binding 名と DB 名を確認する。
- 不足があれば Phase 2 へ進まず依存表を更新する。

### ステップ 2: Sheets フィールド突合

- `docs/00-getting-started-manual/google-form/01-design.md` の入力フィールドを列挙する。
- `members` テーブルへのマッピング候補を Phase 2 への入力として `outputs/phase-01/main.md` に記述する。

### ステップ 3: 4 大リスクの再写経

- 苦戦箇所 4 件（Sheets 変動 / SQLite 型 / FK 無効 / migration 番号）を AC または多角的チェックに対応付ける。

### ステップ 4: 4条件と AC のロック

- 4条件すべてが PASS で固定されていることを確認する。
- AC-1〜AC-12 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・依存境界・テーブル候補・カラム制約候補を設計入力として渡す |
| Phase 3 | 4条件評価の根拠を代替案 PASS/MINOR/MAJOR の比較軸に再利用 |
| Phase 4 | AC-1〜AC-12 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-12 を使用 |
| Phase 10 | 4条件最終判定の起点として再評価 |

## 多角的チェック観点

- 不変条件 #1: Sheets schema をコードに固定しない（mapper 層に閉じる前提を明記）。
- 不変条件 #4: admin-managed data が `members` 等専用テーブルに分離されているか。
- 不変条件 #5: migration ファイルが `apps/api/migrations/` 配下に固定され、`apps/web` から schema を参照しないか。
- SQLite 型: DATETIME 候補列が ISO 8601 TEXT として宣言されているか。
- FK: 外部キー候補列に対し `PRAGMA foreign_keys = ON;` の取り扱い方針が Phase 2 へ持ち越されているか。
- migration 番号: 連番規約（`0001_`, `0002_` 形式）が Phase 2 で確定する旨が記載されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | visualEvidence = NON_VISUAL の確定 | 1 | pending | artifacts.json と同期 |
| 2 | 真の論点を「契約提供 + 4 大リスク管理」に再定義 | 1 | pending | main.md 冒頭に記載 |
| 3 | 依存境界（上流 3 / 並列 1 / 下流 3）の固定 | 1 | pending | UT-09 / UT-21 との interface 整合 |
| 4 | テーブル候補一覧（4 個以内）の暫定列挙 | 1 | pending | Sheets 突合の素材 |
| 5 | カラム制約候補表の作成 | 1 | pending | 3 主要テーブル |
| 6 | Schema / migration ownership 宣言 | 1 | pending | apps/api/migrations/ 限定 |
| 7 | 4条件評価 PASS 確定 | 1 | pending | 全件 PASS |
| 8 | AC-1〜AC-12 の確定 | 1 | pending | index.md と完全一致 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件評価・true issue・依存境界・schema 要件） |
| メタ | artifacts.json | Phase 1 状態の更新 + visualEvidence 確定 |

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `pending` から `spec_created` へ遷移
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 4 件すべてが AC または多角的チェックに対応
- 異常系（Sheets 変動 / 型不整合 / FK 失効 / migration 衝突）の論点が要件レベルで提示
- artifacts.json の `phases[0].status` が `spec_created`
- artifacts.json の `metadata.visualEvidence` が `NON_VISUAL`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 契約提供 + 4 大リスク管理
  - 4条件評価（全 PASS）の根拠
  - テーブル候補一覧（暫定 4 個）とカラム制約候補表
  - Schema / migration ownership は `apps/api/migrations/` に固定
  - data-contract.md との役割境界（契約 vs 実装 refinement）の前提
- ブロック条件:
  - 03-serial-data-source-and-storage-contract の data-contract.md が未確定
  - 4条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-12 が index.md と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
