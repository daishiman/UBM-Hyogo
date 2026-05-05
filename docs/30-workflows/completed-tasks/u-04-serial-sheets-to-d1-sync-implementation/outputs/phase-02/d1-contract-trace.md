# d1-contract-trace.md（data-contract.md mapping ↔ mapping.ts 1:1 trace）

> 状態: completed-design
> 上位仕様: `../../phase-02.md`
> 入力: 03 contract `outputs/phase-02/data-contract.md`、specs/01-api-schema.md
> 用途: AC-8 contract test の入力（差分ゼロを証明する黄金表）

## 1. system fields 対応（data-contract.md §3.1）

| Sheets 列 | mapping.ts 関数 | 出力プロパティ | D1 列 | 型変換 / 検証 |
| --- | --- | --- | --- | --- |
| タイムスタンプ | `parseTimestamp` | `submittedAt` | `member_responses.submitted_at` | ISO8601 文字列化、Sheets の `YYYY/MM/DD HH:mm:ss` 形式を ISO に変換 |
| メールアドレス | `normalizeEmail` | `responseEmail` | `member_responses.response_email` / `member_identities.response_email` | `String.toLowerCase()` + trim、空文字は `null` 扱い |
| (Form API) responseId | passthrough | `responseId` | `member_responses.response_id` (PK) | 文字列、UUID 風（既存 `apps/api/src/jobs/mappers/sheets-to-members.ts` に準拠） |
| (Form API) editResponseUrl | passthrough（取得可能時のみ）| `editResponseUrl` | `member_responses.edit_response_url` | URL 文字列、Sheets には無いため Forms API 補完時のみ |

## 2. Form 質問 31 件対応（data-contract.md §3.2）

| section | stableKey | mapping.ts 関数 | 出力先 | 型変換 / 検証 |
| --- | --- | --- | --- | --- |
| basic_profile | `fullName` | `mapBasicProfile.fullName` | `answers_json.fullName` | string、trim |
| basic_profile | `nickname` | `mapBasicProfile.nickname` | `answers_json.nickname` | string、trim |
| basic_profile | `location` | `mapBasicProfile.location` | `answers_json.location` | string |
| basic_profile | `birthDate` | `mapBasicProfile.birthDate` | `answers_json.birthDate` | `YYYY-MM-DD` 形式に正規化 |
| basic_profile | `occupation` | `mapBasicProfile.occupation` | `answers_json.occupation` | string |
| basic_profile | `hometown` | `mapBasicProfile.hometown` | `answers_json.hometown` | string |
| ubm_profile | `ubmZone` | `mapUbmProfile.ubmZone` | `answers_json.ubmZone` | enum: `0_to_1` / `1_to_10` / `10_to_100`、未知値は `unknown` |
| ubm_profile | `ubmMembershipType` | `mapUbmProfile.ubmMembershipType` | `answers_json.ubmMembershipType` | enum: `member` / `non_member` / `academy` |
| ubm_profile | `ubmJoinDate` | `mapUbmProfile.ubmJoinDate` | `answers_json.ubmJoinDate` | string |
| ubm_profile | `businessOverview` | `mapUbmProfile.businessOverview` | `answers_json.businessOverview` | string (paragraph) |
| ubm_profile | `skills` | `mapUbmProfile.skills` | `answers_json.skills` | string |
| ubm_profile | `challenges` | `mapUbmProfile.challenges` | `answers_json.challenges` | string |
| ubm_profile | `canProvide` | `mapUbmProfile.canProvide` | `answers_json.canProvide` | string |
| personal_profile | `hobbies` | `mapPersonalProfile.hobbies` | `answers_json.hobbies` | string |
| personal_profile | `recentInterest` | `mapPersonalProfile.recentInterest` | `answers_json.recentInterest` | string |
| personal_profile | `motto` | `mapPersonalProfile.motto` | `answers_json.motto` | string |
| personal_profile | `otherActivities` | `mapPersonalProfile.otherActivities` | `answers_json.otherActivities` | string |
| social_links | `urlWebsite` | `mapSocialLinks.urlWebsite` | `answers_json.urlWebsite` | URL 文字列、空は `null` |
| social_links | `urlFacebook` | `mapSocialLinks.urlFacebook` | `answers_json.urlFacebook` | URL 文字列 |
| social_links | `urlInstagram` | `mapSocialLinks.urlInstagram` | `answers_json.urlInstagram` | URL 文字列 |
| social_links | `urlThreads` | `mapSocialLinks.urlThreads` | `answers_json.urlThreads` | URL 文字列 |
| social_links | `urlYoutube` | `mapSocialLinks.urlYoutube` | `answers_json.urlYoutube` | URL 文字列 |
| social_links | `urlTiktok` | `mapSocialLinks.urlTiktok` | `answers_json.urlTiktok` | URL 文字列 |
| social_links | `urlX` | `mapSocialLinks.urlX` | `answers_json.urlX` | URL 文字列 |
| social_links | `urlBlog` | `mapSocialLinks.urlBlog` | `answers_json.urlBlog` | URL 文字列 |
| social_links | `urlNote` | `mapSocialLinks.urlNote` | `answers_json.urlNote` | URL 文字列 |
| social_links | `urlLinkedin` | `mapSocialLinks.urlLinkedin` | `answers_json.urlLinkedin` | URL 文字列 |
| social_links | `urlOthers` | `mapSocialLinks.urlOthers` | `answers_json.urlOthers` | URL 文字列 |
| message | `selfIntroduction` | `mapMessage.selfIntroduction` | `answers_json.selfIntroduction` | string |
| consent | `publicConsent` | `mapConsent.publicConsent` | `answers_json.publicConsent` + `member_status.public_consent` | enum: `consented` / `declined` / `unknown`、不変条件 #2 |
| consent | `rulesConsent` | `mapConsent.rulesConsent` | `answers_json.rulesConsent` + `member_status.rules_consent` | 同上 |

合計: 31 stableKey（basic 6 + ubm 7 + personal 4 + social 11 + message 1 + consent 2）。

## 3. 拡張余地（不変条件 #1）

| 入力 | mapping.ts 関数 | 出力先 | 補足 |
| --- | --- | --- | --- |
| 未知 questionId | `collectExtras` | `member_responses.extra_fields_json` + `unmapped_question_ids_json` | schema diff queue 連携は本タスク対象外（03b owner） |
| `form_field_aliases` | `resolveAlias` | header → stableKey | reader 接続、コード固定禁止 |

## 4. consent 反映（data-contract.md §3.3）

| 経路 | mapping.ts | upsert.ts SQL（概念） |
| --- | --- | --- |
| `answers_json.publicConsent` | `mapConsent.publicConsent` | `INSERT INTO member_status(member_id, public_consent) ... ON CONFLICT(member_id) DO UPDATE SET public_consent=excluded.public_consent`（admin 列 publish_state / is_deleted は更新句に含めない）|
| `answers_json.rulesConsent` | `mapConsent.rulesConsent` | 同上、`rules_consent` 列のみ |

**admin 列ガード**: `publish_state` / `is_deleted` / `hidden_reason` は SQL の更新句に含まれない（AC-4 / 不変条件 #4）。

## 5. admin-managed 列分離（data-contract.md §5）

sync writer が **書かない / 削除しない** テーブル / 列:

| テーブル | 列 | writer |
| --- | --- | --- |
| `member_status` | `publish_state`, `is_deleted`, `hidden_reason` | apps/api admin endpoint |
| `meeting_sessions` | 全列 | apps/api admin endpoint |
| `member_attendance` | 全列 | apps/api admin endpoint |
| `member_tags` | 全列 | apps/api admin / rule worker |
| `tag_assignment_queue` | 全列 | apps/api admin / rule worker |
| `magic_tokens` | 全列 | apps/api auth |

backfill flow は `member_responses` / `member_identities` を truncate するが、上記テーブル / 列には **DELETE / UPDATE / INSERT のいずれも行わない**。Phase 4 で contract test / lint で検証。

## 6. AC-8 contract test 入力

本ファイルの §1〜§4 表は AC-8 contract test の **黄金表（golden table）** として扱う。Phase 4 でテスト戦略を立て、Phase 5 / 8 で以下を検証する:

- 31 stableKey すべてに対する mapping ゴールデンケース（正常 + 境界値 + 未知値）
- consent enum 3 値 × 2 キー の正規化
- system fields の小文字化 / ISO8601 化
- 未知 questionId の `extra_fields_json` 退避

## 7. AC trace

| AC | 反映箇所 |
| --- | --- |
| AC-4 | §5（admin 列ガード）|
| AC-6 | §1（responseId PK）|
| AC-8 | §1〜§4（mapping 1:1）+ §6 contract test 入力 |
| AC-11 | §2 consent 行 |
| 不変条件 #1 | §3 拡張余地 |
| 不変条件 #3 | §1 responseEmail = system field |
