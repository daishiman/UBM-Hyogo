# 本人更新・公開状態・削除/復元の設計

## 設計方針

本人更新の正本は Google Form とする。

本人更新・公開状態・削除復元の制御は `apps/web` の導線と `apps/api` の操作 API を分離して扱う。

```text
プロフィール本文
  = Google Form current response

公開状態
  = current response の publicConsent
  + member_status.publish_state

削除状態
  = member_status.is_deleted
  + deleted_members
```

MVP では D1 `profile_overrides` 前提を採らない。

---

## 本人更新

### 正式フロー

```text
マイページ
  -> 更新モーダル or 更新 CTA
  -> Google Form responderUrl or editResponseUrl
  -> 回答送信
  -> sync
  -> current_response_id 更新
  -> マイページ再表示
```

### ルール

1. アプリ内で本文を直接 PATCH しない
2. 氏名、プロフィール文、SNS、consent を含む 31 項目は Google Form 側で更新する
3. 同じ `responseEmail` の最新回答を current response とする
4. 旧回答は履歴として保持する

---

## edit URL の扱い

- `editResponseUrl` を取得できる場合は最優先の更新導線にする
- 取得できない場合は responderUrl から再回答してもらう
- いずれの場合もアプリ内編集 UI は補助説明に留める

---

## 公開状態

公開判定は 2 段階に分ける。

1. フォーム回答由来
   - `publicConsent`
2. 管理運用由来
   - `member_status.publish_state`

公開される条件:

1. `publicConsent = "consented"`
2. `publishState = "public"`
3. `isDeleted = false`

これにより、本人の掲載同意と管理者の公開制御を両立できる。

---

## 管理者が変更できるもの

### 1. 公開状態

- `publish_state` の切り替え
- `hidden_reason` の記録

### 2. 削除/復元

- 物理削除はしない
- `member_status.is_deleted` を更新する
- `deleted_members` に履歴を残す

### 3. schema 外データ

- 開催日の追加
- 参加履歴の付与 / 解除
- タグ割当キューの処理

管理者は Google Form 本文を直接書き換えない。

---

## 削除依頼への対応

規約に合わせ、アプリから消しても Google 側元データは残る。

```text
member requests deletion
  -> admin confirms
  -> member_status.is_deleted = true
  -> deleted_members insert
  -> public/member views hide
```

復元時は `is_deleted=false` に戻し、履歴は残す。

---

## API の責務

| 操作 | API |
|------|-----|
| 本人更新導線の取得 | `GET /me/update-link` |
| 公開停止申請 | `POST /me/visibility-request` |
| 退会申請 | `POST /me/delete-request` |
| 公開状態変更 | `PATCH /admin/members/:memberId/status` |
| 削除 | `POST /admin/members/:memberId/delete` |
| 復元 | `POST /admin/members/:memberId/restore` |
| 参加履歴付与 | `POST /admin/meetings/:sessionId/attendance` |
| 参加履歴解除 | `DELETE /admin/meetings/:sessionId/attendance/:memberId` |

本人の本文更新用 `PATCH /profile` や `PATCH /me/profile` は MVP 正式仕様にしない。

---

## 事故防止ルール

1. current response を D1 差分で上書きしない
2. `publicConsent` と `publishState` を混同しない
3. 削除を物理削除にしない
4. GAS prototype のローカル編集挙動を本番仕様にしない
