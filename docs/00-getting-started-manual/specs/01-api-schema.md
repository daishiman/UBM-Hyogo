# フォーム schema と項目定義

## 役割

このファイルは Google Form の live schema を `stableKey` ベースで扱うための正本です。

- 実フォームは 31 項目・6 セクション
- formId は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
- メールはフォーム項目ではなく Google が自動収集する `responseEmail`
- admin-managed data はこの schema の外で持つ
- 実装先は `apps/web` の表示と `apps/api` の同期処理であり、D1 への直接参照は `apps/api` に閉じる

---

## フォーム情報

| 項目 | 値 |
|------|-----|
| formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| responderUrl | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` |
| editorUrl | `https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit` |
| sectionCount | `6` |
| questionCount | `31` |

---

## system fields

以下はフォーム UI 上の質問ではないが、アプリで保持する system fields:

| key | source | 説明 |
|-----|--------|------|
| `responseId` | Forms API response | 回答単位の ID |
| `responseEmail` | Google auto-collected | 回答者の verified email |
| `submittedAt` | Forms API response | 回答送信日時 |
| `lastSubmittedAt` | derived | 同一メンバーの最新回答日時 |
| `editResponseUrl` | available when obtained | 再編集導線に使う候補 |
| `revisionId` | Forms API form | schema 版管理 |
| `schemaHash` | app derived | schema fingerprint |

`responseEmail` は form field として定義しない。認証照合と stable member 解決に使う。

---

## visibility ルール

| 値 | 意味 |
|----|------|
| `public` | 未ログインでも表示可能 |
| `member` | ログイン済み会員と管理者のみ表示 |
| `admin` | 管理者のみ表示 |

visibility は field 単位の表示制御であり、メンバー全体の公開状態は `publishState` で別管理する。

---

## セクション1: basic_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `fullName` | お名前（フルネーム） | `shortText` | ✅ | `public` |
| `nickname` | あだ名・ニックネーム | `shortText` | - | `public` |
| `location` | お住まい（都道府県・市区町村） | `shortText` | ✅ | `public` |
| `birthDate` | 生年月日 | `date` | - | `member` |
| `occupation` | 職業・仕事内容 | `shortText` | ✅ | `public` |
| `hometown` | 出身地 | `shortText` | - | `public` |

## セクション2: ubm_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `ubmZone` | UBM区画 | `radio` | ✅ | `public` |
| `ubmMembershipType` | UBM参加ステータス | `radio` | ✅ | `public` |
| `ubmJoinDate` | UBMに入会・参加した時期 | `shortText` | - | `member` |
| `businessOverview` | ビジネス概要 | `paragraph` | ✅ | `public` |
| `skills` | 得意分野・スキル | `paragraph` | - | `public` |
| `challenges` | 現在の課題・相談したいこと | `paragraph` | - | `member` |
| `canProvide` | 提供できること・協力できること | `paragraph` | - | `public` |

`ubmZone` の正規化候補:

- `0_to_1`
- `1_to_10`
- `10_to_100`

`ubmMembershipType` の正規化候補:

- `member`
- `non_member`
- `academy`

## セクション3: personal_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `hobbies` | 趣味・好きなこと | `shortText` | - | `public` |
| `recentInterest` | 最近ハマっていること | `shortText` | - | `public` |
| `motto` | 座右の銘・大切にしている言葉 | `shortText` | - | `public` |
| `otherActivities` | 仕事以外の活動 | `paragraph` | - | `public` |

## セクション4: social_links

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `urlWebsite` | ホームページ URL | `url` | - | `public` |
| `urlFacebook` | Facebook URL | `url` | - | `public` |
| `urlInstagram` | Instagram URL | `url` | - | `public` |
| `urlThreads` | Threads URL | `url` | - | `public` |
| `urlYoutube` | YouTube URL | `url` | - | `public` |
| `urlTiktok` | TikTok URL | `url` | - | `public` |
| `urlX` | X URL | `url` | - | `public` |
| `urlBlog` | ブログ URL | `url` | - | `public` |
| `urlNote` | note URL | `url` | - | `public` |
| `urlLinkedin` | LinkedIn URL | `url` | - | `public` |
| `urlOthers` | その他の SNS・URL | `paragraph` | - | `public` |

## セクション5: message

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `selfIntroduction` | 自己紹介・一言メッセージ | `paragraph` | - | `public` |

## セクション6: consent

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `publicConsent` | ホームページへの掲載に同意しますか？ | `radio` | ✅ | `admin` |
| `rulesConsent` | 勧誘ルール・免責事項への同意 | `radio` | ✅ | `admin` |

consent キーは `publicConsent` と `rulesConsent` に統一する。`ruleConsent` は使用しない。

---

## consent の扱い

```ts
type ConsentStatus = "consented" | "declined" | "unknown";
```

- `publicConsent`
  - 公開一覧・詳細への掲載可否に使う
- `rulesConsent`
  - ログイン許可の必須条件に使う
- 元の選択肢文言は `rawAnswersByQuestionId` に保持する
- choice の表示文言が変わっても `stableKey` と正規化値で吸収する

---

## schema 外の admin-managed data

以下は Google Form schema に含めない:

| key | 管理場所 | 説明 |
|-----|----------|------|
| `memberId` | D1 `member_identities` | stable member entity |
| `currentResponseId` | D1 `member_identities` | 現在採用する回答 |
| `publishState` | D1 `member_status` | `public` / `member_only` / `hidden` |
| `isDeleted` | D1 `member_status` | アプリ上の論理削除 |
| `meetingSessions` | D1 `meeting_sessions` | 開催日 |
| `attendance` | D1 `member_attendance` | 参加履歴 |
| `tags` | D1 `member_tags` | 付与済みタグ |
| `tagSource` | D1 `member_tags` | `rule` / `ai` / `manual` |
| `tagAssignmentStatus` | D1 `tag_assignment_queue` | 手動確認待ち状態 |

---

## API health contract: GET /health/db

`GET /health/db` は API Worker から D1 binding に `SELECT 1` を実行し、UT-06 AC-4 の API 経由 D1 smoke を可能にするための health endpoint である。D1 への直接アクセスは `apps/api` に閉じ、`apps/web` から D1 binding を参照しない。

### Request

| 項目 | 値 |
|------|-----|
| Method | `GET` |
| Path | `/health/db` |
| Header | `X-Health-Token: <HEALTH_DB_TOKEN>` |
| 外周制御 | Cloudflare WAF allowlist + rate limit |

### Response

| 状況 | Status | Body | Headers |
|------|--------|------|---------|
| D1 疎通成功 | `200` | `{ "ok": true, "db": "ok", "check": "SELECT 1" }` | `Content-Type: application/json` |
| token 欠落 / 誤値（WAF allowlist 内） | `401` | `{ "ok": false, "error": "unauthorized" }` | - |
| WAF allowlist 外 / rate limit | `403` | Cloudflare WAF response | Cloudflare WAF response |
| token 未設定 / D1 binding 欠落 / D1 失敗 | `503` | `{ "ok": false, "db": "error", "error": "<Error.name>" }` | `Retry-After: 30` |

`HEALTH_DB_TOKEN` は Cloudflare Secrets で管理し、実値をドキュメントやログに残さない。運用手順は `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md` を正とする。

---

## schema sync で取得する metadata

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

---

## 保存ルール

1. UI は `stableKey` を参照して描画する
2. `questionId` 直書きの UI を作らない
3. 未解決の追加質問は `extraFields` として保持する
4. 過去 manifest は削除しない
5. 31 項目の既知項目と schema 外データを混同しない

## schema alias assignment API（07b）

`GET /admin/schema/diff` は `recommendedStableKeys: string[]` を同梱する。`POST /admin/schema/aliases?dryRun=true` は DB / queue / audit に副作用を出さず、影響件数と collision 有無だけを返す。apply は `schema_questions.stable_key` 更新、任意 `schema_diff_queue.status='resolved'`、`response_fields.stable_key='__extra__:<questionId>'` の back-fill、`audit_log.action='schema_diff.alias_assigned'` を実行する。

collision は 422、diff 不在は 404、diff と question 不一致は 409。大規模 back-fill / UNIQUE index / retryable HTTP contract は `docs/30-workflows/unassigned-task/UT-07B-schema-alias-hardening-001.md` に分離する。
