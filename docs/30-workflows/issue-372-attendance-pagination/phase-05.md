# Phase 5: 実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-5/phase-5.md` |

## 目的
repository / builder / shared 型 / route / web UI を実装し、Phase 4 の RED テストを GREEN にする。

## 変更対象ファイル

| Path | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/repository/attendance.ts` | 編集 | `AttendanceCursor` 型 + `encodeAttendanceCursor` / `decodeAttendanceCursor` / `ATTENDANCE_PAGE_DEFAULT_LIMIT=50` / `ATTENDANCE_PAGE_MAX_LIMIT=200` / `AttendancePageOptions` / `AttendancePageResult` を追加。`AttendanceProvider` に `findByMemberId(id, opts?)` を追加し、`createAttendanceProvider` で実装。SQL は `WHERE member_id = ? AND (held_on < ? OR (held_on = ? AND session_id < ?))` の明示比較で `LIMIT N+1` 取得し、N+1 件取れたら `hasMore=true`、N 件にトリム。 |
| `apps/api/src/repository/_shared/builder.ts` | 編集 | `buildMemberProfile` / `buildAdminMemberDetailView` の `deps` に `attendancePage?: { limit?: number; cursor?: string }` を追加。注入時は `findByMemberId` 経路、未注入時は既存 `findByMemberIds` 経路（後方互換）。`attendanceMeta` を返り値に注入。 |
| `packages/shared/src/types/viewmodel/index.ts` | 編集 | `MemberProfile.attendanceMeta?: { hasMore: boolean; nextCursor: string \| null }` 追加。 |
| `packages/shared/src/zod/viewmodel.ts` | 編集 | `MemberProfile` zod schema に `attendanceMeta` optional 追加。 |
| `apps/api/src/routes/me/index.ts` | 編集 | `/me/profile` で `attendancePage: { limit: 50 }` を builder に注入。`GET /me/attendance` を新設し、`limit` / `cursor` を query parse、`createAttendanceProvider(ctx).findByMemberId(memberId, {limit, cursor})` を直接呼ぶ。Zod で query validation。 |
| `apps/api/src/routes/admin/members.ts` | 編集 | `/admin/members/:memberId` で同様に注入。`GET /admin/members/:memberId/attendance` を新設。 |
| `apps/web/app/profile/page.tsx` | 編集 | `AttendanceList` に `attendanceMeta` と load-more 初期 state を渡す。 |
| `apps/web/app/profile/_components/AttendanceList.tsx` | 編集 | `attendanceMeta.hasMore` で「もっと見る」ボタン表示。クリックで `/api/me/attendance?cursor=...` を fetch し追加。 |
| `apps/web/src/components/admin/MemberDrawer.tsx` | 編集 | admin 詳細 attendance セクションに load-more UI を追加し、`/api/admin/members/:memberId/attendance?cursor=...` を fetch する。 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | `MemberProfile.attendanceMeta` と新 endpoint 2 つ（`/me/attendance` / `/admin/members/:memberId/attendance`）の request/response を追加。 |

## 主要シグネチャ
```ts
// apps/api/src/repository/attendance.ts
export type AttendanceCursor = { heldOn: string; sessionId: MeetingSessionId };
export const ATTENDANCE_PAGE_DEFAULT_LIMIT = 50;
export const ATTENDANCE_PAGE_MAX_LIMIT = 200;
export interface AttendancePageOptions { limit?: number; cursor?: AttendanceCursor; }
export interface AttendancePageResult {
  records: ReadonlyArray<AttendanceRecord>;
  hasMore: boolean;
  nextCursor: string | null;
}
export const encodeAttendanceCursor: (c: AttendanceCursor) => string;
export const decodeAttendanceCursor: (s: string) => AttendanceCursor; // 不正は Error
```

Route / builder 境界では encoded cursor string を扱い、repository 呼び出し直前に decoded `AttendanceCursor` へ変換する。

## 参照資料
- `outputs/phase-5/phase-5.md`
- `outputs/phase-2/api-design.md`
- `outputs/phase-2/cursor-format.md`

## 成果物
- 上記変更ファイル
- `outputs/phase-5/diff-summary.md`

## 完了条件
- すべての対象ファイルが変更され、Phase 4 の RED テストが GREEN になる。
- `mise exec -- pnpm typecheck` PASS。
- `mise exec -- pnpm lint` PASS。

## 実行タスク
- [ ] cursor encode/decode と SQL 組み立てを実装。
- [ ] builder DI の分岐実装。
- [ ] route 実装と Zod validation。
- [ ] shared 型と zod schema 同期。
- [ ] apps/web の load-more UI 実装。
- [ ] API schema docs 更新。

## 統合テスト連携
- `mise exec -- pnpm --filter @ubm-hyogo/api test:run` を実装中に繰り返し走らせ、Phase 4 で RED だったケースの GREEN 化を確認する。
