# 検索・タグ・業種分類 設計

## 検索機能の概要

```text
検索方法は 3 種類:
1. テキスト検索  名前・職業・ビジネス概要・スキル・自己紹介
2. フィルター    UBM区画・参加ステータス・公開状態・業種タグ
3. 補助指標      最終更新日・公開/非公開バッジ
```

---

## 基本方針

- タグは `stableKey` ベースのルールで付与する
- `occupation` や `businessOverview` のラベル変更に依存しない
- フォーム schema が変わったら tag rule も再評価する
- ただし既存タグは即消さず、`sourceSchemaHash` を持って stale 判定できるようにする

---

## 検索・フィルターのUI設計

### 検索バー

```text
┌─────────────────────────────────────────────┐
│ 名前・職業・スキル・自己紹介で検索          │
└─────────────────────────────────────────────┘
```

### フィルター

```text
【UBM区画】
  [全て] [0→1] [1→10] [10→100]

【参加ステータス】
  [全て] [会員] [非会員] [アカデミー生]

【公開状態】
  [全て] [公開] [非公開]

【業種タグ】
  [経営] [Web・IT] [デザイン] [コンサル]
```

---

## 業種タグの付与方式

### 自動付与

- フォームの `occupation` / `businessOverview` / `skills` / `canProvide` から自動分類する
- ルールは `tag_rules` に保存する
- 結果は D1 の `member_tags` に保存する

### 手動修正

- 本人がプロフィール編集で追加・削除できる
- 管理者のデフォルトUXにはタグ管理 UI を置かない

---

## D1 テーブル設計

```sql
CREATE TABLE IF NOT EXISTS tag_definitions (
  tag_id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  source_fields TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tag_rules (
  rule_id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL,
  schema_hash TEXT,
  source_stable_keys TEXT NOT NULL,
  match_type TEXT NOT NULL,
  match_value TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS member_tags (
  response_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  source_schema_hash TEXT NOT NULL,
  matched_by TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (response_id, tag_id)
);
```

---

## 一覧表示との関係

- タグは検索精度向上のために使う
- 検索条件はフォームの表示項目とタグに限定し、アクセス制御状態は別フィルターに分ける
- schema 変更後は tag rules を再評価する
- 未解決の `stableKey` がある場合は、そのルールを一時的に無効化する

---

## 実装ルール

1. インデックス生成は `member_responses` の保存時に行う
2. `schemaHash` が変わったら `member_tags` を再計算する
3. `tag_rules` は `stableKey` 参照で書く
4. 検索語は全文検索用の `searchText` にまとめる
5. 未対応の質問は検索対象から外すのではなく、raw データとして保持する

---

## 事故を防ぐルール

1. `industry_tags` のような固定列前提に戻さない
2. 文字列ラベルだけで tag を決めない
3. `tag_rules` を schema 無しで評価しない
4. `questionId` 依存の分類をしない
