# Phase 5 — 実装

SSOT カタログ（TypeScript）→ 純粋ジェネレータ → committed 生成物（SQL/cleanup/manifest）→ 適用 CLI → E2E mint の順に実装する。各モジュールの入力・出力・副作用を明記し、関数シグネチャを TypeScript で確定する。実コードは本 wave で作成済み。commit・PR は user-gated。

## 1. 新規作成 / 修正ファイル一覧

| パス | 種別 | 役割 |
|------|------|------|
| `apps/api/src/testing/test-accounts/catalog.ts` | 新規 | SSOT カタログ（10 member + 3 admin + 3 meeting + 規約定数） |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | 新規 | カタログ→`{ seedSql, cleanupSql, manifest }` の純粋ジェネレータ |
| `apps/api/src/testing/test-accounts/index.ts` | 新規 | 公開エクスポート（catalog 定数・`buildTestAccountsSeed`・型） |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 新規 | カタログ不変条件検証（Phase 4 §2） |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 新規 | 生成 SQL 構造 / manifest 検証（Phase 4 §2） |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 新規 | drift guard ＋ in-memory D1 投入後のゲーティング期待値検証 |
| `apps/api/migrations/seed/test-accounts-seed.sql` | 新規（生成物） | 冪等 seed SQL |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | 新規（生成物） | 冪等 cleanup SQL |
| `apps/api/migrations/seed/test-accounts.manifest.json` | 新規（生成物） | id/email/role/loginable/public/meetings の manifest |
| `scripts/gen-test-accounts-seed.mjs` | 新規 | カタログ→生成物の書き出し（`--check` で drift 検出） |
| `scripts/seed-test-accounts.sh` | 新規 | local/staging 適用・撤去 CLI（production 拒否） |
| `apps/web/playwright/scripts/mint-test-account-storage-state.ts` | 新規 | manifest を読み JWT mint（任意テストアカウントで E2E ログイン） |
| `apps/api/package.json` | 編集 | scripts に `seed:test-accounts` / `seed:test-accounts:gen` 追加 |
| `package.json`（root） | 編集 | ルートからの `seed:test-accounts` パススルー追加 |

## 2. catalog.ts 実装方針

### 型定義

```ts
export type Consent = "consented" | "declined" | "unknown";
export type PublishState = "public" | "member_only" | "hidden";
export type PhotoSource = "admin" | "self";

export interface TestPhoto {
  readonly source: PhotoSource;
  readonly objectKey: string;          // R2 実体は投入しない placeholder
  readonly contentType: string;        // "image/jpeg"
  readonly byteSize: number;
  readonly thumbObjectKey?: string;
  readonly thumbByteSize?: number;
  readonly contentHash?: string;
  readonly processingStatus: "none" | "processing" | "completed";
}

export interface TestMemberAccount {
  readonly memberId: string;           // "TEST-MEM-01"
  readonly responseId: string;         // "TEST-RES-01"
  readonly email: string;              // "test-mem-01@test.ubm-hyogo.invalid"
  readonly publicConsent: Consent;
  readonly rulesConsent: Consent;
  readonly publishState: PublishState;
  readonly isDeleted: boolean;
  readonly hiddenReason?: string;
  readonly deletedReason?: string;     // isDeleted===true のとき必須
  readonly notificationOptOut: boolean;
  readonly tags: readonly string[];    // tag_definitions.code（既存 master のみ）
  readonly attendanceSessionIds: readonly string[]; // "TEST-MTG-01" 等
  readonly photo?: TestPhoto;
  readonly answers: Readonly<Record<string, string>>; // answers_json（stable_key 最小集合）
}

export interface TestAdminAccount {
  readonly adminId: string;            // "TEST-ADM-01"
  readonly email: string;
  readonly displayName: string;        // "[TEST] 主管理者"
  readonly active: boolean;
}

export interface TestMeeting {
  readonly sessionId: string;          // "TEST-MTG-01"
  readonly title: string;              // "[TEST] 2026年度 第1回 定例会"
  readonly heldOn: string;             // "2026-04-12"
}

export const SEED_ACTOR = "seed:test-accounts" as const;
export const TEST_EMAIL_DOMAIN = "test.ubm-hyogo.invalid" as const;
```

### 10 メンバー定数（マトリクス具体化）

`apps/api` の `aiworkflow`/admin spec が読めるよう、`answers` は stable_key 最小集合（`fullName` / `selfIntroduction` / URL 系）を使う。`fullName` は全件 `[TEST] ` 接頭。

| memberId | email | publicConsent | rulesConsent | publishState | isDeleted | notificationOptOut | tags | attendance | photo | fullName |
|----------|-------|---------------|--------------|--------------|-----------|--------------------|------|-----------|-------|----------|
| TEST-MEM-01 | test-mem-01@… | consented | consented | public | 0 | 0 | `tag_b_it`,`tag_s_dev`,`tag_r_kobe` | MTG-01,MTG-02 | source=admin / completed | `[TEST] 山田太郎` |
| TEST-MEM-02 | test-mem-02@… | declined | consented | member_only | 0 | 0 | `tag_b_finance` | MTG-01 | なし | `[TEST] 佐藤花子` |
| TEST-MEM-03 | test-mem-03@… | consented | consented | hidden | 0 | 0 | `tag_s_design` | なし | source=admin / completed | `[TEST] 鈴木一郎` |
| TEST-MEM-04 | test-mem-04@… | unknown | declined | member_only | 0 | 0 | （なし） | なし | なし | `[TEST] 田中次郎` |
| TEST-MEM-05 | test-mem-05@… | consented | consented | public | 1 | 0 | （なし） | なし | なし | `[TEST] 高橋三郎`（deletedReason=`test seed soft-delete` / hiddenReason=`deleted`） |
| TEST-MEM-06 | test-mem-06@… | consented | consented | public | 0 | 0 | （なし） | なし | なし | `[TEST] 伊藤四郎`（最小公開会員） |
| TEST-MEM-07 | test-mem-07@… | consented | consented | public | 0 | 1 | 6 カテゴリ各 1: `tag_b_it`,`tag_s_pm`,`tag_r_himeji`,`tag_ro_owner`,`tag_i_dx`,`tag_st_active` | MTG-01,MTG-02,MTG-03 | なし | `[TEST] 渡辺五郎` |
| TEST-MEM-08 | test-mem-08@… | unknown | unknown | member_only | 0 | 0 | （なし） | なし | なし | `[TEST] 中村六子` |
| TEST-MEM-09 | test-mem-09@… | consented | consented | public | 0 | 0 | `tag_s_marketing` | MTG-02,MTG-03 | source=self / thumb 付 / completed | `[TEST] 小林七海` |
| TEST-MEM-10 | test-mem-10@… | consented | consented | public | 0 | 0 | `tag_b_consult`,`tag_s_writing` | MTG-01 | source=admin / completed | `[TEST] 山田'太郎😀 長い日本語の表示名サンプル`（全 URL 系キー・特殊文字・絵文字） |

- MEM-10 の `answers` には URL 系 stable_key 全種（`urlWebsite` / `urlX` / `urlFacebook` / `urlInstagram` / `urlLinkedin` / `urlNote` / `urlBlog` / `urlYoutube` / `urlThreads` / `urlTiktok` / `urlOthers`）と、シングルクォート（`'`）・絵文字を含む `fullName` を入れ、escape 経路（TC-BUILD-05）と長文描画（エッジ）を検証可能にする。
- MEM-09 の photo は `source:"self"`, `thumbObjectKey`/`thumbByteSize`/`contentHash` 付与、`processingStatus:"completed"`。
- 各 photo の `objectKey` は `members/TEST-MEM-01/original.jpg` 形式の placeholder（R2 実体は投入しない）。

### 3 admin / 3 meeting 定数

```ts
export const TEST_ADMINS: readonly TestAdminAccount[] = [
  { adminId: "TEST-ADM-01", email: "test-adm-01@test.ubm-hyogo.invalid", displayName: "[TEST] 主管理者", active: 1 },
  { adminId: "TEST-ADM-02", email: "test-adm-02@test.ubm-hyogo.invalid", displayName: "[TEST] 副管理者", active: 1 },
  { adminId: "TEST-ADM-03", email: "test-adm-03@test.ubm-hyogo.invalid", displayName: "[TEST] 無効化管理者", active: 0 },
];

export const TEST_MEETINGS: readonly TestMeeting[] = [
  { sessionId: "TEST-MTG-01", title: "[TEST] 2026年度 第1回 定例会", heldOn: "2026-04-12" },
  { sessionId: "TEST-MTG-02", title: "[TEST] 2026年度 第2回 定例会", heldOn: "2026-05-10" },
  { sessionId: "TEST-MTG-03", title: "[TEST] 2026年度 第3回 定例会", heldOn: "2026-06-14" },
];
```

## 3. build-seed-sql.ts 実装方針

純関数。外部副作用なし（fs / 時刻 / 乱数を呼ばない）。`datetime('now')` は SQL リテラルに焼かず、SQL 文中の `datetime('now')` 式として出力する（決定論性のため）。

### シグネチャ

```ts
export interface TestAccountsCatalog {
  readonly members: readonly TestMemberAccount[];
  readonly admins: readonly TestAdminAccount[];
  readonly meetings: readonly TestMeeting[];
}

export interface ManifestMember {
  readonly memberId: string;
  readonly email: string;
  readonly fullName: string;
  readonly loginable: boolean;
  readonly publicListed: boolean;
  readonly isDeleted: boolean;
  readonly storageStateName: string;
}

export interface ManifestAdmin {
  readonly adminId: string;
  readonly email: string;
  readonly displayName: string;
  readonly active: boolean;
  readonly storageStateName: string;
}

export interface TestAccountsManifest {
  readonly generatedAt: string;
  readonly members: readonly ManifestMember[];
  readonly admins: readonly ManifestAdmin[];
}

export interface BuildResult {
  readonly seedSql: string;
  readonly cleanupSql: string;
  readonly manifest: TestAccountsManifest;
}

export const buildTestAccountsSeed: (catalog: TestAccountsCatalog) => BuildResult;
```

### 内部ヘルパ（escape / loginable / public）

```ts
// SQL リテラル escape: シングルクォートを二重化。null は NULL リテラル。
const sqlStr = (v: string): string => `'${v.replace(/'/g, "''")}'`;
const sqlNullable = (v: string | undefined): string => (v === undefined ? "NULL" : sqlStr(v));

const isLoginable = (m: TestMemberAccount): boolean =>
  m.rulesConsent === "consented" && m.isDeleted === 0;
const isPublic = (m: TestMemberAccount): boolean =>
  m.publicConsent === "consented" && m.publishState === "public" && m.isDeleted === 0;
```

### seedSql 生成（テーブル投入順序）

参照整合を満たすため次の順で `INSERT OR REPLACE INTO` を出力する。全行 `updated_by`/`created_by`/`assigned_by`/`uploaded_by` 列に `SEED_ACTOR`（`seed:test-accounts`）を入れる。

1. `member_responses`（`response_id`, `form_id='TEST-FORM'`, `revision_id='TEST-REV'`, `schema_hash='TEST-HASH'`, `response_email`, `submitted_at`, `answers_json=JSON.stringify(answers)`, `raw_answers_json='{}'`, `search_text=fullName`）
2. `member_identities`（`member_id`, `response_email`, `current_response_id`, `first_response_id`, `last_submitted_at`）
3. `member_status`（`member_id`, `public_consent`, `rules_consent`, `publish_state`, `is_deleted`, `hidden_reason`, `updated_by=SEED_ACTOR`）
4. `meeting_sessions`（`session_id`, `title`, `held_on`, `created_by=SEED_ACTOR`）
5. `member_attendance`（`member_id`, `session_id`, `assigned_by=SEED_ACTOR`）— attendanceSessionIds を展開
6. `member_tags`（`member_id`, `tag_id=code`, `source='manual'`, `assigned_by=SEED_ACTOR`）— tags を展開
7. `member_photos`（`member_id`, `object_key`, `content_type`, `byte_size`, `uploaded_by=SEED_ACTOR`, `source`, `thumb_object_key`, `thumb_byte_size`, `content_hash`, `processing_status`）— photo 持ちのみ
8. `admin_users`（`admin_id`, `email`, `display_name`, `active`）
9. `deleted_members`（`member_id`, `deleted_by=SEED_ACTOR`, `reason=deletedReason`）— `isDeleted===1` のみ

`answers_json` は `JSON.stringify(answers)` → `sqlStr` で escape（内部の `'` も二重化）。全体を `BEGIN TRANSACTION;` … `COMMIT;` で囲む。先頭にヘッダコメント（`-- test-accounts-seed.sql / generated from catalog.ts / DO NOT EDIT BY HAND`）。

### cleanupSql 生成

issue-399 cleanup と同型。`BEGIN TRANSACTION;` … `COMMIT;` で囲み、子テーブル→親テーブルの順で DELETE。各 DELETE は `LIKE 'TEST-%'`（または admin は `admin_id LIKE 'TEST-ADM-%'` / email は `LIKE '%@test.ubm-hyogo.invalid'`、もしくは `updated_by = 'seed:test-accounts'`）で対象限定。末尾に残件 0 検証 SELECT（`member_identities` / `admin_users` / `member_status` の残数）。

### manifest 生成

`accounts` = members（role=member, isAdmin=false, loginable=isLoginable(m), public=isPublic(m)）+ admins（role=admin, isAdmin=true, loginable=（active===1）, public=false）。配列順は catalog 順を保持。`meetings` は sessionId/title。

## 4. 生成スクリプト gen-test-accounts-seed.mjs

`scripts/gen-test-accounts-seed.mjs`。Node ESM。catalog/build を import（`tsx`/transpile 不要にするため、build は pure JS 化が難しいので **`apps/api/src/testing/test-accounts/index.ts` を `tsx` 経由で動的 import** する。実装プロンプトは `node --import tsx scripts/gen-test-accounts-seed.mjs` で起動する想定）。

入力: なし（カタログを import）。
出力（書き出し）: `apps/api/migrations/seed/test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json`。
副作用: 上記 3 ファイルの上書き（`writeFileSync`, 末尾改行付き）。

```js
// 擬似コード
import { writeFileSync, readFileSync } from "node:fs";
import { buildTestAccountsSeed, TEST_MEMBERS, TEST_ADMINS, TEST_MEETINGS } from "../apps/api/src/testing/test-accounts/index.ts";

const { seedSql, cleanupSql, manifest } = buildTestAccountsSeed({
  members: TEST_MEMBERS, admins: TEST_ADMINS, meetings: TEST_MEETINGS,
});
const files = {
  "apps/api/migrations/seed/test-accounts-seed.sql": seedSql,
  "apps/api/migrations/seed/test-accounts-cleanup.sql": cleanupSql,
  "apps/api/migrations/seed/test-accounts.manifest.json": JSON.stringify(manifest, null, 2) + "\n",
};
const check = process.argv.includes("--check");
let drift = false;
for (const [path, content] of Object.entries(files)) {
  if (check) {
    const current = readFileSync(path, "utf8");
    if (current !== content) { console.error(`drift: ${path}`); drift = true; }
  } else {
    writeFileSync(path, content);
  }
}
if (check && drift) process.exit(1);
```

`--check` モード: 既存ファイルと再生成結果を比較し、不一致が 1 件でもあれば `exit 1`（CI / drift guard の補助。byte 一致は spec TC-SEED-08 が本検証）。書き出しモード（`--check` なし）は 3 ファイルを上書きする。

## 5. seed-test-accounts.sh

`scripts/seed-test-accounts.sh`。`scripts/cf.sh` を経由して `d1 execute --file` で適用する。production を構造的に拒否。

引数:
- `--env local|staging`（必須。`production` を渡したら `echo "refused: production is not allowed" >&2; exit 2`）
- `--cleanup`（指定時は cleanup SQL を適用。未指定時は seed SQL）

```bash
#!/usr/bin/env bash
set -euo pipefail
ENV=""; MODE="seed"
for arg in "$@"; do
  case "$arg" in
    --env=*) ENV="${arg#--env=}" ;;
    --env) shift; ENV="$1" ;;          # 簡易: 実装は getopts 不使用の素朴 parse
    --cleanup) MODE="cleanup" ;;
  esac
done
case "$ENV" in
  local|staging) ;;
  production) echo "refused: --env production is not allowed for test-account seeding" >&2; exit 2 ;;
  *) echo "usage: seed-test-accounts.sh --env local|staging [--cleanup]" >&2; exit 2 ;;
esac
SQL_FILE="apps/api/migrations/seed/test-accounts-$( [ "$MODE" = cleanup ] && echo cleanup || echo seed ).sql"
DB="ubm-hyogo-db$( [ "$ENV" = staging ] && echo -staging )"
LOCAL_FLAG=$( [ "$ENV" = local ] && echo --local )
bash scripts/cf.sh d1 execute "$DB" $LOCAL_FLAG --file "$SQL_FILE" $( [ "$ENV" = staging ] && echo "--env staging" )
```

入力: CLI 引数。出力: D1 への SQL 適用（stdout に wrangler 出力）。副作用: local/staging D1 行の投入 / 撤去（production 不可）。実 DB 名・wrangler 環境名は実装時に `apps/api/wrangler.toml` の binding に合わせて確定する（local は `--local`、staging は `--env staging`）。

## 6. mint-test-account-storage-state.ts

`apps/web/playwright/scripts/mint-test-account-storage-state.ts`。`mint-staging-storage-state.ts` を踏襲し、role 固定ではなく manifest から `--account <id>` で解決する。D1 には触れず manifest JSON のみ読む（不変条件 #5）。

入力:
- env: `STAGING_AUTH_SECRET`（min 32）、`STAGING_WORKER_HOST`（bare host）
- CLI: `--account=<TEST-MEM-01|TEST-ADM-01...>`, `--out=<path>`, 任意 `--ttl=<sec>`（既定 600）, `--dry-run`

```ts
import { readFileSync } from "node:fs";
import { asMemberId, signSessionJwt } from "@ubm-hyogo/shared";

const MANIFEST_PATH = "apps/api/migrations/seed/test-accounts.manifest.json";
const COOKIE_NAME = "authjs.session-token";
const DEFAULT_TTL_SEC = 600;

interface ManifestMember { memberId: string; email: string; fullName: string; loginable: boolean; publicListed: boolean; isDeleted: boolean; storageStateName: string; }
interface ManifestAdmin { adminId: string; email: string; displayName: string; active: boolean; storageStateName: string; }

export async function mintTestAccountStorageState(args: {
  account: string; out: string; ttlSec?: number; dryRun?: boolean;
}, env = process.env): Promise<{ summary: { account: string; sub: string; exp: number; isAdmin: boolean } }> {
  const secret = env.STAGING_AUTH_SECRET; const host = env.STAGING_WORKER_HOST;
  if (!secret || secret.length < 32) throw new Error("mint-test-account: STAGING_AUTH_SECRET missing/short");
  if (!host) throw new Error("mint-test-account: STAGING_WORKER_HOST missing");
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as { accounts: ManifestAccount[] };
  const acct = manifest.accounts.find((a) => a.id === args.account);
  if (!acct) throw new Error(`mint-test-account: unknown --account ${args.account}`);
  if (!acct.loginable) throw new Error(`mint-test-account: account ${args.account} is not loginable`);
  const iat = Math.floor(Date.now() / 1000);
  const ttl = args.ttlSec ?? DEFAULT_TTL_SEC;
  const exp = iat + ttl;
  const token = await signSessionJwt(secret, {
    memberId: asMemberId(acct.id), email: acct.email, isAdmin: acct.isAdmin, nowSeconds: iat, ttlSeconds: ttl,
  });
  const storage = { cookies: [{ name: COOKIE_NAME, value: token, domain: host, path: "/", expires: exp, httpOnly: true, secure: true, sameSite: "Lax" as const }], origins: [] };
  if (!args.dryRun) { /* mkdir + writeFile(args.out, JSON, mode 0o600) */ }
  return { summary: { account: acct.id, sub: acct.id, exp, isAdmin: acct.isAdmin } };
}
```

副作用: `--out` に storageState JSON を書き出し（mode 0o600）。cookie / token 値は stdout / log に出さず、summary（account/sub/exp/isAdmin）のみ出力。出力先は `.gitignore` 配下（`apps/web/.gitignore` の `playwright/.auth/`）。`loginable===false` のアカウント（MEM-04/05/08）は mint を拒否する（ログイン不可ゲートの整合）。

## 7. package.json scripts 追加

`apps/api/package.json` の `scripts` に:

```json
"seed:test-accounts:gen": "node --import tsx ../../scripts/gen-test-accounts-seed.mjs",
"seed:test-accounts": "bash ../../scripts/seed-test-accounts.sh"
```

root `package.json` の `scripts` に（ルートからのパススルー）:

```json
"seed:test-accounts": "bash scripts/seed-test-accounts.sh",
"seed:test-accounts:gen": "node --import tsx scripts/gen-test-accounts-seed.mjs"
```

## 8. 実装順序とローカル検証

1. `catalog.ts` → `build-seed-sql.ts` → `index.ts` を実装し `mise exec -- pnpm typecheck` を通す。
2. `node --import tsx scripts/gen-test-accounts-seed.mjs` で 3 生成物を書き出す。
3. catalog/build/seed の 3 spec を実装し以下で GREEN を確認:
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/testing/test-accounts/__tests__/catalog.spec.ts src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
   mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=../../vitest.d1.config.ts
   ```
4. `node --import tsx scripts/gen-test-accounts-seed.mjs --check` が exit 0（drift なし）。
5. `mise exec -- pnpm lint`（HEX 直書き 0 / `*.test.ts` 0）。
