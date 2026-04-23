# プロフィール編集・公開状態・削除/復元の設計

## 設計方針

Google Forms の回答は直接書き換えず、差分上書き方式を採用する。

```text
【表示データ】= Forms の元データ + D1 の編集差分

【公開状態】= D1 の member_status で制御

【削除状態】= D1 の member_status + deleted_members で制御
```

---

## プロフィール編集（本人のみ）

### 制約

- ログイン中のメールとフォーム回答者メールが一致する場合のみ編集可能
- 編集できるのは表示系フィールドのみ
- 変更内容は D1 の `profile_overrides` に保存する
- `publicConsent` / `ruleConsent` / 公開状態 / 削除状態は本人編集不可

### 編集可能フィールド

| カテゴリ | フィールド |
|---------|-----------|
| 基本 | あだ名・お住まい・職業・出身地 |
| UBM | ビジネス概要・スキル・課題・提供できること |
| パーソナル | 趣味・最近ハマっていること・座右の銘・仕事以外の活動 |
| SNS | 全SNSのURL |
| メッセージ | 自己紹介文 |

### 保存ルール

1. 変更前後の差分だけを保存する
2. `schemaHash` が変わっていたら再マッピングする
3. 未対応項目は `extraFields` に退避する

---

## 管理者が変更できるもの

### 1. 公開状態

- 対象メンバーを一覧に表示するかどうかだけを切り替える
- 実装上は `member_status.is_public` を更新する

```text
/admin/members
    ↓
[公開/非公開] を切り替える
    ↓
PATCH /api/admin/members/[id]/visibility
```

### 2. 削除/復元

- 物理削除はしない
- `member_status.is_deleted` を立てて、`deleted_members` に履歴を残す
- 復元時は `is_deleted=false` に戻す

```text
/admin/members
    ↓
[削除] / [復元] を実行
    ↓
PATCH /api/admin/members/[id]/delete
POST  /api/admin/members/[id]/restore
```

### 3. 同期差分の確認

- Google Form の変更は `admin/schema` で確認する
- `questionId` 変更、質問追加、削除、選択肢変更はここで吸収する
- 管理者は `stableKey` の再割り当てだけを行い、元回答は壊さない

---

## D1 テーブル設計

### profile_overrides

| カラム | 型 | 説明 |
|--------|-----|------|
| `response_id` | TEXT | Google Forms の responseId |
| `schema_hash` | TEXT | 保存時の schemaHash |
| `values_json` | TEXT | 変更したフィールドのみの JSON |
| `updated_at` | TEXT | 更新日時 |
| `updated_by` | TEXT | 更新したユーザー |

### member_status

| カラム | 型 | 説明 |
|--------|-----|------|
| `response_id` | TEXT | Google Forms の responseId |
| `public_consent` | TEXT | `consented` / `declined` / `unknown` |
| `rules_consent` | TEXT | `consented` / `declined` / `unknown` |
| `is_public` | INTEGER | 一覧に表示するかどうか |
| `is_deleted` | INTEGER | 論理削除かどうか |
| `hidden_reason` | TEXT | 非公開にした理由 |
| `last_notified_at` | TEXT | 必要時の通知日時 |
| `updated_by` | TEXT | 更新した管理者メール |
| `updated_at` | TEXT | 更新日時 |

### deleted_members

| カラム | 型 | 説明 |
|--------|-----|------|
| `response_id` | TEXT | メンバーID |
| `deleted_by` | TEXT | 削除した管理者メール |
| `deleted_at` | TEXT | 削除日時 |
| `reason` | TEXT | 削除理由 |

---

## API ルート

| 操作 | ルート |
|------|--------|
| 自分のプロフィール更新 | `PATCH /api/profile` |
| 管理者の公開状態変更 | `PATCH /api/admin/members/[id]/visibility` |
| 管理者の削除 | `PATCH /api/admin/members/[id]/delete` |
| 管理者の復元 | `POST /api/admin/members/[id]/restore` |

---

## 管理画面の操作原則

1. 管理者は公開状態と削除状態だけを触る
2. 本文は本人編集に限定する
3. 変更前に確認ダイアログを出す
4. 取り消し可能な操作には undo を用意する
5. Google Form の schema 変更は `/admin/schema` で処理する

---

## 事故防止ルール

1. 元回答を直接更新しない
2. `member_status` を `profile_overrides` と混同しない
3. 管理者が本文を直接書き換えない
4. `publicConsent` と `ruleConsent` を公開状態と混同しない
5. 削除は物理削除にしない
