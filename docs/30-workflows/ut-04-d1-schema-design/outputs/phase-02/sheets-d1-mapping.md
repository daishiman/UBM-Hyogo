# Phase 2: sheets-d1-mapping.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 2 / 13（設計） |
| 出典 | `docs/00-getting-started-manual/google-form/01-design.md`（31 設問 / 6 セクション） |
| 反映先 | `member_responses` / `response_fields` / `response_sections` / `schema_questions` |

## 1. マッピング戦略

不変条件 #1（実フォームの schema をコードに固定しすぎない）に従い、Sheets の列名を D1 列に**直接**マッピングしない。代わりに次の 2 段階で抽象化する。

1. **schema 層**: Forms schema を `schema_questions` に正規化し、各設問に `stable_key`（手動命名・Forms revision 横断で安定）を付与する。
2. **value 層**: 回答値は `response_fields(response_id, stable_key)` に格納する（行 = 設問）。

`member_responses.answers_json` には mapper が組み立てた canonical JSON、`raw_answers_json` には Forms API 生レスポンス、`extra_fields_json` には schema 外フィールドを保管する。

## 2. システムフィールド（Forms 設問ではない）

| Forms 由来 | D1 格納先 | 変換ルール | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| `responseId`（Forms API） | `member_responses.response_id` | そのまま TEXT | YES | PK |
| `formId` 固定値 | `member_responses.form_id` | constant `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` | YES | - |
| 現在 schema revision | `member_responses.revision_id` | sync 時の `schema_versions.revision_id` | YES | - |
| schema hash | `member_responses.schema_hash` | sync 時の `schema_versions.schema_hash` | YES | - |
| respondent email（VERIFIED） | `member_responses.response_email` | lowercase + trim | NO（システムフィールド） | 不変条件 #3: Forms 設問ではなく system field |
| `createTime`（Forms API） | `member_responses.submitted_at` | ISO 8601 TEXT | YES | sort key |
| `respondentUri` | `member_responses.edit_response_url` | そのまま | NO | 本人による再回答の入口 |
| mapper 生成 canonical JSON | `member_responses.answers_json` | mapper output | YES | - |
| Forms API 生 JSON | `member_responses.raw_answers_json` | API レスポンス全体 | YES (DEFAULT '{}') | - |
| schema 外フィールド | `member_responses.extra_fields_json` | schema にない questionId を JSON 化 | YES (DEFAULT '{}') | - |
| 未マップ questionId 配列 | `member_responses.unmapped_question_ids_json` | string[] JSON | YES (DEFAULT '[]') | schema_diff_queue 連携 |
| 検索文字列 | `member_responses.search_text` | answers_json から抽出した space-joined plain text | YES (DEFAULT '') | 部分一致検索用 |

## 3. Forms 設問 → `response_fields` マッピング（31 設問 / 6 セクション）

`response_fields.value_json` には正規化値、`response_fields.raw_value_json` には Forms API 由来の生値を JSON 化して格納する。`stable_key` は schema_questions に登録済の値を使用する（下記は推奨命名・Phase 5 で確定）。

### セクション 1: 基本プロフィール（section_key=`profile_basic`）

| # | 質問文 | 推奨 stable_key | kind | required | 変換ルール |
| --- | --- | --- | --- | --- | --- |
| 1 | お名前（フルネーム） | `full_name` | SHORT_TEXT | YES | trim |
| 2 | あだ名・ニックネーム | `nickname` | SHORT_TEXT | NO | trim |
| 3 | お住まい（都道府県・市区町村） | `residence` | SHORT_TEXT | YES | trim |
| 4 | 生年月日 | `birth_date` | DATE | NO | ISO 8601 date (YYYY-MM-DD) |
| 5 | 職業・仕事内容 | `occupation` | SHORT_TEXT | YES | trim |
| 6 | 出身地 | `hometown` | SHORT_TEXT | NO | trim |

### セクション 2: UBM情報（section_key=`ubm_info`）

| # | 質問文 | 推奨 stable_key | kind | required | 変換ルール |
| --- | --- | --- | --- | --- | --- |
| 7 | UBM区画 | `ubm_segment` | RADIO | YES | choice label そのまま（`0to1` / `1to10` / `10to100`） |
| 8 | UBM参加ステータス | `ubm_status` | RADIO | YES | `member` / `non_member` / `academy` に正規化 |
| 9 | UBM入会・参加時期 | `ubm_joined_at_text` | SHORT_TEXT | NO | trim（自由記述） |
| 10 | ビジネス概要 | `business_summary` | LONG_TEXT | YES | as-is |
| 11 | 得意分野・スキル | `skills` | LONG_TEXT | NO | as-is |
| 12 | 現在の課題・相談したいこと | `current_issues` | LONG_TEXT | NO | as-is |
| 13 | 提供できること・協力できること | `offerings` | LONG_TEXT | NO | as-is |

### セクション 3: あなたを知るための情報（section_key=`personal_info`）

| # | 質問文 | 推奨 stable_key | kind | required | 変換ルール |
| --- | --- | --- | --- | --- | --- |
| 14 | 趣味・好きなこと | `hobbies` | SHORT_TEXT | NO | trim |
| 15 | 最近ハマっていること | `recent_passion` | SHORT_TEXT | NO | trim |
| 16 | 座右の銘 | `motto` | SHORT_TEXT | NO | trim |
| 17 | 仕事以外の活動 | `other_activities` | LONG_TEXT | NO | as-is |

### セクション 4: SNS・Web情報（section_key=`sns_web`, 全任意）

| # | カテゴリ | 推奨 stable_key | kind | 変換ルール |
| --- | --- | --- | --- | --- |
| 18 | Web | `url_homepage` | SHORT_TEXT | trim + URL 形式チェック（不正は raw のみ保存） |
| 19 | Meta系 | `url_facebook` | SHORT_TEXT | 同上 |
| 20 | Meta系 | `url_instagram` | SHORT_TEXT | 同上 |
| 21 | Meta系 | `url_threads` | SHORT_TEXT | 同上 |
| 22 | 動画系 | `url_youtube` | SHORT_TEXT | 同上 |
| 23 | 動画系 | `url_tiktok` | SHORT_TEXT | 同上 |
| 24 | テキスト系 | `url_x` | SHORT_TEXT | 同上 |
| 25 | テキスト系 | `url_blog` | SHORT_TEXT | 同上 |
| 26 | テキスト系 | `url_note` | SHORT_TEXT | 同上 |
| 27 | プロフェッショナル | `url_linkedin` | SHORT_TEXT | 同上 |
| 28 | その他 | `url_others` | LONG_TEXT | as-is |

### セクション 5: メッセージ（section_key=`message`）

| # | 質問文 | 推奨 stable_key | kind | required | 変換ルール |
| --- | --- | --- | --- | --- | --- |
| 29 | 自己紹介・一言メッセージ | `intro_message` | LONG_TEXT | NO | as-is |

### セクション 6: 同意（section_key=`consent`）

| # | 質問文 | 推奨 stable_key | kind | required | 変換ルール |
| --- | --- | --- | --- | --- | --- |
| 30 | ホームページ掲載への同意 | `public_consent` | RADIO | YES | `consented` / `declined` に正規化（不変条件 #2） |
| 31 | 勧誘ルール・免責事項への同意 | `rules_consent` | RADIO | YES | 同上 |

> 不変条件 #2: consent キーは `publicConsent` / `rulesConsent`（snake_case 物理列は `public_consent` / `rules_consent`）に統一。
> Forms 回答時の値は `response_fields` に保管されるが、admin-managed の `member_status` テーブルにも `public_consent` / `rules_consent` を持つ。両者は **mapper が同期** し、`member_status` を canonical な consent 状態として参照する。

## 4. response_sections マッピング

| section_key | section_title | position |
| --- | --- | --- |
| profile_basic | 基本プロフィール | 1 |
| ubm_info | UBM情報 | 2 |
| personal_info | あなたを知るための情報 | 3 |
| sns_web | SNS・Web情報 | 4 |
| message | メッセージ | 5 |
| consent | 同意 | 6 |

## 5. member_identities への派生

response 同期時、mapper は `response_email` を natural key として `member_identities` を upsert する。

| Forms 由来 | D1 列 | 変換ルール |
| --- | --- | --- |
| `member_responses.response_email` | `member_identities.response_email` | 同値 UNIQUE。新規作成時 UUID v4 を `member_id` に採番 |
| 同 email の最新 response | `member_identities.current_response_id` | 最新 `submitted_at` の response_id |
| 同 email の最古 response | `member_identities.first_response_id` | 最古 response_id（不変） |
| 最新 response の submitted_at | `member_identities.last_submitted_at` | ISO 8601 |
| 同期処理時刻 | `member_identities.updated_at` | `datetime('now')` |

## 6. member_status への派生

| 由来 | D1 列 | 変換ルール |
| --- | --- | --- |
| `response_fields[stable_key=public_consent]` | `member_status.public_consent` | `consented` / `declined` / `unknown` に正規化 |
| `response_fields[stable_key=rules_consent]` | `member_status.rules_consent` | 同上 |
| 管理画面操作 | `member_status.publish_state` | `member_only` / `public` / `hidden`（admin-managed） |
| 管理画面操作 | `member_status.is_deleted` | 0/1 |

## 7. 変換のエッジケース

| ケース | 処理方針 |
| --- | --- |
| Sheets 側で空セル | `response_fields.value_json` に NULL を保存。raw も NULL |
| 重複 response（同一 responseId 再受信） | `member_responses.response_id` PK 衝突で no-op upsert（INSERT OR IGNORE） |
| 同一 email の複数 response | `member_identities` を upsert。`current_response_id` のみ更新、`first_response_id` は不変 |
| schema 外 questionId（schema_questions 未登録） | `member_responses.extra_fields_json` に格納し、`unmapped_question_ids_json` に追記、`schema_diff_queue` に enqueue（status='queued', partial UNIQUE で重複防止） |
| 不正 RADIO 値（schema 定義外の choice） | `value_json` に正規化値を入れず、`raw_value_json` のみ保存。`schema_diff_queue` に label として enqueue |
| URL 形式不正 | `value_json` に正規化失敗を示す JSON、`raw_value_json` に raw を保存 |
| consent 値が `consented` / `declined` 以外 | `member_status` 同期時は `unknown` フォールバック |
| Forms API レスポンスから email 欠落 | `response_email` を NULL 許可（Forms 側 VERIFIED 設定で通常欠落しない） |

## 8. mapper 実装側の責務（UT-09 へ引き渡し）

- `schema_questions` を Forms schema sync ジョブで先に正規化しておく（UT-04 はそのテーブル定義のみ提供）。
- response 同期時は `schema_questions[revision_id]` を参照して `questionId → stable_key` を解決する。
- 解決失敗 questionId は `schema_diff_queue` に enqueue。
- 全カラムへの書き込みは `apps/api` に閉じる（不変条件 #5）。

## 9. 不変条件 touched

| # | 不変条件 | マッピング設計内での扱い |
| --- | --- | --- |
| #1 | schema をコードに固定しすぎない | Forms 列名は schema_questions.stable_key で抽象化、コード側は stable_key のみ参照 |
| #2 | consent キーは publicConsent / rulesConsent に統一 | response_fields と member_status の両方で `public_consent` / `rules_consent` を統一使用 |
| #3 | responseEmail は system field | `member_responses.response_email` は system field 列。設問テーブルにはマッピングしない |
| #4 | schema 外データは admin-managed として分離 | publish_state / is_deleted 等は member_status（admin-managed）に隔離 |
| #5 | D1 アクセスは apps/api に閉じる | mapper も `apps/api` に実装（UT-09 で実装、本タスクは契約のみ） |
| #7 | response_id / member_id 別 PK | response_fields PK は (response_id, stable_key)、identities は member_id |
