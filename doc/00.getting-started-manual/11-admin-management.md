# 管理者権限管理設計

## 管理者でできること

| 機能 | 一般メンバー | 管理者 |
|------|:-----------:|:------:|
| プロフィール一覧・詳細の閲覧 | ✅ | ✅ |
| 自分のプロフィール編集 | ✅ | ✅ |
| 公開/非公開の切り替え | ❌ | ✅ |
| 削除/復元 | ❌ | ✅ |
| Google Form 差分の確認 | ❌ | ✅ |
| タグルールの運用 | ❌ | ✅ |

デフォルトUXから除外するもの:

- 管理者追加・削除 UI
- 他人のプロフィール本文編集
- 物理削除

---

## 管理者ページ

### `/admin/members`

- 各メンバーの公開状態と削除状態を管理するページ
- 一覧から `詳細` を押すと、右ドロワーかモーダルで詳細と操作を表示する
- 画面の主目的は「誰を見せるか」「誰を隠すか」を素早く判断すること

### `/admin/schema`

- Google Form の構造変更を確認するページ
- 追加・削除・変更・未解決項目をまとめて見る
- `schemaHash` と `revisionId` を確認し、`stableKey` の再割当てを行う

### `/admin/tags`

- `tag_definitions` と `tag_rules` を管理するページ
- `stableKey` 参照のルールだけを編集する

---

## 画面での管理操作

| 操作 | UI |
|------|----|
| 公開状態の切り替え | `Switch` |
| 削除/復元 | `Dialog` の確認ボタン |
| schema 差分の確認 | `Drawer` または `Sheet` |
| タグルール編集 | `Dialog` または専用編集パネル |

---

## D1 テーブル前提

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS member_status (
  response_id TEXT PRIMARY KEY,
  public_consent TEXT NOT NULL DEFAULT 'unknown',
  rules_consent TEXT NOT NULL DEFAULT 'unknown',
  is_public INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  last_notified_at TEXT,
  updated_by TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deleted_members (
  response_id TEXT PRIMARY KEY,
  deleted_by TEXT NOT NULL,
  deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT NOT NULL DEFAULT ''
);
```

---

## 管理者の設定方法

管理者の追加・削除は UI では行わず、内部運用に限定する。

```bash
pnpm wrangler d1 execute ubm-members-db \
  --command="INSERT INTO admin_users (email) VALUES ('admin@example.com')"
```

---

## セキュリティ設計

```text
【管理者確認】
  APIルートで isAdmin を必ず確認する

【誤操作防止】
  公開切り替えと削除は確認または undo を付ける

【操作ログ】
  member_status.updated_by
  deleted_members.deleted_by
  sync_jobs.details_json
  を保存する
```

---

## 運用ルール

1. 管理者はメンバーの本文を直接編集しない
2. Google Form 変更は `/admin/schema` に閉じ込める
3. タグルールは `stableKey` で管理する
4. 削除は物理削除にしない
