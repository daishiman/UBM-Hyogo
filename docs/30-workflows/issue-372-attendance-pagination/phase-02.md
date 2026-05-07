# Phase 2: 設計

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-2/phase-2.md` |

## 目的
cursor format / API shape / 型契約 / UI 導線を確定する。

## 設計事項

### Cursor 仕様
- 内部表現: `{ heldOn: string /* ISO date YYYY-MM-DD */, sessionId: MeetingSessionId }`
- 外部表現: `base64url(JSON.stringify(internal))`。client は opaque として扱う。
- 復号は `apps/api/src/repository/attendance.ts` の `decodeAttendanceCursor` で行い、不正値は repository では typed error、route では `400 Bad Request` に変換する。
- 並び順: `held_on DESC, session_id DESC` の二段で安定化（同日 tie-break）。
- cursor 条件は D1/SQLite 互換の明示比較式 `held_on < ? OR (held_on = ? AND session_id < ?)` を使う。row-value comparison は使わない。
- `session_id` は同一 `held_on` 内の安定 tie-break としてだけ使う。辞書順が実開催順と一致しない ID 形式へ変わる場合は、`meeting_sessions.starts_at` 等の時刻列を cursor に昇格する。

### Repository API
```ts
export interface AttendancePageOptions {
  limit?: number;   // default 50, max 200
  cursor?: AttendanceCursor;
}
export interface AttendancePageResult {
  records: ReadonlyArray<AttendanceRecord>;
  hasMore: boolean;
  nextCursor: string | null;
}
export interface AttendanceProvider {
  findByMemberIds(ids: ReadonlyArray<MemberId>): Promise<ReadonlyMap<MemberId, ReadonlyArray<AttendanceRecord>>>;
  findByMemberId(id: MemberId, opts?: AttendancePageOptions): Promise<AttendancePageResult>;
}
```

### Builder DI
```ts
deps?: {
  attendanceProvider?: AttendanceProvider;
  attendancePage?: { limit?: number; cursor?: string }; // route/query と同じ encoded cursor
};
```
- `attendancePage` 注入時: `findByMemberId` 経路で取得し `attendance` + `attendanceMeta` を埋める。
- 未注入時: 既存挙動（`findByMemberIds`）を維持。
- 型境界: route / builder deps は encoded string、repository は decoded `AttendanceCursor` を受ける。decode と HTTP 400 変換は route/service 境界で閉じる。

### Shared Type
```ts
// packages/shared/src/types/viewmodel/index.ts
export interface MemberProfile {
  // ...既存 fields
  attendance: AttendanceRecord[]; // 既存（破壊なし）
  attendanceMeta?: { hasMore: boolean; nextCursor: string | null };
}
```

### Route 仕様
- `GET /me/profile`: default limit=50 で先頭ページを返し、`attendanceMeta` を含む。
- `GET /me/attendance?limit=&cursor=`: ページング継続取得。レスポンス `{ records, hasMore, nextCursor }`。
- `GET /admin/members/:memberId`: default limit=50 + `attendanceMeta`。
- `GET /admin/members/:memberId/attendance?limit=&cursor=`: ページング継続。
- `limit < 1` / 不正 cursor は 400。`limit > 200` は 200 に silent clamp する。

### Contract Matrix
| Layer | Contract | Owner | Evidence |
| --- | --- | --- | --- |
| repository | `findByMemberId(id, opts?)` + cursor encode/decode | `apps/api/src/repository/attendance.ts` | `attendance-provider.test.ts` |
| builder | encoded cursor を受け、`attendanceMeta` を view model へ注入 | `apps/api/src/repository/_shared/builder.ts` | `builder.test.ts` |
| route | query validation、400 変換、`limit > 200` clamp | `apps/api/src/routes/me/index.ts`, `apps/api/src/routes/admin/members.ts` | route tests + curl evidence |
| shared | `MemberProfile.attendanceMeta?` と Zod schema | `packages/shared/src/types/viewmodel/index.ts`, `packages/shared/src/zod/viewmodel.ts` | typecheck + schema tests |
| web | 初回配列へ追加ページを append する load-more UI | `apps/web/app/profile/_components/AttendanceList.tsx`, `apps/web/src/components/admin/MemberDrawer.tsx` | Vitest + Playwright |
| docs | API schema と cursor runbook | `docs/00-getting-started-manual/specs/01-api-schema.md`, `outputs/phase-2/cursor-format.md` | Phase 12 compliance |

### UI 導線
- `apps/web` profile attendance セクション: `attendanceMeta.hasMore` true で「もっと見る」ボタン表示、押下で `/me/attendance` を fetch し、レスポンスを既存リスト末尾に append、`nextCursor` を state 更新。
- admin 詳細画面 attendance セクション: 同様に `/admin/members/:id/attendance`。

## 参照資料
- `outputs/phase-2/phase-2.md`
- `outputs/phase-1/ac-check-list.md`

## 成果物
- `outputs/phase-2/phase-2.md`
- `outputs/phase-2/api-design.md`（OpenAPI スニペット相当）
- `outputs/phase-2/cursor-format.md`
- `outputs/phase-2/ui-load-more-design.md`

## 完了条件
- 上記設計が文書化され、Phase 3 レビューゲートで承認されている。

## 実行タスク
- [ ] 上記設計を成果物 4 ファイルに書き出す。
- [ ] 既存 `findByMemberIds` の戻り値型と新 `findByMemberId` の整合（要素型 `AttendanceRecord` 共通）を確認する。

## 統合テスト連携
- まだテスト実装は行わない。Phase 4 で雛形作成。
