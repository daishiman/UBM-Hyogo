# Phase 5: 実装（GREEN）

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。本 Phase で Phase 4 の RED を GREEN 化する実装方針・コード断片・SQL 全文を確定し、同一 wave で local 実装済み。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 5（実装 GREEN） |
| 依存 | Phase 4（RED 設計） |
| 分類 | NON_VISUAL（`apps/api` のみ。`apps/web` 無変更 = AC-8） |
| implementation_mode | `new` |
| 主成果物 | 変更ファイル一覧 + 各ファイルの実装方針・コード断片・SQL 全文 |

## 目的

Phase 2 の確定契約に従い、F-1〜F-5 を最小差分で実装し Phase 4 の RED を GREEN 化する。既存正常パス（status / response あり）の出力は 1 byte も変えない（AC-7 非回帰）。`apps/web` には一切触れない（AC-8）。

## 実行タスク

### 5.0 着手前解消事項（MINOR-1 / MINOR-2 / MINOR-4）

| ID | 確認結果（本 Phase で確定） | 影響 |
|----|---------------------------|------|
| MINOR-1 | `MemberStatusRow`（`status.ts:9-19`）の実カラムは `member_id`/`public_consent`/`rules_consent`/`publish_state`/`is_deleted`/`hidden_reason`/`last_notified_at`/`updated_by`/`updated_at` の 9 カラム。**`notification_opt_out` カラムは型に存在しない**。`defaultMemberStatusRow` はこの 9 カラムのみで構成する（Phase 2 §2.3 の `notification_opt_out` 加算は不要）。なお builder 既存コード（`builder.ts:439-442`）は `(status as { notification_opt_out?: number\|null }).notification_opt_out ?? 0` と optional アクセスしているため、`MemberStatusRow` に当該プロパティが無くても `?? 0 → false` で安全。degraded 既定も `notificationOptOut: false` になる。 | `defaultMemberStatusRow` を 9 カラムで確定 |
| MINOR-2 | `extractSummary`（`builder.ts:97`）の引数は `answersJson: string`（**null 非許容**）。`JSON.parse` 失敗を try/catch し、全フィールドを `?? ""` / `?? null` で埋め `MemberProfileSummary`（= `SummaryZ` 充足）を必ず返す。degraded view では `extractSummary("{}")` を呼べば空 summary（`fullName:""` 等）が得られ zod を満たす。**`extractSummary(null)` は呼ばない**（型不一致）。 | degraded summary は `extractSummary("{}")` で生成 |
| MINOR-4 | `migrations/sequence-exceptions.json` は **duplicates（同一 prefix 重複）のみ**を記録する。`0024` は単一・連番上 `0023` の次で重複が無いため **更新不要**。 | `sequence-exceptions.json` は無変更 |

### 5.1 変更ファイル一覧

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| F-1 | `apps/api/src/repository/status.ts` | 編集 | `ensureMemberStatusRow` 新規 export + `defaultMemberStatusRow` 新規 export |
| F-2 | `apps/api/src/repository/_shared/builder.ts` | 編集 | `buildAdminMemberDetailView` を耐性化（404 は identity 不在のみ・degraded view） |
| F-3 | `apps/api/src/routes/admin/member-status.ts` | 編集 | 404 判定を identity 存在へ・mutation 前 `ensureMemberStatusRow` |
| F-4 | `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | 新規 identity 作成直後に `ensureMemberStatusRow` |
| F-5 | `apps/api/migrations/0024_backfill_member_status.sql` | 新規 | orphan backfill（`INSERT OR IGNORE ... SELECT`） |
| 補 | `apps/api/src/jobs/__fixtures__/d1-fake.ts` | 編集 | `INSERT OR IGNORE INTO member_status` 分岐追加（AC-5 検証用） |
| 補 | `apps/api/src/routes/admin/member-status.contract.spec.ts` | 編集 | `beforeEach` で `member_identities` も投入（F-3 後の非回帰維持） |

### 5.2 F-1: `status.ts`（`ensureMemberStatusRow` + `defaultMemberStatusRow`）

`status.ts` 末尾（`setDeleted` の後）に追加する。import は既存の `DbCtx` / `MemberId` を流用。

```ts
/**
 * member_status の既定行を冪等に生成する。
 * NOT NULL カラムは全て DEFAULT を持つため member_id のみで安全（0002_admin_managed.sql:5-15）。
 * INSERT OR IGNORE により既存行は破壊しない（再実行・既存値温存）。
 */
export async function ensureMemberStatusRow(
  c: DbCtx,
  id: MemberId,
): Promise<void> {
  await c.db
    .prepare("INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)")
    .bind(id)
    .run();
}

/**
 * builder が status 欠落時に view を組むための既定 status（純関数）。
 * member_status の DEFAULT 値に一致させる。updated_at は builder の出力に使われないため空文字。
 */
export const defaultMemberStatusRow = (id: MemberId): MemberStatusRow => ({
  member_id: id as unknown as string,
  public_consent: "unknown",
  rules_consent: "unknown",
  publish_state: "member_only",
  is_deleted: 0,
  hidden_reason: null,
  last_notified_at: null,
  updated_by: null,
  updated_at: "",
});
```

- 冪等性は `INSERT OR IGNORE` が担保（PRIMARY KEY `member_id` 競合で no-op）。
- `defaultMemberStatusRow` は 9 カラム（MINOR-1 確定）。`notification_opt_out` は加えない。

### 5.3 F-2: `builder.ts`（`buildAdminMemberDetailView` 耐性化）

現行 `builder.ts:383-447` を以下方針で書き換える。**正常パス（response あり）の組み立て・出力は完全保持**し、欠落時の分岐だけを追加する。

```ts
const [identity, status] = await Promise.all([
  findMemberById(c, mid),
  getStatus(c, mid),
]);

if (!identity) return null;                       // ← 404 は identity 不在のみ
const effStatus = status ?? defaultMemberStatusRow(mid);  // status 欠落は既定で代替

const response = await findCurrentResponse(c, mid);

if (response) {
  // ===== 従来パス（builder.ts:393-429 を effStatus へ置換のみ）=====
  // responseId / sections / fields / visibility / tags / attendance / summary 構築は現行と同一。
  // status.public_consent → effStatus.public_consent 等、status 参照を effStatus に置換。
  // ... 既存ロジック ...
} else {
  // ===== 劣化 view（response 欠落・AC-2）=====
  const tags = await listTagsByMemberId(c, mid);
  const paged = await fetchAttendancePagedFor(
    mid, c.var.attendanceProvider, deps?.attendancePage,
  );
  const fallbackResponseId =
    identity.current_response_id && identity.current_response_id.length > 0
      ? identity.current_response_id
      : identity.member_id;                       // responseId は min(1) 充足
  const summary = extractSummary("{}");           // 空 summary（SummaryZ 充足・MINOR-2）
  const profile: MemberProfile = {
    memberId: asMemberId(identity.member_id),
    responseId: asResponseId(fallbackResponseId),
    responseEmail: asResponseEmail(identity.response_email),
    publicConsent: effStatus.public_consent as ConsentStatus,
    rulesConsent: effStatus.rules_consent as ConsentStatus,
    publishState: effStatus.publish_state as PublishState,
    isDeleted: effStatus.is_deleted === 1,
    summary,
    sections: [],                                 // sections は空（AC-2）
    attendance: paged.records,
    tags: tags.map((t) => ({
      code: t.code, label: t.label, category: t.category,
      source: t.source as "rule" | "ai" | "manual",
    })),
    lastSubmittedAt: identity.last_submitted_at,
    editResponseUrl: null,
  };
  if (paged.meta) profile.attendanceMeta = paged.meta;
  return {
    identityMemberId: asMemberId(identity.member_id),
    identityEmail: asResponseEmail(identity.response_email),
    status: {
      publicConsent: effStatus.public_consent as ConsentStatus,
      rulesConsent: effStatus.rules_consent as ConsentStatus,
      publishState: effStatus.publish_state as PublishState,
      isDeleted: effStatus.is_deleted === 1,
      notificationOptOut:
        Number((effStatus as { notification_opt_out?: number | null }).notification_opt_out ?? 0) === 1,
    },
    profile,
    audit: adminNotes,
  };
}
```

- import に `defaultMemberStatusRow` を `status` モジュールから追加。`asResponseId` / `listTagsByMemberId` / `fetchAttendancePagedFor` は既存 import を流用。
- **非回帰の要**: response あり分岐は現行コード（`builder.ts:393-446`）から `status.` を `effStatus.` へ機械的に置換するのみ（status あり時 `effStatus === status` なので出力不変）。新規フィールド・順序変更・型変更を一切行わない。
- `MemberProfileZ.responseId`（`z.string().min(1)`）は `fallbackResponseId`（identity 由来・非空）で充足。

### 5.4 F-3: `member-status.ts`（404 境界変更 + ensure）

現行 `member-status.ts:50-66` を以下へ変更。import に `findMemberById`（`../../repository/members`）と `ensureMemberStatusRow`（`../../repository/status`）を追加。

```ts
const db = ctx({ DB: c.env.DB });
const mid = asMemberId(memberId);

const identity = await findMemberById(db, mid);    // ← 404 判定を identity へ
if (!identity) return c.json({ ok: false, error: "not found" }, 404);

await ensureMemberStatusRow(db, mid);              // 既定行を保証（hiddenReason のみ更新時の行不在解消）
const before = await getStatus(db, mid);           // ensure 後は必ず非 null

if (parsed.data.publishState !== undefined) {
  await setPublishState(db, mid, parsed.data.publishState, SYSTEM_ADMIN);
}
if (parsed.data.hiddenReason !== undefined) {
  await db.db
    .prepare(
      `UPDATE member_status SET hidden_reason = ?1, updated_at = datetime('now') WHERE member_id = ?2`,
    )
    .bind(parsed.data.hiddenReason, mid)
    .run();
}
const after = await getStatus(db, mid);
// audit append（既存・before/after はそのまま）
```

- 旧 `const before = await getStatus(db, mid); if (!before) return 404;`（:52-53）を削除し、上記 identity 判定 + ensure に置換。
- `setPublishState` の `INSERT ... ON CONFLICT` は維持（ensure 後でも安全）。
- audit の before は ensure 後の既定行になりうる（Phase 2 §2.5 で許容済み）。

### 5.5 F-4: `sync-forms-responses.ts`（ingest 予防）

`sync-forms-responses.ts:303-311` の新規 identity 作成ブロック内、`writeCount += 1;`（:310）の直後・`else` ブロックを閉じる前に挿入する。import に `ensureMemberStatusRow` を追加（既存 `import { setConsentSnapshot, getStatus } from "../repository/status";` を `ensureMemberStatusRow` 追加）。

```ts
} else {
  memberId = asMemberId(crypto.randomUUID());
  isFirstResponse = true;
  await upsertMember(dbCtx, { /* 既存 */ });
  writeCount += 1;
  await ensureMemberStatusRow(dbCtx, memberId);   // ← 追加: identity と同期で既定行を保証
  writeCount += 1;
}
```

- 挿入位置は新規 identity 経路のみ（既存 identity は既に行を持つ前提だが、§6 の consent 経路 `setConsentSnapshot` が ON CONFLICT で補完するため二重保証）。
- 既存 `setConsentSnapshot`（:385）は維持。順序は `upsertMember → ensureMemberStatusRow → upsertResponse → ... → setConsentSnapshot`。

### 5.6 F-5: `0024_backfill_member_status.sql`（新規）

ファイル: `apps/api/migrations/0024_backfill_member_status.sql`。

```sql
-- 0024_backfill_member_status.sql
-- orphan member_identities（member_status 行が無い会員）に既定 member_status 行を補完する。
-- NOT NULL カラムは全て DEFAULT を持つため member_id のみで安全（0002_admin_managed.sql）。
-- INSERT OR IGNORE により再適用・部分適用後でも冪等（重複・上書きなし）。
INSERT OR IGNORE INTO member_status (member_id)
SELECT mi.member_id
FROM member_identities mi
LEFT JOIN member_status ms ON ms.member_id = mi.member_id
WHERE ms.member_id IS NULL;
```

- 4 桁連番 `0024`（直近 `0023_member_photos_source.sql` の次）。`sequence-exceptions.json` 更新不要（MINOR-4）。
- 単一 statement・末尾 `;`。`_setup.ts` の splitStatements / `db.exec` で適用可能（コメント行は stripComments で除去される）。

### 5.7 補: FakeD1 / member-status spec の改修（Phase 4 で確定した必須事項）

- `apps/api/src/jobs/__fixtures__/d1-fake.ts`: `INSERT OR IGNORE INTO member_status` を判定する分岐を追加。member_id（`b[0]`）が `db.status` に無ければ既定行（`public_consent:"unknown"`,`rules_consent:"unknown"`,`publish_state:"member_only"`,`is_deleted:0`）を push、有れば no-op。既存 `/INSERT INTO member_status/i`（:335）は ON CONFLICT consent 用なので別分岐として残す。
- `apps/api/src/routes/admin/member-status.contract.spec.ts`: `beforeEach`（:17-21）に `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at) VALUES ('m1', ...)` を追加し、F-3 の identity 判定下でも `正常系: publishState 更新 200` が GREEN を維持するようにする。

### 5.8 実装後の検証コマンド（GREEN 確認）

リポジトリルートから順に実行する。

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 対象 spec（Phase 4 の suite と同一）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/status.repository.spec.ts \
  apps/api/src/repository/__tests__/builder.repository.spec.ts \
  apps/api/src/routes/admin/member-status.contract.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/sync/migration-0024-backfill.contract.spec.ts
# AC-8 確認（apps/web に diff が無いこと）
git diff --name-only | grep -c '^apps/web/' || true   # 期待: 0
```

期待: Phase 4 の全 RED ケースが GREEN。typecheck / lint が 0 error。`apps/web` の diff が 0（AC-8）。

## 参照資料

- Phase 2 §2.2〜2.7（helper / degraded view / 404 境界 / ingest / migration 契約）
- Phase 4（GREEN 化対象の RED ケース）
- `apps/api/src/repository/status.ts:9-139`（`MemberStatusRow` 型 / 既存 setter）
- `apps/api/src/repository/_shared/builder.ts:97-112,372-447`（`extractSummary` / `buildAdminMemberDetailView`）
- `apps/api/src/routes/admin/member-status.ts:37-79`
- `apps/api/src/jobs/sync-forms-responses.ts:293-391`
- `apps/api/src/repository/members.ts:8-39`（`MemberIdentityRow` / `findMemberById`）
- `apps/api/migrations/0002_admin_managed.sql:5-15`（member_status DDL / DEFAULT）
- `apps/api/migrations/sequence-exceptions.json`（duplicates のみ・0024 は対象外）

## 成果物

- 本ファイル（Phase 5: 実装方針 + コード断片 + SQL 全文）
- F-1〜F-5 + 補 2 ファイルの確定差分方針
- MINOR-1/2/4 の着手前解消結果

## 統合テスト連携

- F-1〜F-5 の各実装は Phase 4 の RED ケース（4.1〜4.5）を GREEN 化する。
- 5.8 の検証コマンドは Phase 9（品質保証）の全体実行へ引き継ぐ。
- AC-8（apps/web diff 0）は 5.8 の `git diff --name-only` で確認し Phase 10 で最終判定する。

## 完了条件

- [x] MINOR-1（`MemberStatusRow` 9 カラム・`notification_opt_out` 不在）を確定し `defaultMemberStatusRow` に反映した
- [x] MINOR-2（`extractSummary("{}")` で空 summary 生成・null は呼ばない）を確定した
- [x] MINOR-4（`sequence-exceptions.json` 更新不要）を確定した
- [x] F-1 `ensureMemberStatusRow` / `defaultMemberStatusRow` の実装方針を固定した
- [x] F-2 degraded view の実装方針（正常パス非回帰 + 欠落分岐）を固定した
- [x] F-3 404 境界変更 + ensure の実装方針を固定した
- [x] F-4 ingest 予防の挿入位置を固定した
- [x] F-5 migration 0024 の SQL 全文を固定した
- [x] FakeD1 / member-status spec の改修必須事項を記録した
- [x] 実装後の検証コマンド（typecheck/lint/vitest/apps-web diff）を列挙した
