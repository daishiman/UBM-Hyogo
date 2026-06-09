---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 5
name: 実装
status: completed
implementation_mode: new
updated: 2026-06-09
---

# Phase 5 — 実装仕様（member-data-source-precedence-and-profile-session-fix）

> 正本: `_shared-context.md`（§10b CORR-1..8 が最新訂正）・`phase-2-design.md`（DDL/シグネチャの正本）。
> 本ファイルは後続実装者が**そのまま書ける粒度**で各 Lane の変更を確定する。
> コードの実装・commit・PR・D1 適用・deploy は本 Phase では行わない（すべて user-gated）。
> D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。

---

## 0. 実装計画: 新規 / 修正ファイルパス一覧（Feedback RT-03）

| # | パス | 種別 | Lane |
|---|------|------|------|
| 1 | `apps/api/migrations/0028_member_field_overrides.sql` | 新規 | A |
| 2 | `apps/api/src/repository/memberFieldOverrides.ts` | 新規 | A |
| 3 | `apps/api/src/repository/identities.ts` | 編集 | A |
| 4 | `apps/api/src/jobs/mappers/sheets-to-members.ts` | 編集 | B |
| 5 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 編集 | B |
| 6 | `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | B |
| 7 | `packages/integrations/google/src/forms/mapper.ts` | 編集 | B |
| 8 | `apps/api/src/use-cases/_shared/field-precedence.ts` | 新規 | C |
| 9 | `apps/api/src/use-cases/public/list-public-members.ts` | 編集 | C |
| 10 | `apps/api/src/use-cases/public/get-public-member-profile.ts` | 編集 | C |
| 11 | `apps/api/src/repository/_shared/builder.ts` | 編集 | C |
| 12 | `apps/api/src/routes/admin/member-fields.ts` | 新規 | C |
| 13 | `apps/api/src/index.ts` | 編集（mount） | C |
| 14 | `apps/web/src/components/admin/MemberFieldEditor.tsx` | 新規 | D |
| 15 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集（editor 配置） | D |
| 16 | `apps/web/src/features/admin/api/members.ts` | 編集（PUT client 追加） | D |
| 17 | `apps/api/src/middleware/session-guard.ts` | 編集 | E |
| 18 | `apps/web/app/(member)/profile/page.tsx` | 編集（分岐） | E |

> 🔴 Phase 1 §6 からの確定訂正:
> - admin 会員詳細 UI は `[id]` route ではなく **drawer**（`MemberDrawer.tsx`・実コード確認済）。Lane D の editor は drawer 内へ配置する。
> - admin API client は `apps/web/src/features/admin/api/members.ts`（既存 `fetchMemberTags` 等が在る）に PUT を足す。
> - route mount は `apps/api/src/index.ts`（`app.route("/admin", adminMemberStatusRoute)` 群の隣）。
> - `routes/me/index.ts` は **編集不要**（`/me/profile` は既に `PROFILE_UNAVAILABLE` 404 を返す。E-2 はそれを contract test で固定するだけ）。Lane E のコード変更は `session-guard.ts` と web `page.tsx` の 2 点。

---

## Lane A — データモデル基盤（NON_VISUAL・直列ゲート）

### A-1. migration（新規）`apps/api/migrations/0028_member_field_overrides.sql`

DDL 全文（`phase-2-design.md` §1.1 を正本・採番 CORR-6）:

```sql
-- apps/api/migrations/0028_member_field_overrides.sql
-- L1 admin override（Form schema 外の admin-managed data・不変条件 #4）。
-- 再同期（L2 Form 再回答 / L3 Sheets seed）で絶対に上書きされない確定編集値。

CREATE TABLE IF NOT EXISTS member_field_overrides (
  member_id       TEXT NOT NULL,
  stable_key      TEXT NOT NULL,            -- camelCase（STABLE_KEY 値・例 "fullName"）
  value_json      TEXT,                     -- 表示用 effective 値（JSON.stringify 済・null 可 = 明示クリア）
  raw_value_json  TEXT,                     -- 任意: 入力原文（監査用・null 可）
  updated_by      TEXT NOT NULL,            -- admin email（actor）
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_id, stable_key)
);

CREATE INDEX IF NOT EXISTS idx_member_field_overrides_member
  ON member_field_overrides(member_id);

-- L3 import-once provenance（member_identities へ列追加・SQLite は単一列ずつ）。
ALTER TABLE member_identities ADD COLUMN seed_source      TEXT;   -- 'sheets' | 'forms' | NULL（未取込）
ALTER TABLE member_identities ADD COLUMN seed_imported_at TEXT;   -- ISO8601 / NULL
```

- **FK 方針**: 既存 admin-managed テーブル群に合わせ FK 制約を張らない。整合は app 層（PUT 時 identity 存在確認）で担保。
- 入力: なし（DDL）。出力: テーブル + 2 列。副作用: schema 変更（**適用は user-gated**）。

### A-2. repository（新規）`apps/api/src/repository/memberFieldOverrides.ts`

```ts
import type { DbCtx } from "./_shared/db";
import type { MemberId, StableKey } from "./_shared/brand";

export interface MemberFieldOverrideRow {
  member_id: string;
  stable_key: string;
  value_json: string | null;
  raw_value_json: string | null;
  updated_by: string;
  updated_at: string;
}

/** member の全 override を取得（detail / profile / admin view 用）。 */
export async function listOverridesByMemberId(
  c: DbCtx,
  memberId: MemberId,
): Promise<MemberFieldOverrideRow[]> {
  const r = await c.db
    .prepare("SELECT * FROM member_field_overrides WHERE member_id = ?1")
    .bind(memberId)
    .all<MemberFieldOverrideRow>();
  return r.results;
}

/** 複数 member の override を 1 query で取得（公開一覧の N+1 防止）。 */
export async function listOverridesByMemberIds(
  c: DbCtx,
  memberIds: readonly MemberId[],
): Promise<MemberFieldOverrideRow[]> {
  if (memberIds.length === 0) return [];
  const ph = memberIds.map((_, i) => `?${i + 1}`).join(", ");
  const r = await c.db
    .prepare(`SELECT * FROM member_field_overrides WHERE member_id IN (${ph})`)
    .bind(...memberIds)
    .all<MemberFieldOverrideRow>();
  return r.results;
}

/** override を upsert（admin PUT 用・value_json=null で明示クリア）。 */
export async function upsertOverride(
  c: DbCtx,
  input: {
    memberId: MemberId;
    stableKey: StableKey;
    valueJson: string | null;
    rawValueJson: string | null;
    updatedBy: string;
  },
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO member_field_overrides
        (member_id, stable_key, value_json, raw_value_json, updated_by, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
       ON CONFLICT(member_id, stable_key) DO UPDATE SET
         value_json = excluded.value_json,
         raw_value_json = excluded.raw_value_json,
         updated_by = excluded.updated_by,
         updated_at = datetime('now')`,
    )
    .bind(
      input.memberId,
      input.stableKey,
      input.valueJson,
      input.rawValueJson,
      input.updatedBy,
    )
    .run();
}

/** override を物理削除（任意・PUT は value_json=null upsert に統一するので主には未使用）。 */
export async function deleteOverride(
  c: DbCtx,
  memberId: MemberId,
  stableKey: StableKey,
): Promise<void> {
  await c.db
    .prepare("DELETE FROM member_field_overrides WHERE member_id = ?1 AND stable_key = ?2")
    .bind(memberId, stableKey)
    .run();
}
```

- 入力/出力/副作用: 各関数 docstring の通り。`upsertOverride` のみ D1 write、他は read / delete。
- **設計判断**: PUT の「クリア」は `deleteOverride` ではなく **value_json=null の upsert** に統一（`mergeFieldProjection` の「null=結果から除外」と整合・監査で「いつ誰がクリアしたか」を残せる）。`deleteOverride` は将来用に export だけ用意。

### A-3. `apps/api/src/repository/identities.ts`（編集・provenance helper 追加）

既存 export 群の末尾に追加（`phase-2-design.md` §1.3）:

```ts
export async function getSeedProvenance(
  c: DbCtx,
  memberId: MemberId,
): Promise<{ seedSource: string | null; seedImportedAt: string | null } | null> {
  const row = await c.db
    .prepare(
      "SELECT seed_source, seed_imported_at FROM member_identities WHERE member_id = ?1 LIMIT 1",
    )
    .bind(memberId)
    .first<{ seed_source: string | null; seed_imported_at: string | null }>();
  if (!row) return null;
  return { seedSource: row.seed_source, seedImportedAt: row.seed_imported_at };
}

/** 初回 seed 時のみ provenance を記録（既に値があれば no-op = import-once の根拠）。 */
export async function markSeedImported(
  c: DbCtx,
  memberId: MemberId,
  source: "sheets" | "forms",
  importedAt: string,
): Promise<void> {
  await c.db
    .prepare(
      `UPDATE member_identities
       SET seed_source = ?2, seed_imported_at = ?3, updated_at = datetime('now')
       WHERE member_id = ?1 AND seed_source IS NULL`,
    )
    .bind(memberId, source, importedAt)
    .run();
}
```

- `MemberIdentityRow`（`members.ts`）には `seed_source`/`seed_imported_at` を追加しない（`SELECT *` で拾えるが型に列挙不要・読み手は `getSeedProvenance` を使う）。型を足したい場合は optional で追加。

### Lane A DoD
- [ ] `0028_member_field_overrides.sql` が命名規則（`00NN_snake_case.sql`）に合致・採番 0028。
- [ ] `memberFieldOverrides.ts` の 4 関数が export され A-1 spec 全 pass。
- [ ] `markSeedImported` の二重呼び出しが no-op（A-2 spec）。
- [ ] `pnpm typecheck`（apps/api）緑。
- 想定動作確認: in-memory D1 に 0028 を apply→ upsert/list/delete 往復、`markSeedImported` 冪等を spec で確認。

---

## Lane B — 取込是正（NON_VISUAL・wave-1）

### B-1. `apps/api/src/jobs/mappers/sheets-to-members.ts`（編集）

#### (a) `DB_FIELD_MAP` を実ヘッダーへ全面是正（RC-1・`phase-2-design.md` §2.3）

key を Phase 1 §5.1 の実 33 ヘッダーへ、value を `STABLE_KEY.*`（camelCase）へ。**全文は phase-2-design.md §2.3 の `DB_FIELD_MAP` ブロックを正本とする**（33 entry）。要点:
- `"お名前（フルネーム）"→fullName`, `"あだ名・ニックネーム"→nickname`, `"お住まい（都道府県・市区町村）"→location`,
- `"職業・仕事内容"→occupation`, `"UBM区画"→ubmZone`, `"UBM参加ステータス"→ubmMembershipType`, `"UBMに入会・参加した時期"→ubmJoinDate`,
- `"ビジネス概要"→businessOverview`, `"得意分野・スキル"→skills`, `"現在の課題・相談したいこと"→challenges`, `"提供できること・協力できること"→canProvide`,
- `"X（Twitter）URL"→urlX`, `"その他のSNS・URL"→urlOthers`, `"ホームページへの掲載に同意しますか？"→publicConsent`, `"勧誘ルール・免責事項への同意"→rulesConsent`,
- `"タイムスタンプ"→"submittedAt"`, `"メールアドレス"→"responseEmail"`（system）。
- 既存一致は維持: `"生年月日"→birthDate`, `"出身地"→hometown`。

#### (b) `CONSENT_MAP` に実値追加（RC-2）

```ts
const CONSENT_MAP: Record<string, "consented" | "declined" | "unknown"> = {
  "はい": "consented", "同意する": "consented",
  "同意する（掲載ok）": "consented",   // 実値 "同意する（掲載OK）".toLowerCase()
  "yes": "consented", "true": "consented",
  "いいえ": "declined", "同意しない": "declined", "no": "declined", "false": "declined",
};
```
照合は既存通り `CONSENT_MAP[value.trim().toLowerCase()] ?? "unknown"`。`"同意する（掲載OK）".toLowerCase()` は全角不変・`OK→ok` のみ。

#### (c) zone / status 値ドメイン正規化マップ（CORR-5）

```ts
const UBM_ZONE_MAP: Record<string, "0_to_1" | "1_to_10" | "10_to_100"> = {
  "0→1": "0_to_1", "0to1": "0_to_1",
  "1→10": "1_to_10", "1to10": "1_to_10",
  "10→100": "10_to_100", "10to100": "10_to_100",
};
const UBM_MEMBERSHIP_MAP: Record<string, "member" | "non_member" | "academy"> = {
  "会員": "member", "非会員": "non_member", "アカデミー": "academy",
};
```
適用: `ubmZone` 値は `UBM_ZONE_MAP[v] ?? v`、`ubmMembershipType` は `UBM_MEMBERSHIP_MAP[v] ?? v` で正規化してから `answersByStableKey` へ。未知値は raw 保持（防御的・WEEKGRD-02 = 例外を投げない）。

#### (d) 出力 shape を `SheetSeedRow` へ（RC-1 構造修正）

`MemberRow`（個別フィールド・存在しない列前提）を廃止し `SheetSeedResult`/`SheetSeedRow` を返す（`phase-2-design.md` §2.3）:

```ts
export interface SheetSeedResult {
  readonly rows: SheetSeedRow[];
  readonly skipped: Array<{ rowIndex: number; reason: string }>;
}
export interface SheetSeedRow {
  readonly responseEmail: string;
  readonly submittedAt: string;
  readonly responseId: string;                                 // `${submittedAt}__${email}`.toLowerCase()
  readonly answersByStableKey: Record<string, string | null>;  // 既知 31 key（zone/status enum 正規化済）
  readonly publicConsent: "consented" | "declined" | "unknown";
  readonly rulesConsent: "consented" | "declined" | "unknown";
  readonly extraByLabel: Record<string, string>;               // unmapped ヘッダ（将来 alias 用）
}

export function mapSheetRows(values: string[][]): SheetSeedResult;
```

- consent stableKey（publicConsent/rulesConsent）は `answersByStableKey` には入れず、`publicConsent`/`rulesConsent` フィールドに `CONSENT_MAP` 経由で格納（既存 sync-forms と同じく consent は member_status へ separate で書くため）。
- 入力: `string[][]`（header + body）。出力: `SheetSeedResult`。副作用: なし（純変換）。

### B-2. `apps/api/src/jobs/sync-sheets-to-d1.ts`（編集）

#### (a) 存在しない列前提の `UPSERT_COLUMNS` / `ROW_FIELD_ORDER` / `upsertMembers` を削除

現行 L215-310 の `member_responses` 個別列 INSERT は全削除（CORR-1: SQL レベルで壊れている）。

#### (b) per-row import-once ガード + 共通 seed 関数（`phase-2-design.md` §2.2 / §2.3）

`runSync` の map 後ループを以下へ差し替える:

```ts
import { ctx as makeCtx } from "../repository/_shared/db";
import { findIdentityByEmail, markSeedImported } from "../repository/identities";
import { createMemberWithStatus } from "../repository/members";
import { upsertResponse } from "../repository/responses";
import { upsertKnownField } from "../repository/responseFields";
import { setConsentSnapshot } from "../repository/status";
import {
  asMemberId, asResponseId, asResponseEmail, asStableKey,
} from "@ubm-hyogo/shared";

const SHEETS_SEED_FORM_ID = "<実 formId 定数を seed 専用に固定>"; // CLAUDE.md formId / R-2

async function seedMemberFromSheetRow(c: DbCtx, row: SheetSeedRow): Promise<void> {
  const memberId = asMemberId(crypto.randomUUID());
  const responseId = asResponseId(row.responseId);
  await createMemberWithStatus(c, {
    memberId, responseEmail: asResponseEmail(row.responseEmail),
    currentResponseId: responseId, firstResponseId: responseId,
    lastSubmittedAt: row.submittedAt,
  });
  await upsertResponse(c, {
    responseId, formId: SHEETS_SEED_FORM_ID, revisionId: "sheets-seed",
    schemaHash: "sheets-seed", responseEmail: asResponseEmail(row.responseEmail),
    submittedAt: row.submittedAt, editResponseUrl: null,
    answersJson: JSON.stringify(row.answersByStableKey),
    rawAnswersJson: "{}", extraFieldsJson: JSON.stringify(row.extraByLabel),
    unmappedQuestionIdsJson: JSON.stringify(Object.keys(row.extraByLabel)),
    searchText: Object.values(row.answersByStableKey).filter(Boolean).join(" "),
  });
  for (const [stableKey, value] of Object.entries(row.answersByStableKey)) {
    if (value === null) continue;
    await upsertKnownField(c, responseId, asStableKey(stableKey),
      JSON.stringify(value), JSON.stringify(value));
  }
  await setConsentSnapshot(c, memberId, row.publicConsent, row.rulesConsent);
  await markSeedImported(c, memberId, "sheets", row.submittedAt);
}
```

ループ本体（`upsertMembers(batch)` 経由を置換）:
```ts
const dbCtx = makeCtx({ DB: env.DB });
let upserted = 0;
for (const row of rows) {
  const existing = await findIdentityByEmail(dbCtx, asResponseEmail(row.responseEmail));
  if (existing) {
    skipped.push({ rowIndex: -1, reason: "import-once: identity already exists" });
    continue; // L3 import-once: 既存 member には seed を書かない（AC-3）
  }
  try {
    await withRetry(() => seedMemberFromSheetRow(dbCtx, row), { maxRetries, baseMs: 50 });
    upserted += 1;
  } catch (err) { errors.push(err instanceof Error ? err.message : String(err)); }
}
```
- `WriteQueue` / `withRetry` / batch chunk は維持してよい（per-row だが seed 関数を queue.enqueue でラップ可）。`fetched`/`failed` 集計は seed 件数ベースへ調整。
- 入力: `SyncEnv`/`SyncOptions`。出力: `SyncResult`（不変）。副作用: 新規 member の identity+response+response_fields+status+provenance を D1 へ書く。既存 member は skip。

### B-3. `apps/api/src/jobs/sync-forms-responses.ts`（編集・provenance mark のみ）

`processResponse` の新規 identity 作成パス（`isFirstResponse=true`・現行 L404-415）に provenance mark を 1 行追加:

```ts
import { markSeedImported } from "../repository/identities";
// ... createMemberWithStatus(...) の直後（writeCount += 2 の後）:
await markSeedImported(dbCtx, memberId, "forms", resp.submittedAt);
```
- 既存 identity への Form 再回答は**従来通り**（import-once でブロックしない・L2 本人更新経路は毎回反映が正・DEC-3/§2.4）。override は touch しない（DEC-4 = projection で勝つ）。
- 入力/出力: 不変（`PerResponseStats`）。副作用: 新規作成時のみ provenance 1 write 追加（`markSeedImported` は no-op になり得るが新規作成直後は seed_source NULL なので必ず記録）。

### B-4. `packages/integrations/google/src/forms/mapper.ts`（編集・2 ラベル是正・CORR-3）

`STABLE_KEY_BY_LABEL` の 2 entry を実ヘッダーへ:
```ts
- "X URL": "urlX",
+ "X（Twitter）URL": "urlX",
- "その他の SNS・URL": "urlOthers",   // 全角スペース有（旧）
+ "その他のSNS・URL": "urlOthers",     // 全角スペース無（実ヘッダー）
```
残り 29 ラベルは一致のため不変。新 alias 機構は作らない（YAGNI・不変条件 #1）。

### Lane B DoD
- [ ] `mapSheetRows` が実 33 ヘッダーで unmapped 0・consent 実値ヒット・zone/status enum 化（B-1 spec 全 pass）。
- [ ] Sheets 経路が `response_fields` に書く（B-2 spec）・既存 member skip（import-once）。
- [ ] Form 経路の新規作成で provenance mark（B-3 spec）。
- [ ] mapper の 2 ラベル是正（B-4 spec）。
- [ ] `pnpm typecheck`（apps/api + packages/integrations/google）緑。

---

## Lane C — 表示プレシデンス純関数 + admin override 書込 API（NON_VISUAL）

### C-1. `apps/api/src/use-cases/_shared/field-precedence.ts`（新規・純関数）

`phase-2-design.md` §3.1 の `resolveFieldValue` / `mergeFieldProjection` / `toOverrideMap` / `OverrideMap` / `ResponseFieldMap` をそのまま実装（state 無し・branch 100% を Phase 4 で担保）。

- 入力: 純粋な値（Map / array）。出力: 解決済み値 / merged 配列。副作用: なし。
- 3 経路（list use-case / detail use-case / builder）から DI せず直接 import して使う（ロジック単一化・CORR-8）。

### C-2a. `list-public-members.ts`（編集）

`memberRows` 取得後、override を batch 取得して SUMMARY_KEYS projection にマージ:

```ts
import { listOverridesByMemberIds } from "../../repository/memberFieldOverrides";
import { resolveFieldValue, toOverrideMap, type OverrideMap } from "../_shared/field-precedence";
import { asMemberId } from "@ubm-hyogo/shared";

// fieldsByResponseId 構築と同じ波で:
const overrideRows = memberRows.length > 0
  ? await listOverridesByMemberIds(ctx, memberRows.map((m) => asMemberId(m.member_id)))
  : [];
const overridesByMember = new Map<string, OverrideMap>();
for (const m of memberRows) {
  overridesByMember.set(m.member_id,
    toOverrideMap(overrideRows.filter((r) => r.member_id === m.member_id)));
}
const EMPTY: OverrideMap = new Map();

// item 構築（既存 byKey を responseFieldMap として渡す）:
const ov = overridesByMember.get(m.member_id) ?? EMPTY;
const respMap: ResponseFieldMap = byKey; // Map<stableKey, value_json|null>
items.push({
  memberId: m.member_id,
  fullName: parseJsonString(resolveFieldValue(STABLE_KEY.fullName, ov, respMap)),
  nickname: parseJsonString(resolveFieldValue(STABLE_KEY.nickname, ov, respMap)),
  occupation: parseJsonString(resolveFieldValue(STABLE_KEY.occupation, ov, respMap)),
  location: parseJsonString(resolveFieldValue(STABLE_KEY.location, ov, respMap)),
  ubmZone: parseJsonNullable(resolveFieldValue(STABLE_KEY.ubmZone, ov, respMap)),
  ubmMembershipType: parseJsonNullable(resolveFieldValue(STABLE_KEY.ubmMembershipType, ov, respMap)),
  photoUrl: photoMap.get(m.member_id),
  ...(wantTags ? { tags: tagsByMember?.get(m.member_id) ?? [] } : {}),
});
```
- **外形 shape 不変**（item の keys は従来通り・AC-6）。`parseJsonString`/`parseJsonNullable` は既存ヘルパー流用。`byKey` は `Map<string,string|null>` で `ResponseFieldMap` と互換。
- 副作用: D1 read 1 query 追加（override batch）。

### C-2b. `get-public-member-profile.ts`（編集）

```ts
import { listOverridesByMemberId } from "../../repository/memberFieldOverrides";
import { mergeFieldProjection, toOverrideMap } from "../_shared/field-precedence";
import { asMemberId } from "@ubm-hyogo/shared";

const overrides = toOverrideMap(await listOverridesByMemberId(ctx, asMemberId(memberId)));
const mergedFields = mergeFieldProjection(
  fieldRows.map((f) => ({ stableKey: f.stable_key, valueJson: f.value_json })),
  overrides,
);
// toPublicMemberProfile の fields を mergedFields から構築（value は parseJson）:
fields: mergedFields.map((f) => ({ stableKey: f.stableKey, value: parseJson(f.valueJson) })),
```
- 公開フィルタ（EXISTS / consent / publish_state）は不変・override は表示値のみに効く（公開可否は member_status のまま）。

### C-2c. `builder.ts`（編集・/me/profile と admin detail）

`buildMemberProfile` / `buildAdminMemberDetailView` / `buildPublicMemberProfile` で `listFieldsByResponseId` 結果を `buildSections` に渡す前に override マージ:

```ts
import { listOverridesByMemberId } from "../memberFieldOverrides";
import { mergeFieldProjection, toOverrideMap } from "../../use-cases/_shared/field-precedence";

// Promise.all 波に追加: listOverridesByMemberId(c, mid)
// fields を以下へ差し替え:
const overrides = toOverrideMap(overrideRows);
const mergedFields = mergeFieldProjection(
  fields.map((f) => ({ stableKey: f.stable_key, valueJson: f.value_json })),
  overrides,
).map((f) => ({ stable_key: f.stableKey, value_json: f.valueJson })); // buildSections 入力 shape へ戻す
// buildSections(sections, mergedFields, visibilityMap, allowed, resolver)
```
- `extractSummary` は `response.answers_json` を読むため override が効かない → summary 用には override 反映後の値が必要なら `mergedFields` から summary を再構築するか、summary は response 由来のまま（list/detail/profile の fields が override 反映されれば AC-6 充足。summary は header 表示用で fields が正本）。**決定**: summary は response 由来を維持し、表示の正本は `sections`（merged fields）とする。詳細は Phase 8 で重複排除を確認。
- 副作用: 各 build で override read 1 query 追加。

### C-3. `apps/api/src/routes/admin/member-fields.ts`（新規）

`member-status.ts` の DI パターン（`requireAdmin` + `writeTagNoteProviderMiddleware` + `requireProvider(auditLogProvider)`）に合流。

```ts
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asMemberId, asStableKey, auditAction, adminEmail as toAdminEmail } from "../../repository/_shared/brand";
import { findMemberById, findCurrentResponse } from "../../repository/members"; // findCurrentResponse は responses.ts
import { listFieldsByResponseId } from "../../repository/responseFields";
import { listOverridesByMemberId, upsertOverride } from "../../repository/memberFieldOverrides";
import { resolveFieldValue, toOverrideMap } from "../../use-cases/_shared/field-precedence";
import { writeTagNoteProviderMiddleware, type WriteTagNoteProviderVariables } from "../../middleware/repository-providers";
import { requireProvider } from "../../repository/_shared/provider-context";
import { STABLE_KEY_LIST } from "@ubm-hyogo/shared"; // 既知 31 key 配列（無ければ Object.values(STABLE_KEY)）
import type { AdminRouteEnv } from "./_shared";

export const AdminMemberFieldsResponseZ = z.object({
  memberId: z.string().min(1),
  fields: z.array(z.object({
    stableKey: z.string().min(1),
    label: z.string(),
    overrideValue: z.unknown().nullable(),
    responseValue: z.unknown().nullable(),
    effectiveValue: z.unknown().nullable(),
    hasOverride: z.boolean(),
  })),
}).strict();

export const AdminMemberFieldsUpdateBodyZ = z.object({
  fields: z.array(z.object({
    stableKey: z.enum(STABLE_KEY_LIST as [string, ...string[]]),
    value: z.union([z.string(), z.null()]),
  })).min(1),
}).strict();

export const AdminMemberFieldsUpdateResponseZ = z.object({
  memberId: z.string().min(1),
  updated: z.number().int().nonnegative(),
}).strict();

export const createAdminMemberFieldsRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: Partial<WriteTagNoteProviderVariables>;
  }>();
  app.use("*", requireAdmin);
  app.use("*", writeTagNoteProviderMiddleware);

  app.get("/member-fields/:memberId", async (c) => {
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(c.req.param("memberId"));
    const identity = await findMemberById(db, mid);
    if (!identity) return c.json({ code: "NOT_FOUND" }, 404);
    const response = await findCurrentResponse(db, mid);
    const fieldRows = response ? await listFieldsByResponseId(db, asResponseId(response.response_id)) : [];
    const overrides = toOverrideMap(await listOverridesByMemberId(db, mid));
    const respMap = new Map(fieldRows.map((f) => [f.stable_key, f.value_json]));
    const parse = (s: string | null): unknown => (s === null ? null : JSON.parse(s));
    // 既知 31 key を列挙し各 key の effective を解決（label は schema_questions 由来・無ければ ""）
    const fields = STABLE_KEY_LIST.map((k) => {
      const eff = resolveFieldValue(k, overrides, respMap);
      return {
        stableKey: k,
        label: "", // 必要なら listFieldsByVersion から label join（最小実装は ""）
        overrideValue: overrides.has(k) ? parse(overrides.get(k) ?? null) : null,
        responseValue: parse(respMap.get(k) ?? null),
        effectiveValue: parse(eff),
        hasOverride: overrides.has(k),
      };
    });
    return c.json(AdminMemberFieldsResponseZ.parse({ memberId: String(mid), fields }));
  });

  app.put("/member-fields/:memberId", async (c) => {
    const db = ctx({ DB: c.env.DB });
    const mid = asMemberId(c.req.param("memberId"));
    const identity = await findMemberById(db, mid);
    if (!identity) return c.json({ code: "NOT_FOUND" }, 404);
    const raw = await c.req.json().catch(() => null);
    const parsed = AdminMemberFieldsUpdateBodyZ.safeParse(raw);
    if (!parsed.success) return c.json({ code: "INVALID_REQUEST", issues: parsed.error.issues }, 422);
    const actor = /* requireAdmin が解決した admin email。c.get 経由 or c.var */ "";
    const before = await listOverridesByMemberId(db, mid);
    for (const f of parsed.data.fields) {
      await upsertOverride(db, {
        memberId: mid,
        stableKey: asStableKey(f.stableKey),
        valueJson: f.value === null ? null : JSON.stringify(f.value),
        rawValueJson: f.value === null ? null : JSON.stringify(f.value),
        updatedBy: actor,
      });
    }
    const after = await listOverridesByMemberId(db, mid);
    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: null,
      actorEmail: actor ? toAdminEmail(actor) : null,
      action: auditAction("admin.member.field_override"),
      targetType: "member",
      targetId: String(mid),
      before: { overrides: before } as unknown as Record<string, unknown>,
      after: { overrides: after } as unknown as Record<string, unknown> | null,
    });
    return c.json(AdminMemberFieldsUpdateResponseZ.parse({ memberId: String(mid), updated: parsed.data.fields.length }));
  });

  return app;
};

export const adminMemberFieldsRoute = createAdminMemberFieldsRoute();
```

- **内部型→公開 DTO 変換表**（FB-SDK-07-2・`phase-2-design.md` §4.1）: `value_json`（JSON 文字列）→ `overrideValue`/`responseValue`/`effectiveValue`（parse 済 unknown）。
- actor（admin email）解決は既存 `requireAdmin` の context 注入方法に合わせる（`member-status.ts` は `SYSTEM_ADMIN` 固定だが、本 route は audit に実 actor を残すため `requireAdmin` が set する admin email を参照。未提供なら `member-status.ts` 同様 system 固定でも可・実装時に require-admin.ts を確認して確定）。
- `STABLE_KEY_LIST` が shared に無ければ `Object.values(STABLE_KEY)` で代替（31 key）。
- value は文字列 or null のみ受理（最小・enum 妥当性は UI select で担保・R-5）。
- 副作用: override upsert（複数）+ audit append 1 回。member_status は touch しない（AC-5）。

### C-4. `apps/api/src/index.ts`（編集・mount）

`adminMemberStatusRoute` mount（L275）の隣に追加:
```ts
import { adminMemberFieldsRoute } from "./routes/admin/member-fields";
// ...
app.route("/admin", adminMemberFieldsRoute);
```

### Lane C DoD
- [ ] `field-precedence.ts` 純関数 branch 100%（C-1 spec）。
- [ ] list/detail/builder が override マージ済み・外形 shape 不変（C-2a/b/c spec）。
- [ ] `GET/PUT /admin/member-fields/:memberId` contract test 全 pass（C-3）・404/422/audit/member_status 非干渉。
- [ ] route が index.ts に mount。
- [ ] `pnpm typecheck` / `pnpm lint`（apps/api）緑。

---

## Lane D — Web UI（VISUAL・直列締め）

### D-1. `apps/web/src/components/admin/MemberFieldEditor.tsx`（新規）

- `FormField` primitive 経由のみ（不変条件 #9・`<input>` 直書き禁止）。
- mutation は `@/features/admin/hooks/useAdminMutation`（不変条件 #10・PUT method）。
- props / state（Phase 2 §8）:

```ts
export interface MemberFieldEditorField {
  readonly stableKey: string;
  readonly label: string;
  readonly effectiveValue: string | null; // GET /admin/member-fields の effective
  readonly hasOverride: boolean;
}
export interface MemberFieldEditorProps {
  readonly memberId: string;
  readonly fields: readonly MemberFieldEditorField[];
  readonly onSaved?: () => void; // 成功後に親（MemberDrawer）を再 fetch
}
```

- 編集値は **internal state**（`useState` per stableKey・初期値 = `effectiveValue`）。`effectiveValue` prop 変更時に `useEffect([fields])` で再同期（STATE-DETAIL-03）。
- 保存: dirty な field のみ `{fields:[{stableKey, value}]}` を `useAdminMutation({method:"PUT"}).trigger(body, "/admin/member-fields/" + memberId)`。
- 「同期値に戻す」: 当該 field を `value: null` で送る（projection で除外 → response 由来へ戻る）。
- HEX 直書き禁止（OKLch トークン・不変条件 #5 of workflow）。

### D-2. `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集）

- 既存 drawer の fields 表示（KVList）の近くに `MemberFieldEditor` を配置。`memberId` を渡し、`onSaved` で既存の member detail 再 fetch（drawer は `useState<AdminMemberDetailView>` を持つので再 fetch 関数を呼ぶ）。
- 初期 fields は `GET /admin/member-fields/:memberId`（D-3 client）で取得。

### D-3. `apps/web/src/features/admin/api/members.ts`（編集）

既存 `fetchMemberTags` 等の隣に追加（既存 admin client パターン踏襲）:
```ts
export interface AdminMemberField {
  stableKey: string; label: string;
  overrideValue: unknown; responseValue: unknown; effectiveValue: unknown;
  hasOverride: boolean;
}
export async function fetchMemberFields(memberId: string): Promise<{ memberId: string; fields: AdminMemberField[] }>;
// PUT は useAdminMutation 経由で送るため client 関数は GET のみで足りる（mutation は hook が fetch）。
```

### Lane D DoD
- [ ] `MemberFieldEditor` が `FormField` + `useAdminMutation` で構成・新規 primitive を生やさない。
- [ ] effectiveValue prop 再同期・PUT body 生成・クリア（value=null）が D-1 spec で pass。
- [ ] drawer に editor が配置され、保存後に detail 再 fetch。
- [ ] HEX 直書き 0（design token gate）。
- [ ] `cd apps/web && pnpm vitest run src/components/admin/MemberFieldEditor.spec.tsx --root ../..` 緑。

---

## Lane E — /profile セッションエラー修正（NON_VISUAL・wave-1 独立）

### E-1. `apps/api/src/middleware/session-guard.ts`（編集）

現行は member 不在で 401（CORR-2: 既存挙動は正しい）。本タスクの変更は **DB lookup の例外を握り潰さず Hono の onError（500）に伝播させる**ことの明示化（fail-closed の境界整理）。

- 現状 `Promise.all([findIdentityByMemberId, getStatus])` が throw すると middleware が reject → Hono が 500 を返す（既に 500 化される）。本タスクでは「lookup 例外 = 500（transport/DB unavailable）」を**意図的挙動として spec 化**する（E-1 spec）。コード上の最小変更:
  - lookup を try/catch で囲み、**真の internal error（D1 例外）は rethrow（500 維持）**、`identity`/`status` が null（正常 lookup の結果不在）は 401（既存）。これにより「null=401」「throw=500」が明確に分離される（CORR-2 / fail-closed）。

```ts
let identity, status;
try {
  [identity, status] = await Promise.all([
    findIdentityByMemberId(ctx, memberId),
    getStatus(ctx, memberId),
  ]);
} catch (err) {
  // D1 unavailable 等の internal error は 500 として上位へ（握り潰さない）。
  throw err;
}
if (!identity || !status) {
  return c.json(errorBody("UNAUTHENTICATED"), 401); // member 不在は 401（#11・memberId 非露出）
}
```
- 入力/出力: 不変（middleware）。副作用: なし（分類の明確化のみ）。`/me` 外形契約（`MeSessionResponse`）は不変（R-1）。

### E-2. `routes/me/index.ts` — 変更不要（contract test のみ）

`/me`=200（session 通過時）・`/me/profile`=404 `{code:"PROFILE_UNAVAILABLE"}`（profile null 時）は既に実装済（L176-179）。E-2 spec で固定する。

### E-3. `apps/web/app/(member)/profile/page.tsx`（編集・エラー分岐）

現行は `MEMBER_SESSION_404` と default の 2 分岐。`MEMBER_SESSION_FAILED`（transport）を追加し文言分離（`phase-2-design.md` §5.3）:

```tsx
if (!meResult.ok) {
  switch (meResult.error.code) {
    case "MEMBER_SESSION_404":
      return (
        <main data-route="member" data-section-rhythm="comfortable">
          <SectionError
            title="会員情報が見つかりませんでした"
            detail="会員登録が完了していない可能性があります。再ログインするか、登録をご確認ください。"
            actionHref="/login?redirect=/profile" actionLabel="再ログイン" />
        </main>
      );
    case "MEMBER_SESSION_FAILED":
      return (
        <main data-route="member" data-section-rhythm="comfortable">
          <SectionError
            title="ただいま接続できません"
            detail="サーバーへの接続に問題が発生しています。時間をおいて再度お試しください。"
            retryHref="/profile" />
        </main>
      );
    default: // 500 等
      return (
        <main data-route="member" data-section-rhythm="comfortable">
          <SectionError
            title="セッション情報を取得できませんでした"
            detail="時間をおいて再読み込みしてください。" retryHref="/profile" />
        </main>
      );
  }
}
```
- `AuthRequiredError`（401）は `rethrowOn` で再 throw → `redirect("/login?redirect=/profile")`（既存・会員未登録の管理者はここに倒れる・R-1）。
- D1 直接アクセス追加なし（`fetchAuthed`/`safeServerFetch` 経由・AC-8）。HEX 直書きなし（既存 `SectionError` 使用）。

### E-4. transport 真因（config・user-gated）

staging で `MEMBER_SESSION_FAILED` が出る場合の真因（`API_SERVICE` binding / `INTERNAL_API_BASE_URL` 未解決）は Lane E phase-1 実機ログで特定し、`apps/web/wrangler.toml` の binding 設定で解消（**コード変更ではなく config・user-gated**・R-4）。本 Phase ではコードを fail-safe に倒すまで。

### Lane E DoD
- [ ] session-guard が「null=401 / throw=500」を分離（E-1 spec）。
- [ ] `/me`=200 / `/me/profile`=404 contract（E-2 spec）。
- [ ] web profile が 404/FAILED/default の 3 分岐で文言分離（E-3 spec）。
- [ ] `/me` 外形契約不変（R-1）。
- [ ] `cd apps/web && pnpm vitest run 'app/(member)/profile' --root ../..` 緑。

---

## 2. Lane 実装順序（Phase 2 §6 topology）

```
[直列ゲート]            [並列 wave-1（≤3）]                  [直列締め]
Lane A (migration+repo) ─┬─> Lane B (ingestion)        ─┐
                         ├─> Lane C-1 (純関数+list/detail/builder) ─┤
                         └─> Lane E (session fix・A 非依存) ─┤
                                                          │
                             Lane C-3/C-4 (admin PUT route+mount) ──┴─> Lane D (web editor) ─> 統合検証
```
1. **直列ゲート**: Lane A（後続が repository に依存）。
2. **並列 wave-1**: B / C-1（projection 適用部分）/ E を 3 SubAgent 並列。
3. **直列締め**: C-3/C-4（admin route）→ D（web）→ 統合検証（validation lane は直列）。

---

## 3. ローカル実行・検証コマンド（DoD 共通・migration apply は user-gated）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# API targeted（Phase 4 §2）
cd apps/api && mise exec -- pnpm vitest run \
  src/repository/memberFieldOverrides.spec.ts src/repository/identities.spec.ts \
  src/jobs/mappers/sheets-to-members.spec.ts src/jobs/sync-sheets-to-d1.spec.ts \
  src/jobs/sync-forms-responses.spec.ts src/use-cases/_shared/field-precedence.spec.ts \
  src/use-cases/public/list-public-members.spec.ts src/use-cases/public/get-public-member-profile.spec.ts \
  src/repository/_shared/builder.spec.ts src/routes/admin/member-fields.contract.spec.ts \
  src/routes/me/index.contract.spec.ts src/middleware/session-guard.spec.ts
# packages
cd packages/integrations/google && mise exec -- pnpm vitest run src/forms/mapper.spec.ts
# web（--root ../.. 必須）
cd apps/web && mise exec -- pnpm vitest run 'app/(member)/profile' src/components/admin/MemberFieldEditor.spec.tsx --root ../..
# design token gate（Lane D）: HEX 直書き 0
```

**user-gated（本 Phase で実行しない）**:
```bash
bash scripts/cf.sh d1 migrations apply <db>     # 0028 適用
# staging deploy / commit / PR / staging 実機 /me status 切り分け
```

---

## 4. 不変条件遵守（実装時チェック）

| # | 条件 | 担保 |
|---|------|------|
| #1 | schema 固定しすぎない | ラベルは実値準拠是正・alias 新機構なし |
| #2/#3 | consent キー / responseEmail system | stableKey/identity 経由維持 |
| #4 | admin-managed 分離 | override は `member_field_overrides`（Form schema 外） |
| #5 | D1 は apps/api に閉じる | web は `useAdminMutation`/`fetchAuthed`/`fetchMemberFields`（transport）経由のみ |
| #6 | test は `*.spec.ts` | 全 spec 準拠 |
| #7 | Form 再回答=本人更新経路 | L2 維持・import-once は Sheets のみ |
| #9/#10 | FormField / useAdminMutation | Lane D 準拠 |
