# data-contract.md（Sheets ↔ D1 契約）

## 0. スコープと前提

- 入力: Google Sheets（Form `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` の回答 sheet）
- 正本: Cloudflare D1（apps/api binding、apps/web からの直接アクセス禁止 / 不変条件 5）
- direction: **Sheets → D1 のみ**（逆方向禁止）
- 対象: Form 31 問 / 6 セクション
- consent キー: `publicConsent` / `rulesConsent` の 2 つに統一（不変条件 2）
- `responseEmail` は Form 項目ではなく system field（不変条件 3）
- admin-managed data は本契約の sync 対象外（不変条件 4）

---

## 1. Sheets schema

Form 連携シートが自動生成する列構造を前提とする。実列名は Form 質問文に依存するため、コードでは「列番号 + ヘッダ文字列」ではなく **`stableKey` mapping** で抽象化する（不変条件 1）。

| カテゴリ | 列 | 備考 |
| --- | --- | --- |
| Form auto | `タイムスタンプ` | submittedAt 相当 |
| Form auto | `メールアドレス` | responseEmail（system field、auto-collected） |
| Form 質問 (31) | section1 basic_profile (6) | fullName / nickname / location / birthDate / occupation / hometown |
| Form 質問 | section2 ubm_profile (7) | ubmZone / ubmMembershipType / ubmJoinDate / businessOverview / skills / challenges / canProvide |
| Form 質問 | section3 personal_profile (4) | hobbies / recentInterest / motto / otherActivities |
| Form 質問 | section4 social_links (11) | urlWebsite/Facebook/Instagram/Threads/Youtube/Tiktok/X/Blog/Note/Linkedin/Others |
| Form 質問 | section5 message (1) | selfIntroduction |
| Form 質問 | section6 consent (2) | publicConsent / rulesConsent |

合計: system 2 + Form 31 = 33 列（順序は Form 連携シートに準拠）。

---

## 2. D1 schema（sync 対象テーブル）

正本は specs/08-free-database.md。本契約の sync worker が書き込むのは以下のテーブルのみ。

### 2.1 `member_responses`（生回答の正規化保存）

```sql
CREATE TABLE IF NOT EXISTS member_responses (
  response_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  response_email TEXT,
  submitted_at TEXT NOT NULL,
  edit_response_url TEXT,
  answers_json TEXT NOT NULL,         -- stableKey -> 正規化値
  raw_answers_json TEXT NOT NULL DEFAULT '{}',
  extra_fields_json TEXT NOT NULL DEFAULT '{}',
  unmapped_question_ids_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL DEFAULT ''
);
```

### 2.2 `member_identities`（stable member）

```sql
CREATE TABLE IF NOT EXISTS member_identities (
  member_id TEXT PRIMARY KEY,
  response_email TEXT NOT NULL UNIQUE,
  current_response_id TEXT NOT NULL,
  first_response_id TEXT NOT NULL,
  last_submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.3 `member_status`（consent snapshot を sync 経由で反映）

sync worker は consent 値（`public_consent` / `rules_consent`）のみを current response から反映する。`publish_state` / `is_deleted` 等の admin 列は **触らない**（不変条件 4）。

### 2.4 `sync_audit`（新規 / 本契約で導入）

```sql
CREATE TABLE IF NOT EXISTS sync_audit (
  audit_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,             -- 'manual' | 'scheduled' | 'backfill'
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,              -- 'running' | 'success' | 'failed'
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_reason TEXT,
  diff_summary_json TEXT NOT NULL DEFAULT '{}'
);
```

---

## 3. mapping table（Sheets 列 → D1）

stableKey は specs/01-api-schema.md に準拠。

### 3.1 system fields（Form 質問外、auto-collected）

| Sheets 列 | D1 保存先 | 型変換 | 備考 |
| --- | --- | --- | --- |
| タイムスタンプ | `member_responses.submitted_at` | ISO8601 文字列 | Form 自動付与 |
| メールアドレス | `member_responses.response_email` / `member_identities.response_email` | 文字列、小文字正規化 | system field（不変条件 3） |
| (Form API) responseId | `member_responses.response_id` (PK) | 文字列 | upsert 冪等キー（不変条件 7） |
| (Form API) editResponseUrl | `member_responses.edit_response_url` | 文字列 | 取得可能時のみ |

### 3.2 Form 質問（31 stableKey）

`answers_json` に `{ [stableKey]: 正規化値 }` 形式で格納する。`raw_answers_json` には Sheets/Form の生値を保持する。

| section | stableKey | 型変換 |
| --- | --- | --- |
| basic_profile | fullName, nickname, location, occupation, hometown | string |
| basic_profile | birthDate | date (YYYY-MM-DD) |
| ubm_profile | ubmZone | enum: `0_to_1` / `1_to_10` / `10_to_100` |
| ubm_profile | ubmMembershipType | enum: `member` / `non_member` / `academy` |
| ubm_profile | ubmJoinDate | string |
| ubm_profile | businessOverview, skills, challenges, canProvide | string (paragraph) |
| personal_profile | hobbies, recentInterest, motto, otherActivities | string |
| social_links | urlWebsite/Facebook/Instagram/Threads/Youtube/Tiktok/X/Blog/Note/Linkedin/Others | url string |
| message | selfIntroduction | string |
| consent | publicConsent, rulesConsent | `ConsentStatus` = `consented` / `declined` / `unknown` |

### 3.3 consent → member_status 反映

current_response_id 更新時に以下を upsert:

| answers_json の値 | member_status |
| --- | --- |
| answers_json.publicConsent | `member_status.public_consent` |
| answers_json.rulesConsent | `member_status.rules_consent` |

`publish_state` / `is_deleted` / `hidden_reason` 等は **sync 対象外**（admin endpoint が writer）。

---

## 4. sync direction

- 唯一の方向: **Sheets → D1**
- 例外なし。D1 → Sheets 書き戻しは行わない
- 復旧時は Sheets を真として backfill（不変条件 7 / AC-4 と整合）

```
Form -> Google Sheets -> sync worker (apps/api) -> D1
                                                 -> sync_audit
```

---

## 5. admin-managed columns 分離（不変条件 4）

| 区分 | テーブル/列 | writer | sync 対象 |
| --- | --- | --- | --- |
| Form 由来 | member_responses 全列 | sync worker | ✅ |
| Form 由来 | member_identities | sync worker | ✅ |
| consent snapshot | member_status.public_consent / rules_consent | sync worker | ✅（current response から） |
| 公開・削除状態 | member_status.publish_state / is_deleted / hidden_reason | apps/api admin endpoint | ❌ |
| 開催日 | meeting_sessions, member_attendance | admin endpoint | ❌ |
| タグ | member_tags, tag_assignment_queue | admin endpoint / rule worker | ❌ |
| 認証 | magic_tokens | apps/api auth | ❌ |

---

## 6. 拡張余地（不変条件 1）

- 未知の Form 質問が現れた場合は `extra_fields_json` に格納し、`unmapped_question_ids_json` に questionId を残す
- `form_field_aliases` で questionId 差し替えを追跡
- mapping table のコード固定は最小限に留め、`stableKey` レジストリ（`form_fields`）駆動とする

---

## 7. AC トレース

| AC | 対応箇所 |
| --- | --- |
| AC-1 | §0 / §4（direction 一意化） |
| AC-2 | §0、本ドキュメントは設計入力。trigger 詳細は sync-flow.md |
| AC-3 | §2.4 sync_audit、§5（admin 列分離は restore 時の保護に寄与） |
| AC-4 | §4 復旧経路 |
| AC-5 | main.md §5 にて根拠記述 |
