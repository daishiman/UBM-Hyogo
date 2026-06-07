# Phase 1 — 要件定義

> タスク分類: **implementation task / NON_VISUAL**
> 本フェーズは、SSOT(`index.md`)で確定したアカウント網羅マトリクスを、実装プロンプトが迷わず実装できる粒度の要件へ落とし込む。

## 1. 背景

UBM 兵庫支部会(Cloudflare D1 + Hono API + Next.js)には、会員ドメインの状態空間を網羅した手動操作なしの再現可能なテスト基盤が存在しない。現状の seed 先例 `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` は `/admin/requests` の visual evidence 取得用に `member_status` / `admin_member_notes` の 5 行のみを投入する単一目的 seed であり、以下が網羅できていない。

- **ログイン可否ゲート**（`13-mvp-auth.md` のログイン3条件: `responseEmail 登録` ∧ `rules_consent="consented"` ∧ `is_deleted=0`、不成立時の gateReason 4値 `unregistered` / `rules_declined` / `deleted` / `null`）
- **公開ディレクトリ可視性**（公開3条件: `public_consent="consented"` ∧ `publish_state="public"` ∧ `is_deleted=0`）
- **付帯データの有無**（`tag_definitions` の assign、`meeting_sessions` への出席、`member_photos`(admin / self)、`deleted_members` 行）
- **公開 member detail が参照する `response_fields`**（`stable_key` 単位の展開済み回答）

これらを SQL ハンドメイドで個別に書くと、member が `member_identities` / `member_responses` / `response_fields` / `member_status` / `member_tags` / `member_attendance` / `member_photos` の複数テーブルにまたがるため、重複コストとドリフトが構造的に発生する。本タスクは、**単一の SSOT カタログ(TypeScript)から冪等 seed/cleanup SQL + manifest JSON を決定論的に生成し、drift guard spec で同期を保証する seed 基盤**を実装するための仕様を確定する。

## 2. ユーザー要求

> ユーザー依頼(2026-06-03):「メンバーと管理者にテストアカウントを作成。メンバー10アカウント、管理者3アカウントを作成し、様々なパターンで網羅的にテストできるものに対応する。テスト用とわかるようにしておく。コードで作成する。」

要求を分解すると以下の4点になる。

1. **メンバー10件・管理者3件** のテストアカウントを作成する。
2. **様々なパターンで網羅的にテスト**できる(ログイン可否 × 公開可視性 × 付帯データの組み合わせを網羅する)。
3. **テスト用と一目で判別**できる(実会員データと区別でき、cleanup が安全に対象限定できる)。
4. **コードで作成**する(手動 SQL 投入ではなく、SSOT から決定論的に生成し冪等に投入/撤去できる)。

## 3. AC（Acceptance Criteria）

| ID | 入力 | 期待 |
|----|------|------|
| AC-1 | SSOT カタログ `catalog.ts` をロード | `members` が 10 件、`admins` が 3 件、`meetings` が 3 件。member_id は `TEST-MEM-01`〜`TEST-MEM-10`、admin_id は `TEST-ADM-01`〜`TEST-ADM-03`、session_id は `TEST-MTG-01`〜`TEST-MTG-03` で重複なし |
| AC-2 | カタログから各 member の「ログイン3条件」を評価 | **ログイン可 7 件** = `TEST-MEM-01,02,03,06,07,09,10`、**ログイン不可 3 件** = `TEST-MEM-04`(gateReason=`rules_declined`)、`TEST-MEM-05`(gateReason=`deleted`)、`TEST-MEM-08`(gateReason=`unregistered` 相当: `rules_consent="unknown"≠"consented"`) |
| AC-3 | カタログから各 member の「公開3条件」を評価 | **公開ディレクトリ掲載 5 件** = `TEST-MEM-01,06,07,09,10`。残り 5 件(`02`=public_consent declined / `03`=publish_state hidden / `04,08`=member_only / `05`=is_deleted=1)は非掲載 |
| AC-4 | `build-seed-sql.ts` でカタログから生成 | `{ seedSql, cleanupSql, manifest }` を返す。`seedSql` は `BEGIN TRANSACTION;` で始まり `COMMIT;` で終わる。各 INSERT は `INSERT OR REPLACE`(冪等更新)または `INSERT OR IGNORE`(冪等追加) のみを使用し、素の `INSERT INTO`(衝突時エラー)を含まない |
| AC-5 | in-memory D1(`setupD1`)に `seedSql` を 2 回連続適用 | 各テーブルの `TEST-%` 行件数が 1 回目と 2 回目で不変(冪等)。member_identities=10, member_responses=10, member_status=10, admin_users=3, meeting_sessions=3 |
| AC-6 | seed 適用後に `cleanupSql` を適用 | `member_identities` / `member_responses` / `response_fields` / `member_status` / `member_tags` / `member_attendance` / `member_photos` / `deleted_members` / `meeting_sessions` / `admin_users` の各テーブルで `TEST-%` または `@test.ubm-hyogo.invalid` または `updated_by/created_by/assigned_by/uploaded_by='seed:test-accounts'` にマッチする行が 0 件。`cleanupSql` 末尾の残件検証 SELECT が全テーブル 0 を返す |
| AC-7 | `node --import tsx scripts/gen-test-accounts-seed.mjs` を実行 | `test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json` の 3 生成物が出力され、committed 版と **byte 一致**(drift guard spec が再生成して `===` 比較で PASS) |
| AC-8 | `test-accounts.manifest.json` をパース | `{ members: [{memberId, email, loginable, publicListed, role}], admins: [{adminId, email, active}] }` 形を満たし、`members` の `loginable===true` が 7 件、`publicListed===true` が 5 件、`admins` の `active===1` が 2 件(`TEST-ADM-03` は `active===0`) |
| AC-9 | 公開 member detail が参照する `response_fields` | 公開掲載 5 件(`TEST-MEM-01,06,07,09,10`)の各 `response_id` に対し `response_fields(response_id, stable_key, value_json)` 行が投入され、少なくとも `fullName` の stable_key が存在する(空 detail にならない) |
| AC-10 | `scripts/seed-test-accounts.sh --env production`(または `--env prod`)を実行 | CLI が exit code 非0 で拒否し、D1 を一切変更しない(production 適用を構造的に禁止)。`--env local` / `--env staging` のみ受理 |

> AC は SSOT(`index.md`)の網羅マトリクス・DoD と完全整合させる。AC-2 / AC-3 の件数(7/3/5)が崩れる変更は本タスクの破壊的回帰とみなす。

## 4. スコープ

### 含む(今回サイクルで完了させる)

- 10 メンバー + 3 管理者 + 3 会議 + 規約定数の **SSOT カタログ**(`apps/api/src/testing/test-accounts/catalog.ts`)。
- カタログから `{ seedSql, cleanupSql, manifest }` を生成する **純粋ジェネレータ**(`build-seed-sql.ts`)と公開エクスポート(`index.ts`)。
- committed 生成物 3 ファイル(`test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json`)と、それを再生成する書き出しスクリプト(`scripts/gen-test-accounts-seed.mjs`)。
- カタログ不変条件 / 生成 SQL 構造 / manifest / committed 生成物 drift / in-memory D1 投入後のゲーティング期待値 / 冪等性 を検証する **vitest spec(`*.spec.ts`)** 3 本。
- local / staging に適用・撤去する **CLI**(`scripts/seed-test-accounts.sh`、`--env production` 拒否)。
- manifest を読み JWT mint する **E2E ログイン補助**(`apps/web/playwright/scripts/mint-test-account-storage-state.ts`)。
- `apps/api/package.json` / root `package.json` への `seed:test-accounts` / `seed:test-accounts:gen` スクリプト追加。

### 含まない(理由付き・先送りではない明示的除外)

| 除外項目 | 理由 |
|----------|------|
| 実コードの実装・commit・PR・staging/production への実投入 | CONST_002 / CONST_006。本タスクは implemented_local_evidence_captured であり、本 wave で実装済み |
| Google Form 実回答の取り込み(form sync 経由の生成) | テストアカウントは form sync を通さず D1 へ直接 seed する。不変条件 #1(実フォーム schema をコードに固定しすぎない)を尊重し、`answers_json` は stable_key 最小集合のみ使用 |
| R2 への写真バイナリ実アップロード | `member_photos` はメタデータ行のみ投入。バイナリ実体は描画 e2e の別関心。manifest にプレースホルダ `object_key` を記録 |
| 新規 D1 テーブル / migration / API endpoint の追加 | 既存 schema・既存 surface のみ利用(不変条件 #5、UI prototype alignment 不変条件 #1) |
| 新規 `tag_definitions` の作成 | 既存 41 件(`0004_seed_tags.sql`、例 `tag_b_food` / `biz_food`)を assign で再利用。tag master 汚染防止 |

## 5. 前提依存

| 依存 | パス / 内容 | 利用方法 |
|------|------------|----------|
| 既存 D1 schema | `apps/api/migrations/0001_init.sql`〜`0005_response_sync.sql`, `0002_admin_managed.sql`, `0004_seed_tags.sql` | seed は既存テーブル列のみに INSERT。`members` は VIEW(`member_identities` JOIN `member_responses`)であり直接 INSERT しない |
| ログイン/公開ゲート定義 | `docs/00-getting-started-manual/specs/13-mvp-auth.md`, `06-member-auth.md` | AC-2 / AC-3 の期待値(7/3/5、gateReason 4値)の正本 |
| `signSessionJwt` | `packages/shared/src/auth.ts` の `signSessionJwt(secret, { memberId, email, isAdmin, name?, ttlSeconds?, nowSeconds? })` | mint 補助が JWT を署名する際に再利用 |
| `setupD1` | `apps/api` テスト基盤(in-memory D1 セットアップ) | drift / ゲーティング / 冪等性 spec で migration 適用 → seed 適用 → SELECT 検証 |
| 既存 seed 先例 | `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` / `issue-399-admin-queue-staging-cleanup.sql` / `__tests__/` | seed/cleanup/syntax spec の `BEGIN TRANSACTION` 構成・`<PREFIX>-` 判別・`updated_by` actor 限定パターンを踏襲 |
| E2E mint 先例 | `apps/web/playwright/scripts/mint-staging-storage-state.ts` | storageState JWT mint の構造(cookie 非ログ・出力非コミット・`asMemberId` / `signSessionJwt` 利用)を踏襲 |
| stable_key 定義 | `packages/shared/src/zod/field.ts`(`fullName` / `nickname` / `location` / `occupation` / `ubmZone` / `ubmMembershipType` / `selfIntroduction` / `urlWebsite` / `urlFacebook` / `urlX` ほか) | `answers_json` / `response_fields` の stable_key 名の正本 |
| 既存 tag master | `apps/api/migrations/0004_seed_tags.sql`(41 件) | assign 対象 tag_id の正本 |

## 6. 非機能要件

| 区分 | 要件 |
|------|------|
| **冪等性** | seed は `INSERT OR REPLACE` / `INSERT OR IGNORE` のみ・`BEGIN TRANSACTION;...COMMIT;` で原子的。同一 seed を N 回適用しても `TEST-%` 行件数は不変。cleanup → seed → cleanup の往復で件数が決定論的に推移する(AC-5 / AC-6) |
| **テスト判別性** | member_id/admin_id/response_id/session_id は `TEST-` prefix、email は RFC 2606 予約 TLD `.invalid`(`*@test.ubm-hyogo.invalid`、実在せず配信不能)、actor 列(`created_by` / `updated_by` / `assigned_by` / `uploaded_by`)は `seed:test-accounts`、表示名(`fullName` 等)は先頭 `[TEST]`。cleanup はこの 3 系統(prefix / `.invalid` ドメイン / actor)で対象限定する |
| **セキュリティ(secret 非混入)** | カタログ・生成 SQL・manifest に AUTH_SECRET 等の実値を一切含めない。mint 補助は secret を env(`STAGING_AUTH_SECRET` 等、1Password / env 経由)から読み、cookie/token 値を stdout/log に出さず、出力 storageState JSON を `.gitignore` 配下(`apps/web/playwright/.auth/`)に書く |
| **D1 境界** | D1 直接アクセスは apps/api / scripts に閉じる(不変条件 #5)。apps/web/playwright は manifest JSON(id/email/role/loginable/public)のみ読み、D1 binding に触れない |
| **互換性** | 既存 migration・既存 API surface を一切変更しない。`members` VIEW を破壊せず、公開 member list/detail が参照する `response_fields` を公開掲載 5 件に投入して空表示を防ぐ(AC-9) |
| **production 防御** | seed 適用 CLI は `--env production` / `--env prod` を構造的に拒否(AC-10)。production には本 seed を投入しない |

## 7. 命名規則(既存コード踏襲・記録)

| 対象 | 規則 | 例 |
|------|------|-----|
| ソースファイル名 | kebab-case | `build-seed-sql.ts`, `mint-test-account-storage-state.ts`, `seed-test-accounts.sh` |
| 生成物ファイル名 | kebab-case + 用途サフィックス | `test-accounts-seed.sql`, `test-accounts-cleanup.sql`, `test-accounts.manifest.json` |
| テストファイル名 | `*.spec.ts`(不変条件 #2。`*.test.ts` 禁止) | `catalog.spec.ts`, `build-seed-sql.spec.ts`, `test-accounts-seed.contract.spec.ts` |
| TypeScript 変数/関数 | camelCase | `buildSeedSql`, `testAccountsCatalog`, `seedSql`, `publicListed` |
| TypeScript 型/interface | PascalCase | `TestMemberAccount`, `TestAdminAccount`, `TestMeeting`, `TestAccountsManifest` |
| D1 識別子 prefix | `TEST-` | `TEST-MEM-01`, `TEST-ADM-01`, `TEST-RES-01`, `TEST-MTG-01` |
| seed actor 値 | 固定文字列 | `seed:test-accounts` |
| npm script | コロン区切り | `seed:test-accounts`, `seed:test-accounts:gen` |
