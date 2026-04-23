# フォームの質問IDと項目対応表

## 役割

このファイルは Google Form の live schema を、`stableKey` ベースで安全に扱うための基準表です。

- `questionId` は Google Forms API の実 ID
- `itemId` は項目の構造変化を追う補助キー
- `stableKey` はアプリ側の固定キー
- `revisionId` と `schemaHash` の両方で schema version を管理する
- 未解決の質問は削除せず、`extraFields` と admin schema 画面に送る
- Google Form の構造変更に追従する一方で、過去回答は壊さない

---

## フォーム情報

| 項目 | 値 |
|------|-----|
| formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| responderUrl | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` |
| editorUrl | `https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit` |

---

## 取得する schema metadata

`forms.get` で必ず拾う。

- `formId`
- `title`
- `revisionId`
- `items[].itemId`
- `items[].title`
- `items[].description`
- `items[].questionItem.question.questionId`
- `items[].questionItem.question.questionType`
- `items[].questionItem.question.choiceQuestion.options`
- `items[].questionItem.question.validation`
- `items[].pageBreakItem`
- `items[].sectionHeaderItem`

UI の見た目はここから再構成する。
Google Form の並び順やラベル文字列に直接依存しない。

---

## 基本ルール

1. `forms.get` を正本として schema を取得する
2. `questionId` と `itemId` を保存する
3. 画面は `stableKey` を見て生成し、`questionId` 直接参照を避ける
4. `questionId` が変わったら alias で再紐付けする
5. マッピング不能な新項目は `extraFields` と `unmappedQuestionIds` に退避する
6. Google Form の項目順や列順には依存しない
7. `meetingSessions` / `memberAttendance` はこの schema の外で管理する

---

## stableKey 一覧

### セクション1: basic_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `fullName` | お名前（フルネーム） | `shortText` | ✅ | `public` |
| `nickname` | あだ名・ニックネーム | `shortText` | - | `public` |
| `location` | お住まい（都道府県・市区町村） | `shortText` | ✅ | `public` |
| `birthDate` | 生年月日 | `date` | - | `member` |
| `occupation` | 職業・仕事内容 | `shortText` | ✅ | `public` |
| `hometown` | 出身地 | `shortText` | - | `public` |

### セクション2: ubm_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `ubmZone` | UBM区画 | `radio` | ✅ | `public` |
| `ubmMembershipType` | UBM参加ステータス | `radio` | ✅ | `public` |
| `ubmJoinDate` | UBMに入会・参加した時期 | `shortText` | - | `member` |
| `businessOverview` | ビジネス概要 | `paragraph` | ✅ | `public` |
| `skills` | 得意分野・スキル | `paragraph` | - | `public` |
| `challenges` | 現在の課題・相談したいこと | `paragraph` | - | `member` |
| `canProvide` | 提供できること・協力できること | `paragraph` | - | `public` |

### セクション3: personal_profile

| stableKey | 表示名 | kind | visibility |
|-----------|--------|------|------------|
| `hobbies` | 趣味・好きなこと | `shortText` | `public` |
| `recentInterest` | 最近ハマっていること | `shortText` | `public` |
| `motto` | 座右の銘・大切にしている言葉 | `shortText` | `public` |
| `otherActivities` | 仕事以外の活動 | `paragraph` | `public` |

### セクション4: social_links

| stableKey | 表示名 | kind | visibility |
|-----------|--------|------|------------|
| `urlWebsite` | ホームページ URL | `url` | `public` |
| `urlFacebook` | Facebook URL | `url` | `public` |
| `urlInstagram` | Instagram URL | `url` | `public` |
| `urlThreads` | Threads URL | `url` | `public` |
| `urlYoutube` | YouTube URL | `url` | `public` |
| `urlTiktok` | TikTok URL | `url` | `public` |
| `urlX` | X URL | `url` | `public` |
| `urlBlog` | Blog URL | `url` | `public` |
| `urlNote` | note URL | `url` | `public` |
| `urlLinkedin` | LinkedIn URL | `url` | `public` |
| `urlOthers` | その他の SNS・URL | `paragraph` | `public` |

### セクション5: message

| stableKey | 表示名 | kind | visibility |
|-----------|--------|------|------------|
| `selfIntroduction` | 自己紹介・一言メッセージ | `paragraph` | `public` |

### セクション6: consent

| stableKey | 表示名 | kind | required | 用途 |
|-----------|--------|------|:--------:|------|
| `publicConsent` | ホームページへの掲載に同意しますか？ | `radio` | ✅ | 公開可否 |
| `ruleConsent` | 勧誘ルール・免責事項への同意 | `radio` | ✅ | サイト利用可否 |

---

## consent の扱い

- `publicConsent` は一覧・詳細の公開可否にだけ使う
- `ruleConsent` はログイン許可の必須条件にする
- どちらも文言一致ではなく `stableKey` で判定する
- 内部保存値は `ConsentStatus = "consented" | "declined" | "unknown"` に正規化する
- 生の選択肢ラベルは `rawAnswersByQuestionId` に残す

```ts
type ConsentStatus = "consented" | "declined" | "unknown";
```

Google Form 側の文言が「同意する / 同意しない」から変わっても、
同期時に `ConsentStatus` に変換できれば UI と権限制御は壊れない。

---

## schema sync の保存先

```text
form_manifests
  - form_id
  - revision_id
  - schema_hash
  - title
  - state
  - synced_at
  - source_url

form_fields
  - form_id
  - revision_id
  - schema_hash
  - stable_key
  - question_id
  - item_id
  - field_type
  - section_key
  - position
  - required
  - visibility
  - editable_by_member
  - editable_by_admin
  - choice_labels_json
  - normalized_choice_map_json
  - status

form_field_aliases
  - form_id
  - stable_key
  - old_question_id
  - new_question_id
  - old_revision_id
  - new_revision_id
  - detected_at
```

`form_field_aliases` は必須ではないが、`questionId` 置換の吸収に非常に有効。

---

## API レスポンスの正規化

```ts
type NormalizedAnswerValue =
  | string
  | string[]
  | number
  | boolean
  | {
      year: number;
      month: number;
      day: number;
    }
  | null;

type NormalizedMemberResponse = {
  responseId: string;
  formId: string;
  revisionId: string;
  schemaHash: string;
  loginEmail: string | null;
  responseEmail: string | null;
  submittedAt: string;
  answersByStableKey: Record<string, NormalizedAnswerValue>;
  rawAnswersByQuestionId: Record<string, unknown>;
  extraFields: Record<string, unknown>;
  unmappedQuestionIds: string[];
};
```

ここで重要なのは、`answersByStableKey` だけでなく `rawAnswersByQuestionId` と `extraFields` も保持することです。

---

## フォーム変更時の振る舞い

| 変更内容 | 対応 |
|----------|------|
| 質問文変更 | `questionId` が同じなら自動追従 |
| 質問追加 | `extraFields` に保存し、管理者が `stableKey` を確定 |
| 質問削除 | `status = inactive` として保持し、旧回答は残す |
| 選択肢変更 | 新 schema version を作成し、旧値も残す |
| `questionId` 差し替え | alias または再解決ルールで吸収 |
| 質問タイプ変更 | 旧レスポンスを壊さず、新 manifest を作成 |

---

## 実装時の作業

1. `forms.get` で schema を取得する
2. `revisionId` と `schemaHash` を計算する
3. `form_manifests` / `form_fields` に保存する
4. `forms.responses.list` を `questionId -> stableKey` に変換する
5. 未解決項目は `extraFields` に隔離する
6. 管理画面に schema diff と未解決項目を出す

---

## 事故を防ぐルール

1. `questionId` 直書きで UI を組まない
2. `choices[0]` みたいな順序依存をしない
3. `email` を唯一キーとして扱わない
4. 旧 schema の manifest を削除しない
5. 未解決質問を silently ignore しない
6. 公開可否は `publicConsent`、ログイン可否は `ruleConsent` で分ける
