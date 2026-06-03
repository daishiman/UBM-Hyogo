# Phase 2: 設計

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 2 / 設計 |
| 分類 | implementation / bugfix / NON_VISUAL |
| implementation_mode | new |
| 依存 Phase | Phase 1（要件定義） |
| 後続 Phase | Phase 3（設計レビュー） |

## 目的

耐性化（detail / status）・予防（ingest）・backfill（migration）の topology と各部品の契約（helper シグネチャ / degraded view / 404 判定境界 / 既定 status マージ）を確定し、Phase 4-13 の SubAgent lane と validation path を設計する。

## 実行タスク

### 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用候補 | 可否 | 方針 |
|-----------|------|------|
| `getStatus`（status.ts:31） | ○ | そのまま利用（null 可を呼び出し側で許容） |
| `setPublishState`（status.ts・`INSERT ON CONFLICT`） | ○ | 行が無くても作成されるため publishState 経路は既存で十分 |
| `findMemberById`（members.ts:29） | ○ | status PATCH の「identity 存在判定」に再利用 |
| `findCurrentResponse`（responses.ts:72） | ○ | builder の response 取得（null 可で degraded 分岐） |
| 新規 exists 専用関数 | △ | `findMemberById` が `null` 可なら別関数を作らず再利用（命名ドリフト回避） |

→ **新規実装面は最小**: helper 1（`ensureMemberStatusRow`）+ 既定 status 定数 + 既存関数の null 許容化のみ。

### 2.2 helper 契約: `ensureMemberStatusRow`

```ts
// apps/api/src/repository/status.ts
// 既定行を冪等に生成する。NOT NULL カラムは全て DEFAULT を持つため member_id のみで安全。
export async function ensureMemberStatusRow(c: DbCtx, id: MemberId): Promise<void> {
  await c.db
    .prepare("INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)")
    .bind(id)
    .run();
}
```

- 入力: `DbCtx`, `MemberId`（brand）
- 出力: `void`（副作用 = 行が無ければ既定行を 1 行 INSERT、有れば no-op）
- 冪等: `INSERT OR IGNORE` により再実行で重複・上書きなし（既存 status を破壊しない）
- 既定値: `public_consent='unknown'`, `rules_consent='unknown'`, `publish_state='member_only'`, `is_deleted=0`, `updated_at=datetime('now')`（`0002_admin_managed.sql` の DEFAULT）

### 2.3 既定 status オブジェクト: `DEFAULT_MEMBER_STATUS`

builder が「status 欠落でも既定値で view を組む」ために、`MemberStatusRow` 互換の既定値を返す純関数を用意する。

```ts
// apps/api/src/repository/status.ts
export const defaultMemberStatusRow = (id: MemberId): MemberStatusRow => ({
  member_id: id,
  public_consent: "unknown",
  rules_consent: "unknown",
  publish_state: "member_only",
  is_deleted: 0,
  hidden_reason: null,
  last_notified_at: null,
  updated_by: null,
  updated_at: "", // builder では使わない。型充足のためのプレースホルダ
});
```

> 実カラム名・nullable は `MemberStatusRow` 型定義（`status.ts`）に合わせて Phase 5 で最終確定する。`notification_opt_out` 等の任意カラムが型に存在する場合は既定 0 を加える。

### 2.4 degraded view 契約（builder の耐性化）

```
buildAdminMemberDetailView(c, mid, adminNotes, deps):
  identity = findMemberById(c, mid)
  status   = getStatus(c, mid)
  if (!identity) return null            // ← identity 不在のみ真の 404
  effStatus = status ?? defaultMemberStatusRow(mid)   // status 欠落は既定で代替
  response = findCurrentResponse(c, mid)
  if (response) {
    // 従来どおり sections / summary / tags を構築
  } else {
    // 劣化 view:
    //   responseId   = identity.current_response_id ?? identity.member_id  // min(1) 充足
    //   responseEmail = identity.response_email
    //   summary       = 空（extractSummary(null) 相当 / SummaryZ を満たす空値）
    //   sections      = []
    //   tags          = listTagsByMemberId(c, mid)（取得可能なら）
    //   attendance    = fetchAttendancePagedFor(...)（取得可能なら）
    //   lastSubmittedAt = identity.last_submitted_at ?? null
  }
  return { identityMemberId, identityEmail, status: effStatus(map), profile, audit }
```

- **404 境界**: `identity` 不在のみ null（route 404）。status / response 欠落は 200 で degraded。
- **zod 整合**: `MemberProfileZ.responseId` は `z.string().min(1)`。degraded 時は `current_response_id ?? member_id` を採用し空文字を避ける（schema 変更不要）。
- **`SummaryZ` 空値**: 既存 `extractSummary` が null 入力で返す空 summary 形を流用し、zod を満たす（Phase 5 で `extractSummary` の null 挙動を確認。満たさない場合は最小フィールドを埋める）。
- **不変条件**: 既存の正常パス（response あり）の出力は 1 byte も変えない（非回帰）。

### 2.5 status PATCH の 404 境界変更

```
PATCH /admin/members/:memberId/status:
  memberId 必須チェック（既存・400）
  body parse / zod（既存・400）
  identity = findMemberById(db, mid)
  if (!identity) return 404            // ← 旧: getStatus 欠落で 404 / 新: identity 欠落で 404
  ensureMemberStatusRow(db, mid)       // 既定行を保証（hiddenReason のみ更新時の行不在を解消）
  before = getStatus(db, mid)          // ensure 後は必ず非 null
  if publishState != undefined: setPublishState(...)   // 既存（ON CONFLICT）
  if hiddenReason != undefined: UPDATE member_status SET hidden_reason ... WHERE member_id  // 既存・行は存在
  after = getStatus(db, mid)
  audit append（既存）
  return 200 { ok:true, status: after }
```

- **before の意味変更**: 旧 before（mutation 前 status）が null だった場合、新では `ensureMemberStatusRow` 後の既定行が before になる。audit の before は「既定行」になる（許容。空 → 値の遷移が監査に残る）。
- 既存テスト（status あり）の挙動は不変。

### 2.6 ingest 予防（sync-forms-responses）

`upsertMember` で新規 identity を作る箇所（`sync-forms-responses.ts:303` 周辺）の直後に `ensureMemberStatusRow(dbCtx, memberId)` を追加する。既存の条件付き `setConsentSnapshot`（:385）は維持（consent 値の上書きは従来どおり ON CONFLICT で行う）。

- 順序: `upsertMember` → `ensureMemberStatusRow`（行を保証）→ `upsertResponse` → ... → `setConsentSnapshot`（consent 反映）。
- 効果: 以降 example の例外で setConsentSnapshot に到達しなくても member_status 行は残る。

### 2.7 migration 0024（backfill）

```sql
-- apps/api/migrations/0024_backfill_member_status.sql
-- orphan member_identities（member_status 行が無い会員）に既定 member_status を補完。冪等。
INSERT OR IGNORE INTO member_status (member_id)
SELECT mi.member_id
FROM member_identities mi
LEFT JOIN member_status ms ON ms.member_id = mi.member_id
WHERE ms.member_id IS NULL;
```

- 4 桁連番 `0024`（直近 `0023_member_photos_source.sql` の次）。
- `INSERT OR IGNORE` で再適用安全。`migrations/sequence-exceptions.json` の更新要否は Phase 5 で確認。

### 2.8 SubAgent lane / validation path（≤3 並列）

| lane | 担当 | 直列/並列 |
|------|------|----------|
| Lane A | Phase 4 / 5 / 6 / 7（test → impl → 拡充 → coverage） | 直列内・lane 並列 |
| Lane B | Phase 8 / 9 / 10 / 11（refactor → QA → review → manual-test） | lane 並列 |
| Lane C | Phase 12 / 13 + outputs/phase-12 6 成果物 + outputs/phase-11 | lane 並列 |
| validation | `validate-phase-output.js` / `verify:phase12-compliance` / `gate-metadata:validate` | 直列（最後に締め） |

### 2.9 ロック / エラー経路（該当なしの明示）

本タスクに UI state machine / ロック変数は無い（NON_VISUAL・サーバ純粋ロジック）。エラー経路は HTTP status（400/404/500）と D1 例外のみ。

## 参照資料

- Phase 1 inventory（§1.5）
- `apps/api/src/repository/_shared/builder.ts:372-447`
- `apps/api/src/routes/admin/member-status.ts:37-79`
- `packages/shared/src/zod/viewmodel.ts:53-63,306-320`（`MemberProfileZ` / `AdminMemberDetailViewZ`）

## 成果物

- 本ファイル（Phase 2 設計）
- helper / degraded view / 404 境界 / migration の確定契約

## 統合テスト連携

- §2.2〜2.7 の各契約は Phase 4 のテストケース（status 欠落 / response 欠落 / identity 不在 / ingest / migration）に 1:1 対応する。
- §2.4 の zod 整合（responseId min(1)）は builder.repository.spec で検証する。

## 完了条件

- [x] `ensureMemberStatusRow` の契約（冪等・既定値）を固定した
- [x] degraded view 契約（404 は identity 不在のみ・responseId フォールバック）を固定した
- [x] status PATCH の 404 境界変更を固定した
- [x] ingest 予防の挿入位置を固定した
- [x] migration 0024 の DDL を固定した
- [x] SubAgent lane（≤3 並列）と validation path を設計した
