# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 4 (テスト戦略) |
| 下流 | Phase 6 (異常系検証) |
| 状態 | pending |

## 目的

実装エージェントが **コードを書かずに本仕様書だけで作業着手できる** 状態を作る。順序付き runbook + コード placeholder + sanity check で構成する。

## runbook（順序付き）

### Step 0: 前提確認
```bash
# 上流 Wave 完了確認
test -f apps/api/db/migrations/0001_init.sql || exit 1   # 01a 完了
test -f packages/shared/src/view-models/member.ts || exit 1   # 01b 完了

# 依存追加（このタスクでは原則追加しない、bundle size 観点）
pnpm --filter apps/api list  # 既存 deps 確認
```

### Step 1: ディレクトリ作成
```bash
mkdir -p apps/api/src/repository/_shared
mkdir -p apps/api/src/repository/__fixtures__
mkdir -p apps/api/src/repository/__tests__
```

### Step 2: branded type 配置
```ts
// apps/api/src/repository/_shared/brand.ts
declare const MemberIdBrand: unique symbol;
declare const ResponseIdBrand: unique symbol;
declare const StableKeyBrand: unique symbol;

export type MemberId = string & { readonly [MemberIdBrand]: true };
export type ResponseId = string & { readonly [ResponseIdBrand]: true };
export type StableKey = string & { readonly [StableKeyBrand]: true };

export const memberId = (s: string): MemberId => s as MemberId;
export const responseId = (s: string): ResponseId => s as ResponseId;
export const stableKey = (s: string): StableKey => s as StableKey;
```

### Step 3: db ctx 配置
```ts
// apps/api/src/repository/_shared/db.ts
import type { D1Database } from "@cloudflare/workers-types";

export interface DbCtx {
  readonly db: D1Database;
}

export const ctx = (env: { DB: D1Database }): DbCtx => ({ db: env.DB });
```

### Step 4: row 型と repository 8 種を実装

実装順:
1. `members.ts`
2. `identities.ts`
3. `status.ts`
4. `responses.ts`
5. `responseSections.ts`
6. `responseFields.ts`
7. `fieldVisibility.ts`
8. `memberTags.ts`

各ファイルの placeholder：

```ts
// apps/api/src/repository/members.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";
import type { MemberId } from "./_shared/brand.ts";

export interface MemberRow {
  memberId: MemberId;
  // ... 01a の DDL に対応する列を全て
}

export const findMemberById = async (c: DbCtx, id: MemberId): Promise<MemberRow | null> => {
  const row = await c.db.prepare("SELECT * FROM members WHERE member_id = ?1 LIMIT 1")
    .bind(id).first<MemberRow>();
  return row ?? null;
};

export const listMembersByIds = async (c: DbCtx, ids: MemberId[]): Promise<MemberRow[]> => {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `?${i + 1}`).join(",");
  const result = await c.db.prepare(`SELECT * FROM members WHERE member_id IN (${placeholders})`)
    .bind(...ids).all<MemberRow>();
  return result.results;
};

// upsertMember は 03b sync からのみ呼ばれる前提
export const upsertMember = async (c: DbCtx, row: NewMemberRow): Promise<MemberRow> => {
  // INSERT ... ON CONFLICT(member_id) DO UPDATE SET ...
  // 必ず idempotent
};
```

```ts
// apps/api/src/repository/identities.ts （placeholder）
export const findIdentityByEmail = async (c: DbCtx, email: string): Promise<MemberIdentityRow | null> => {
  return await c.db.prepare("SELECT * FROM member_identities WHERE response_email = ?1 LIMIT 1")
    .bind(email).first<MemberIdentityRow>();
};

export const updateCurrentResponse = async (
  c: DbCtx, id: MemberId, current: ResponseId, lastSubmittedAt: string
): Promise<void> => {
  await c.db.prepare(
    "UPDATE member_identities SET current_response_id = ?1, last_submitted_at = ?2, updated_at = datetime('now') WHERE member_id = ?3"
  ).bind(current, lastSubmittedAt, id).run();
};
```

```ts
// apps/api/src/repository/responses.ts （placeholder、本文 partial update API なし）
export const findResponseById = async (c: DbCtx, rid: ResponseId): Promise<MemberResponseRow | null> => {
  const row = await c.db.prepare("SELECT * FROM member_responses WHERE response_id = ?1 LIMIT 1")
    .bind(rid).first<MemberResponseRow>();
  if (!row) return null;
  return parseAnswersJson(row); // answers_json を AnswerValue map に
};

export const findCurrentResponse = async (c: DbCtx, mid: MemberId): Promise<MemberResponseRow | null> => {
  // identities.current_response_id を取得 → responses を取得（IN 1 件）
  return await c.db.prepare(`
    SELECT mr.* FROM member_responses mr
    INNER JOIN member_identities mi ON mi.current_response_id = mr.response_id
    WHERE mi.member_id = ?1
    LIMIT 1
  `).bind(mid).first<MemberResponseRow>();
};

// upsertResponse は 03b sync からのみ呼ばれる前提
// 本文の partial update / patch API は提供しない（不変条件 #4 / #11）
```

### Step 5: builder 配置

```ts
// apps/api/src/repository/_shared/builder.ts （placeholder）
import * as identities from "../identities.ts";
import * as status from "../status.ts";
import * as responses from "../responses.ts";
import * as sections from "../responseSections.ts";
import * as fields from "../responseFields.ts";
import * as visibility from "../fieldVisibility.ts";
import * as tags from "../memberTags.ts";
import type { DbCtx } from "./db.ts";
import type { MemberId } from "./brand.ts";
import type { PublicMemberProfile, MemberProfile, AdminMemberDetailView, AdminMemberNote } from "@ubm/shared";

export const buildPublicMemberProfile = async (c: DbCtx, mid: MemberId): Promise<PublicMemberProfile | null> => {
  const st = await status.getStatus(c, mid);
  if (!st) return null;
  if (st.isDeleted || st.publicConsent !== "consented" || st.publishState !== "public") return null;

  const [resp, sec, fld, vis, tg] = await Promise.all([
    responses.findCurrentResponse(c, mid),
    /* ... */
  ]);
  if (!resp) return null;

  // visibility = 'public' の field のみで sections を組み立て
  // adminNotes は含めない（不変条件 #12）
  return assemblePublic({ st, resp, sec, fld, vis, tg });
};

export const buildMemberProfile = async (c: DbCtx, sessionMemberId: MemberId): Promise<MemberProfile | null> => {
  // visibility = 'public' | 'member' の field を含める
  // adminNotes は含めない
};

export const buildAdminMemberDetailView = async (
  c: DbCtx, mid: MemberId, adminNotes: AdminMemberNote[]
): Promise<AdminMemberDetailView | null> => {
  // 全 visibility の field を含め、引数で受けた adminNotes を attach
};
```

### Step 6: fixture / test 配置
```bash
# Phase 4 で定義した verify suite を実装
touch apps/api/src/repository/__fixtures__/members.fixture.ts
touch apps/api/src/repository/__fixtures__/responses.fixture.ts
touch apps/api/src/repository/__tests__/{members,identities,status,responses,responseSections,responseFields,fieldVisibility,memberTags,builder,brand}.test.ts
```

### Step 7: dependency-cruiser ルール

```js
// .dependency-cruiser.cjs（02c がメインで管理、ここでは 02a 観点ルール案を渡す）
module.exports = {
  forbidden: [
    {
      name: "repo-no-cross-domain",
      from: { path: "^apps/api/src/repository/(members|identities|status|responses|responseSections|responseFields|fieldVisibility|memberTags)\\.ts$" },
      to:   { path: "^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue|adminUsers|adminMemberNotes|auditLog|syncJobs|magicTokens)\\.ts$" },
      severity: "error",
    },
    {
      name: "web-no-d1-import",
      from: { path: "^apps/web/" },
      to:   { path: "^apps/api/src/repository/" },
      severity: "error",
    },
  ],
};
```

### Step 8: sanity check
```bash
pnpm --filter apps/api typecheck
pnpm --filter apps/api test repository
pnpm depcruise --config .dependency-cruiser.cjs apps/api
```

## sanity check 一覧

| # | 確認項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | TS コンパイル | `pnpm --filter apps/api typecheck` | 0 error |
| 2 | repository unit | `pnpm --filter apps/api test repository` | 全 pass |
| 3 | brand 型エラー | `tsc --noEmit __tests__/brand.test.ts` で意図的エラーが期待通り発生 | コメント通り |
| 4 | dependency-cruiser | `pnpm depcruise apps/api` | 02b/02c へ 0 violation |
| 5 | bundle size | `pnpm --filter apps/api build && du -sh dist/` | < 1MB |

## 実行タスク

1. runbook を `outputs/phase-05/runbook.md` に転記
2. 各 placeholder を `outputs/phase-05/main.md` の章として整理
3. sanity check 表を main.md に貼る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 4 outputs/phase-04/verify-suite.md | 実装到達目標 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | DDL / index |
| 必須 | doc/02-application-implementation/01a-... / 01b-... | 上流成果物 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook を異常系で叩く |
| Phase 7 | 実装 step を AC 検証に紐付け |
| Phase 8 | placeholder を DRY 化候補として抽出 |
| 03b / 04* / 08a | runbook の interface を再利用 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 本人本文 immutable | #4 | responses.ts に partial update が無い、コメントで明示 |
| D1 boundary | #5 | dependency-cruiser ルール有効 |
| GAS 非昇格 | #6 | runbook が GAS data.jsx を import しない |
| 型混同防止 | #7 | brand.ts が Step 2 で先に配置 |
| admin 本文編集禁止 | #11 | builder で `adminNotes` 引数受取 |
| view model 分離 | #12 | builder の戻り値型が分離（PublicMemberProfile / MemberProfile / AdminMemberDetailView） |
| 無料枠 | #10 | bundle size sanity check / N+1 排除 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 転記 | 5 | pending | 7 ステップ |
| 2 | placeholder 整理 | 5 | pending | 8 + builder |
| 3 | sanity check 表 | 5 | pending | 5 項目 |
| 4 | dep-cruiser ルール案 | 5 | pending | 02c へ引き渡し |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | placeholder + sanity check |
| ドキュメント | outputs/phase-05/runbook.md | 7 step runbook |

## 完了条件

- [ ] 7 step runbook が完成
- [ ] placeholder が 9 ファイル分書かれている
- [ ] sanity check 5 項目が定義
- [ ] dep-cruiser ルール案が 02c に引き渡せる形

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜4 が completed
- [ ] outputs/phase-05/{main,runbook}.md が配置済み
- [ ] runbook が Step 0〜8 まで連続して読める
- [ ] artifacts.json の Phase 5 を completed に更新

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ事項: 7 step runbook / placeholder / sanity check
- ブロック条件: placeholder が 9 ファイル分そろわない場合は Phase 6 に進めない
