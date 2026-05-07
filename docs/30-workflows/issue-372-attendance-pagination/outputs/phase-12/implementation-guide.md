# Implementation Guide

## Part 1: 初学者向け

長く活動している会員は、出席の記録がとても多くなります。全部を一度に画面へ送るのは、図書館で本を一気に全部かばんへ入れるようなものです。重くなり、探すのも大変になります。

このタスクでは、最初に最近の 50 件だけを渡し、続きが必要なときだけ「もっと見る」で次の分を取ります。出席の一覧そのものは今まで通り残し、続きがあるかどうかだけを別の印として付けます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| cursor | 続きから読むためのしおり |
| endpoint | 情報を取りに行く窓口 |
| repository | データを取り出す係 |
| schema | 情報の形の決まり |
| response | 返ってくる情報 |

## Part 2: 技術者向け

### 変更ファイル一覧

| Layer | Path | Contract |
| --- | --- | --- |
| repository | `apps/api/src/repository/attendance.ts` | `findByMemberId(id, opts?)`, cursor encode/decode, `LIMIT N+1` |
| builder | `apps/api/src/repository/_shared/builder.ts` | encoded cursor string を受けて `attendanceMeta` を注入 |
| shared type | `packages/shared/src/types/viewmodel/index.ts` | `MemberProfile.attendanceMeta?` |
| shared zod | `packages/shared/src/zod/viewmodel.ts` | optional `attendanceMeta` schema |
| me route | `apps/api/src/routes/me/index.ts` | `/me/profile`, `/me/attendance` |
| admin route | `apps/api/src/routes/admin/members.ts` | `/admin/members/:memberId`, `/admin/members/:memberId/attendance` |
| web profile | `apps/web/app/profile/page.tsx`, `apps/web/app/profile/_components/AttendanceList.tsx` | profile load-more UI |
| web admin | `apps/web/src/components/admin/MemberDrawer.tsx` | admin detail load-more UI |

### 主要シグネチャ

```ts
export type AttendanceCursor = { heldOn: string; sessionId: MeetingSessionId };
export interface AttendancePageOptions { limit?: number; cursor?: AttendanceCursor; }
export interface AttendancePageResult {
  records: ReadonlyArray<AttendanceRecord>;
  hasMore: boolean;
  nextCursor: string | null;
}
```

Route / builder は encoded cursor string、repository は decoded `AttendanceCursor` を扱う。`limit < 1` と不正 cursor は HTTP 400、`limit > 200` は 200 に clamp する。

### エッジケース

- 同一 `held_on` は `session_id DESC` で tie-break する。
- SQL cursor 条件は `held_on < ? OR (held_on = ? AND session_id < ?)` を使う。
- `findByMemberIds(ids)` は変更しない。
- `MemberProfile.attendance` は配列のまま維持し、`attendanceMeta` は optional にする。

### 検証（2026-05-07 実装サイクル実行結果）

| Phase | 内容 | 結果 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` 全パッケージ | ✅ green |
| lint | `pnpm lint` (boundaries/deps/stablekey/tsc) | ✅ green（既存 issue-393 stablekey warning 2 件は無関係） |
| 4 (unit) | `apps/api/src/repository/__tests__/attendance-pagination.test.ts` 11 / 11 | ✅ |
| 4 (builder) | `builder.test.ts` 25 / 25 | ✅ |
| 5 (me route) | `apps/api/src/routes/me/index.test.ts` 28 / 28（うち pagination 8 ケース新規） | ✅ |
| 5 (admin route) | `apps/api/src/routes/admin/members.test.ts` 21 / 21（うち attendance 4 ケース新規） | ✅ |
| 6 (web) | `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` 13 / 13 | ✅ |
| 9 build | `pnpm --filter @ubm-hyogo/shared build` / `@ubm-hyogo/integrations build` | ✅ tsc green |
| 9 build (full) | `pnpm build`（`scripts/with-env.sh` 経由） | ⚠ 1Password CLI authorization timeout により未完了（環境要因）。コード起因ではない。 |
| 11 VISUAL | staging deploy + browser screenshot + curl evidence | ⚠ 未実施。staging deploy と authenticated browser capture には Cloudflare API Token / runtime session が必要なため、本ローカルレビューサイクルでは取得不可。Phase 13 PR 作成前の user-approved runtime cycle で再実行する。 |

#### 全体 vitest の補足

`pnpm exec vitest run` 全体実行時は miniflare の `EADDRNOTAVAIL` ポート枯渇により 18 ファイル / 127 ケースが環境的に失敗する。issue-372 で追加・改修した範囲は個別実行で **すべて pass** している。issue-393 由来の `scripts/lint-stablekey-literal.test.ts` 1 ケースの失敗は本タスク無関係。

### 既知の deferred

- Phase 11 staging visual evidence（6 screenshots + 5 curl JSON）は staging deploy 後に取得する。task spec の `outputs/phase-11/` 直下に未配置。
- API schema 文書（`docs/00-getting-started-manual/specs/01-api-schema.md`）と aiworkflow `references/api-endpoints.md` への新エンドポイント・`attendanceMeta` 記載は 2026-05-07 review cycle で反映済み。
