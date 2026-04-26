# データ取得・同期・マージ設計

## 役割

このファイルは Google Form の live schema と回答を D1 に正規化し、公開・会員・管理 UI に渡すまでの流れを定義する。

- フォーム構造と回答の正本は Google Forms API
- D1 は表示と運用のための正規化キャッシュ
- 会合・参加履歴・タグキューは Google Form schema 外の admin-managed data
- GAS prototype の `localStorage` は本番データソースにしない
- 実装先は `apps/api` の同期ジョブと `apps/web` の表示モデルであり、D1 は `apps/api` からのみ更新する

---

## データフロー

```text
forms.get
  -> schema normalize
  -> form_manifests / form_fields / form_field_aliases

forms.responses.list
  -> normalize answers
  -> extract responseEmail
  -> upsert member_responses
  -> resolve member identity
  -> pick current response
  -> update consent snapshot
  -> enqueue tag assignment

view builder
  -> current response
  + member_status
  + meeting_sessions / member_attendance
  + member_tags
  -> public/member/admin view model
```

---

## 同期対象

### Google Form 由来

- schema metadata
- 31 項目の回答
- `responseId`
- `responseEmail`
- `submittedAt`
- 取得できる場合は `editResponseUrl`

### D1 由来

- `member_identities`
- `member_status`
- `deleted_members`
- `meeting_sessions`
- `member_attendance`
- `tag_definitions`
- `member_tags`
- `tag_assignment_queue`

---

## schema sync

```text
forms.get
  -> flatten sections and questions
  -> resolve stableKey
  -> compute schemaHash
  -> save manifest
  -> save fields
  -> detect alias / unresolved questions
```

ルール:

1. `stableKey` を基準に UI を構成する
2. `questionId` 変更は alias で吸収する
3. 未解決項目は `extraFields` と管理画面に退避する
4. 31 項目既知セットを壊さない

---

## response sync

```text
forms.responses.list
  -> page through responses
  -> map questionId to stableKey
  -> normalize answersByStableKey
  -> keep rawAnswersByQuestionId
  -> extract responseEmail
  -> save member_responses
```

### response 正規化の原則

1. `responseEmail` を system field として必ず保持する
2. `answersByStableKey` と `rawAnswersByQuestionId` を両方残す
3. 未解決項目は `extraFields` と `unmappedQuestionIds` に残す
4. 回答そのものは削除しない

---

## stable member 解決

同じ人が Google Form を再回答できる前提で、回答とメンバー実体を分ける。

### `member_identities`

| カラム | 説明 |
|--------|------|
| `member_id` | アプリ内の stable ID |
| `response_email` | ログイン照合の主キー |
| `current_response_id` | 現在採用する回答 |
| `first_response_id` | 初回回答 |
| `last_submitted_at` | 最新回答日時 |

### current response 選定ルール

1. 同じ `responseEmail` の回答を時系列で比較する
2. `submittedAt` が最も新しいものを `current_response_id` にする
3. 旧回答は履歴として `member_responses` に残す
4. 管理者は本文を直接修正せず、必要なら再回答を案内する

この設計により、Google Form 再回答を MVP の更新手段にできる。

---

## consent snapshot 更新

`member_status` には current response 由来の consent を反映する。

| 項目 | 由来 |
|------|------|
| `public_consent` | current response の `publicConsent` |
| `rules_consent` | current response の `rulesConsent` |
| `publish_state` | 管理者運用値 |
| `is_deleted` | 管理者運用値 |

公開条件:

1. `public_consent = consented`
2. `publish_state = public`
3. `is_deleted = false`

ログイン条件:

1. `rules_consent = consented`
2. `is_deleted = false`

---

## 会合・参加履歴

`meetingSessions` と `attendance` は Google Form schema に含めない。

```text
meeting_sessions
  <- admin creates

member_attendance
  <- admin adds / removes for member_id
```

この 2 つは GAS prototype の UI を踏襲するが、保存先は D1 であり Form ではない。

---

## タグ付与

```text
current response
  -> rule-based tagging
  -> optional AI suggestion
  -> tag_assignment_queue
  -> admin review
  -> member_tags
```

タグ辞書は初期状態で 6 カテゴリ 30 タグを想定する。
ただし正式な検索対象フィールドは schema と一致させ、`occupation`, `businessOverview`, `skills`, `canProvide`, `challenges`, `recentInterest`, `selfIntroduction` を中心に扱う。

---

## view merge

```text
base = current member response
status = member_status
attendance = member_attendance
tags = member_tags

public view
  -> public fields only

member view
  -> public + member fields
  -> self update CTA
  -> attendance summary

admin view
  -> public + member + admin fields
  -> status controls
  -> tag / schema / meeting tools
```

---

## 削除依頼の扱い

規約上、アプリから削除しても Google 側の元データは残る。

そのため:

1. `is_deleted=true` と `deleted_members` を使ってアプリから除外する
2. `member_responses` の raw data は監査目的で保持する
3. フォーム元データの物理削除はアプリ責務にしない

---

## 事故を防ぐルール

1. `responseEmail` をフォーム項目扱いしない
2. `publicConsent` と `rulesConsent` を混同しない
3. current response と旧 response を上書き破壊しない
4. GAS prototype の `localStorage` を本番保存方式にしない
5. `meeting_sessions` / `member_attendance` を form schema に押し込まない
