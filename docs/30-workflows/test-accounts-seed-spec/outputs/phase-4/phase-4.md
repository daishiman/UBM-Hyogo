# Phase 4 — テスト作成

本 Phase は TDD の RED 局面。実コードを書く前に、SSOT カタログ・純粋ジェネレータ・committed 生成物（seed/cleanup SQL・manifest）が満たすべき不変条件を `*.spec.ts` として固定する。各テストは「外部入力（カタログ定数 / 生成 SQL 文字列 / manifest JSON）」と「内部状態（in-memory D1 に投入後の行数・ゲーティング判定結果）」を明確に分離して assert する。

## 1. テストファイル一覧

| パス | 種別 | 実行系 | 検証対象 |
|------|------|--------|----------|
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 新規 | unit（`vitest.config.ts`・D1 不要） | SSOT カタログ定数の不変条件（件数・prefix・email ドメイン・一意性・ゲーティング期待件数） |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 新規 | unit（`vitest.config.ts`・D1 不要） | 純粋ジェネレータ `buildTestAccountsSeed(catalog)` の出力（SQL 構造・冪等構文・escape・manifest 整合） |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 新規 | D1（`vitest.d1.config.ts`・`setupD1()` 経由） | committed 生成物の drift guard ＋ in-memory D1 へ seed 適用後のゲーティング期待値・冪等性・cleanup 検証 |

- D1 を使う spec（`test-accounts-seed.contract.spec.ts`）は先頭に `// @vitest-environment node` を付与し、`apps/api/src/repository/__tests__/_setup.ts` の `setupD1()` / `InMemoryD1` を import する。実行コマンド: `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts`（`vitest.d1.config.ts` はリポジトリルート）。
- D1 不要の 2 spec は通常の `pnpm --filter @ubm-hyogo/api exec vitest run` で実行する。

## 2. テストケース設計

### catalog.spec.ts（SSOT カタログ不変条件）

| ID | 対象 | 入力（外部） | 期待（内部状態） |
|----|------|-------------|-----------------|
| TC-CAT-01 | 件数の固定 | `TEST_MEMBERS` / `TEST_ADMINS` / `TEST_MEETINGS` 配列長 | `TEST_MEMBERS.length === 10` ∧ `TEST_ADMINS.length === 3` ∧ `TEST_MEETINGS.length === 3` |
| TC-CAT-02 | id prefix 規約 | 全 member の `memberId`、全 admin の `adminId`、全 meeting の `sessionId` | member は `/^TEST-MEM-\d{2}$/`、admin は `/^TEST-ADM-\d{2}$/`、meeting は `/^TEST-MTG-\d{2}$/` に全件マッチ |
| TC-CAT-03 | email ドメイン規約 | 全 member / 全 admin の `email` | 全件が `/@test\.ubm-hyogo\.invalid$/` で終わる（RFC 2606 予約 TLD `.invalid`） |
| TC-CAT-04 | id / email の一意性 | member+admin の `id`（13 件）と `email`（13 件）を Set 化 | `new Set(ids).size === 13` ∧ `new Set(emails).size === 13`（重複なし） |
| TC-CAT-05 | ログイン可否ゲートの内訳 | 各 member の `rulesConsent` / `isDeleted` から導出した `loginable`（`rulesConsent==="consented" && isDeleted===0`） | `loginable===true` が 7 件（MEM-01,02,03,06,07,09,10）、`false` が 3 件（MEM-04 rules_declined / MEM-05 deleted / MEM-08 unknown） |
| TC-CAT-06 | 公開ディレクトリ掲載件数 | 各 member の `publicConsent` / `publishState` / `isDeleted`（`publicConsent==="consented" && publishState==="public" && isDeleted===0`） | 掲載対象が 5 件（MEM-01,06,07,09,10） |
| TC-CAT-07 | publish_state の内訳 | 各 member の `publishState` | `public` 6 件（01,05,06,07,09,10）・`member_only` 3 件（02,04,08）・`hidden` 1 件（03） |
| TC-CAT-08 | 削除済み member の整合 | `isDeleted===1` の member | ちょうど 1 件（MEM-05）。その member は `deletedReason` が非空文字列を持つ（`deleted_members` 行投入のため） |
| TC-CAT-09 | 表示名の `[TEST]` 接頭 | 各 member の `answers.fullName` | 全件が `[TEST] ` で始まる（画面上の判別） |
| TC-CAT-10 | admin の active 内訳 | 各 admin の `active` | `active===1` が 2 件（ADM-01,02）・`active===0` が 1 件（ADM-03） |
| TC-CAT-11 | actor 定数 | `SEED_ACTOR` 定数 | `=== "seed:test-accounts"`（cleanup 対象限定キー） |
| TC-CAT-12 | タグ参照が既存 master 限定 | 全 member の `tags[]` に列挙された tag code | すべて既知の `tag_definitions.code` 集合（`tag_b_*` / `tag_s_*` / `tag_r_*` / `tag_ro_*` / `tag_i_*` / `tag_st_*` の 41 件）に含まれる（新規タグ定義を作らない） |

### build-seed-sql.spec.ts（純粋ジェネレータ出力）

ジェネレータは `const { seedSql, cleanupSql, manifest } = buildTestAccountsSeed({ members: TEST_MEMBERS, admins: TEST_ADMINS, meetings: TEST_MEETINGS })` の形で SSOT カタログを受け取る純関数。

| ID | 対象 | 入力（外部） | 期待（内部状態） |
|----|------|-------------|-----------------|
| TC-BUILD-01 | トランザクション境界 | `seedSql` 文字列 | `BEGIN TRANSACTION;` を 1 回含み、末尾側に `COMMIT;` を 1 回含む。`cleanupSql` も同様に `BEGIN TRANSACTION;` … `COMMIT;` を含む |
| TC-BUILD-02 | 冪等 INSERT 構文 | `seedSql` 文字列 | `member_status` / `member_identities` / `member_responses` / `admin_users` / `meeting_sessions` / `member_attendance` / `member_tags` / `member_photos` / `deleted_members` への INSERT がすべて `INSERT OR REPLACE INTO` で始まる（再適用で件数不変にするため。生 `INSERT INTO` が 0 件） |
| TC-BUILD-03 | manifest がカタログと整合 | `manifest.accounts` | 配列長 13。各要素が `{ id, email, role, loginable, public, isAdmin }` を持ち、`role==="member"` 10 件・`role==="admin"` 3 件。`loginable===true` 7 件・`public===true` 5 件（TC-CAT-05/06 と一致） |
| TC-BUILD-04 | manifest meetings | `manifest.meetings` | 配列長 3。各 `sessionId` が `TEST-MTG-0[1-3]` |
| TC-BUILD-05 | escape: シングルクォート | `MEM-10` の `fullName`（`[TEST] 山田'太郎`等クォート含む）を含むカタログを入力 | 生成 `seedSql` 内でその名前部分が `''`（二重化）でエスケープされ、`'山田''太郎'` の形になる。`split("''")` で復元すると元の値に一致 |
| TC-BUILD-06 | answers_json が valid JSON | `seedSql` から `member_responses` 行の `answers_json` リテラルを抽出（`'` 復元後） | `JSON.parse` が throw しない。`fullName` キーを含む |
| TC-BUILD-07 | 決定論性（純粋性） | 同一カタログで `buildTestAccountsSeed` を 2 回呼ぶ | `seedSql` 同士 / `cleanupSql` 同士 / `JSON.stringify(manifest)` 同士が完全一致（時刻等の非決定値を含まない。`datetime('now')` は SQL 側評価のためリテラルに焼かない or 固定文字列） |
| TC-BUILD-08 | cleanup の対象限定句 | `cleanupSql` 文字列 | `LIKE 'TEST-%'` を含む DELETE が member_id / note_id / session_id 系に存在し、`@test.ubm-hyogo.invalid` または `updated_by = 'seed:test-accounts'` のいずれかでも限定している。`DELETE FROM` が無条件（WHERE なし）で現れない |
| TC-BUILD-09 | 投入テーブル順序（参照整合） | `seedSql` 内で各テーブル名が最初に出現する index | `member_responses` / `member_identities` / `member_status` が `member_tags` / `member_attendance` / `member_photos` より前。`meeting_sessions` が `member_attendance` より前（出席の参照先を先に投入） |

### test-accounts-seed.contract.spec.ts（drift guard ＋ in-memory D1 投入）

`setupD1()` は migrations を全適用し全テーブルを truncate 済みの `InMemoryD1` を返す。seed/cleanup SQL は issue-399 spec と同じ `execAll`（`BEGIN`/`COMMIT` を filter して個別 `db.exec`）パターンで流す。drift guard は committed SQL を `readFileSync` で読み、`buildTestAccountsSeed(catalog)` の再生成結果と byte 比較する。

| ID | 対象 | 入力（外部） | 期待（内部状態） |
|----|------|-------------|-----------------|
| TC-SEED-01 | identity 投入件数 | committed `test-accounts-seed.sql` を `execAll` | `SELECT count(*) FROM member_identities WHERE member_id LIKE 'TEST-MEM-%'` が 10 |
| TC-SEED-02 | admin 投入と active 内訳 | 同上 | `admin_users WHERE admin_id LIKE 'TEST-ADM-%'` が 3 件、うち `active=1` が 2 件・`active=0` が 1 件 |
| TC-SEED-03 | 公開掲載 member 数 | 同上 | `SELECT count(*) FROM member_status WHERE member_id LIKE 'TEST-MEM-%' AND public_consent='consented' AND publish_state='public' AND is_deleted=0` が 5 |
| TC-SEED-04 | 削除済み member の整合 | 同上 | `member_status WHERE member_id='TEST-MEM-05' AND is_deleted=1` が 1 件、かつ `deleted_members WHERE member_id='TEST-MEM-05'` が 1 件 |
| TC-SEED-05 | ログイン可ゲートの D1 検証 | 同上 | `member_identities`（identity 存在）∧ `rules_consent='consented'` ∧ `is_deleted=0` を JOIN で満たす member が 7 件。満たさない member_id 集合が `{TEST-MEM-04, TEST-MEM-05, TEST-MEM-08}` |
| TC-SEED-06 | seed 冪等（2 回適用で件数不変） | seed を続けて 2 回 `execAll` | `member_identities` 10 / `member_status` 10 / `admin_users` 3 / `meeting_sessions` 3 が 2 回目適用後も不変 |
| TC-SEED-07 | cleanup 後 全テスト行 0 件 | seed 適用後 cleanup を `execAll` | `member_identities` / `member_responses` / `member_status` / `admin_users` / `meeting_sessions` / `member_attendance` / `member_tags` / `member_photos` / `deleted_members` の各 `... LIKE 'TEST-%'`（admin_users は `admin_id LIKE 'TEST-ADM-%'`、admin email は `LIKE '%@test.ubm-hyogo.invalid'`）が全て 0 |
| TC-SEED-08 | drift: 再生成 == committed（byte 一致） | `readFileSync(test-accounts-seed.sql)` と `buildTestAccountsSeed(catalog).seedSql` | 文字列が完全一致。同様に `test-accounts-cleanup.sql` == `cleanupSql`、`test-accounts.manifest.json` == `JSON.stringify(manifest, null, 2) + "\n"`（末尾改行込み） |
| TC-SEED-09 | tag 参照の整合（FK 相当） | seed 適用後 | `member_tags WHERE member_id LIKE 'TEST-MEM-%'` の各 `tag_id` がすべて `tag_definitions` に存在（既存 master 再利用。孤児タグ 0） |
| TC-SEED-10 | attendance の参照整合 | seed 適用後 | `member_attendance WHERE member_id LIKE 'TEST-MEM-%'` の各 `session_id` がすべて `meeting_sessions WHERE session_id LIKE 'TEST-MTG-%'` に存在 |

> ケース総数: catalog 12 + build 9 + seed 10 = 31（タスク要求の最低 15 を満たす）。

## 3. TDD RED 方針

1. まず 3 つの spec を Phase 4 の表どおり作成する。この時点で `apps/api/src/testing/test-accounts/{catalog,build-seed-sql,index}.ts` と committed 生成物 3 ファイルは存在しないため、`import` 解決・`readFileSync` で全テストが fail（RED）する。
2. Phase 5 で catalog → build-seed-sql → 生成スクリプト実行（committed 生成物の書き出し）→ index の順に実装し、ケースを順次 GREEN にする。
3. drift guard（TC-SEED-08）は「生成スクリプト未実行」の状態で byte 不一致 fail することを最初に確認し、`node --import tsx scripts/gen-test-accounts-seed.mjs` 実行後に GREEN へ反転することで「committed 生成物が SSOT から決定論的に派生している」ことを保証する。
4. RED → GREEN の各段で「外部入力（カタログ/SQL 文字列/manifest）」を固定し、「内部状態（行数・ゲート判定）」のみを assert する構造を維持する。期待値（7/3/5/2/1）はカタログ定数から導出した値ではなくテスト側にハードコードし、カタログ改変時に検出できるようにする。

## 4. 命名規則整合

- すべて `*.spec.ts`（`*.test.ts` は lefthook `block-test-suffix` / CI `verify-test-suffix` で reject。不変条件 #2）。
- テスト ID は `TC-CAT-*` / `TC-BUILD-*` / `TC-SEED-*`。テストファイル名・関数名・変数名は camelCase（`buildTestAccountsSeed` / `countLoginable` / `seedSql`）。
- D1 spec のヘルパ命名は issue-399 spec に倣い `countMembers` / `countAdmins` / `execAll` を踏襲する。
