# Phase 4: テスト戦略

実装区分: 実装仕様書

## 4.1 test matrix

| # | テスト | 対象ファイル | 種別 | AC ref |
| --- | --- | --- | --- | --- |
| T1 | `addAttendance` 正常系（active session + active member） | `apps/api/src/repository/attendance.test.ts` | 単体 | AC-1, AC-2 |
| T2 | `addAttendance` UNIQUE 違反 → `{ ok: false, reason: "duplicate", existing }` | 同上 | 単体 | AC-2, AC-7 |
| T3 | `addAttendance` `meeting_sessions.deleted_at IS NOT NULL` → `session_not_found` | 同上 | 単体 | AC-2, AC-6 |
| T4 | `addAttendance` member 不在 → `member_not_found` | 同上 | 単体 | AC-2, AC-6 |
| T5 | `addAttendance` `member_status.is_deleted = 1` → `deleted_member` / route 422 | 同上 | 単体 | AC-2, AC-6 |
| T6 | `removeAttendance` 正常系 → existing row 返却 + DB から消える | 同上 | 単体 | AC-3, AC-7 |
| T7 | `removeAttendance` 対象不在 → repository は `null`、route は `404 attendance_not_found` | 同上 | 単体 | AC-3, AC-7 |
| T8 | `AttendanceRecordId` を導入しないこと（grep / typecheck） | repository / typecheck | 型 | AC-4 |
| T9 | `POST /admin/meetings/:id/attendances` `attended:true` → upsert / audit log `attendance.add` 発火 | `apps/api/src/routes/admin/meetings.test.ts` | route | AC-5 |
| T10 | `POST /admin/meetings/:id/attendances` `attended:false` → softRemove / audit log `attendance.remove` 発火 | 同上 | route | AC-5 |
| T11 | `POST /admin/meetings/:id/attendances` 削除済み session → 404 | 同上 | route | AC-6 |
| T12 | `POST /admin/meetings/:id/attendances` unknown member → 404 | 同上 | route | AC-6 |
| T13 | admin gate 未認証 / 権限不足 → 401 / 403（middleware 経路確認） | `apps/api/src/routes/admin/attendance.test.ts` | route | AC-5 |
| T14 | add → 即時 `AttendanceProvider.findByMemberIds` で観測（`held_on DESC` 維持） | `apps/api/src/repository/__tests__/attendance-provider.test.ts` | 統合 | AC-8 |
| T15 | remove → 即時 read で観測されない | 同上 | 統合 | AC-8 |
| T16 | typecheck / lint / build 全通過 | CI | 自動 | AC-9 |
| T17 | 既存 02a / read path テスト regression なし | CI | 自動 | AC-9 |
| T18 | 空 `memberId` / 空 `sessionId` validation → 400 / 422 | admin route tests | route | AC-6 |
| T19 | D1 / audit append failure → 500、成功 audit 以外は追加しない | admin route tests | route | AC-5, AC-6 |

## 4.2 AC × test mapping

| AC | tests |
| --- | --- |
| AC-1 | T1 |
| AC-2 | T1, T2, T3, T4, T5 |
| AC-3 | T6, T7 |
| AC-4 | T8 |
| AC-5 | T9, T10, T13 |
| AC-6 | T3, T4, T5, T11, T12 |
| AC-7 | T2, T6, T7 |
| AC-8 | T14, T15 |
| AC-9 | T16, T17 |
| AC-10 | Phase 11 contract placeholder（runtime curl は 08b / 09a gate に委譲） |
| AC-11 | Phase 12 doc update |

## 4.3 楽観排他再現手順（T2）

```ts
// 同一 (memberId, sessionId) で 2 回 upsert
const r1 = await addAttendance(ctx, m, s, "owner@e.com");
const r2 = await addAttendance(ctx, m, s, "owner@e.com");
expect(r1.ok).toBe(true);
expect(r2).toEqual({ ok: false, reason: "duplicate", existing: r1.row });
```

## 4.4 統合テスト方針（T14, T15）

- miniflare D1 を seed して member / session 作成
- Writer 経由で upsert → 同 D1 binding で `createAttendanceProvider().findByMemberIds([m])` を実行
- 戻り値 Map に該当 record が含まれること、`heldOn` 順序が DESC に保たれることを assert
- softRemove 後の read で該当 record が含まれないことを assert

## 4.5 evidence contract テンプレート

`outputs/phase-11/evidence/api-curl/` 配下に以下 JSON を保存:
- `attendance-add-ok.json`: 200 / `{ ok: true, row: {...} }`
- `attendance-add-duplicate.json`: 409 / `{ ok: false, error: "attendance_already_recorded", existing?: {...} }`
- `attendance-remove-ok.json`: 200 / `{ ok: true, removed: {...} }`
- `attendance-session-not-found.json`: 404 / `{ ok: false, reason: "session_not_found" }`

これらは `CONTRACT_ONLY_NOT_EXECUTED` の placeholder であり、実測 PASS ではない。runtime curl / UI smoke は 08b / 09a evidence gate で取得する。

## 4.6 ローカル実行コマンド

```bash
pnpm --filter @ubm-hyogo/api test -- apps/api/src/repository/attendance.test.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/routes/admin/meetings.test.ts apps/api/src/repository/__tests__/attendance-provider.test.ts
pnpm --filter @ubm-hyogo/api typecheck
```

## 4.7 DoD

- T1〜T17 全 PASS
- Phase 11 contract placeholder 5 件が存在し、`CONTRACT_ONLY_NOT_EXECUTED` を明示
- 02a 既存 attendance test に regression なし
