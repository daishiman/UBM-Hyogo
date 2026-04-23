# データ取得の仕組み

## 役割

このファイルは、Google Form の構造変化に追従しながら、表示用データを D1 に正規化して保持するための同期設計です。

- Google Forms API はフォーム構造と生回答の正本
- D1 は `form_manifests` と `form_fields` を使った表示用キャッシュの正本
- Next.js は D1 の manifest だけを見て UI を描画する
- `questionId` が変わっても `stableKey` と schema version で吸収する
- 未解決の回答は消さずに `extraFields` と `unmappedQuestionIds` に退避する

---

## データフロー

```text
Google Forms API
  -> forms.get
  -> forms.responses.list
  -> forms.watches (任意の起点)

sync worker
  -> discover form metadata
  -> build field registry
  -> compute schemaHash
  -> normalize responses
  -> save D1

D1
  -> form_manifests
  -> form_fields
  -> form_field_aliases
  -> member_responses
  -> profile_overrides
  -> member_status
  -> deleted_members
  -> tag_definitions
  -> member_tags

Next.js app
  -> read current manifest
  -> merge profile data
  -> render schema-driven UI
```

Google Forms の `forms.watches` は「変更を知るきっかけ」として使う。
実際の構造判定は必ず `forms.get` で再取得して行う。

---

## 同期の前提

### 1. schema sync

```text
forms.get
  -> extract formId / title / revisionId / items
  -> flatten sections and questions
  -> resolve stableKey
  -> compute schemaHash
  -> upsert manifest
  -> upsert form_fields
  -> record aliases / unresolved items
```

### 2. response sync

```text
forms.responses.list
  -> page through all responses
  -> map questionId to stableKey
  -> keep rawAnswersByQuestionId
  -> keep answersByStableKey
  -> store extraFields and unmappedQuestionIds
  -> save response with schemaHash + revisionId
```

### 3. view merge

```text
member_responses
  + profile_overrides
  + member_status
  + deleted_members
  + tag_definitions
  + member_tags
  -> MemberProfile
```

---

## schema discovery のルール

Google Forms API から拾うべき情報は、回答本文だけではない。

- `formId`
- `title`
- `revisionId`
- `items[].itemId`
- `items[].questionItem.question.questionId`
- `items[].title`
- `items[].description`
- `items[].questionItem.question.questionType`
- `items[].questionItem.question.choiceQuestion.options`
- `items[].questionItem.question.validation`
- `items[].pageBreakItem`
- `items[].sectionHeaderItem`

これらを元に、フォームの section 構造と質問構造を再構成する。

---

## マッピング方針

### 優先順位

1. `questionId`
2. `itemId`
3. `stableKey` の過去 alias
4. それでも解決できなければ `unresolved` として隔離

### 解決できないケース

- 質問が削除された
- 質問タイプが変わった
- 選択肢の意味が変わった
- 同じラベルの質問が複数ある
- セクション移動で一意性が崩れた

この場合でも、回答は捨てずに raw データとして保持する。

---

## manifest と field registry

### form_manifests

- `form_id`
- `revision_id`
- `schema_hash`
- `title`
- `state`
- `synced_at`
- `item_count`
- `unknown_item_count`
- `source_url`

### form_fields

- `form_id`
- `revision_id`
- `schema_hash`
- `stable_key`
- `question_id`
- `item_id`
- `section_key`
- `section_title`
- `label`
- `kind`
- `position`
- `required`
- `visibility`
- `editable_by_member`
- `editable_by_admin`
- `choice_labels_json`
- `normalized_choice_map_json`
- `status`

### form_field_aliases

- `form_id`
- `stable_key`
- `old_question_id`
- `new_question_id`
- `old_revision_id`
- `new_revision_id`
- `detected_at`
- `resolved_by`

`questionId` 置換は例外ではなく想定イベントとして扱う。

---

## response の正規化

```text
raw response
  -> normalize by current manifest
  -> answersByStableKey
  -> rawAnswersByQuestionId
  -> extraFields
  -> unmappedQuestionIds
  -> searchText
```

### 保持する理由

- `answersByStableKey` は UI と検索のため
- `rawAnswersByQuestionId` は再同期と監査のため
- `extraFields` は未対応の追加質問を落とさないため
- `unmappedQuestionIds` は schema 差分の検知のため

### 注意点

- `responseId` を主キーにする
- `email` は識別子ではなく検索キーとして扱う
- 同じ email に複数 response が来る前提で重複検知を入れる

---

## マージロジック

```text
base = member_responses
patch = profile_overrides
status = member_status
deletion = deleted_members
tags = member_tags

merged = apply overrides to current response
         + attach status
         + attach tags
```

### 表示条件

- `member_status.is_public = true` のときだけ公開一覧に表示
- `deleted_members` がある場合は hidden 扱いにする
- `publicConsent = "consented"`
- `ruleConsent = "consented"`

### 本人表示

- `publicConsent` が拒否でも本人は `/profile` で見られる
- ただし `ruleConsent` が拒否ならログイン自体を止める

---

## Google Form 変更への追従ルール

| 変更内容 | 振る舞い |
|----------|----------|
| 質問文の変更 | `questionId` が同じなら自動追従 |
| 質問の追加 | `extraFields` に保持し、管理画面で `stableKey` を採番 |
| 質問の削除 | `form_fields.status = inactive` にして旧回答は保持 |
| 質問の並び替え | `position` の更新のみ |
| 選択肢の変更 | `choice_labels_json` と `normalized_choice_map_json` を更新 |
| `questionId` の置換 | alias 解決または unresolved として保留 |
| 質問タイプの変更 | 既存レスポンスを壊さず、新 schema version を作成 |

### 重要な不変条件

1. 過去回答 payload は削除しない
2. 既存 override は壊さない
3. 旧 schema で取得したレスポンスは旧 manifest で再表示できる
4. UI は manifest に無い項目を勝手に描画しない

---

## フレッシュネスと再検証

| 対象 | 再検証トリガー |
|------|---------------|
| メンバー一覧 | schema sync / response sync |
| メンバー詳細 | response sync / override 更新 |
| 自分のプロフィール | 変更直後に即時再検証 |
| 管理者の schema 画面 | schema sync / alias 解決 |

```text
schema sync
  -> revalidateTag("form-schema")
  -> revalidateTag("member-list")
  -> revalidateTag("member-detail")
```

```text
response sync
  -> revalidateTag("member-list")
  -> revalidateTag("member-detail")
  -> revalidateTag("profile-self")
```

---

## D1 に持つデータ

### schema 系

- `form_manifests`
- `form_fields`
- `form_field_aliases`

### member 系

- `member_responses`
- `profile_overrides`
- `member_status`
- `deleted_members`
- `member_tags`
- `tag_rules`

### admin / operations 系

- `admin_users`
- `sync_jobs`

---

## もし schema が壊れたら

1. まず raw response を保持する
2. UI は最新 manifest で描画を続ける
3. 解決できない質問は admin schema 画面に出す
4. `stableKey` が確定するまで公開表示の一部を非表示にする
5. 旧 manifest は削除しない

この運用により、Google Form の更新があっても表示面と保存面を分離して守れる。
