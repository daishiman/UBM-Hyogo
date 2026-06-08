# Phase 2 — データベーススキーマ詳細 + ADR-1119

> **[実装区分: 実装仕様書]** / `implementation_mode: new` / **NON_VISUAL**
> member_tags / tag_definitions の現状 schema（FK なし）・ADR-1119（DB FK 不採用の決定と根拠）・D1 PRAGMA foreign_keys が N/A である理由を確定する。

## 1. 現状 schema（実測・FK なし）

### 1.1 `member_tags`（`apps/api/migrations/0002_admin_managed.sql:43-51`）

| 列 | 型 | 制約 | 備考 |
|----|----|------|------|
| `member_id` | TEXT | PRIMARY KEY（複合） | members への論理 FK（DB FK なし） |
| `tag_id` | TEXT | PRIMARY KEY（複合） | **tag_definitions への論理 FK（DB FK なし）← 本タスクの参照整合性対象** |
| `source` | TEXT | — | 付与元（admin / form 等） |
| `confidence` | — | — | 確度 |
| `assigned_at` | TEXT | — | 付与日時 |
| `assigned_by` | TEXT | NULL 可 | 付与者（system 付与時 null） |

- `PRIMARY KEY (member_id, tag_id)`（複合主キー）
- **FOREIGN KEY 制約なし**（`tag_id` が `tag_definitions.tag_id` を参照するが DB は強制しない）

### 1.2 `tag_definitions`（`apps/api/migrations/0002_admin_managed.sql:34-41`）

| 列 | 型 | 制約 |
|----|----|------|
| `tag_id` | TEXT | PRIMARY KEY |
| `code` | TEXT | UNIQUE |
| `label` | TEXT | — |
| `category` | TEXT | — |
| `source_stable_keys_json` | TEXT | — |
| `active` | — | — |

- seed（`0004`）で 41 行が常在（`NOT IN` サブクエリが空テーブルにならない前提）。

### 1.3 参照関係（論理 FK）

```
member_tags.tag_id  ──(論理 FK・DB FK なし)──▶  tag_definitions.tag_id
                                                  (PRIMARY KEY)

孤児 = member_tags 行のうち tag_id が tag_definitions.tag_id に存在しないもの
     = member_tags.tag_id NOT IN (SELECT tag_id FROM tag_definitions)
```

## 2. ADR-1119: DB-level FOREIGN KEY を採用しない決定（AC-1）

### 2.1 決定

**`member_tags.tag_id` への DB-level FOREIGN KEY は採用しない。** 代替として application 層の孤児行検出ガード（detection 関数 + admin 監査 endpoint + 不変条件テスト）で参照整合性を担保する。

### 2.2 コンテキスト

- 元 Issue #1119 は「DB-level FK 追加の是非評価」を成果物とする評価タスクだった。
- リポジトリには `apps/api/migrations/0022_member_photos.sql:4` に「member_id は論理 FK（D1 は application 層で整合、FK 制約なし）」という **documented no-FK invariant** が既に存在する。
- 全 migration（0001〜0025）に `FOREIGN KEY` は 0 件（実測）。

### 2.3 根拠比較表（DB-level FK vs application 層ガード）

| 観点 | DB-level FK 追加 | application 層ガード（**採用**） |
|------|------------------|----------------------------------|
| 既存架構との整合 | `0022_member_photos.sql:4` の documented no-FK invariant を**反転**する | invariant を**維持・強化**する |
| D1 での実効性 | D1（SQLite）は接続ごとに `PRAGMA foreign_keys` の ON/OFF が決まり enforcement が不確実。「FK を足したのに効かない」リスク | application 層クエリは D1 で確実に動作。enforcement 不確実性が無い |
| migration コスト | SQLite は `ALTER TABLE ADD CONSTRAINT` 非対応 → テーブル再作成（rename→新 table→`INSERT SELECT`→drop）。既存孤児行があると移行失敗 | migration 不要・テーブル再作成リスクなし |
| seed / fixture 影響 | FK 追加で挿入順序が壊れ、孤立 INSERT する fixture が一斉に失敗しうる | current fixture は実測で健全（`tag_a`/`tag_b` 定義済み）。本タスクでは孤児 0 の回帰確認に留める |
| 検出 vs 防止 | 防止（挿入時拒否）だが**既存孤児は検出できない** | 検出（既存孤児も含めて可視化・監査）。INSERT 防止は tag_id 先在検証（route/workflow/repository helper）が担う |
| 可逆性 | テーブル再作成は不可逆寄り・高リスク | read 関数 + endpoint 追加は低リスク・容易に拡張可能 |
| 無料枠 / コスト | テーブル再作成は大規模行コピーで I/O コスト増 | read-only の軽量 COUNT / SELECT のみ |

### 2.4 帰結

- 孤児行の**検出・監査**を application 層で実装する（防止は tag_id 先在検証が担う二段構え）。
- issue-1070 の count guard（削除時の参照防壁）は撤去せず維持。orphan detection と**責務を分離**して共存させる。
- 新 migration（0026 等）を追加しない。D1 schema は不変。
- ユーザー承認（2026-06-06）により approach = 「App 層整合性ガード強化（整合性重視・migration 追加なし）」を確定。

### 2.5 「先送り」ではなく「不採用の確定」

本 ADR は FK を「将来再検討する」のではなく、no-FK 架構との整合・D1 enforcement 不確実性・移行リスクを根拠に **本タスクで不採用を確定**する。根本問題（孤児ギャップ）は application 層ガードで本サイクル内に解消するため、未解決の繰り越しは残らない。

## 3. D1 PRAGMA foreign_keys が N/A である理由（元 AC-4）

| 論点 | 内容 |
|------|------|
| 元 AC-4 | 「D1 PRAGMA foreign_keys の挙動確認」 |
| 本タスクでの扱い | **N/A（FK 非依存）** |
| N/A 理由 | DB-level FK を採用しない（ADR-1119）ため、FK enforcement の有効/無効を制御する `PRAGMA foreign_keys` の挙動は本実装の判断に**不要**。孤児検出は `NOT IN` サブクエリの application 層クエリで実現し、PRAGMA 設定に依存しない |
| 補足 | D1 では接続ごとに `PRAGMA foreign_keys` 状態が定まり enforcement が不確実であること自体が、FK を採用しない根拠（§2.3）に含まれる。挙動の実測検証は「FK を使わない」決定により不要化された |

## 4. 孤児検出クエリの設計根拠

```sql
-- 検出（detectOrphanMemberTags）
SELECT member_id, tag_id, source, assigned_at, assigned_by
  FROM member_tags
 WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)
 ORDER BY member_id, tag_id;

-- 件数（countOrphanMemberTags）
SELECT COUNT(*) AS n
  FROM member_tags
 WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions);
```

| 設計要素 | 根拠 |
|----------|------|
| `NOT IN (SELECT tag_id ...)` | 「定義不在 tag を参照する行」を直接表現。論理 FK の破れを 1 クエリで検出 |
| `tag_definitions` 空時の挙動 | seed（0004）で 41 行常在ゆえ通常空にならない。空時は `NOT IN ()` が全行を孤児と判定しうるため Phase 4 でエッジケースとして検証（誤検出ガード） |
| `ORDER BY member_id, tag_id` | 決定的順序でテストの assertion を安定化 |
| read-only | mutation なし。invariant #13・無料枠維持に適合 |

## 5. schema 変更の有無（確定）

| 項目 | 本タスク |
|------|----------|
| 新 migration | **なし**（0026 等を追加しない） |
| 既存 schema 変更 | **なし** |
| FK 追加 | **なし**（ADR-1119 で不採用確定） |
| index 追加 | **なし**（既存 PK で `tag_id` 検索は十分・読み取り軽量） |

## 完了条件（Phase 2 — DB schema）

- [x] member_tags / tag_definitions の現状 schema（FK なし）を実測記載
- [x] ADR-1119（DB FK 不採用）を決定・コンテキスト・根拠比較表・帰結で確定
- [x] D1 PRAGMA foreign_keys が N/A である理由を明記
- [x] 孤児検出クエリの設計根拠・schema 無変更を確定
