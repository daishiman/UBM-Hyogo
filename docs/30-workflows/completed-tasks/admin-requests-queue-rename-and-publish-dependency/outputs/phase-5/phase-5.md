# Phase 5 — 実装（TDD-Green）

`[実装区分: 実装仕様書]`（taskType=implementation / visualEvidence=VISUAL / workflow_state=implemented_local_evidence_captured）

> Phase 4 の Red を Green にする実装手順を Before→After で記述する。唯一の正本は `../../_shared-context.md`（SSOT）。
> 本フェーズはコード実装そのものは行わず、後続実装者がそのまま着手できる粒度（CONST_005: 対象ファイル/変更種別/シグネチャ/入出力・副作用）で書く。
> 不変条件: 新 endpoint 追加なし・D1 schema 変更なし・`apps/web` から D1 直接禁止・HEX 直書き禁止・spec は `*.spec.*` のみ。

---

## Lane A — テスト依頼 seed（apps/api / testing）

### A-1. catalog.ts に依頼定義を追加

対象ファイル: `apps/api/src/testing/test-accounts/catalog.ts`
変更種別: 編集（型 1 つ新規・配列 1 つ追加）

裏取り済み catalog 実値（payload を「現状と異なる遷移」にするための紐付け先確定）:

| member | catalog 実 publishState / isDeleted | 選定 note | 遷移 |
| --- | --- | --- | --- |
| TEST-MEM-01（[TEST] 公開 ログイン 太郎） | `public` / 未削除 | TEST-NOTE-V01 visibility `{"desiredState":"hidden"}` | public→hidden（確認価値あり） |
| TEST-MEM-02（[TEST] 会員限定 花子） | `member_only` / 未削除 | TEST-NOTE-V02 visibility `{"desiredState":"public"}` | member_only→public（確認価値あり） |
| TEST-MEM-07（[TEST] 多タグ 通知停止 七海） | `public` / 未削除 | TEST-NOTE-D01 delete `{}` | 未削除→退会（確認価値あり） |

> SSOT §4 第一候補と catalog 実値が一致したため差し替え不要。TEST-MEM-05 は `isDeleted:true` なので delete 先から除外済み（七海を採用）。

#### Before（型定義群の末尾・L43-51 付近の `TestAccountsCatalog` interface）

```ts
export interface TestAccountsCatalog {
  readonly formId: string;
  readonly revisionId: string;
  readonly schemaHash: string;
  readonly submittedAt: string;
  readonly members: readonly TestMemberAccount[];
  readonly admins: readonly TestAdminAccount[];
  readonly meetings: readonly TestMeeting[];
}
```

#### After（`TestRequest` 型を追加し、catalog に `requests` フィールドを追加）

```ts
export type RequestNoteType = "visibility_request" | "delete_request";

export interface TestRequest {
  readonly noteId: `TEST-NOTE-${string}`;
  readonly memberId: `TEST-MEM-${string}`;
  readonly noteType: RequestNoteType;
  /** payload object（delete_request は空オブジェクト {}）。json(...) として body に埋め込む。 */
  readonly payload: Record<string, unknown>;
  readonly reason: string;
}

export interface TestAccountsCatalog {
  readonly formId: string;
  readonly revisionId: string;
  readonly schemaHash: string;
  readonly submittedAt: string;
  readonly members: readonly TestMemberAccount[];
  readonly admins: readonly TestAdminAccount[];
  readonly meetings: readonly TestMeeting[];
  readonly requests: readonly TestRequest[];
}
```

#### `testAccountsCatalog` への requests 配列追加（`members: [...]` の後・L241 `]` の直後、`} as const satisfies` の前）

```ts
  requests: [
    {
      noteId: "TEST-NOTE-V01",
      memberId: "TEST-MEM-01",
      noteType: "visibility_request",
      payload: { desiredState: "hidden" },
      reason: "都合により一時的に掲載を止めたいです",
    },
    {
      noteId: "TEST-NOTE-V02",
      memberId: "TEST-MEM-02",
      noteType: "visibility_request",
      payload: { desiredState: "public" },
      reason: "公開できるようになったので掲載をお願いします",
    },
    {
      noteId: "TEST-NOTE-D01",
      memberId: "TEST-MEM-07",
      noteType: "delete_request",
      payload: {},
      reason: "退会を希望します",
    },
  ],
```

入出力・副作用: 純データ。`satisfies TestAccountsCatalog` が requests を要求するため、型追加と配列追加はセット。member メタ（members 配列）は無変更＝manifest 不変。

### A-2. build-seed-sql.ts に admin_member_notes INSERT / cleanup 生成を追加

対象ファイル: `apps/api/src/testing/test-accounts/build-seed-sql.ts`
変更種別: 編集（生成ブロック 1 つ・cleanup 行 1 つ追加）

裏取り済み既存ヘルパ（再利用）:
- `sqlString(value)` → `'...'`（シングルクォートエスケープ）
- `sqlJson(value)` → `'<JSON 文字列>'`
- `buildInsert(table, columns, rows, verb)` → `INSERT OR REPLACE INTO ...`（rows 空なら ""）
- `TEST_ACCOUNT_ACTOR = "seed:test-accounts"`、`catalog.submittedAt = "2026-06-03T10:30:00.000Z"`

#### body の json_object 生成（前例 `issue-399-admin-queue-staging-seed.sql` に整合）

依頼 body は SQL 関数 `json_object('reason', '<reason>', 'payload', json('<payload-json>'))` で生成する。空 payload は `json('{}')`。この式は文字列リテラルではなく **SQL 式**なので、`buildInsert` の row 要素にそのまま式文字列を入れる（`sqlString` でラップしない）。

新規ヘルパ（`build-seed-sql.ts` 内、`sqlJson` の近くに追加）:

```ts
// admin_member_notes.body は json_object(...) SQL 式で生成（前例: issue-399 seed）。
// reason は文字列リテラル、payload は json('<JSON>') で埋め込む。
const sqlRequestBody = (reason: string, payload: Record<string, unknown>): string =>
  `json_object('reason', ${sqlString(reason)}, 'payload', json(${sqlJson(payload)}))`;
```

> `sqlJson(payload)` は `'{"desiredState":"hidden"}'` のような **シングルクォート済み JSON 文字列リテラル**を返すため、`json('{"desiredState":"hidden"}')` という妥当な SQL 式になる。空オブジェクトは `json('{}')`。

#### buildSeedSql の statements 配列末尾（`admin_users` の buildInsert の後・L220 `)` の直後）に追加

```ts
    buildInsert(
      "admin_member_notes",
      [
        "note_id",
        "member_id",
        "body",
        "created_by",
        "updated_by",
        "created_at",
        "updated_at",
        "note_type",
        "request_status",
      ],
      catalog.requests.map((req) => [
        sqlString(req.noteId),
        sqlString(req.memberId),
        sqlRequestBody(req.reason, req.payload), // SQL 式（json_object(...)）
        sqlString(TEST_ACCOUNT_ACTOR),
        sqlString(TEST_ACCOUNT_ACTOR),
        sqlString(catalog.submittedAt),
        sqlString(catalog.submittedAt),
        sqlString(req.noteType),
        sqlString("pending"),
      ]),
    ),
```

> 配置注: `admin_member_notes` は `member_id` の FK を持つため `member_identities` / `member_status` より **後** に INSERT する必要がある。statements 配列末尾（admin_users の後）への追加で順序は満たされる。`resolved_at` / `resolved_by_admin_id` は INSERT 列に含めない（schema default NULL を採る）。`INSERT OR REPLACE`（buildInsert デフォルト verb）で冪等。

#### buildCleanupSql に DELETE を追加（`build-seed-sql.ts` L231-244 の statements 配列）

Before（先頭付近）:
```ts
  const statements = [
    `DELETE FROM member_photos WHERE member_id IN (${memberIds});`,
```

After（`member_photos` DELETE の前に admin_member_notes DELETE を追加。子テーブル先行で安全。LIKE で seed 専用 note_id を狙い撃ち）:
```ts
  const statements = [
    `DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';`,
    `DELETE FROM member_photos WHERE member_id IN (${memberIds});`,
```

入出力・副作用: `buildSeedSql()` 出力が admin_member_notes ブロック分だけ伸びる。`buildCleanupSql()` に 1 行追加。manifest（`buildManifest`）は requests を参照しないため不変。

### A-3. committed SQL 再生成（drift guard を Green に）

```bash
mise exec -- pnpm seed:test-accounts:gen        # 生成（committed .sql / manifest.json を上書き）
mise exec -- pnpm seed:test-accounts:gen -- --check   # drift 0 を確認（exit 0）
git diff --stat apps/api/migrations/seed/        # test-accounts-seed.sql / test-accounts-cleanup.sql のみ変化
```

再生成対象（`scripts/gen-test-accounts-seed.mjs` の outputs）:
- `apps/api/migrations/seed/test-accounts-seed.sql`（admin_member_notes INSERT 3 件が末尾に追加される）
- `apps/api/migrations/seed/test-accounts-cleanup.sql`（admin_member_notes DELETE が先頭に追加される）
- `apps/api/migrations/seed/test-accounts.manifest.json`（**不変**＝member/admin メタ非変更。差分が出たら実装ミス）

> staging 投入は `bash scripts/seed-test-accounts.sh --env staging --action apply`（Phase 13・user-gated）。production は拒否。

---

## Lane B — 命名平易化 + 役割明確化（apps/web）

> SSOT §3 命名マップを逐語適用。**`id` / `className` / `data-*` / ルート `/admin/requests` / API パス / コンポーネントファイル名 / 内部 import 名は不変**。変更は人間可読テキストノードと `aria-label` のみ。

### B-1. サイドバー nav ラベル

対象ファイル: `apps/web/src/components/shell/shell-config.ts`（L94）
変更種別: 編集（label 文言のみ）

Before:
```ts
{ id: "requests", href: "/admin/requests", label: "依頼キュー", icon: "requests" },
```
After:
```ts
{ id: "requests", href: "/admin/requests", label: "会員からの申請", icon: "requests" },
```
不変: `id="requests"` / `href="/admin/requests"` / `icon="requests"`。

### B-2. ページタイトル・説明・パンくず

対象ファイル: `apps/web/app/(admin)/admin/requests/page.tsx`（L41-47）
変更種別: 編集（AdminPageHeader props 文言）

Before:
```tsx
<AdminPageHeader
  eyebrow="ADMIN / REQUESTS"
  title="依頼キュー"
  description="公開状態の変更依頼・退会依頼を確認・承認します。"
  breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "依頼キュー" }]}
  headingId="admin-requests-h"
/>
```
After:
```tsx
<AdminPageHeader
  eyebrow="ADMIN / REQUESTS"
  title="会員からの申請"
  description="会員本人がマイページから出した「公開の停止/再開」「退会」の申請を、ここで承認・却下します。管理者が自分で公開/非公開をすぐ切り替えたいときは「会員管理」から操作してください。"
  breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "会員からの申請" }]}
  headingId="admin-requests-h"
/>
```
不変: `eyebrow="ADMIN / REQUESTS"`（英字パンくずは内部表記・SSOT §3 で不変指定）/ `headingId="admin-requests-h"` / `breadcrumbs[0].href="/admin"`。

### B-3. パネル見出し h1 / 一覧見出し / 空表示 / 相互リンク

対象ファイル: `apps/web/src/components/admin/RequestQueuePanel.tsx`
変更種別: 編集（テキストノード・aria-label・新規リンク/説明ブロック）

| 行 | Before | After |
| --- | --- | --- |
| L154 | `{showHeading ? <h1 id="admin-requests-h">依頼キュー</h1> : null}` | `{showHeading ? <h1 id="admin-requests-h">会員からの申請</h1> : null}` |
| L171 | `<h3 className="h-card">依頼一覧</h3>` | `<h3 className="h-card">申請一覧</h3>` |
| L172 | `<ul aria-label="依頼一覧">` | `<ul aria-label="申請一覧">` |
| L175 | `<EmptyState title="未処理の依頼はありません" />` | `<EmptyState title="未処理の申請はありません" />` |

不変: `id="admin-requests-h"`（B-T5 ガード）/ `aria-labelledby={showHeading ? "admin-requests-h" : "admin-requests-filter-h"}`（L151）/ `aria-label="依頼種別"`（L159・命名マップ対象外）/ `className="admin-requests-grid"`（L169）/ `#admin-requests-filter-h`。

#### 相互リンク + 補助説明（新規・AC-2 / AC-3 / B-T7）

`showHeading` 分岐の h1 直下に説明 + 相互リンクブロックを追加（Phase 4 §3-3 の配置決定に従い Panel 側に置く＝component spec で検証可能）:

Before（L154）:
```tsx
      {showHeading ? <h1 id="admin-requests-h">会員からの申請</h1> : null}
```
After:
```tsx
      {showHeading ? (
        <>
          <h1 id="admin-requests-h">会員からの申請</h1>
          <p className="text-muted">
            ここは<strong>会員本人がマイページから出した申請</strong>を承認・却下する場所です。
            「公開停止/再開」は会員が自分のプロフィール掲載を止めたい/再開したい申請、
            「退会」はアカウント削除の希望です。
            管理者が自分の判断ですぐ公開/非公開を切り替えたいときは{" "}
            <a href="/admin/members">会員管理</a> から操作してください。
          </p>
        </>
      ) : null}
```

> 配置補足: page.tsx は `showHeading={false}` で Panel を呼ぶ（L56）。`AdminPageHeader` の description（B-2）に説明が入るが、相互リンク `<a href="/admin/members">会員管理</a>` を確実に DOM に出して B-T7（Panel spec）を Green にするため、Panel の `showHeading` 分岐にも相互リンクを置く。ただし page.tsx は `showHeading={false}` なので **実画面では Panel 側説明は描画されない**。
> → **実装決定**: B-T7 を Panel component spec（`showHeading` 省略時 default true）で検証する一方、**実画面（page.tsx, showHeading=false）には B-2 の description に加えて相互リンクを別途配置する**。page.tsx の `<section>` 内・`AdminPageHeader` の直後に次を追加して AC-3 を実画面で満たす:
> ```tsx
> <p className="text-muted">
>   管理者がすぐに公開/非公開を切り替えたいときは <a href="/admin/members">会員管理</a> から操作してください。
> </p>
> ```
> これにより、Panel spec（B-T7・showHeading=true 経路）と実画面（page.tsx 経路）の両方で相互リンクが DOM に出る。color は既存 utility（`text-muted`）または OKLch トークン変数のみ。HEX 直書き禁止。

> `<a>` か `next/link` の選択: 既存 admin で `next/link`（`MemberDrawer.tsx`）と素の `<a>` が混在。SSR 内リンクは `next/link` 推奨だが、Panel は client component なので `import Link from "next/link"` を使い `<Link href="/admin/members">会員管理</Link>` としてよい。spec の `getByRole("link", { name: /会員管理/ })` はどちらでも通る。

### B-4. 詳細パネルの見出し / aria-label

対象ファイル: `apps/web/src/components/admin/RequestQueueDetail.tsx`
変更種別: 編集（テキスト・aria-label）

| 行 | Before | After |
| --- | --- | --- |
| L39 | `<aside aria-label="依頼詳細" className="card-flat card-pad-lg">` | `<aside aria-label="申請詳細" className="card-flat card-pad-lg">` |
| L45 | `<aside aria-label="依頼詳細" className="card card-pad-lg">` | `<aside aria-label="申請詳細" className="card card-pad-lg">` |
| L49 | `依頼詳細`（h3 内テキスト） | `申請詳細` |

不変: `id="admin-request-detail-h"`（L47）/ `className`。`NOTE_TYPE_LABEL`（L7-10「公開停止/再公開」「退会」）は SSOT §3 で **不変**（既に平易）。

> L39 の空状態 EmptyState title「左の一覧から依頼を選択してください。」は SSOT §3 表に無いが、命名統一として「左の一覧から申請を選択してください。」へ揃えてよい（任意・テキストノードのみ・spec が assert していなければ非破壊）。Phase 6 で文言一貫性ケースを追加。

---

## Lane C — 会員管理「申請中」バッジ + 相互リンク + API

### C-1. members.ts に相関サブクエリ + projection + 純関数

対象ファイル: `apps/api/src/routes/admin/members.ts`
変更種別: 編集（型拡張・SQL 追加・projection 追加・純関数新規）

#### C-1a. MemberListRow 型に列追加（L104-114）

Before:
```ts
interface MemberListRow {
  member_id: string;
  response_email: string;
  last_submitted_at: string;
  answers_json: string | null;
  tags_json: string | null;
  public_consent: string | null;
  rules_consent: string | null;
  publish_state: string | null;
  is_deleted: number | null;
}
```
After（末尾に 1 行）:
```ts
interface MemberListRow {
  member_id: string;
  response_email: string;
  last_submitted_at: string;
  answers_json: string | null;
  tags_json: string | null;
  public_consent: string | null;
  rules_consent: string | null;
  publish_state: string | null;
  is_deleted: number | null;
  pending_request_types_json: string | null;
}
```

#### C-1b. parsePendingRequestTypes 純関数（`parseTagsJson` L130 付近の隣に新規）

```ts
const PENDING_REQUEST_TYPES = ["visibility_request", "delete_request"] as const;
type PendingRequestType = (typeof PENDING_REQUEST_TYPES)[number];

// 相関サブクエリ json_group_array(DISTINCT note_type) の結果文字列を
// 既知 enum のみの配列へ正規化。null / 不正 JSON / 未知 type は除外。
const parsePendingRequestTypes = (raw: string | null): PendingRequestType[] => {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const seen = new Set<PendingRequestType>();
    for (const v of arr) {
      if (typeof v === "string" && (PENDING_REQUEST_TYPES as readonly string[]).includes(v)) {
        seen.add(v as PendingRequestType);
      }
    }
    return [...seen];
  } catch {
    return [];
  }
};
```

入出力: `string | null` → `PendingRequestType[]`（空配列許容・重複除去・順序不問）。副作用なし。

#### C-1c. SELECT に相関サブクエリ追加（L394-413 の list クエリ）

Before（tags_json サブクエリの後・`ms.public_consent, ...` の前）:
```sql
                (
                  SELECT json_group_array(json_object('code', td.code, 'label', td.label))
                  FROM member_tags mt
                  JOIN tag_definitions td ON td.tag_id = mt.tag_id
                  WHERE mt.member_id = mi.member_id
                ) AS tags_json,
                ms.public_consent, ms.rules_consent, ms.publish_state, ms.is_deleted
```
After（SSOT §5 の SQL を追加）:
```sql
                (
                  SELECT json_group_array(json_object('code', td.code, 'label', td.label))
                  FROM member_tags mt
                  JOIN tag_definitions td ON td.tag_id = mt.tag_id
                  WHERE mt.member_id = mi.member_id
                ) AS tags_json,
                (
                  SELECT json_group_array(DISTINCT amn.note_type)
                  FROM admin_member_notes amn
                  WHERE amn.member_id = mi.member_id
                    AND amn.note_type IN ('visibility_request','delete_request')
                    AND amn.request_status = 'pending'
                ) AS pending_request_types_json,
                ms.public_consent, ms.rules_consent, ms.publish_state, ms.is_deleted
```

> `.all<MemberListRow>()`（L413）の型は C-1a で更新済み。bind 引数は不変（相関サブクエリにプレースホルダなし）。

#### C-1d. projection に pendingRequestTypes 追加（L432-446 の map 内 return）

Before:
```ts
          tags: parseTagsJson(row.tags_json),
          updatedAt: normalizeIso(row.last_submitted_at),
        };
```
After:
```ts
          tags: parseTagsJson(row.tags_json),
          pendingRequestTypes: parsePendingRequestTypes(row.pending_request_types_json),
          updatedAt: normalizeIso(row.last_submitted_at),
        };
```

副作用: `view.members[]` に `pendingRequestTypes` が乗る。`AdminMemberListViewZ.safeParse(view)`（L455）が C-2 の schema 拡張で通過する。

### C-2. shared schema 拡張

対象ファイル: `packages/shared/src/zod/viewmodel.ts`（`AdminMemberListItemZ` L280-294）
変更種別: 編集（item schema に 1 フィールド追加）

Before:
```ts
export const AdminMemberListItemZ = z.object({
  memberId: z.string().min(1),
  responseEmail: EmailZ,
  fullName: z.string(),
  publicConsent: ConsentStatusZ,
  rulesConsent: ConsentStatusZ,
  publishState: PublishStateZ,
  isDeleted: z.boolean(),
  lastSubmittedAt: Iso8601Z,
  occupation: z.string().optional(),
  ubmZone: z.string().nullable().optional(),
  ubmMembershipType: z.string().nullable().optional(),
  tags: z.array(z.object({ code: z.string(), label: z.string() })).optional(),
  updatedAt: Iso8601Z.optional(),
});
```
After（`tags` の後に追加）:
```ts
export const AdminMemberListItemZ = z.object({
  memberId: z.string().min(1),
  responseEmail: EmailZ,
  fullName: z.string(),
  publicConsent: ConsentStatusZ,
  rulesConsent: ConsentStatusZ,
  publishState: PublishStateZ,
  isDeleted: z.boolean(),
  lastSubmittedAt: Iso8601Z,
  occupation: z.string().optional(),
  ubmZone: z.string().nullable().optional(),
  ubmMembershipType: z.string().nullable().optional(),
  tags: z.array(z.object({ code: z.string(), label: z.string() })).optional(),
  // admin-requests-queue-rename: 会員が pending で持つ申請種別（申請中バッジ用）。
  pendingRequestTypes: z
    .array(z.enum(["visibility_request", "delete_request"]))
    .default([]),
  updatedAt: Iso8601Z.optional(),
});
```

> `AdminMemberListItemZ` は `AdminMemberListView["members"][number]` の型源（`MembersTable.tsx` が import）。`.default([])` で API が省略しても web 側型は常に配列。`AdminMemberListViewZ` は `.strict()` だが members は item schema 配列なので影響なし。
> web 側の再宣言 zod は **存在しない**（裏取り: `MembersTable.tsx` は `@ubm-hyogo/shared` の `AdminMemberListView` を直 import / adapter `members-view-model.ts` は `AdminMemberListItem` を spread）。したがって C-2 のみで web 型に伝播する。

### C-3. adapter 素通り確認（members-view-model.ts）

対象ファイル: `apps/web/src/features/admin/adapters/members-view-model.ts`
変更種別: **変更不要**（裏取り）。`toMemberListRow`（L49-75）は `item` から `occupation/ubmZone/.../tags/updatedAt` のみ分割代入し残りを `...baseItem` で spread。`pendingRequestTypes` は `baseItem` に含まれ素通りする。型 `MemberListRow extends AdminMemberListItem` も自動で `pendingRequestTypes` を含む。

> ただし `MembersTable` は `AdminMemberListView["members"][number]`（= 生 item）を直接受け取り、`toMemberListRow` 経由ではない（`MembersTable.tsx` L12）。よってバッジは生 item の `pendingRequestTypes` を読む。Phase 6 で adapter 素通りの回帰ケースを追加（任意）。

### C-4. MembersTable に申請中バッジ + Link

対象ファイル: `apps/web/src/features/admin/components/_members/MembersTable.tsx`
変更種別: 編集（import 追加・バッジ描画追加）

裏取り: 行は `data-testid={`admin-members-row-${m.memberId}`}`（L107・不変）。`区画 / ステータス` セル（L140-157）に `MemberStateChipRow` がある。バッジは既存 `Chip` primitive を再利用（新規 primitive を生やさない・SSOT §5）。`Chip` tone に `info` が存在（`lib/tones.ts` ChipTone）。

#### C-4a. import 追加（L1-10 付近）

```ts
import Link from "next/link";
```

#### C-4b. バッジ描画ヘルパ（`memberTagPills` の近くに pure helper を追加）

```tsx
const PENDING_REQUEST_LABEL: Record<"visibility_request" | "delete_request", string> = {
  visibility_request: "公開申請中",
  delete_request: "退会申請中",
};

function pendingRequestBadges(
  pendingRequestTypes: ReadonlyArray<"visibility_request" | "delete_request">,
) {
  if (!pendingRequestTypes?.length) return null;
  // 表示順は visibility を先に（SSOT §5: 両方ある場合 visibility 優先）
  const ordered = (["visibility_request", "delete_request"] as const).filter((t) =>
    pendingRequestTypes.includes(t),
  );
  return ordered.map((t) => (
    <Link
      key={t}
      href={`/admin/requests?type=${t}`}
      aria-label={`${PENDING_REQUEST_LABEL[t]}（会員からの申請へ）`}
      onClick={(e) => e.stopPropagation()}
    >
      <Chip tone="info" dot>
        {PENDING_REQUEST_LABEL[t]}
      </Chip>
    </Link>
  ));
}
```

> `Member` 型に `pendingRequestTypes` が乗る（C-2 経由）。`m.pendingRequestTypes` は default([]) で常に配列。

#### C-4c. 区画 / ステータスセルに差し込み（L152-156 の MemberStateChipRow の隣）

Before:
```tsx
                  <MemberStateChipRow
                    publishState={m.publishState}
                    isDeleted={m.isDeleted}
                  />
                </div>
```
After:
```tsx
                  <MemberStateChipRow
                    publishState={m.publishState}
                    isDeleted={m.isDeleted}
                  />
                  {pendingRequestBadges(m.pendingRequestTypes)}
                </div>
```

入出力・副作用: pending 申請を持つ行のみバッジ描画。クリックで `/admin/requests?type=...` へ遷移（行の onOpenRow への伝播は `stopPropagation` で抑止）。色は `Chip tone="info"`＝OKLch トークン経由（HEX 直書きなし）。

### C-5. 会員管理ページに説明 + 相互リンク

対象ファイル: `apps/web/app/(admin)/admin/members/page.tsx`
変更種別: 編集（説明文 + Link 追加）

裏取り: `AdminPageHeader description="回答データ・公開フラグ・タグ付けをここから操作します。"`（L72-73）。`<section aria-labelledby="admin-members-h">` 内。

Before（AdminPageHeader の description）:
```tsx
        description="回答データ・公開フラグ・タグ付けをここから操作します。"
```
After（description に 1 文追加）:
```tsx
        description="回答データ・公開フラグ・タグ付けをここから操作します。ここでの公開/非公開トグルは管理者がすぐに切り替えるための操作です。会員本人からの「公開停止/再開」「退会」の申請は［会員からの申請］で承認します。"
```

加えて相互リンクを `AdminPageHeader` 直後に追加（AC-11・クリックできるリンク）:
```tsx
      <p className="text-sm text-[var(--ubm-color-text-muted)]">
        会員本人からの申請は{" "}
        <Link href="/admin/requests" className="text-[var(--ubm-color-accent)] hover:underline">
          会員からの申請
        </Link>{" "}
        で承認します。
      </p>
```

import 追加（page.tsx 冒頭）:
```ts
import Link from "next/link";
```

> color は OKLch トークン変数（`var(--ubm-color-*)`）のみ。HEX 直書き禁止（AC-12）。`text-[var(...)]` は既存 page で多用されており token gate を通過する記法。

### C-6. 依存関係の整合（AC-13）

両経路は実装上独立で、本タスクは破壊しない:
- 会員本人発の申請承認 = `POST /admin/requests/:noteId/resolve`（`RequestQueuePanel` → `resolveAdminRequest`）→ publish_state / is_deleted を更新。
- 管理者起点の即時変更 = `PATCH /admin/members/:memberId/status`（`MemberPublishSwitch`）。

バッジは「pending 申請の有無」を相関サブクエリで可視化するのみで、両 mutation 経路には手を入れない。AC-13 はテスト（requests.contract / members.contract）と本仕様の説明で担保する。

---

## 実行コマンド（Green 確認・DoD）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin src/testing/test-accounts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin src/features/admin/components/_members
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{6}" apps/web/src/components/admin apps/web/src/features/admin/components/_members  # HEX 0 件
mise exec -- pnpm seed:test-accounts:gen          # committed .sql 再生成
mise exec -- pnpm seed:test-accounts:gen -- --check  # drift 0（exit 0）
# staging 投入（Phase 13・user-gated）
bash scripts/seed-test-accounts.sh --env staging --action apply
```

---

## 完了条件

- [ ] Lane A: `catalog.ts` に `TestRequest` 型 + `requests` 配列（V01/V02/D01・紐付け先は catalog 実値 public/member_only/public に整合）を追加し、`build-seed-sql.ts` に `admin_member_notes` INSERT（json_object body・固定 ISO・seed:test-accounts・request_status=pending）と cleanup DELETE（LIKE 'TEST-NOTE-%'）を生成、committed `.sql` を再生成する手順が Before→After で記述されている。
- [ ] Lane B: SSOT §3 命名マップ（nav / page title / description / breadcrumb / h1 / 一覧見出し / 空表示 / 詳細見出し・aria-label）を逐語適用した Before→After 差分があり、`id` / `className` / `data-*` / ルート / API / ファイル名・`aria-label="依頼種別"` が不変であることが明記されている。説明文 + 相互リンク（`/admin/members`）の配置（page.tsx 実画面 + Panel showHeading 経路）が記述されている。
- [ ] Lane C: `members.ts` の相関サブクエリ（SSOT §5）・`MemberListRow` 拡張・`parsePendingRequestTypes` 純関数・projection 追加、`AdminMemberListItemZ` への `pendingRequestTypes`（default []）追加、`MembersTable` のバッジ + `Link href="/admin/requests?type=..."`、会員管理ページの説明 + 相互リンクが Before→After で記述されている。web 側 zod 再宣言が不要であることを裏取り済みで明記。
- [ ] 各変更に「対象ファイル / 変更種別 / シグネチャ / 入出力・副作用」が付されている（CONST_005）。
- [ ] 色は OKLch トークン経由のみ（`Chip tone="info"` / `var(--ubm-color-*)`）で HEX 直書きが無い方針が明記されている。
- [ ] Green 実行コマンドと drift 再生成手順（§実行コマンド）が記載されている。
