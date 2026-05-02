# Phase 2: 設計（コメント文言・spec 表記）

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 2 |
| status | `done` |

## 目的

UNIQUE 所在を `database-schema.md` と migration コメントで同じ語彙にそろえる設計を定義する。既適用 migration への変更はコメントのみとし、SQL semantics 不変と D1 migration 状態を Phase 11 evidence で確認する。

## 実行タスク

- 編集対象ファイルと差分方針を定義する。
- immutable migration 方針時の縮退先を明確化する。

## 参照資料

- `apps/api/migrations/0001_init.sql`
- `apps/api/migrations/0005_response_sync.sql`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## 統合テスト連携

設計段階では統合テストを実行しない。grep / SQL semantic diff / D1 migration list は Phase 11 evidence として後続実装時に取得する。

## 編集対象ファイルと差分方針

### 1. `.claude/skills/aiworkflow-requirements/references/database-schema.md`

対象行: 50 - 51 周辺（テーブル責務表）と、後続の `member_identities` table 定義節（同 file 内の table 列定義表があれば該当箇所）。

差分方針（追記のみ・既存行削除なし）:

- 行 50 の `member_responses` 説明末尾に追記:
  - ``response_email` 列に UNIQUE 制約は付与しない（履歴行のため同値重複を許容する）。`
- 行 51 の `member_identities` 説明末尾に追記:
  - ``response_email` は本テーブルにおいて UNIQUE（`NOT NULL UNIQUE`、宣言は `apps/api/migrations/0001_init.sql`）であり、システム全体の正本 UNIQUE 所在である。`
- 同 file 内に「主要 UNIQUE 制約一覧」節があれば同一文言を 1 行追加。なければ section を新設しない（DRY）。

### 2. `apps/api/migrations/0001_init.sql`

対象行: 54（`response_email TEXT,` — `member_responses` 内）、90（`response_email TEXT NOT NULL UNIQUE,` — `member_identities` 内）。

差分方針（行末コメント or 直前行コメント、SQL 構文不変）:

- 行 54 直後（または同行末）に SQL コメント:
  - `-- NOTE: response_email に UNIQUE は付与しない。履歴行のため同一 email で複数 row を許容する。正本 UNIQUE は member_identities.response_email 側（同 file 行 90）。`
- 行 90 直後（または同行末）に SQL コメント:
  - `-- NOTE: ここが response_email の正本 UNIQUE。member_responses.response_email には UNIQUE を付与しない。`

### 3. `apps/api/migrations/0005_response_sync.sql`

対象行: 7（`-- 2. member_identities.response_email は 0001_init.sql で UNIQUE 済み（再宣言なし）`）。

差分方針: 文言を 0001 側のコメントと同義語に揃える（必要な場合のみ）。最小差分例:

- 行 7 を以下に置換:
  - `-- 2. member_identities.response_email は 0001_init.sql で正本 UNIQUE が宣言済み（再宣言・再付与なし）。`

## 文言テンプレート（DRY のため共通語彙を採用）

| 概念 | 統一語彙 |
| --- | --- |
| UNIQUE 所在 | `member_identities.response_email` |
| 正本 file / 行 | `apps/api/migrations/0001_init.sql` 行 90 |
| `member_responses` 側 | UNIQUE 不在（履歴行・同一 email 重複許容） |

## 関数・型シグネチャの変更

なし（コメント / spec 文言のみ）。

## 入出力 / 副作用

- 入力: ソース 3 ファイルの現行内容
- 出力: 上記差分方針を適用した 3 ファイル
- 副作用: なし（SQL 実行・データ変更・インデックス変更すべてなし）

## 完了条件

- [x] 上記 3 ファイルの差分案が文言レベルで確定している
- [x] 「UNIQUE 所在」を表す共通語彙が決定している
- [x] 後続 Phase（実装手順 / テスト戦略）から参照可能

## 成果物

- `outputs/phase-02/main.md`: 本設計書のコピー
