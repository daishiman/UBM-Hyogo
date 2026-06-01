# 実装ガイド

## Part 1: 中学生にもわかる説明

なぜ必要か: Google Form に回答しても、管理者が「今どう反映されているか」「いつ一覧に出るか」「公開スイッチを救済できるか」を画面で確認・操作できないと、会員が存在するのに `/members` が空に見える状態を自力で直せません。

たとえば、教室の名簿に名前はあるのに、掲示板に貼る許可欄だけ空欄のままだと、先生はその子を掲示板に載せられません。今回の対応は、名簿の許可欄を確認して直すボタン、回答をもう一度取り込むボタン、掲示板に反映される時間の説明をそろえるイメージです。

何が変わるか: 管理者は同期診断画面から公開状態の救済と Google Forms 回答の再取込を実行でき、会員と公開ページの利用者は反映タイミングを画面で確認できます。

### 今回作ったもの

- 管理画面 `/admin/sync-status` の公開状態 backfill パネル。
- 管理画面 `/admin/sync-status` の Google Forms 回答再取込パネル。
- `/members` と `/profile` の Google Form 反映タイミング表示。
- 管理サイドバーの Google Form 回答一覧リンク。

会員ディレクトリ（みんなの紹介ページ）に「公開していい人が今いません」と出ていました。
でも実は 2 人が登録済みです。なぜ出ないかというと、コンピューターの中では会員に「公開してOK」という
スイッチ（`publish_state`）があり、これが初期状態では「会員だけに見せる（member_only）」になっているからです。
「ホームページに載せてOK」と同意（consent）していても、このスイッチが自動で「公開（public）」に切り替わるのは
特定の条件のときだけです。だから昔OKした人も、スイッチが切り替わらないまま止まっていました。

実は、止まっている人をまとめて「公開」に切り替える機能（backfill）は**もう作ってあります**。
ただ、管理者がその機能を**画面のボタンから押せるようになっていない**だけでした。

そこで 4 つの仕事に分けます:
- **A**: 「止まっている人をまとめて公開にするボタン」を管理画面に付ける
- **B**: 「Googleフォームの答えをもう一度取り込むボタン」を管理画面に付ける（昔の回答も反映できる）
- **C**: 「フォームに書いてから何分くらいで一覧や自分のページに出るか」を画面と説明書に書く
- **D**: 管理画面から「Googleフォームの回答一覧表」へ飛ぶリンクを付ける

「どこに出るか」も整理しました。**一覧（/members）は公開OKの人だけ**出ます。
**自分のページ（/profile）は公開OKかどうかに関係なく、自分の情報がそのまま出ます**。
反映の速さは、フォーム送信から **最大15分**（取り込みは15分ごと）+ 画面更新30秒くらい。
混んでいる最悪のときで **15〜45分** くらいです。

## Part 2: 技術者向け

### 根本原因
- 公開条件 = `public_consent='consented' AND publish_state='public' AND is_deleted=0`（`publicMembers.ts:37-39`）
- `publish_state` 既定値 `member_only`。public 昇格は `decidePublishState()`（auto-publish policy）が flag ON + sync 実行時のみ。
- 既存メンバーは過去 sync 時点の状態で滞留。

### タスク別実装サマリ

| Task | 主な変更 | 既存資産 |
|------|---------|---------|
| A | `BackfillPublishStatePanel.client.tsx` 新規 + sync-status page マウント + `BackfillResultSchema` | `POST /admin/sync/responses?fullSync=true-publish-state`（変更不要） |
| B | `ManualFormResyncPanel.client.tsx` 新規 + proxy 認証注入（`route.ts`+`env.ts`+Secrets） | `POST /admin/sync/responses?fullSync=false`, `POST /admin/sync/responses?fullSync=true`（confirm） |
| C | `ReflectionTimingNote.tsx` 新規 + /members・/profile マウント + 03-data-fetching.md SLA 追記 | `GET /public/stats` の `responseSyncFinishedAt`（既存・API 拡張不要） |
| D | `constants/form.ts` 定数 + `ShellNavItem.external?` + `SidebarNavItem` 外部分岐 + icon | `RegisterCallout.tsx` 外部リンクパターン |

### 横断前提（A/B）
sync 系 endpoint は `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`）。web proxy がブラウザ fetch にトークンを付けられないため、
proxy（`apps/web/app/api/admin/[...path]/route.ts`）で server-only に `Authorization: Bearer` を注入する。`SYNC_ADMIN_TOKEN` 未設定時は client Authorization へフォールバックせず `500 sync_admin_token_missing` を返す。

### 実装順序
1. Task B proxy 認証経路 → 2. Task A → 3. Task C / D（並列）→ typecheck/lint/test → Phase 11 → PR(base=dev)

### 不変条件
INV: D1 は apps/api 内（#5）/ admin mutation は `useAdminMutation`（#10）/ admin input は `FormField`（#9）/ OKLch トークン / 外部リンク `rel="noopener noreferrer"`（#7）/ test は `*.spec.{ts,tsx}`（#8）。

### APIシグネチャ / TypeScript types

```ts
export const SYNC_RESPONSES_PATH = "/api/admin/sync/responses" as const;

export type SyncResult = {
  status: "succeeded" | "failed" | "skipped";
  jobId: string;
  processedCount: number;
  writeCount: number;
  cursor: string | null;
  skippedReason?: string;
};

// Differential import
POST /api/admin/sync/responses?fullSync=false

// Full import
POST /api/admin/sync/responses?fullSync=true
```

### 使用例

```tsx
const raw = await runMutation.trigger(
  {},
  `${SYNC_RESPONSES_PATH}?fullSync=false`,
);
const parsed = SyncRunResponseSchema.safeParse(raw);
if (!parsed.success) {
  setParseError("sync result schema mismatch");
  return;
}
setLastResult(parsed.data.result);
```

### エラーハンドリング

- `SYNC_ADMIN_TOKEN` missing in web proxy: `500 sync_admin_token_missing`; client bearer is not forwarded to sync routes.
- Concurrent response sync: API returns HTTP 409 with `result.status="skipped"`; UI displays an in-progress message and does not render the result table.
- Schema mismatch: panels suppress success toast until after `safeParse`, then show local parse error only.
- Backfill publish-state apply: disabled until a successful dry-run with candidates, then requires `confirm`.
- Legacy endpoint guard: active web/docs scope must not reference `/admin/sync/run` or `/admin/sync/backfill`.

### エッジケース

- dry-run 候補が 0 件の場合、公開状態 apply は disabled のままにする。
- `ok:false` かつ `status!="skipped"` の Forms response sync result は schema mismatch として扱う。
- `statsUnavailable` のときも `/members` / `/profile` の反映タイミング欄は fallback 文言を出す。
- 外部 Form リンクは `target="_blank"` と `rel="noopener noreferrer"` を必須にする。

### 設定項目と定数一覧

| Name | Owner | Purpose |
|---|---|---|
| `SYNC_ADMIN_TOKEN` | Cloudflare Secret / web+api | `/admin/sync/schema` / `/admin/sync/responses` / backfill-publish-state の Bearer |
| `SYNC_RESPONSES_PATH` | `apps/web/src/features/admin/diagnostics/manual-sync.ts` | web proxy 経由 Forms response sync path |
| `FORM_RESPONSES_EDIT_URL` | `apps/web/src/lib/constants/form.ts` | admin sidebar external link |
| `RESPONSE_SYNC_MAX_DELAY_MINUTES` | `ReflectionTimingNote.tsx` | response sync SLA 表示 |

### テスト構成

- `BackfillPublishStatePanel.spec.tsx`: dry-run, apply gating, confirm cancel, pending, HTTP error, schema mismatch, callback.
- `ManualFormResyncPanel.spec.tsx`: `fullSync=false`, `fullSync=true`, confirm cancel, pending, 409 skipped, HTTP error, schema mismatch, callback.
- `sync-schemas.spec.ts`: zod parse/reject for backfill and current Forms response sync contracts.
- `route.spec.ts`: sync bearer injection, missing-token 500, non-sync Authorization forwarding.

### Phase 11 screenshot evidence

`VISUAL_ON_EXECUTION` remains required. Current status is `runtime_visual_pending`; static local gates are green but PNG capture is not claimed.

| Screenshot | Path | Status |
|---|---|---|
| Task A backfill panel | `../phase-11/screenshots/a-backfill-panel.png` | pending |
| Task B manual resync panel | `../phase-11/screenshots/b-manual-resync-panel.png` | pending |
| Task C members reflection note | `../phase-11/screenshots/c-members-reflection-note.png` | pending |
| Task C profile reflection note | `../phase-11/screenshots/c-profile-publish-state.png` | pending |
| Task D admin Form link | `../phase-11/screenshots/d-admin-form-link.png` | pending |

Capture command:

```bash
PLAYWRIGHT_MEMBER_PUBLISH_RECOVERY=1 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/member-publish-recovery-form-ops-and-admin-link.spec.ts --project=desktop-chromium
```
