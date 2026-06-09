---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 1
name: 要件定義
status: completed
implementation_mode: new
task_type: implementation
visual_category: VISUAL
updated: 2026-06-09
---

# Phase 1 — 要件定義（member-data-source-precedence-and-profile-session-fix）

> 本ファイルは SSOT（`_shared-context.md`）を実コードで裏取りした結果を確定させる。
> 矛盾時は SSOT を優先するが、本 Phase の「実コード検証結果（§5）」で SSOT を訂正した箇所は
> 訂正注記として残し、Phase 2 以降はこの訂正後の事実を正本とする。

---

## 1. スコープ（in / out）

### in scope（全 Lane がコード実装を伴う実装仕様書）

| Lane | 責務（単一） | 区分 |
|------|-------------|------|
| **A: データモデル基盤** | L1 override テーブル `member_field_overrides` 新設 + L3 import-once provenance 列を `member_identities` へ追加 + repository | NON_VISUAL |
| **B: 取込（ingestion）是正** | RC-1（Sheets/Form ラベルマップ是正 + Sheets 経路を `response_fields` へ書く構造修正）/ RC-2（consent 実値追加）/ L3 import-once | NON_VISUAL |
| **C: 表示プレシデンス + admin override 書込 API** | 純関数 `resolveFieldValue` projection を list/detail/profile に適用 + `PUT /admin/member-fields/:memberId` 新設 | NON_VISUAL |
| **D: Web UI** | admin 会員詳細でプロフィールフィールド編集（L1 書込・C 経由）+ 公開/会員表示が merged projection を表示することの確認・整え | **VISUAL** |
| **E: /profile セッションエラー修正** | RC-3 の `/me` ステータス正規化 + web エラー分岐是正（会員未登録ユーザー＝管理者等への案内） | NON_VISUAL |

### out of scope

- Google Form の schema 変更・質問追加（不変条件 #1）。
- public read endpoint の**外形契約（レスポンス shape）変更**（projection は内部で変える / AC-6）。
- `apps/web` からの D1 直接アクセス追加（不変条件 #5 / AC-8）。
- 先送り（別 PR / 将来 / バックログ）でのスコープ縮小は禁止（CONST_007）。全 Lane を 1 実装サイクル内で完了する。

---

## 2. 受入条件（AC-1..AC-9・SSOT §8 を実測で確定）

| AC | 内容 | 主担当 Lane | 実測による確定/訂正 |
|----|------|------------|--------------------|
| **AC-1** | 実スプレッドシート（§5.1 実ヘッダー33列）の全項目が正しい stableKey にマップされ **`response_fields` に格納**される（unmapped 0）。 | B | 🔴訂正: 現行 Sheets 経路は `response_fields` に**一切書いていない**（§5.3）。AC-1 は「ラベル一致」だけでなく「`response_fields` への書込経路を新設する」ことを含む。 |
| **AC-2** | `"同意する（掲載OK）"` が `public_consent = consented` に正規化される。`"同意する"` 系の表記揺れを網羅。 | B | 確定（§5.4）。Sheets `CONSENT_MAP` に実値が無い。 |
| **AC-3** | スプレッドシート seed は **対象 member（response_email 単位）が D1 未登録のときだけ**取込む。既存 member には seed で上書きしない（import-once）。provenance 列で取込済みを記録。 | A,B | 確定。provenance 列は `member_identities` へ追加（§5.2 / Phase 2 §2.2）。 |
| **AC-4** | Form 再回答は従来通り snapshot を更新するが、L1 override 済みフィールドの**表示**は override を維持（DEC-4）。 | A,C | 確定。表示プレシデンスは use-case 純関数で完結（projection が override を最優先）。 |
| **AC-5** | admin が本システムで会員プロフィールフィールドを編集すると `member_field_overrides` に保存され、一覧/詳細/マイページの表示で最優先。再同期で消えない。 | A,C,D | 確定。現状プロフィール本文編集 endpoint は**存在しない**（§5.7）→ 新設。 |
| **AC-6** | `/members`・`/members/[id]`・`/profile` が L1>L2/L3 マージ済み projection を表示。public read endpoint の**外形契約は不変**。 | C,D | 確定。list は `response_fields` から `SUMMARY_KEYS` を読む（§5.6）。detail/profile は `listFieldsByResponseId`。projection を override マージで差し替える。 |
| **AC-7** | `/profile` の「セッション情報を取得できませんでした」が解消。member レコードを持たないユーザー（管理者等）には適切分岐（401→ログイン / 会員未登録→案内）。500 汎用エラーで詰まらない。 | E | 🔴訂正: H-1（resolver 500化）は**誤り**。resolver も sessionGuard も member 不在で **401**（§5.8）。500/FAILED は DB 例外か transport 未解決のみ。Lane E は「会員未登録ユーザーは正常系として案内画面に倒す」設計を含む。 |
| **AC-8** | `apps/web` から D1 直接アクセスを追加しない。新規 read は既存 transport 経由。 | 全 | 確定。`fetchAuthed` / `safeServerFetch` 経由（§5.9）。 |
| **AC-9** | 新規/変更コードは focused test（`*.spec.ts`）で RED→GREEN。`pnpm typecheck` / `pnpm lint` / 対象 vitest 緑。HEX 直書き 0。 | 全 | 確定。test suffix は `*.spec.ts` のみ（不変条件 #6）。 |

---

## 3. タスク分類（task classification）

| 項目 | 値 |
|------|-----|
| spec_classification | `implementation_spec`（docs-only ではない・全 Lane code change） |
| visual_category | **VISUAL**（Lane D のみ実 UI 変更 = admin member field editor + 公開/会員表示の確認。他 Lane は NON_VISUAL）|
| Phase 11 区分 | VISUAL（Lane D の admin member-fields editor / 公開一覧・詳細・/profile の merged 表示を screenshot）。capture metadata `status=pending_runtime_visual`（implemented_local_runtime_pending のため PNG 0 で validator PASS）。 |
| 視覚証跡を出す画面 | `/(admin)/admin/members/[id]`（field editor）, `/(public)/members`, `/(public)/members/[id]`, `/profile` |

> **[Feedback 3] 対応**: Phase 1 で記録したこの分類を Phase 11 着手時に必ず参照する。Lane A/B/C/E が NON_VISUAL、Lane D のみ VISUAL。

---

## 4. P50 前提確認チェック

| 確認項目 | 判定 | 対応 |
|----------|------|------|
| current branch に実装が存在する | **No** | `implementation_mode: "new"`。Phase 5 は通常の RED→GREEN 実装。 |
| upstream（main/dev）にマージ済み | No | 未マージ。新規実装。 |
| 前提タスク（依存）が完了済み | N/A | `depends_on: []`。本ワークフロー単独で完結。 |

`implementation_mode = "new"`。

---

## 5. 実コード検証結果（Phase 1 必須ゲート・SSOT 裏取り）

> SSOT §3「重大な実測根拠」を現行コードで再確認した結果。🔴 は SSOT への訂正注記。

### 5.1 実スプレッドシートヘッダー（SSOT §3-1）

SSOT 記載の33列ヘッダーは Google Drive MCP 実取得値として採用（本 Phase ではスプレッドシート再取得は行わず SSOT 値を正本とする）。代表実値: `UBM区画="0→1"`, `UBM参加ステータス="会員"`, `ホームページへの掲載に同意しますか？="同意する（掲載OK）"`, `勧誘ルール・免責事項への同意="同意する"`。

### 5.2 データモデル実測（`migrations/0001_init.sql`, `0002_admin_managed.sql`, `0005_response_sync.sql`）

- `member_identities(member_id PK, response_email NOT NULL UNIQUE, current_response_id NOT NULL, first_response_id NOT NULL, last_submitted_at NOT NULL, created_at, updated_at)` — **provenance 列なし**（`seed_source` / `seed_imported_at` 不在）→ Lane A で追加。
- `member_responses(response_id PK, form_id, revision_id, schema_hash, response_email, submitted_at, edit_response_url, answers_json NOT NULL, raw_answers_json, extra_fields_json, unmapped_question_ids_json, search_text)` — **氏名・職業等の個別列は存在しない**（`answers_json` / `extra_fields_json` のみ）。
- `response_fields(response_id, stable_key, value_json, raw_value_json, PK(response_id, stable_key))` — 表示の正本。
- `member_status(member_id PK, public_consent, rules_consent, publish_state, is_deleted, hidden_reason, last_notified_at, updated_by, updated_at)` — admin-managed。
- 既存 migration 最新番号: **0027**（dev #1167 `0027_audit_log_batchid_index.sql` が land 済）。同番号複数あり（0002/0008/0014/0015/0020 が二重）。新規 migration は **`0028_member_field_overrides.sql`** を採番（0027 は sync-merge で dev と衝突したため 0028 へ繰り上げ）。命名規則は `00NN_snake_case.sql`。

### 5.3 🔴 RC-1 訂正注記（Sheets 経路は SQL レベルで壊れている）

- `sync-sheets-to-d1.ts` の `UPSERT_COLUMNS`（L215-252）は `full_name`, `ubm_zone`, `business_overview` 等の snake_case 列 + `STABLE_KEY.nickname`（=`"nickname"` camelCase）等を混在で **`member_responses` に INSERT** しようとしている。
- しかし `member_responses` DDL（§5.2）には**これらの列が一切存在しない**（ALTER TABLE 追加 migration も無し / grep 0 件）。
- → **Sheets 同期は「存在しない列への INSERT」で SQL エラーになり、1 行も書けない**。SSOT の「`extra_fields_json`/`unmapped` に落ちる」は不正確で、実際は `upsertMembers` 全体が失敗する。
- さらに表示経路（list/detail）は `response_fields` から `stable_key` 単位で読むが、Sheets 経路は `response_fields` に**一切書かない**。
- **結論（Lane B のスコープ拡大）**: ラベルマップ是正だけでは不足。Sheets 経路は ① `member_responses`（`answers_json`/`extra_fields_json` 形式）+ ② `response_fields`（stableKey 単位）+ ③ `member_identities`/`member_status` を、**Form 経路（`processResponse`）と同じ書込モデルに合流させる**設計に変える。詳細は Phase 2 §2.3。

### 5.4 🔴 RC-2 訂正注記（consent map）

`sheets-to-members.ts` の `CONSENT_MAP`（L81-90）は `"同意する"`→consented を持つが、実値 `"同意する（掲載OK）"` を持たない。`mapSheetRows` L143 は `CONSENT_MAP[value.trim().toLowerCase()]` で照合するため、`"同意する（掲載OK）"` は `unknown` 化。`勧誘ルール・免責事項への同意="同意する"` は拾える。Lane B で実値を追加（Phase 2 §2.3）。

### 5.5 🔴 Form 経路 label マップも RC-1 該当（SSOT §3-4 検証）

`packages/integrations/google/src/forms/mapper.ts` の `STABLE_KEY_BY_LABEL`（L53-85）を実ヘッダーと突合した結果、**2 ラベルが不一致**:

| 実ヘッダー（§5.1） | mapper の label | 一致 |
|--------------------|-----------------|------|
| `X（Twitter）URL` | `X URL` | ✗ → slug fallback → `__unknown__` |
| `その他のSNS・URL`（全角スペース無） | `その他の SNS・URL`（全角スペース有） | ✗ → slug fallback |

→ **Form 経路も urlX / urlOthers の 2 フィールドが unknown 化する**。SSOT §3-4 の懸念は実証。Lane B で mapper の label を実ヘッダーに合わせる（または alias 化）。残り 29 ラベルは一致。

> 🔴 訂正: integrations パスは SSOT 記載の `packages/integrations-google` ではなく **`packages/integrations/google/src/forms/mapper.ts`**。`apps/api/src/sync/schema/forms-schema-sync.ts:45 buildLabelToStableKey` が `mapFormSchema` の `f.label`→`f.stableKey` を `KNOWN_KEY_SET` でフィルタしてマップ化（slug fallback は除外）。

### 5.6 表示経路（list / detail / profile）

- 公開一覧 `use-cases/public/list-public-members.ts`: `listFieldsByResponseIds(current_response_id 群)` → `SUMMARY_KEYS`（fullName/nickname/occupation/location/ubmZone/ubmMembershipType）を `response_fields` から読む。`value_json` を JSON.parse。
- 公開詳細 `use-cases/public/get-public-member-profile.ts`: `listFieldsByResponseId(current_response_id)` の全 stableKey + schema_questions + tags + attendance。
- マイページ `routes/me/index.ts` `GET /me/profile` → `buildMemberProfile`（`_shared/builder.ts`）→ `listFieldsByResponseId` + visibility filter。
- いずれも `current_response_id` 経由で `response_fields` を読む。**override マージは use-case / builder 層に純関数を差し込む**（Phase 2 §2.4）。

### 5.7 admin 編集経路（現状）

- `routes/admin/members.ts` は member 詳細 view（`buildAdminMemberDetailView`）と tag 操作・photo・status のみ。**プロフィール本文（氏名/職業等の stableKey 値）を編集する endpoint は存在しない**。→ Lane C で `routes/admin/member-fields.ts` 新設。
- admin route ファイル命名は **kebab-case**（`member-status.ts`, `member-notes.ts`, `member-delete.ts`, `member-notification-pref.ts`, `identity-conflicts.ts`）。→ 新規 `member-fields.ts` は多数派と整合（§7）。

### 5.8 🔴 RC-3 訂正注記（/profile セッションエラー）

- `me-session-resolver.ts` L67: `if (!claims.memberId || !claims.email) return null;` → memberId claim 無は **null → sessionGuard が 401**（500 ではない）。
- `session-guard.ts` L89: `if (!identity || !status) return c.json(errorBody("UNAUTHENTICATED"), 401);` → session の memberId が D1 に無くても **401**。
- `GET /me`（`routes/me/index.ts` L132-147）は session 解決後 `c.get("user")` のみ返す（DB lookup 無）→ session が通れば必ず 200。
- web `profile/page.tsx`: `/me` が 401→`AuthRequiredError`→`/login` redirect、404→「再ログイン」分岐、それ以外→「時間をおいて再読み込み」汎用エラー（L66-74）。
- `safe-fetch.ts`: `FetchAuthedError(status)` は `MEMBER_SESSION_<status>`、transport throw（`transport.ts:40` "API transport unresolved"）は status 無 → `MEMBER_SESSION_FAILED`。
- **結論（RC-3 真因の確定）**: 汎用エラーに至るのは (a) `sessionGuard` 内の DB 例外（`findIdentityByMemberId`/`getStatus`/`findAdminByEmail` の throw）で **500**、または (b) staging で `API_SERVICE` binding も `INTERNAL_API_BASE_URL` も解決できず transport throw → **`MEMBER_SESSION_FAILED`**。H-1（resolver 500化）は否定。**H-2（transport 未解決）と H-3（DB 例外）が候補。Phase 1 実機切り分けは Lane E phase-1 で staging ログ確認（Gate-B 時 user-gated）。設計は両方を fail-safe に倒す**（§Lane E）。
- なお「管理者が member_identities に未登録」のケースは現状 **401→`/login` redirect** に倒れるため「セッション取得不能」汎用エラーには**ならない**。だが UX としては「会員未登録の管理者がログイン済で /profile を見ると login にリダイレクトし続ける」ループになり得るため、Lane E で「会員未登録（401 だが session cookie 有）」を案内画面へ倒す分岐を追加する（Phase 2 §2.6）。

### 5.9 web fetch transport

`authed.ts` → `resolveApiFetch`（service-binding 優先 / baseUrl fallback / local fallback `http://localhost:8787` / 非 local で未解決なら throw）。`safeServerFetch` が code 正規化（`<prefix>_<status>` / `<prefix>_FAILED` / `<prefix>_UNKNOWN`）。新規 read 追加は無し（AC-8 維持）。

### 5.10 stableKey 正本一覧（`packages/shared/src/zod/field.ts`）

`STABLE_KEY`（L70-102）= **camelCase 文字列リテラル**（`STABLE_KEY.nickname === "nickname"`）。31 件:

```
fullName, nickname, location, birthDate, occupation, hometown,         // section1 basic
ubmZone, ubmMembershipType, ubmJoinDate, businessOverview, skills, challenges, canProvide, // section2 ubm
hobbies, recentInterest, motto, otherActivities,                       // section3 personal
urlWebsite, urlFacebook, urlInstagram, urlThreads, urlYoutube, urlTiktok, urlX, urlBlog, urlNote, urlLinkedin, urlOthers, // section4 social
selfIntroduction,                                                       // section5 message
publicConsent, rulesConsent                                            // section6 consent
```

- `response_fields.stable_key` も **camelCase**（`STABLE_KEY` 値そのもの）。
- enum: `UbmZoneZ = ["0_to_1","1_to_10","10_to_100"]`, `UbmMembershipTypeZ = ["member","non_member","academy"]`, consent = `["consented","declined","unknown"]`。
- 🔴 注記: 実スプレッドシート `UBM区画="0→1"` は enum 値 `"0_to_1"` ではない（表示用ラベル）。Sheets/Form 取込時に値ドメイン正規化（`"0→1"→"0_to_1"`, `"会員"→"member"` 等）が必要。これは別ワークフロー `members-search-filter-ux-and-api-fix`（MEMORY 記録）の Lane B スコープと重複し得るが、本タスクでは「`response_fields` への書込が成立すること（AC-1）」を満たせばよく、enum 値正規化は当該 stableKey の `value_json` 生成時に Phase 2 §2.3 のマッピングで行う（zone/status のみ）。

---

## 6. inventory（変更対象ファイル一覧・変更種別）

| # | ファイル | 種別 | Lane | 内容 |
|---|---------|------|------|------|
| 1 | `apps/api/migrations/0028_member_field_overrides.sql` | 新規 | A | `member_field_overrides` テーブル + `member_identities` への `seed_source` / `seed_imported_at` 列追加 |
| 2 | `apps/api/src/repository/memberFieldOverrides.ts` | 新規 | A | override の upsert / delete / list（memberId 単位）|
| 3 | `apps/api/src/repository/identities.ts` | 編集 | A | provenance 列 read/write helper（`markSeedImported` / `getSeedProvenance`）追加 |
| 4 | `apps/api/src/jobs/mappers/sheets-to-members.ts` | 編集 | B | `DB_FIELD_MAP` の key を実ヘッダーへ是正 + `CONSENT_MAP` 実値追加 + zone/status 値正規化 + 出力モデルを `response_fields`/`answers_json` 互換へ変更 |
| 5 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 編集 | B | `upsertMembers` を Form 経路と同じ書込モデル（identity + member_responses(answers_json) + response_fields + status consent）へ変更 + L3 import-once ガード |
| 6 | `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | B | import-once ガード（既存 identity 有なら seed として再取込しない・Form 再回答は従来通り）+ provenance マーク |
| 7 | `packages/integrations/google/src/forms/mapper.ts` | 編集 | B | `STABLE_KEY_BY_LABEL` の `X URL`→`X（Twitter）URL`、`その他の SNS・URL`→`その他のSNS・URL` 是正 |
| 8 | `apps/api/src/use-cases/_shared/field-precedence.ts` | 新規 | C | 純関数 `resolveFieldValue` / `mergeFieldProjection`（L1 override > L2/L3 response_fields）|
| 9 | `apps/api/src/use-cases/public/list-public-members.ts` | 編集 | C | override map を batch 取得し `SUMMARY_KEYS` projection にマージ |
| 10 | `apps/api/src/use-cases/public/get-public-member-profile.ts` | 編集 | C | override map をマージしてから view 組成 |
| 11 | `apps/api/src/repository/_shared/builder.ts` | 編集 | C | `buildMemberProfile` / `buildAdminMemberDetailView` の fields に override マージ |
| 12 | `apps/api/src/routes/admin/member-fields.ts` | 新規 | C | `GET /admin/member-fields/:memberId`（編集可能フィールド一覧 + 現在の override/effective 値）+ `PUT /admin/member-fields/:memberId`（override 書込）|
| 13 | `apps/api/src/routes/admin/_shared.ts` または admin router mount | 編集 | C | 新 route を admin app に mount |
| 14 | `apps/web/app/(admin)/admin/members/[id]/...`（field editor 配置箇所）| 編集 | D | プロフィールフィールド編集 UI（`FormField` + `useAdminMutation` 経由）|
| 15 | `apps/web/src/components/admin/MemberFieldEditor.tsx` | 新規 | D | override 編集フォーム（`FormField` primitive 再利用）|
| 16 | `apps/web/src/lib/api/admin/*`（admin client）| 編集 | D | `PUT /admin/member-fields/:memberId` 呼び出し client（既存 admin client パターン踏襲）|
| 17 | `apps/api/src/routes/me/index.ts` | 編集 | E | `/me/profile` の 404（PROFILE_UNAVAILABLE）と「会員未登録」を区別する応答整理 |
| 18 | `apps/api/src/middleware/session-guard.ts` | 編集 | E | DB 例外を 500 で漏らさず、member 不在を 401（既存維持）+ 会員未登録専用コードの導入余地 |
| 19 | `apps/web/app/(member)/profile/page.tsx` | 編集 | E | 汎用「セッション取得不能」を、会員未登録（401 + cookie 有）案内 / transport 失敗 / 500 で分岐 |
| 20 | `apps/web/src/lib/fetch/transport.ts` | 編集（必要時） | E | transport 未解決時のエラーコードを `safeServerFetch` が識別できる形へ（fail-safe 文言）|

> 🔴 注記: SSOT の想定パス `apps/api/src/use-cases/public/...` に直接 override をマージする案だったが、実コードでは `builder.ts` を経由する `/me/profile` と `get-public-member-profile.ts` で読み方が異なるため、**純関数 `field-precedence.ts` を 1 つ作り、3 箇所（list use-case / detail use-case / builder）から呼ぶ**形に確定（#8-11）。
> 🔴 注記: SSOT の `apps/web/src/components/admin/MemberFieldEditor.tsx` を採用（admin component 命名は PascalCase 多数派）。SSOT の `packages/integrations-google/src/form-schema-mapper.ts` は実体 `packages/integrations/google/src/forms/mapper.ts` に訂正（#7）。

---

## 7. 命名規則記録（FB-SDK-07-4 / FB-01）

| 対象 | 実測した多数派 | 新規命名 | 整合 |
|------|----------------|----------|------|
| repository ファイル | **camelCase**（`memberPhotos.ts`, `memberTags.ts`, `responseFields.ts`, `adminNotes.ts`, `schemaAliases.ts`）。例外: `attendance-analytics.ts`, `identity-conflict.ts`, `identity-merge.ts`（kebab）。多数派は camelCase。 | `memberFieldOverrides.ts` | ✅ camelCase 多数派と整合 |
| use-case 共通純関数 | `use-cases/_shared/` 既存。ファイルは kebab（例: `search-query-parser.ts`, `pagination.ts`）が多い | `field-precedence.ts` | ✅ kebab と整合 |
| admin route ファイル | **kebab-case**（`member-status.ts`, `member-notes.ts`, `member-delete.ts`, `identity-conflicts.ts`）| `member-fields.ts` | ✅ kebab と整合 |
| migration | `00NN_snake_case.sql`（最新 0026・複数二重番号あり）| `0028_member_field_overrides.sql` | ✅ 採番衝突回避（0027 は dev #1167 audit_log_batchid_index が使用済のため 0028 へ採番）|
| admin web component | **PascalCase**（`apps/web/src/components/admin/` 配下）| `MemberFieldEditor.tsx` | ✅ 整合 / 不変条件 #9 = `<input>` 直書き禁止 → `FormField` 経由 |
| admin mutation hook | `@/features/admin/hooks/useAdminMutation`（不変条件 #10・legacy `@/lib/useAdminMutation` 禁止）| 既存 hook 再利用 | ✅ |

---

## 8. targeted vitest ファイルリスト（[FB-UI-02-2] / 全件 run 回避）

> 全件 `pnpm test` の SIGKILL を避け、対象ファイルを Phase 1 で事前列挙する。
> web vitest は repo root が vitest root のため `--root ../..` 必須（SSOT §9・memory 既知）。

### API（`cd apps/api`）
```
mise exec -- pnpm vitest run \
  src/repository/memberFieldOverrides.spec.ts \
  src/repository/identities.spec.ts \
  src/jobs/mappers/sheets-to-members.spec.ts \
  src/jobs/sync-sheets-to-d1.spec.ts \
  src/jobs/sync-forms-responses.spec.ts \
  src/use-cases/_shared/field-precedence.spec.ts \
  src/use-cases/public/list-public-members.spec.ts \
  src/use-cases/public/get-public-member-profile.spec.ts \
  src/repository/_shared/builder.spec.ts \
  src/routes/admin/member-fields.contract.spec.ts \
  src/routes/me/index.contract.spec.ts \
  src/middleware/session-guard.spec.ts
```
（新規 `*.spec.ts` は対象ファイルと同階層に置く。既存 `*.contract.spec.ts` 命名に合流。）

### packages（`cd packages/integrations/google`）
```
mise exec -- pnpm vitest run src/forms/mapper.spec.ts
```

### web（`cd apps/web`、`--root ../..` 必須）
```
mise exec -- pnpm vitest run \
  app/\(member\)/profile \
  src/components/admin/MemberFieldEditor.spec.tsx \
  --root ../..
```

### migration 検証（user-gated）
```
bash scripts/cf.sh d1 migrations list <db>   # 0028 が表示されること
# SELECT で member_field_overrides / member_identities.seed_source 列存在確認（Phase 4 に SQL 記載）
```

---

## 9. carry-over 確認（前タスク棚卸し）

直近コミット（`git log --oneline`）は tag catalog / 物理削除 / member_tags 整合ガード / Sentry noise 等。本タスクの member data source precedence / profile session fix と**重複なし**。`member_field_overrides` テーブル名・`field-precedence.ts`・`member-fields.ts` route はいずれも既存に存在しない（grep 0 件）= 新規作成で衝突なし。

---

## 10. 不変条件遵守チェック（CLAUDE.md）

| # | 条件 | 本タスクでの遵守 |
|---|------|------------------|
| #1 | 実フォーム schema をコードに固定しすぎない | ラベルマップ是正は実ラベル準拠 + Phase 2 で alias/questionId 駆動を検討（§Phase2 §2.3）|
| #2 | consent キー = publicConsent / rulesConsent | 維持（stableKey 経由）|
| #3 | responseEmail = system field | 維持（identity / member_responses.response_email）|
| #4 | admin-managed data 分離 | L1 override は Form schema 外テーブル `member_field_overrides` に隔離 |
| #5 | D1 直接アクセスは apps/api に閉じる | 維持（web は fetchAuthed 経由のみ・AC-8）|
| #6 | 新規 test は `*.spec.ts` のみ | 遵守（§8）|
| #7 | MVP は Form 再回答を本人更新の正式経路 | L2 = Form 再回答として包含（DEC-3）|
| #9/#10 | admin form input = FormField / mutation = useAdminMutation | Lane D 遵守（§7）|
