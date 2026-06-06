# Phase 2 — 設計

> タスク分類: implementation task / NON_VISUAL。
> 設計は SSOT(`index.md`)のアーキテクチャ図と変更対象ファイル一覧を正本とし、各レーンの型定義・生成方針・再利用可否を実装可能な粒度で確定する。

## 1. トポロジ（責務分離）

SSOT カタログを単一の真実源とし、生成物・適用・E2E ログインを 4 つの責務に分離する。`catalog → build → 生成物 → {drift spec / CLI / mint}` の一方向データフローで、ドリフトは drift guard spec が再生成して byte 一致で検出する。

```
┌──────────────────────────────────────────────────────────────┐
│ SSOT (apps/api/src/testing/test-accounts/)                    │
│   catalog.ts   10 member + 3 admin + 3 meeting + 規約定数      │
│   build-seed-sql.ts  (pure) catalog → {seedSql,cleanupSql,    │
│                                        manifest}              │
│   index.ts     公開エクスポート                                │
└───────────────┬──────────────────────────┬───────────────────┘
   (committed 生成物)│                       │(drift guard spec が再生成し byte 一致検証)
┌─────────────────▼─────────────┐  ┌────────▼──────────────────────────────┐
│ apps/api/migrations/seed/      │  │ apps/api/.../__tests__/*.spec.ts        │
│   test-accounts-seed.sql       │  │  catalog 不変条件 / build 出力構造 /    │
│   test-accounts-cleanup.sql    │  │  生成物 drift / in-memory D1 ゲーティング│
│   test-accounts.manifest.json  │  │  / 冪等性                               │
└──────┬─────────────────────────┘  └─────────────────────────────────────────┘
 ┌─────▼──────────────────────┐    ┌────────────────────────────────────────────┐
 │ scripts/                    │    │ apps/web/playwright/scripts/                 │
 │  seed-test-accounts.sh      │    │  mint-test-account-storage-state.ts          │
 │   (local/staging 適用・撤去 │    │   (manifest を読み JWT mint で E2E ログイン) │
 │    production 拒否)         │    │   ※ D1 非接触・manifest JSON のみ参照        │
 │  gen-test-accounts-seed.mjs │    └──────────────────────────────────────────────┘
 │   (catalog→生成物 書き出し) │
 └─────────────────────────────┘
```

**D1 境界**: catalog / build / 生成物 / drift spec / 適用 CLI は apps/api・scripts に閉じる。`mint-test-account-storage-state.ts` は manifest JSON(`memberId` / `email` / `role` / `loginable`)のみを読み、D1 binding に触れない(不変条件 #5)。

## 2. SubAgent lane / 実装レーン（1サイクル1PRで完結）

| Lane | 担当パッケージ | 成果物 | 依存 |
|------|----------------|--------|------|
| **Lane A** | `apps/api/src/testing/test-accounts/` | `catalog.ts`(SSOT)、`build-seed-sql.ts`(純粋ジェネレータ)、`index.ts`、`__tests__/catalog.spec.ts`、`__tests__/build-seed-sql.spec.ts`、`migrations/seed/__tests__/test-accounts-seed.contract.spec.ts`(drift + in-memory D1 ゲーティング) | なし(SSOT) |
| **Lane B** | `scripts/`, `apps/api/package.json`, root `package.json` | `gen-test-accounts-seed.mjs`(catalog → 3 生成物 書き出し)、`seed-test-accounts.sh`(local/staging 適用・撤去・production 拒否)、committed 生成物 3 ファイル、npm script(`seed:test-accounts` / `seed:test-accounts:gen`) | Lane A の `build-seed-sql.ts` を import |
| **Lane C** | `apps/web/playwright/scripts/` | `mint-test-account-storage-state.ts`(manifest → JWT mint → storageState) | Lane B の生成 manifest を入力(疎結合: ファイルパスのみ) |

- **1サイクル1PR**: 3 Lane を 1 PR で完結。Lane B/C は Lane A の純粋関数・生成物に依存するが、いずれも 1 サイクル内で生成可能(分量を理由とした分割はしない)。
- Lane 間の唯一の結合点は (a) `build-seed-sql.ts` の公開関数シグネチャ、(b) `test-accounts.manifest.json` の JSON 形。両者を本フェーズで固定する。

## 3. データ構造・型定義

### カタログ型(`catalog.ts`)

```ts
/** ログインゲート/公開ゲートに直結する member_status の状態。 */
type ConsentState = "consented" | "declined" | "unknown";
type PublishState = "public" | "member_only" | "hidden";
type PhotoSource = "admin" | "self";

/** answers_json / response_fields に投入する stable_key の部分集合。
 *  値は packages/shared/src/zod/field.ts の stable_key 名に一致させる。 */
interface TestMemberAnswers {
  readonly fullName: string;            // 先頭 "[TEST]" を付与
  readonly nickname?: string;
  readonly location?: string;
  readonly occupation?: string;
  readonly ubmZone?: string;
  readonly ubmMembershipType?: string;
  readonly selfIntroduction?: string;
  readonly urlWebsite?: string;
  readonly urlFacebook?: string;
  readonly urlX?: string;
}

interface TestMemberPhoto {
  readonly source: PhotoSource;         // "admin" | "self"
  readonly objectKey: string;           // R2 プレースホルダ(実体未アップロード)
  readonly contentType: "image/webp";
  readonly byteSize: number;
  readonly thumbObjectKey?: string;     // source="self" のとき設定
  readonly processingStatus: "completed" | "pending";
}

interface TestMemberAccount {
  readonly memberId: string;            // "TEST-MEM-01"..."TEST-MEM-10"
  readonly responseId: string;          // "TEST-RES-01"...
  readonly email: string;               // "test-mem-01@test.ubm-hyogo.invalid"
  // identity / responses
  readonly answers: TestMemberAnswers;
  // member_status(ログイン/公開ゲートを決める)
  readonly publicConsent: ConsentState;
  readonly rulesConsent: ConsentState;
  readonly publishState: PublishState;
  readonly isDeleted: boolean;
  readonly hiddenReason?: string;       // publish_state="hidden" / is_deleted=1 のとき
  readonly notificationOptOut: boolean;
  // 付帯データ
  readonly tagIds: readonly string[];   // 既存 tag_definitions の tag_id(例 "tag_b_food")
  readonly attendanceSessionIds: readonly string[]; // "TEST-MTG-01" 等
  readonly photo: TestMemberPhoto | null;
  readonly deleted?: { readonly reason: string }; // is_deleted=1 のとき deleted_members 行
}

interface TestAdminAccount {
  readonly adminId: string;             // "TEST-ADM-01"..."TEST-ADM-03"
  readonly email: string;               // "test-adm-01@test.ubm-hyogo.invalid"
  readonly displayName: string;         // 先頭 "[TEST]"
  readonly active: boolean;             // TEST-ADM-03 のみ false
}

interface TestMeeting {
  readonly sessionId: string;           // "TEST-MTG-01"..."TEST-MTG-03"
  readonly title: string;               // "[TEST] 2026年度 第N回 定例会"
  readonly heldOn: string;              // "2026-04-12" 等(YYYY-MM-DD)
  readonly note?: string;
}

interface TestAccountsCatalog {
  readonly seedActor: "seed:test-accounts";
  readonly emailDomain: "test.ubm-hyogo.invalid";
  readonly idPrefix: "TEST-";
  readonly members: readonly TestMemberAccount[]; // length 10
  readonly admins: readonly TestAdminAccount[];   // length 3
  readonly meetings: readonly TestMeeting[];      // length 3
}

export const testAccountsCatalog: TestAccountsCatalog;
```

### ジェネレータ公開シグネチャ(`build-seed-sql.ts` / `index.ts`)

```ts
interface ManifestMember {
  readonly memberId: string;
  readonly email: string;
  readonly fullName: string;
  readonly loginable: boolean;    // ログイン3条件の評価結果
  readonly publicListed: boolean; // 公開3条件の評価結果
  readonly isDeleted: boolean;
  readonly storageStateName: string;
}
interface ManifestAdmin {
  readonly adminId: string;
  readonly email: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly storageStateName: string;
}
interface TestAccountsManifest {
  readonly generatedAt: string;
  readonly members: readonly ManifestMember[]; // 10 件
  readonly admins: readonly ManifestAdmin[];   // 3 件
}

interface BuildSeedResult {
  readonly seedSql: string;
  readonly cleanupSql: string;
  readonly manifest: TestAccountsManifest;
}

/** 純粋関数: 副作用なし・同一入力で同一出力(drift guard が依存)。 */
export function buildSeedSql(catalog: TestAccountsCatalog): BuildSeedResult;

/** ゲート評価(catalog.spec / manifest 生成で共用)。 */
export function isLoginable(m: TestMemberAccount): boolean;   // rulesConsent==="consented" && isDeleted===0 && email 登録あり
export function isPublicListed(m: TestMemberAccount): boolean; // publicConsent==="consented" && publishState==="public" && isDeleted===0
```

`buildSeedSql` は配列順序・JSON キー順序・改行を決定論的に固定し、再実行で完全同一の文字列を返す(drift guard byte 一致の前提)。`manifest` JSON のシリアライズは `JSON.stringify(manifest, null, 2)` + 末尾改行 1 個に固定する。

## 4. seed SQL 生成方針

### 構造

- 全体を `BEGIN TRANSACTION;` ... `COMMIT;` で囲み原子的に適用する(部分適用を許さない)。
- 冪等性:
  - 状態を上書きしたい行(`member_identities` / `member_responses` / `member_status` / `admin_users` / `meeting_sessions` / `member_photos` / `deleted_members`)は **`INSERT OR REPLACE`**。
  - 重複追加を無視したい junction 行(`response_fields` / `member_tags` / `member_attendance`)は **`INSERT OR IGNORE`**。
  - 素の `INSERT INTO`(衝突時エラー)は使用しない。
- actor 列(`created_by` / `updated_by` / `assigned_by` / `uploaded_by`)は全行 `'seed:test-accounts'`。
- timestamp は決定論的固定値(例 `'2026-06-01T00:00:00Z'`)を使い、`datetime('now')` は drift を生むため**使わない**(生成物 byte 一致のため)。

### テーブル投入順序(FK / VIEW 依存を満たす順)

| 順 | テーブル | 文 | 行数 | 主キー / 主列 |
|----|----------|----|------|----------------|
| 1 | `member_identities` | INSERT OR REPLACE | 10 | `member_id`, `response_email` UNIQUE, `current_response_id`, `first_response_id`, `last_submitted_at` |
| 2 | `member_responses` | INSERT OR REPLACE | 10 | `response_id`, `form_id`, `revision_id`, `schema_hash`, `response_email`, `submitted_at`, `answers_json`(stable_key 部分集合) |
| 3 | `response_fields` | INSERT OR IGNORE | 公開掲載 5 件分の stable_key 展開 | `(response_id, stable_key)`, `value_json`, `raw_value_json` |
| 4 | `member_status` | INSERT OR REPLACE | 10 | `member_id`, `public_consent`, `rules_consent`, `publish_state`, `is_deleted`, `hidden_reason`, `notification_opt_out`, `updated_by` |
| 5 | `meeting_sessions` | INSERT OR REPLACE | 3 | `session_id`, `title`, `held_on`, `note`, `created_by` |
| 6 | `member_tags` | INSERT OR IGNORE | assign 件数分 | `(member_id, tag_id)`, `source`, `assigned_by` |
| 7 | `member_attendance` | INSERT OR IGNORE | 出席件数分 | `(member_id, session_id)`, `assigned_by` |
| 8 | `member_photos` | INSERT OR REPLACE | photo を持つ member 分 | `member_id`, `object_key`, `content_type`, `byte_size`, `uploaded_by`, `source`, `thumb_object_key`, `processing_status` |
| 9 | `deleted_members` | INSERT OR REPLACE | is_deleted=1 の 1 件(`TEST-MEM-05`) | `member_id`, `deleted_by`, `reason` |
| 10 | `admin_users` | INSERT OR REPLACE | 3 | `admin_id`, `email` UNIQUE, `display_name`, `active`, `created_at` |

- `meeting_sessions` を `member_attendance` より前に投入する(出席の参照先を先に作る)。
- `members` は VIEW(`member_identities` JOIN `member_responses` ON `current_response_id`)であり、INSERT 対象にしない。`current_response_id` を各 member の `TEST-RES-NN` に設定することで VIEW 経由で参照可能にする。
- `answers_json` は `json_object('fullName', '[TEST] ...', ...)` で stable_key 最小集合のみを構築する。consent キーは `publicConsent` / `rulesConsent`(不変条件 #2)。

## 5. cleanup 方針

cleanup は **対象限定 3 層規約**(`TEST-` prefix / `.invalid` ドメイン / `seed:test-accounts` actor)で seed 由来行のみを削除し、実会員データを誤削除しない。

- 削除順序は FK / VIEW 安全のため seed の逆順(`admin_users` → `deleted_members` → `member_photos` → `member_attendance` → `member_tags` → `meeting_sessions` → `member_status` → `response_fields` → `member_responses` → `member_identities`)。
- 各 DELETE の WHERE は最も限定的な条件を使う:
  - member 系: `member_id LIKE 'TEST-%'`
  - response 系: `response_id LIKE 'TEST-%'`
  - meeting 系: `session_id LIKE 'TEST-%'`
  - admin: `admin_id LIKE 'TEST-%' OR email LIKE '%@test.ubm-hyogo.invalid'`
- 全体を `BEGIN TRANSACTION;` ... `COMMIT;` で囲む。
- **末尾に残件 0 検証 SELECT** を付ける。10 テーブルそれぞれについて `SELECT '<table>' AS t, COUNT(*) AS remaining FROM <table> WHERE <TEST 限定条件>;` を出力し、全行 `remaining=0` を spec(AC-6)が assert する。

## 6. 既存コンポーネント再利用（再利用可否を明記）

| コンポーネント | 再利用可否 | 利用方法 |
|----------------|-----------|----------|
| `signSessionJwt`(`packages/shared/src/auth.ts`) | **再利用** | Lane C の mint で `signSessionJwt(secret, { memberId, email, isAdmin })` をそのまま呼ぶ。新規署名処理は書かない |
| `asMemberId`(`@ubm-hyogo/shared`) | **再利用** | manifest の `memberId` を branded 型へ変換(mint 先例 `mint-staging-storage-state.ts` と同様) |
| `setupD1`(apps/api テスト基盤) | **再利用** | drift / ゲーティング / 冪等性 spec で migration 適用後の in-memory D1 に seedSql/cleanupSql を実行し SELECT 検証 |
| issue-399 seed/cleanup/syntax spec パターン(`apps/api/migrations/seed/`) | **再利用(構造踏襲)** | `BEGIN TRANSACTION` 構成・`<PREFIX>-` 判別・actor 限定 cleanup・syntax spec の組み立て方を踏襲。SQL 本文は本タスク用に新規生成 |
| 既存 `tag_definitions`(`0004_seed_tags.sql` 41 件) | **再利用** | `member_tags` の assign 対象 tag_id を既存 41 件から選ぶ(例 `tag_b_food`)。新規 tag 定義は作らない |
| mint storageState 先例(`mint-staging-storage-state.ts`) | **再利用(構造踏襲)** | cookie 非ログ・出力非コミット(`.auth/`)・env schema(zod)・`Role = "member"|"admin"` の枠を踏襲。入力源を staging env から manifest JSON へ差し替える |
| `members` VIEW / 既存 API surface | **再利用(非改変)** | 既存 VIEW・endpoint をそのまま使う。新規 schema/migration/endpoint は追加しない(不変条件 #5) |

> 新規作成は「カタログ・純粋ジェネレータ・生成物・spec・CLI・mint」のみ。署名・D1 セットアップ・tag master・schema は既存資産を再利用し重複を作らない。
