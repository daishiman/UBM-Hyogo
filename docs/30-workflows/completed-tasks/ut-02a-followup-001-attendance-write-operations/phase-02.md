# Phase 2: 設計

実装区分: 実装仕様書（CONST_005 の必須項目を本フェーズで全て確定する）

## 2.1 AttendanceWriter contract

### interface

```ts
// apps/api/src/repository/attendance.ts
export async function addAttendance(
  c: DbCtx,
  memberId: MemberId,
  sessionId: string,
  by: string,
): Promise<AddAttendanceResult>;

export async function removeAttendance(
  c: DbCtx,
  memberId: MemberId,
  sessionId: string,
): Promise<MemberAttendanceRow | null>;
```

### 副作用 / 不変条件

- `addAttendance`: `member_attendance` に PK `(member_id, session_id)` で INSERT。UNIQUE 違反時は existing 取得して `{ ok: false, reason: "duplicate", existing }`。session 削除済み / member 不在 / member 削除済み は早期 return。
- `removeAttendance`: 該当行を hard delete し existing row を返す。row 不在は `null`（冪等）。
- read path (`AttendanceProvider.findByMemberIds`) との一貫性: `INNER JOIN meeting_sessions` で deleted_at IS NOT NULL の row は read 側で除外されるため、write 後即時 read で観測可能。

### 楽観排他 SQL（既存利用）

```sql
INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES (?, ?, ?);
-- UNIQUE 違反 → isUniqueConstraintError 経路で duplicate 取得
```

## 2.2 admin route 設計

| route | method | 入力 | 出力 | status |
| --- | --- | --- | --- | --- |
| `/admin/meetings/:sessionId/attendances` | POST | `{ memberId: string, attended: boolean }` | `{ ok: true, row }` または `{ ok: false, reason }` | 200 / 404 / 409 |
| `/admin/meetings/:sessionId/attendance` | POST | `{ memberId: string }` | `{ ok: true, attendance }` または `{ ok: false, error }` | 201 / 404 / 409 / 422 |
| `/admin/meetings/:sessionId/attendance/:memberId` | DELETE | path params | `{ ok: true, attendance }` | 200 / 404 |

- 全 route は `app.use("/admin/*", adminGate)` を経由する（05a 確立済み）
- route 内では `c.get("authUser").email` を audit_log の `actor_email` に渡す
- canonical route は `/attendances`、legacy compatibility route は `/attendance` + DELETE とする
- error mapping: `member_not_found` / `session_not_found` → 404, `deleted_member` → 422, `duplicate` → 409 (with `existing` row where legacy route returns it)

## 2.3 audit log 結線

| operation | event action | target_type | target_id | metadata |
| --- | --- | --- | --- | --- |
| add 成功 | `attendance.add` | `meeting` | `sessionId` | `{ memberId, assignedBy }` |
| add duplicate | （記録しない） | — | — | 変更なしのため event は生成しない |
| remove 成功 | `attendance.remove` | `meeting` | `sessionId` | `{ memberId }` |
| remove not_found | （記録しない） | — | — | 変更なしのため event は生成しない |

既存 `apps/api/src/routes/admin/audit.test.ts` が `attendance.add` / `attendance.remove` event を前提としており、本仕様で整合する。

## 2.4 branded type の write 側展開

`AttendanceRecordId` と新規 Writer interface は導入しない。write 側の物理正本は `member_attendance` の複合 PK `(member_id, session_id)` であり、既存 `MemberId` branded type と `sessionId: string` の組み合わせが実装済み契約である。read 側 `AttendanceRecord` は `MemberProfile.attendance` 用の DTO であり、write command ID と混同しない。

## 2.5 変更ファイル一覧（CONST_005 必須項目）

| パス | 変更種別 | 主要差分 |
| --- | --- | --- |
| `apps/api/src/repository/attendance.ts` | 既存正本参照 | `addAttendance` / `removeAttendance` contract、duplicate 正規化、deleted member / session guard |
| `apps/api/src/routes/admin/attendance.ts` | 既存正本参照 | legacy route / audit log 結線 / error mapping |
| `apps/api/src/routes/admin/meetings.ts` | 既存正本参照 | canonical `POST /meetings/:id/attendances` の attended true/false 振り分け |
| `apps/api/src/repository/attendance.test.ts` | 既存正本参照 | repository write tests（楽観排他 / remove 冪等） |
| `apps/api/src/routes/admin/attendance.test.ts` | 編集 | admin gate 経由 / audit log 検査ケース追加 |
| `apps/api/src/routes/admin/meetings.test.ts` | 編集 | session_not_found / deleted_member / duplicate ケース追加 |
| `docs/30-workflows/ut-02a-followup-001-attendance-write-operations/outputs/**` | 新規 | Phase 1〜13 outputs 成果物 |

## 2.6 入出力定義

### `addAttendance`

- **入力**: `memberId: MemberId`, `sessionId: string`, `by: string (admin email)`
- **出力**: `AddAttendanceResult`（`{ ok: true, row }` / `{ ok: false, reason: "duplicate"|"deleted_member"|"member_not_found"|"session_not_found", existing? }`）
- **副作用**: `member_attendance` への INSERT、`audit_log` への `attendance.add` 記録（route 層）

### `removeAttendance`

- **入力**: `memberId: MemberId`, `sessionId: string`
- **出力**: `MemberAttendanceRow | null`
- **副作用**: `member_attendance` からの DELETE、`audit_log` への `attendance.remove` 記録（route 層）

## 2.7 ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test attendance
mise exec -- pnpm --filter @ubm-hyogo/api test admin/meetings
mise exec -- pnpm --filter @ubm-hyogo/api test admin/audit
mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm build
```

## 2.8 DoD（Definition of Done）

- 上記 7 コマンド全 PASS
- AC-1〜11 が Phase 7 マトリクスでトレース完了
- 既存 02a / read path / `audit.test.ts` / `meetings.test.ts` の regression なし
- Phase 11 の curl evidence 4 件取得（add-ok / add-duplicate-409 / remove-ok / session-not-found）
- 02a Phase 12 `unassigned-task-detection.md` の本項目を「解消済み」に更新

## 2.9 将来拡張点（scope out 明示）

- `member_attendance.deleted_at` 列追加 → 02b schema 変更 wave で検討
- attendance 集計ダッシュボード → `ut-02a-followup-002`
- ページング → `ut-02a-followup-004`
