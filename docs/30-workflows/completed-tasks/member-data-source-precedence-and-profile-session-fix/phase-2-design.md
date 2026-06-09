---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 2
name: 設計
status: completed
updated: 2026-06-09
---

# Phase 2 — 設計（member-data-source-precedence-and-profile-session-fix）

> Phase 1 §5 の実コード検証で確定した事実を正本とする。型・シグネチャは後続実装者が
> そのまま書ける粒度で TypeScript ブロックに固定する。

---

## 0. 状態所有権（state ownership）

| 層 | 所有データ | 書込責務 | 読込責務 |
|----|-----------|---------|---------|
| **L1 = admin-managed** | `member_field_overrides`（member_id, stable_key 単位の確定編集値）| Lane C: `PUT /admin/member-fields/:memberId` のみ | projection 純関数（最優先）|
| **L2/L3 = response 系** | `member_responses.answers_json` / `response_fields` / `member_identities` / `member_status` | Lane B: sync ジョブ（Form 再回答 / Sheets seed）| projection 純関数（override 無時の値）|
| **provenance** | `member_identities.seed_source` / `seed_imported_at` | Lane B: 初回 seed 時のみ mark | Lane B: import-once 判定 |
| **projection（merge）** | なし（純粋関数・state を持たない） | — | use-case / builder 層が DI して呼ぶ |

> 不変条件 #5: L1/L2/L3 すべて `apps/api` 内（D1 binding は web から触らない）。

---

## 1. データモデル設計（Lane A）

### 1.1 `member_field_overrides` テーブル DDL

```sql
-- apps/api/migrations/0027_member_field_overrides.sql
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

-- L3 import-once provenance（member_identities へ列追加）。
-- 既存 member には Sheets seed を再取込しないための記録。
-- SQLite の ALTER TABLE ADD COLUMN は単一列ずつ。
ALTER TABLE member_identities ADD COLUMN seed_source     TEXT;     -- 'sheets' | 'forms' | NULL（未取込）
ALTER TABLE member_identities ADD COLUMN seed_imported_at TEXT;    -- ISO8601 / NULL
```

**FK 方針**: 既存テーブル群（`member_status`, `member_field_visibility`, `member_attendance`）が FK 制約を持たず member_id を論理参照する設計に合わせ、`member_field_overrides` も **FK 制約を張らない**（D1 の PRAGMA foreign_keys 既定 OFF・既存 0026 で member_status に限り FK 導入済だが override は admin 編集のみで identity 経由作成のため孤児リスク低）。整合は app 層（`PUT` 時に identity 存在を確認）で担保する。

**provenance を別テーブルにしない根拠**: import-once 判定は「member（identity）が既に存在するか」と等価であり、`member_identities` は既に member 単位の正本テーブル。`seed_source` / `seed_imported_at` の 2 列追加で十分。別テーブル `member_sync_provenance` を作ると identity と 1:1 の冗長テーブルが増え、join コストと整合維持コストが上がるため不採用。

### 1.2 repository: `memberFieldOverrides.ts`（新規）

```ts
// apps/api/src/repository/memberFieldOverrides.ts
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

/** member の全 override を取得（detail / profile / admin view 用） */
export async function listOverridesByMemberId(
  c: DbCtx,
  memberId: MemberId,
): Promise<MemberFieldOverrideRow[]>;

/** 複数 member の override を 1 query で取得（公開一覧の N+1 防止） */
export async function listOverridesByMemberIds(
  c: DbCtx,
  memberIds: readonly MemberId[],
): Promise<MemberFieldOverrideRow[]>;

/** override を upsert（admin PUT 用・value_json=null で明示クリア） */
export async function upsertOverride(
  c: DbCtx,
  input: {
    memberId: MemberId;
    stableKey: StableKey;
    valueJson: string | null;
    rawValueJson: string | null;
    updatedBy: string;
  },
): Promise<void>;

/** override を物理削除（admin が「同期値に戻す」操作・任意） */
export async function deleteOverride(
  c: DbCtx,
  memberId: MemberId,
  stableKey: StableKey,
): Promise<void>;
```

```sql
-- upsertOverride の SQL
INSERT INTO member_field_overrides (member_id, stable_key, value_json, raw_value_json, updated_by, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
ON CONFLICT(member_id, stable_key) DO UPDATE SET
  value_json = excluded.value_json,
  raw_value_json = excluded.raw_value_json,
  updated_by = excluded.updated_by,
  updated_at = datetime('now');
```

### 1.3 `identities.ts` provenance helper（編集）

```ts
// apps/api/src/repository/identities.ts に追加
export async function getSeedProvenance(
  c: DbCtx,
  memberId: MemberId,
): Promise<{ seedSource: string | null; seedImportedAt: string | null } | null>;

/** 初回 seed 時のみ provenance を記録（既に値があれば no-op = import-once の根拠） */
export async function markSeedImported(
  c: DbCtx,
  memberId: MemberId,
  source: "sheets" | "forms",
  importedAt: string,
): Promise<void>;
```

```sql
-- markSeedImported（既に seed_source が入っていれば上書きしない）
UPDATE member_identities
SET seed_source = ?2, seed_imported_at = ?3, updated_at = datetime('now')
WHERE member_id = ?1 AND seed_source IS NULL;
```

---

## 2. 取込（ingestion）設計（Lane B）

### 2.1 import-once の本質（SSOT §2 / DEC）

- **L3（Sheets seed）**: `response_email` に対応する `member_identities` が**未登録のときだけ**取り込む。既存 member には seed を 1 行も書かない。
- **L2（Form 再回答）**: 既存 member への再回答は従来通り `member_responses`/`response_fields` snapshot を更新（`current_response_id` 切替も従来通り）。**ただし L1 override 済みフィールドの表示は projection で override が勝つ**（書込側では override を一切触らない＝ DEC-4）。
- provenance: 初回 member 作成（identity 新規）時に `markSeedImported(memberId, source, now)` を 1 回呼ぶ。

### 2.2 Sheets 経路 import-once ガード（`sync-sheets-to-d1.ts`）

`upsertMembers` を呼ぶ前に、各 row の `responseEmail` で `findIdentityByEmail` を引き、**既存ありなら seed をスキップ**する。

```ts
// 概念フロー（sync-sheets-to-d1.ts runSync 内の per-row 処理）
for (const row of rows) {
  const existing = await findIdentityByEmail(dbCtx, asResponseEmail(row.responseEmail));
  if (existing) {
    // import-once: 既存 member には seed を書かない（L1/L2 を尊重）
    skipped.push({ rowIndex: row.rowIndex, reason: "import-once: identity already exists" });
    continue;
  }
  // 未登録 → Form 経路と同じ書込モデルで seed する（§2.3）
  await seedMemberFromSheetRow(dbCtx, row);
}
```

### 2.3 🔴 Sheets 書込モデルの構造修正（RC-1 真因・Phase 1 §5.3）

現行 `upsertMembers` は存在しない `member_responses` 列へ INSERT して**必ず失敗**する。これを **Form 経路（`processResponse`）と同じ書込モデルへ合流**させる。`sheets-to-members.ts` の出力を `MemberResponse` 互換 shape に変え、共通の seed 関数で書く。

#### `DB_FIELD_MAP` 是正（実ヘッダー → stableKey）

key を実ヘッダー（Phase 1 §5.1）へ全面是正。value は `STABLE_KEY.*`（camelCase）。

```ts
const DB_FIELD_MAP: Record<string, string> = {
  "タイムスタンプ": "submittedAt",                       // system
  "メールアドレス": "responseEmail",                     // system
  "お名前（フルネーム）": STABLE_KEY.fullName,
  "あだ名・ニックネーム": STABLE_KEY.nickname,
  "お住まい（都道府県・市区町村）": STABLE_KEY.location,
  "生年月日": STABLE_KEY.birthDate,
  "職業・仕事内容": STABLE_KEY.occupation,
  "出身地": STABLE_KEY.hometown,
  "UBM区画": STABLE_KEY.ubmZone,
  "UBM参加ステータス": STABLE_KEY.ubmMembershipType,
  "UBMに入会・参加した時期": STABLE_KEY.ubmJoinDate,
  "ビジネス概要": STABLE_KEY.businessOverview,
  "得意分野・スキル": STABLE_KEY.skills,
  "現在の課題・相談したいこと": STABLE_KEY.challenges,
  "提供できること・協力できること": STABLE_KEY.canProvide,
  "趣味・好きなこと": STABLE_KEY.hobbies,
  "最近ハマっていること": STABLE_KEY.recentInterest,
  "座右の銘・大切にしている言葉": STABLE_KEY.motto,
  "仕事以外の活動": STABLE_KEY.otherActivities,
  "ホームページ URL": STABLE_KEY.urlWebsite,
  "Facebook URL": STABLE_KEY.urlFacebook,
  "Instagram URL": STABLE_KEY.urlInstagram,
  "Threads URL": STABLE_KEY.urlThreads,
  "YouTube URL": STABLE_KEY.urlYoutube,
  "TikTok URL": STABLE_KEY.urlTiktok,
  "X（Twitter）URL": STABLE_KEY.urlX,
  "ブログ URL": STABLE_KEY.urlBlog,
  "note URL": STABLE_KEY.urlNote,
  "LinkedIn URL": STABLE_KEY.urlLinkedin,
  "その他のSNS・URL": STABLE_KEY.urlOthers,
  "自己紹介・一言メッセージ": STABLE_KEY.selfIntroduction,
  "ホームページへの掲載に同意しますか？": STABLE_KEY.publicConsent,
  "勧誘ルール・免責事項への同意": STABLE_KEY.rulesConsent,
};
```

#### `CONSENT_MAP` 実値追加（RC-2）

```ts
const CONSENT_MAP: Record<string, "consented" | "declined" | "unknown"> = {
  "はい": "consented", "同意する": "consented",
  "同意する（掲載ok）": "consented",       // 実値 "同意する（掲載OK）" を lowerCase 後にヒット
  "yes": "consented", "true": "consented",
  "いいえ": "declined", "同意しない": "declined", "no": "declined", "false": "declined",
};
```
> 注: `mapSheetRows` は `value.trim().toLowerCase()` で照合するため key を lowerCase で持つ。`"同意する（掲載OK）".toLowerCase() === "同意する（掲載ok）"`（全角は不変・OK のみ ok 化）。

#### zone / status 値ドメイン正規化（enum 整合・Phase 1 §5.10）

`response_fields.value_json` は enum 値で格納する必要がある（UbmZoneZ / UbmMembershipTypeZ）。

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

#### 出力 shape（`MemberResponse` 互換）

`mapSheetRows` は `MemberRow`（個別フィールド）をやめ、**`MemberResponse` 互換**（`answersByStableKey` / `rawAnswersByQuestionId` / consent は別途）を返す。これにより Sheets/Form の seed が同一の `seedMemberResponse()` を共有できる。

```ts
export interface SheetSeedResult {
  readonly rows: SheetSeedRow[];
  readonly skipped: Array<{ rowIndex: number; reason: string }>;
}
export interface SheetSeedRow {
  readonly responseEmail: string;
  readonly submittedAt: string;
  readonly responseId: string;                         // `${submittedAt}__${email}`.toLowerCase()
  readonly answersByStableKey: Record<string, string | null>; // 既知 31 key（enum 正規化済）
  readonly publicConsent: "consented" | "declined" | "unknown";
  readonly rulesConsent: "consented" | "declined" | "unknown";
  readonly extraByLabel: Record<string, string>;       // unmapped ヘッダ（将来の alias 用）
}
```

#### 共通 seed 書込関数

```ts
// sync-sheets-to-d1.ts（または mappers 隣接の新規 helper）
async function seedMemberFromSheetRow(c: DbCtx, row: SheetSeedRow): Promise<void> {
  const memberId = asMemberId(crypto.randomUUID());
  const responseId = asResponseId(row.responseId);
  // 1. identity + status（Form 経路の createMemberWithStatus 相当）
  await createMemberWithStatus(c, {
    memberId, responseEmail: row.responseEmail,
    currentResponseId: responseId, firstResponseId: responseId,
    lastSubmittedAt: row.submittedAt,
  });
  // 2. member_responses（answers_json 形式・既存 upsertResponse を再利用）
  await upsertResponse(c, {
    responseId, formId: SHEETS_SEED_FORM_ID, revisionId: "sheets-seed",
    schemaHash: "sheets-seed", responseEmail: asResponseEmail(row.responseEmail),
    submittedAt: row.submittedAt, editResponseUrl: null,
    answersJson: JSON.stringify(row.answersByStableKey),
    rawAnswersJson: "{}", extraFieldsJson: JSON.stringify(row.extraByLabel),
    unmappedQuestionIdsJson: JSON.stringify(Object.keys(row.extraByLabel)),
    searchText: Object.values(row.answersByStableKey).filter(Boolean).join(" "),
  });
  // 3. response_fields（known stableKey 単位・既存 upsertKnownField を再利用）
  for (const [stableKey, value] of Object.entries(row.answersByStableKey)) {
    if (value === null) continue;
    await upsertKnownField(c, responseId, asStableKey(stableKey),
      JSON.stringify(value), JSON.stringify(value));
  }
  // 4. consent snapshot（既存 setConsentSnapshot を再利用）
  await setConsentSnapshot(c, memberId, row.publicConsent, row.rulesConsent);
  // 5. provenance（import-once 根拠）
  await markSeedImported(c, memberId, "sheets", row.submittedAt);
}
```

> これにより Sheets seed が **`response_fields` に書かれ表示に反映される**（AC-1）。`UPSERT_COLUMNS`/`ROW_FIELD_ORDER`（存在しない列）は削除。

### 2.4 Form 経路 import-once + provenance（`sync-forms-responses.ts`）

`processResponse` は現状「既存 identity なら current_response 切替・新規なら create」を行う。本タスクでは:
- **新規 identity 作成時（`isFirstResponse`）**に `markSeedImported(memberId, "forms", resp.submittedAt)` を 1 回追加（provenance 整合）。
- 既存 identity への Form 再回答は**従来通り**（L2 = 本人更新の正式経路・DEC-3）。override は触らない（DEC-4 = projection で勝つ）。
- import-once は Sheets 側の責務であり、Form 経路は import-once でブロックしない（Form は本人更新の正式経路のため毎回反映が正）。

### 2.5 Form mapper label 是正（`packages/integrations/google/src/forms/mapper.ts`）

```ts
// STABLE_KEY_BY_LABEL の 2 箇所是正（Phase 1 §5.5）
- "X URL": "urlX",
+ "X（Twitter）URL": "urlX",
- "その他の SNS・URL": "urlOthers",
+ "その他のSNS・URL": "urlOthers",
```
> 不変条件 #1 配慮: 実ラベルに合わせるのが第一だが、将来のラベル変更に強くするため Phase 2 §補遺で「alias テーブル駆動」を検討課題として残す（本タスクでは label 直接是正 + 既存 `schema_diff_queue`/alias 機構の活用範囲内に留める。新機構は作らない＝ YAGNI）。

---

## 3. 表示プレシデンス純関数設計（Lane C）

### 3.1 `field-precedence.ts`（新規・純関数・state 無し）

```ts
// apps/api/src/use-cases/_shared/field-precedence.ts

/** 1 member 分の override マップ（stableKey -> 表示用 effective 値の JSON 文字列 or null） */
export type OverrideMap = ReadonlyMap<string, string | null>;

/** response_fields 由来の値マップ（stableKey -> value_json） */
export type ResponseFieldMap = ReadonlyMap<string, string | null>;

/**
 * L1 > L2/L3 で 1 フィールドの表示値（JSON 文字列）を解決する純関数。
 * - override に key が存在すれば override 値（null 含む = 明示クリア）を返す。
 * - 無ければ response_fields の値。
 * - どちらも無ければ null。
 */
export function resolveFieldValue(
  stableKey: string,
  overrides: OverrideMap,
  responseFields: ResponseFieldMap,
): string | null {
  if (overrides.has(stableKey)) return overrides.get(stableKey) ?? null;
  return responseFields.get(stableKey) ?? null;
}

/**
 * response_fields 配列に override をマージし、表示用の merged フィールド配列を返す純関数。
 * - 入力 fields は response_fields 由来（{ stableKey, valueJson }）。
 * - override にしか無い stableKey も結果に含める（admin が新規追加した値）。
 * - override.valueJson === null は「クリア」= 結果から除外（表示しない）。
 */
export function mergeFieldProjection(
  fields: ReadonlyArray<{ stableKey: string; valueJson: string | null }>,
  overrides: OverrideMap,
): Array<{ stableKey: string; valueJson: string | null; source: "override" | "response" }> {
  const out = new Map<string, { stableKey: string; valueJson: string | null; source: "override" | "response" }>();
  for (const f of fields) {
    out.set(f.stableKey, { stableKey: f.stableKey, valueJson: f.valueJson, source: "response" });
  }
  for (const [stableKey, valueJson] of overrides) {
    if (valueJson === null) { out.delete(stableKey); continue; } // 明示クリア
    out.set(stableKey, { stableKey, valueJson, source: "override" });
  }
  return [...out.values()];
}

/** OverrideMap を repository 行から構築するヘルパー（route/use-case 共通） */
export function toOverrideMap(
  rows: ReadonlyArray<{ stable_key: string; value_json: string | null }>,
): OverrideMap {
  return new Map(rows.map((r) => [r.stable_key, r.value_json]));
}
```

> branch 100% を Phase 4 で狙う: override 有/無 × response 有/無 × null クリア × override-only key の組合せ。

### 3.2 list use-case への適用（`list-public-members.ts`）

```ts
// memberRows から memberIds を取得後（既存 photoMap 取得と同じ波）、override を batch 取得
const overrideRows = await listOverridesByMemberIds(ctx, memberRows.map((m) => asMemberId(m.member_id)));
const overridesByMember = new Map<string, OverrideMap>(); // member_id -> OverrideMap
// 既存 fieldsByResponseId（SUMMARY_KEYS）と override を member 単位でマージ:
// item 構築時に resolveFieldValue(STABLE_KEY.fullName, overridesByMember.get(m.member_id) ?? emptyMap, respFieldMap)
```
- public read endpoint の**外形 shape は不変**（item の keys は従来通り fullName/nickname/...）。中身の解決規則だけ override 優先に変える（AC-6）。
- override の `value_json` は表示用に `parseJsonString` を通す（既存ヘルパー）。

### 3.3 detail use-case への適用（`get-public-member-profile.ts`）

```ts
const overrideRows = await listOverridesByMemberId(ctx, memberId as MemberId);
const overrides = toOverrideMap(overrideRows);
const mergedFields = mergeFieldProjection(
  fieldRows.map((f) => ({ stableKey: f.stable_key, valueJson: f.value_json })),
  overrides,
);
// toPublicMemberProfile に渡す fields を mergedFields から構築（value は parseJson）
```
- 公開フィルタ（EXISTS / consent / publish_state）は不変。override は**表示値のみ**に効く（公開可否判定は member_status のまま）。

### 3.4 builder への適用（`_shared/builder.ts`・/me/profile / admin detail）

`buildMemberProfile` / `buildAdminMemberDetailView` の `fields`（`listFieldsByResponseId` 結果）を `buildSections` に渡す前に `mergeFieldProjection` で override マージ。`buildPublicMemberProfile` も同様（公開詳細が builder 経由の場合に備え統一）。override 取得は `listOverridesByMemberId(c, mid)` を Promise.all 波に追加。

> 🔴 設計判断: list use-case は `response_fields` を直接読む独自経路、detail use-case と builder は別経路。**3 経路すべてが同一純関数（`field-precedence.ts`）を呼ぶ**ことで override 適用ロジックの単一責務を保つ（重複ロジック禁止）。

---

## 4. admin override 書込 endpoint 契約（Lane C）

### 4.1 route: `routes/admin/member-fields.ts`（新規）

認証: `requireAdmin`（既存 middleware）。path に `:memberId` を含む（admin route は member 指定が許容・`/me/*` の不変条件 #11 とは別系統）。

#### `GET /admin/member-fields/:memberId`

編集可能な stableKey 一覧 + 各 key の現在の override 値 / response 由来値 / effective 値を返す（編集 UI の初期表示用）。

```ts
// response zod schema
export const AdminMemberFieldsResponseZ = z.object({
  memberId: z.string().min(1),
  fields: z.array(z.object({
    stableKey: z.string().min(1),
    label: z.string(),                 // schema_questions 由来 label（無ければ空）
    overrideValue: z.unknown().nullable(),   // L1（未設定なら null）
    responseValue: z.unknown().nullable(),   // L2/L3
    effectiveValue: z.unknown().nullable(),  // resolveFieldValue 結果
    hasOverride: z.boolean(),
  })),
}).strict();
```

#### `PUT /admin/member-fields/:memberId`

request body で複数フィールドの override を一括上書き（部分更新可）。

```ts
export const AdminMemberFieldsUpdateBodyZ = z.object({
  fields: z.array(z.object({
    stableKey: z.enum(STABLE_KEY_LIST as [string, ...string[]]),  // 既知 31 key のみ許容
    // value: null = override クリア（同期値に戻す）。string = 上書き。
    value: z.union([z.string(), z.null()]),
  })).min(1),
}).strict();

export const AdminMemberFieldsUpdateResponseZ = z.object({
  memberId: z.string().min(1),
  updated: z.number().int().nonnegative(),
}).strict();
```

**副作用**:
1. identity 存在確認（`findIdentityByMemberId`）。無ければ 404。
2. 各 field を `upsertOverride`（value=null は `deleteOverride` または value_json=null upsert＝設計上は **value_json=null upsert** に統一し、projection の「明示クリア = 結果から除外」と整合）。
3. `auditLogProvider.append`（action `admin.member.field_override`・before/after に stableKey と値・actor=admin email）。
4. consent / publish_state は触らない（member_status は別 endpoint の責務）。

**バリデーション**: value は zod の各 stableKey 型で検証しない（自由編集を許容するが、enum 系 stableKey（ubmZone/ubmMembershipType/consent）は enum 値を期待）。実装は最小: 文字列 or null のみ受理し、enum 妥当性は UI 側 select で担保（過剰バリデーションは YAGNI）。

> **[FB-SDK-07-2]**: 本タスクの新規 surface は IPC ではなく HTTP route（Hono）。Preload API は無関係（Electron ではない）。`requireAdmin` 経由のみ・直接 D1 アクセス無し。
> **[FB-SDK-07-2 内部型→公開 DTO 変換表]**:

| 内部（repository） | 公開 DTO（route response） |
|--------------------|---------------------------|
| `MemberFieldOverrideRow.value_json`（JSON 文字列）| `overrideValue`（parse 済 unknown）|
| `ResponseFieldRow.value_json` | `responseValue`（parse 済）|
| `resolveFieldValue()` 結果（JSON 文字列）| `effectiveValue`（parse 済）|

### 4.2 mount

admin app の router 構築箇所（既存 `member-status` / `member-notes` の mount 隣）に `app.route("/member-fields", createMemberFieldsRoute(deps))` を追加。既存 admin route の DI パターン（`requireAdmin` + provider middleware）に合流。

---

## 5. /profile セッションエラー設計（Lane E）

### 5.1 真因（Phase 1 §5.8 確定）

汎用「セッション情報を取得できませんでした」に至る経路:
- (A) `sessionGuard` 内の DB 例外 → 500 → web `MEMBER_SESSION_500` → 汎用エラー。
- (B) staging で transport 未解決（`resolveApiFetch` throw）→ web `MEMBER_SESSION_FAILED` → 汎用エラー。
- 「会員未登録ユーザー（管理者等）」は 401→`/login` redirect になり、ログイン済なら redirect ループになり得る（汎用エラーではないが UX 不良）。

### 5.2 API 側の正規化（`session-guard.ts` / `routes/me/index.ts`）

- `sessionGuard`: DB lookup を try/catch で囲み、**例外は 500 で漏らさず**、lookup 失敗（例外）も含めて「session 不整合 = 401 UNAUTHENTICATED」に倒す（fail-closed・既存 401 分岐と統一）。ただし真の internal error（D1 unavailable）は 500 を維持し web 側で transport/500 として扱う。
- **会員未登録の明示分岐**: session は有効だが `member_identities` に該当なし（= 管理者など member レコード無）の場合、現状 401。本タスクでは **新コード `MEMBER_UNREGISTERED`（403 もしくは 200 + authGateState 拡張）を導入せず**、web 側で「401 + session cookie あり + /me 自体は到達不能」を会員未登録として扱う案は脆い。
  → **採用案**: `GET /me` は session が通れば 200 を返せる（DB lookup 無）。`sessionGuard` の identity 不在 401 を、`GET /me` に限り **`MEMBER_UNREGISTERED`（200 + `{ user: null, registered: false }`）** に倒す分岐は不変条件 #11（memberId を出さない）と衝突しないため安全。ただし `/me` の MeSessionResponse shape を変える＝外形契約変更になるため、最小変更として **`/me` は 401 のまま維持**し、**web 側で「401 を受けたら一度だけ会員未登録案内へ分岐できる軽量 probe」は導入しない**（過剰）。
  → **最終決定（最小・確実）**: Lane E のスコープを「(1) sessionGuard の DB 例外を 500 として正しく分類（握り潰さない）+ (2) web `profile/page.tsx` のエラー分岐を `MEMBER_SESSION_FAILED`（transport）/ `MEMBER_SESSION_500`（API 内部）/ `MEMBER_SESSION_404` で文言分離 + (3) transport 未解決の根因（staging binding）を Lane E phase-1 実機ログで特定し、binding 設定 or fallback で解消」に確定する。会員未登録ユーザーの体験は「401→/login」を維持しつつ、login 画面に「会員登録がまだの方へ」の案内文を出す（redirect ループの心理的緩和・最小 UI）。

### 5.3 web 側エラー分岐（`profile/page.tsx`）

```ts
if (!meResult.ok) {
  switch (meResult.error.code) {
    case "MEMBER_SESSION_404":   // 会員未登録 → 再ログイン/登録案内
      return <SectionError title="会員情報が見つかりませんでした"
        detail="会員登録が完了していない可能性があります。再ログインするか、登録をご確認ください。"
        actionHref="/login?redirect=/profile" actionLabel="再ログイン" />;
    case "MEMBER_SESSION_FAILED": // transport 未解決（staging binding 等）
      return <SectionError title="ただいま接続できません"
        detail="サーバーへの接続に問題が発生しています。時間をおいて再度お試しください。"
        retryHref="/profile" />;
    default:                      // 500 等
      return <SectionError title="セッション情報を取得できませんでした"
        detail="時間をおいて再読み込みしてください。" retryHref="/profile" />;
  }
}
```
> `MEMBER_SESSION_404` は現状 `/me` が 404 を返さない（200 or 401）ため通常到達しないが、将来 `/me` が会員未登録を 404 に倒す改修に備えて分岐を用意（防御的）。

### 5.4 transport fail-safe（`transport.ts`・必要時）

`resolveApiFetch` の throw メッセージは `safeServerFetch` の `statusFromError` で status を拾えない（3桁無）→ `MEMBER_SESSION_FAILED`。これは意図通り（§5.3 の FAILED 分岐に倒る）。Lane E phase-1 で staging の binding 実態を確認し、binding 未設定が真因なら `apps/web/wrangler.toml` の `API_SERVICE` binding / `INTERNAL_API_BASE_URL` 設定で解消（コード変更ではなく config・user-gated）。

---

## 6. Lane topology（並列・直列の締め方）

```
[直列ゲート]          [並列 wave-1]                    [直列締め]
Lane A (data model) ─┬─> Lane B (ingestion)        ─┐
                     ├─> Lane C-1 (field-precedence)─┤
                     │   純関数 + list/detail/builder │
                     └─> Lane E (profile session)   ─┤ (A 非依存・独立並列可)
                                                      │
                         Lane C-2 (admin PUT route) ──┴─> Lane D (web UI: editor) ─> 統合検証
```

| 段階 | Lane | 並列度 |
|------|------|--------|
| 1. 直列ゲート | A（migration + repository）| 1 |
| 2. 並列 wave-1 | B / C-1（projection 純関数 + 3 経路適用）/ E | 3（≤3 並列）|
| 3. 直列締め | C-2（admin PUT route）→ D（web editor）→ 統合検証 | 1 |

> Lane E は A 非依存で wave-1 に同居可（独立）。Lane C-2 は C-1（純関数）と A（repository）に依存するため締めに置く。

### SubAgent lane 割当（spec 作成・本ワークフローも同構造）

- 本 Phase 1-3 spec は設計エージェント直列で作成（依存ゲート）。
- 実装フェーズ（Phase 4 以降）は wave-1 を 3 SubAgent（B / C-1 / E）に割り、C-2→D を締めの SubAgent で直列実行。
- validation lane（typecheck / lint / vitest / token gate）は**直列で締める**（並列にしない）。

---

## 7. 既存コンポーネント再利用（FB-SDK-07-1）

| 用途 | 再利用する既存資産 | 新規実装 |
|------|---------------------|---------|
| admin field 編集フォーム | `FormField` primitive（不変条件 #9・`<input>` 直書き禁止）| `MemberFieldEditor.tsx`（FormField を組合せるだけ）|
| admin mutation | `@/features/admin/hooks/useAdminMutation`（不変条件 #10）| 既存 hook に endpoint 渡すのみ |
| admin client | 既存 admin API client パターン | `PUT /admin/member-fields/:memberId` 呼び出し追加 |
| repository write モデル | `createMemberWithStatus` / `upsertResponse` / `upsertKnownField` / `setConsentSnapshot`（Form 経路の既存関数）| Sheets seed が再利用（§2.3）|
| projection | なし（新規純関数）| `field-precedence.ts`（最小・state 無し）|
| error UI | `SectionError`（既存）| 文言分岐のみ（§5.3）|

> 新規 primitive は生やさない（不変条件 #3 = プロトタイプ primitives 群で構成）。`FormField` + 既存 button/callout で完結。

---

## 8. ステップ間 state ownership（admin editor・[Feedback W1-02b-2]）

`MemberFieldEditor` は単一フォーム（ウィザードではない）だが、state 所有を明示:

| state | 所有者 | 引き渡し |
|-------|--------|---------|
| 編集中フィールド値 | `MemberFieldEditor` internal（`useState` per stableKey）| 初期値は `GET /admin/member-fields/:id` の `effectiveValue` |
| dirty 判定 | internal（初期値との比較）| — |
| 保存処理 | `useAdminMutation`（PUT）| 成功後に親の member detail を再 fetch（既存 invalidate パターン）|
| override クリア | UI の「同期値に戻す」ボタン → value=null を PUT | projection で結果除外 |

> internal state は `effectiveValue` prop 変更時に再同期（`useEffect([effectiveValue], () => setLocal(...))`）— [Feedback STATE-DETAIL-03] 対応。
