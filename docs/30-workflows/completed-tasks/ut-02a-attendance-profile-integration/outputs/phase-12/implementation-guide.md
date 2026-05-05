# Implementation Guide

## Part 1: 中学生レベル

なぜこの作業をするか。今の会員ページには「出席簿を貼る場所」はありますが、中身はいつも空です。このタスクは、学校の出席簿からその人の行を探して、自分のページに貼る係を作る作業です。

| 用語 | 中学生向け説明 |
| --- | --- |
| repository | データを取りに行く係 |
| N+1 | 人数分だけ何回も取りに行って遅くなること |
| branded type | ID の名札を間違えないための印 |
| chunk | 大人数を小さな班に分けること |
| DI | 必要な係を外から渡すこと |

## Part 2: 技術者レベル

### 実装サマリ

- `AttendanceProvider.findByMemberIds(ids)` を `apps/api/src/repository/attendance.ts` に追加（既存ファイルへ追記。`attendance/` 別ディレクトリ案は同名 `attendance.ts` と衝突するため統合）。
- 戻り値: `ReadonlyMap<MemberId, ReadonlyArray<AttendanceRecord>>`、`AttendanceRecord = { sessionId, title, heldOn }`（`packages/shared` の `MemberProfile.attendance` 要素型と一致）。
- N+1 防止: `member_attendance INNER JOIN meeting_sessions` の単一 `IN (?,?,...)` バッチ + `ATTENDANCE_BIND_CHUNK_SIZE = 80` でチャンク分割。
- branded type module: `apps/api/src/repository/_shared/branded-types/meeting.ts` 新設 (`MeetingSessionId` / `AttendanceRecordId`)。既存 `MemberId` / `ResponseId` 経路は不変。
- builder DI: `buildMemberProfile(c, mid, deps?)` / `buildAdminMemberDetailView(c, mid, notes, deps?)` に optional 第3/第4引数 `{ attendanceProvider }` を追加。未注入時は `[]` フォールバック（02a 互換）。
- 呼び出し側: `apps/api/src/routes/me/index.ts` (`GET /me/profile`) と `apps/api/src/routes/admin/members.ts` (`GET /admin/members/:memberId`) で `createAttendanceProvider(ctx)` を必ず注入。
- 不変条件: `MemberProfile.attendance: AttendanceRecord[]` の interface 契約（02a 確定）に破壊的変更なし。

### 変更ファイル一覧

| Path | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/repository/_shared/branded-types/meeting.ts` | 新設 | `MeetingSessionId` / `AttendanceRecordId` |
| `apps/api/src/repository/attendance.ts` | 拡張 | `AttendanceProvider` / `createAttendanceProvider` / `AttendanceRecord` / `ATTENDANCE_BIND_CHUNK_SIZE` を末尾追記 |
| `apps/api/src/repository/_shared/builder.ts` | 修正 | `attendance: []` stub 排除、`fetchAttendanceFor` 経由で provider 注入 |
| `apps/api/src/routes/me/index.ts` | 修正 | provider を `buildMemberProfile` に注入 |
| `apps/api/src/routes/admin/members.ts` | 修正 | provider を `buildAdminMemberDetailView` に注入 |
| `apps/api/src/repository/__tests__/attendance-provider.test.ts` | 新設 | 単体テスト 10 ケース（空入力、0/1/N 件、削除 meeting 除外、重複正規化、held_on DESC、bind chunk、dedupe、N+1 検証） |
| `apps/api/src/repository/__tests__/builder.test.ts` | 拡張 | attendance 注入/未注入の両分岐をテスト追加（builder 25 件 PASS） |

### 検証結果

- `pnpm --filter @ubm-hyogo/api typecheck`: PASS
- `pnpm --filter @ubm-hyogo/api lint`: PASS
- `vitest run attendance-provider.test.ts builder.test.ts`: 35 / 35 PASS
- リポジトリ全体テスト: 496 / 497 PASS（残 1 失敗 `schemaAliasAssign.test.ts > backfill batch loop` は本タスクと無関係な既存タイムアウト）。

### スコープ外確認

- write 系（出席登録 / 編集 / 削除）は本タスク範囲外（既存 `attendance.ts` の write 関数は無変更）。
- `MemberProfile` interface の構造変更なし。
- UI 新規実装なし（既存 mypage / admin 詳細画面が `MemberProfile.attendance` を表示する経路を流用）。
