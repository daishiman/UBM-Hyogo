# 06c — admin 5 画面 実装ガイド (PR 元原稿)

## Part 1: 中学生レベルの説明

このタスクは、学校の事務室に「先生だけが使える管理画面」を作る作業に近い。

- `/admin` は職員室の掲示板。会員数、公開中の人、未処理のタグ、フォーム変更の未解決件数を一目で見る。
- `/admin/members` は名簿。先生は公開状態や管理メモを扱えるが、本人が書いた自己紹介文を勝手に書き換えない。
- `/admin/tags` はタグの仕分け箱。タグは直接書き換えず、キューを確認してから解決する。
- `/admin/schema` は提出書類の変更点ファイル。フォーム項目の変更はここに集める。
- `/admin/meetings` は出席簿。削除済み会員は候補に出さず、同じ会員を同じ会に2回登録できない。

困りごとは「管理者が触ってよい情報」と「本人だけが直す情報」が混ざることだった。今回の実装では、画面構成とAPI経路を分けて、誤操作が起きにくい状態にした。

## Part 2: 技術者向け詳細

### 概要

`/admin` 配下 5 画面を Next.js App Router の `(admin)` route group として実装し、04c の管理 API・05a の admin gate と接続した。本人 profile 本文の管理者編集 UI、タグの直接編集 UI、schema の他画面解消 UI、削除済み会員の attendance 候補化、attendance 重複登録は **構造的に不可能** な UI に固定した。

## 主な変更点

### 追加

- `apps/web/app/(admin)/layout.tsx` — admin gate (`getSession`→isAdmin チェック→redirect) と AdminSidebar shell
- `apps/web/app/(admin)/admin/page.tsx` — ダッシュボード（KPI 4 種 + 最近提出 + schema 状態, `GET /admin/dashboard` 1 fetch）
- `apps/web/app/(admin)/admin/members/page.tsx` + `MembersClient.tsx` + `MemberDrawer.tsx` — 一覧 + フィルタ + 詳細ドロワー（status 変更・管理メモ作成・論理削除・editResponseUrl リンク・タグキュー導線）
- `apps/web/app/(admin)/admin/tags/page.tsx` + `TagQueuePanel.tsx` — 左 queue / 右 review / resolve POST。`?memberId=` で focus
- `apps/web/app/(admin)/admin/schema/page.tsx` + `SchemaDiffPanel.tsx` — added/changed/removed/unresolved 4 ペイン + alias 割当 form
- `apps/web/app/(admin)/admin/meetings/page.tsx` + `MeetingPanel.tsx` — 開催追加 form + attendance 編集（削除済み除外 + 重複 disabled + 422 toast）
- `apps/web/app/(admin)/admin/{loading,error,not-found}.tsx` — セグメント共通
- `apps/web/src/components/layout/AdminSidebar.tsx` — 5 画面ナビ
- `apps/web/src/lib/admin/api.ts` — client mutation wrapper（`AdminMutationResult` 型）
- `apps/web/src/lib/admin/server-fetch.ts` — Server Component 用 fetch helper（`INTERNAL_API_BASE_URL` + `INTERNAL_AUTH_SECRET`）
- `apps/web/app/api/admin/[...path]/route.ts` — client→apps/api proxy（admin 認可 + secret 注入）
- 4 件の Vitest テスト（`MemberDrawer` / `MeetingPanel` / `SchemaDiffPanel` / `lib/admin/api`）
- `apps/api/src/routes/admin/meetings.ts` — `/admin/meetings` に既存 attendance summary を同梱し、UI 初期表示で重複 disabled を成立させる

### 不変条件と防御

| 不変条件 | 防御策 |
| --- | --- |
| #4 / #11 | `MemberDrawer` に profile 本文 input/textarea を意図的に持たせない。テストで存在しないことを assertion |
| #5 | apps/web から D1 直接 import せず、`server-fetch.ts` + `/api/admin/*` proxy 経由のみ |
| #12 | 管理メモは `MemberDrawer` 内のみ、public/member view には漏らさない |
| #13 | `lib/admin/api.ts` は `resolveTagQueue` のみ。Drawer は `<Link>` のみ |
| #14 | `SchemaDiffPanel` は `/admin/schema/page.tsx` 以外で import しない |
| #15 | `MeetingPanel.filterCandidates` で削除済み除外 + option `disabled` + 422 toast |
| API gate | Server fetch / client proxy は Auth.js session cookie を apps/api へ forwarding し、04c/05a の `requireAdmin` と整合 |

### 主要型

```ts
type AdminMutationResult<T = unknown> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number };

interface MemberCandidate {
  memberId: string;
  fullName: string;
}

interface MeetingsListView {
  total: number;
  items: Array<{
    sessionId: string;
    title: string;
    heldOn: string;
    note: string | null;
    createdAt: string;
  }>;
}
```

### API 使用例

```ts
await patchMemberStatus(memberId, { publishState: "public" });
await postMemberNote(memberId, "管理者のみが読むメモ");
await resolveTagQueue(queueId, { decision: "resolved" });
await createMeeting({ title: "4月例会", heldOn: "2026-04-29", note: null });
await addAttendance(sessionId, memberId);
```

Client mutation は `/api/admin/*` proxy を経由し、Server Component の GET は `fetchAdmin` で `INTERNAL_API_BASE_URL` + `INTERNAL_AUTH_SECRET` を使う。apps/web から D1/repository を直接 import しない。

### エッジケース

| ケース | UI/処理 |
| --- | --- |
| 未認証または非admin | `(admin)/layout.tsx` が `/login` 系へ redirect |
| member detail 取得失敗 | `MemberDrawer` が `role="alert"` でエラー表示 |
| tag queue resolve 競合 | `TagQueuePanel` が失敗 toast を表示 |
| schema alias の対象なし | `SchemaDiffPanel` が失敗 toast を表示 |
| attendance duplicate | API由来の既存 attendance で option disabled + API 409 toast |
| deleted member attendance | server/client filter + API 422 toast |

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
rg -n "from ['\\\"](@repo/api|.*repository|.*d1)" apps/web
```

## 受入条件 (AC)

- AC-1〜5, 7〜10: PASS（実装 + テスト）
- AC-6: ESLint 構成導入は別 issue として DEFERRED

## 検証

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` → PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- MeetingPanel` → 7 files / 37 tests PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/admin/meetings.test.ts` → PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` → PASS
- 手動 smoke は `outputs/phase-11/manual-smoke-evidence.md` のチェックリストで実施可能（D1 fixture を要するため本セッションではスクリーンショット未取得）。Phase 11の画像証跡は `08b` / `09a` の Playwright・staging smoke へ委譲する。

## 関連リンク

- 上流: 04c (admin API), 05a (admin gate), 05b (gate state), 00 (UI primitives)
- 下流: 07a (tag resolve workflow), 07b (schema alias workflow), 07c (attendance/audit workflow), 08a (contract test), 08b (Playwright E2E)

## 備考

- `lib/admin/api.ts` は意図的に GET helper を持たない（Server Component 経由で十分）。`MemberDrawer` の詳細取得のみ Client から `/api/admin/members/:id` を直接 fetch している。
- ESLint rule の正式配置は ESLint 構成導入と合わせて別 task で扱う（`pnpm lint` が `tsc --noEmit` の現状仕様維持）。
