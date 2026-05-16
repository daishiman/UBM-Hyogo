# Implementation Guide

## Part 1: 中学生向け説明

参加履歴は、図書館で本を少しずつ借りるときの「しおり」に似ています。最初に全部の本を机に積むと重くて探しにくいので、まずサーバーが標準で返す 50 件までを見せます。続きがあるときは「もっと見る」ボタンを押すと、サーバーが渡したしおりを使って次の履歴を取ります。

この仕組みが必要な理由は、参加履歴が多い人でも画面を軽く保ち、読み込みに失敗したときにもう一度試せるようにするためです。画面側はしおりの中身を開けず、そのままサーバーに返します。

| 用語 | 日常語での説明 |
| --- | --- |
| cursor | 次の続きを取るためのしおり |
| paging | 一度に全部ではなく少しずつ見ること |
| Server Component | 最初の画面を作って渡す係 |
| Client Component | ボタンを押した後に画面を動かす係 |
| opaque | 中身をのぞかず、そのまま使うこと |

## Part 2: 技術者向け説明

`ProfilePage` は `fetchAuthed<MeProfileResponse>("/me/profile")` で初期 attendance と `attendanceMeta` を取得し、`AttendanceList` に props として渡す。`AttendanceList` は Client Component とし、追加ページ取得だけを browser fetch に閉じる。

```tsx
<AttendanceList
  attendance={profile.attendance}
  attendanceMeta={profile.attendanceMeta}
/>
```

追加取得の API は既存 `/api/me/attendance` のみを使う。

```ts
export interface MeAttendancePageResponse {
  readonly records: ReadonlyArray<MeAttendanceRecord>;
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
}
```

エラー時は `role="alert"` を描画し、loading 中だけ button を disabled にする。cursor は `encodeURIComponent(cursor)` だけを適用し、base64url JSON の中身を UI で decode しない。

## Runtime Path x Evidence

| Path | Evidence |
| --- | --- |
| Unit / Client state | `apps/web/app/profile/_components/AttendanceList.spec.tsx` |
| Server props wiring | `apps/web/app/profile/page.tsx` |
| API contract | `docs/00-getting-started-manual/specs/01-api-schema.md` §Attendance pagination |
| Visual token safety | `outputs/phase-11/evidence/design-token-grep.txt` |
| Local visual evidence | `outputs/phase-11/screenshots/profile-attendance-paging-desktop.png` |

## Verification Commands

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
PLAYWRIGHT_ATTENDANCE_PAGING_EVIDENCE=1 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/outputs/phase-11/evidence ATTENDANCE_PAGING_SCREENSHOT_DIR=../../docs/30-workflows/completed-tasks/parallel-04-attendance-paging-ui/outputs/phase-11/screenshots mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance-paging-ui-evidence.spec.ts --project=desktop-chromium
```
