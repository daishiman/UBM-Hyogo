# Task B — 手動フォーム再取込 管理 UI

**[実装区分: 実装仕様書]**

> 親要件: `../phase-1.md` の §3「Task B（手動フォーム再取込 UI）」AC-B1..B3。
> 既存の保存済み Google Form 回答（Forms API `forms.responses.list`）を、管理者が `admin/sync-status` 画面から
> **手動で再取込してメンバー一覧へ反映**できるようにする。
> 取込本体（cron `*/15 * * * *` の `runResponseSync` / Forms responses→D1 upsert）と
> 手動実行 endpoint `POST /admin/sync/responses`・全件 backfill `POST /admin/sync/responses?fullSync=true` は
> **すべて実装済み・変更不要**。本タスクは UI 導線と、UI から到達するための proxy 認証注入のみを担う。

---

## 1. 目的 / 受け入れ基準

### 目的
実装済みの手動 sync layer に admin UI を与え、管理者が画面操作だけで以下を完結できる状態にする。

1. **差分 sync（既定）**: `POST /admin/sync/responses` を叩き、`processedCount / writeCount / cursor` と status を確認する。
2. **全件 backfill（破壊的・明示確認付き）**: `POST /admin/sync/responses?fullSync=true` を叩き、Forms responses 全件で D1 を再構築する（**確認ダイアログ必須**）。
3. **二重起動防止**: 実行中はボタンを `disabled` にし、サーバ側 sync mutex（`withSyncMutex`）の `409 sync_in_progress` も結果欄に表示する。

> 差分 sync を**既定操作**、全件 backfill は**破壊的なので明示確認（confirm UI）付き**で副次配置する（親要件の方針）。

### 受け入れ基準（親 `phase-1.md` AC-B 群）

| ID | 内容 | 充足方法 |
|----|------|---------|
| AC-B1 | 管理者が `admin/sync-status` から手動 form response sync を実行でき、結果（取込件数・status）が表示される | `ManualFormResyncPanel.client.tsx` の「フォーム回答を再取込（差分）」ボタン → `SyncResult` を結果テーブルへ描画 |
| AC-B2 | 既存保存済み回答も対象になる full / cursor reset の選択肢を提示する（既存 endpoint の引数に準拠） | 「全件 backfill（再構築）」ボタン → `POST /admin/sync/responses?fullSync=true`。endpoint は引数を取らず**常に Forms responses 全件**を取り込むため、差分=`/admin/sync/responses`・全件=`/admin/sync/responses?fullSync=true` の **2 経路で full/cursor reset を表現**する（§8.2 参照。`fullSync?` / 任意 cursor body は両 endpoint とも**受け付けない**ことを実コードで確認済み） |
| AC-B3 | 実行中の二重起動を防止する（disabled / pending 状態） | `useAdminMutation` の `isLoading` を全ボタン `disabled` に接続 + サーバ側 `409 sync_in_progress` を結果欄へ表示 |

### スコープ外（やらないこと）
- **`apps/api` への変更**: endpoint・sync layer・D1 schema・migration・Google Form schema は一切触れない（AC-G2 / 不変条件）。
- Task A（公開状態 backfill UI）/ Task C（SLA 表示）/ Task D（外部リンク）の責務。
- 新規 primitive の追加（既存 `Button` / `AdminSectionCard` / トークン className を再利用）。
- 入力フォーム項目は不要（差分 / 全件の 2 ボタンのみ）。`FormField`（不変条件 #9）が必要な `<input>` は本パネルには無いが、もし将来フィールドを足す場合は `FormField` 経由とすること。

---

## 2. 変更対象ファイル一覧

| パス | 区分 | 内容 |
|------|------|------|
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | 新規 | `SyncResultSchema` / `SyncRunResponseSchema`（zod）+ 型 + endpoint パス定数 |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 新規 | 差分 sync / 全件 backfill 操作パネル（client component） |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | 編集 | `SyncStatusView` 末尾に `ManualFormResyncPanel` をマウント（Task A と同一ページだが**別パネル・別 import** でファイル競合を避ける） |
| `apps/web/app/api/admin/[...path]/route.ts` | 編集 | sync 系パス（`sync/schema` / `sync/responses` / `sync/backfill-publish-state` / `sync/diagnostics`）に対し `SYNC_ADMIN_TOKEN` を `Authorization: Bearer` として注入。未設定時は `500 sync_admin_token_missing`（§8.6） |
| `apps/web/src/lib/env.ts` | 編集 | `EnvSchema` / `AuthEnvSchema` に `SYNC_ADMIN_TOKEN`（optional）を追加 |
| `apps/web/wrangler.toml` | 編集 | `[env.staging.vars]` / `[env.production.vars]` ではなく **Secret 注入**（§8.6 / 不変条件「機密値は Cloudflare Secrets」）。toml には記載しない。`.dev.vars.example` に op 参照のみ追記 |
| `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | 新規 | パネル単体テスト（差分/全件/confirm/pending/409/error/schema mismatch） |
| `apps/web/src/features/admin/diagnostics/__tests__/manual-sync.spec.ts` | 新規 | `SyncResultSchema` / `SyncRunResponseSchema` の parse/reject テスト |

> 配置方針: sync 系パネルは Task A と同じ `apps/web/src/features/admin/components/_sync/` に集約。
> zod / 型は `apps/web/src/features/admin/diagnostics/`（既存 `types.ts` と同階層）に co-locate。
> **ファイル競合回避**: Task A は `BackfillPublishStatePanel.client.tsx` / `diagnostics/backfill.ts`、本タスクは
> `ManualFormResyncPanel.client.tsx` / `diagnostics/manual-sync.ts` と別名にする。`page.tsx` は両タスクとも
> `SyncStatusView` 末尾に**異なる JSX 行**を足すだけなので、マージ時は両パネルを並置する（順序: backfill → manual-resync は任意）。

---

## 3. 主要コンポーネント・関数・型のシグネチャ

### 3.1 zod schema + 型（`apps/web/src/features/admin/diagnostics/manual-sync.ts`）

`POST /admin/sync/responses` と `POST /admin/sync/responses?fullSync=true` のレスポンス契約は**同一形**（§8.1 / §8.2）。
正本は `apps/api/src/routes/admin/responses-sync.ts` と `apps/api/src/jobs/sync-forms-responses.ts`。
route ハンドラのラッパは `{ ok:true, result }` / `409 { ok:false, result:{ status:"skipped", ... } }`。
UI 側は API を信頼せず受信を `safeParse` してから描画する（不変条件 #5: `apps/web` から `apps/api` を import しない → ここで再宣言）。

```ts
import { z } from "zod";

/**
 * Forms response sync 完了レスポンス。
 * status は succeeded | failed | skipped。
 */
export const SyncResultSchema = z.object({
  status: z.enum(["succeeded", "failed", "skipped"]),
  jobId: z.string(),
  processedCount: z.number().int().nonnegative(),
  writeCount: z.number().int().nonnegative(),
  cursor: z.string().nullable(),
  skippedReason: z.string().optional(),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;

/**
 * 200 経路: { ok:true, result }。
 * 409 経路: { ok:false, result:{ status:"skipped", ... } }。
 * 両者を判別 union として表現する。
 */
export const SyncRunResponseSchema = z.union([
  z.object({ ok: z.literal(true), result: SyncResultSchema }).strict(),
  z.object({ ok: z.literal(false), result: SyncResultSchema }).strict(),
]);
export type SyncRunResponse = z.infer<typeof SyncRunResponseSchema>;

/** web → API proxy 経由のパス（catch-all proxy: app/api/admin/[...path]/route.ts）。 */
export const SYNC_RESPONSES_PATH = "/api/admin/sync/responses";
```

> 注: `409 sync_in_progress` は HTTP error として `useAdminMutation` 側に渡る（`!res.ok` 経路 → `FetchAuthedError(409, bodyText)`）。
> パネルは `mutation.error`（`FetchAuthedError`）の `status===409` を検知して「他の sync が実行中です」を出すか、
> もしくは body を `SyncRunResponseSchema` で parse して `error:"sync_in_progress"` を判別する（§4 参照）。

### 3.2 パネル component（`ManualFormResyncPanel.client.tsx`）

```ts
"use client";

export interface ManualFormResyncPanelProps {
  /** 取込成功時に親へ通知（任意）。診断 snapshot 再取得トリガ等に使う想定。未指定なら no-op。 */
  readonly onSynced?: (result: SyncResult) => void;
}

export function ManualFormResyncPanel(props: ManualFormResyncPanelProps): JSX.Element;
```

#### 内部 state

| state | 型 | 役割 |
|-------|-----|------|
| `lastResult` | `SyncResult \| null` | 直近の差分 sync / 全件 backfill の検証済み `result`。結果テーブル描画ソース |
| `mode` | `"run" \| "backfill" \| null` | `lastResult` がどちらの経路由来か（ラベル表示用） |
| `inProgress` | `string \| null` | `409 sync_in_progress` 検知時のメッセージ（jobId を含めてもよい） |
| `parseError` | `string \| null` | schema mismatch（`safeParse` 失敗）時の文言 |

#### mutation の使い方（AC-B3 / 不変条件 #10）

- `useAdminMutation` の **POST 非冪等 overload**（`useAdminMutation.ts:132-136`）を使う。`POST` には `retry` を渡せない（型エラー）。
  sync は副作用を持つ非冪等操作なので自動 retry を付けないのは正しい（二重 sync 防止にも整合）。
- `mutationFn` を渡さず**素の fetch 経路**を使う。差分 / 全件の切替は **2 つの hook インスタンス**でも、
  `endpointOverride`（`trigger(payload, endpointOverride?)`, `useAdminMutation.ts:178-179, 225`）でパスを切り替える 1 インスタンスでもよい。**推奨は 2 インスタンス**（差分=`SYNC_RESPONSES_PATH`, 全件=`SYNC_RESPONSES_PATH`）。理由: それぞれ独立に `isLoading` を持てて、全件 backfill ボタンだけ confirm 直後に発火させやすい。
- `timeoutMs`: sync は Forms responses fetch + upsert で 10s 既定を超えうる。**`timeoutMs: 60000`** を渡して打ち切りを延長する（`useAdminMutation.ts:43-44, 119-120, 187, 222`）。

```ts
import { useAdminMutation, FetchAuthedError } from "../../hooks/useAdminMutation";
import {
  SyncResultSchema,
  SyncRunResponseSchema,
  SYNC_RESPONSES_PATH,
  SYNC_RESPONSES_PATH,
} from "../../diagnostics/manual-sync";

const runMutation = useAdminMutation<unknown>(SYNC_RESPONSES_PATH, "POST", {
  refreshOnSuccess: false,      // 結果は手動描画。admin 画面側の自動再検証は不要
  successMessage: () => "",     // 操作系なので既定 toast を抑止しパネル内で可視化
  timeoutMs: 60000,             // Forms responses fetch + upsert は 10s 既定を超えうる
});

const backfillMutation = useAdminMutation<unknown>(SYNC_RESPONSES_PATH, "POST", {
  refreshOnSuccess: false,
  successMessage: () => "",
  timeoutMs: 60000,
});
```

差分 sync ハンドラ:

```ts
const data = await runMutation.trigger({});            // body は空 {}（endpoint は body を読まない）
const parsed = SyncRunResponseSchema.safeParse(data);
if (!parsed.success) { setParseError("sync レスポンスの形式が一致しません"); return; }
if ("result" in parsed.data) {
  setLastResult(parsed.data.result);
  setMode("run");
  setInProgress(null);
  props.onSynced?.(parsed.data.result);
}
```

全件 backfill ハンドラ（confirm 必須）:

```ts
// window.confirm は no-restricted-globals に抵触しうるため、自前の確認ダイアログ state か
// globalThis.confirm を isBrowser() ガード下で使う（既存 isBrowser: src/lib/is-browser）。
// 推奨: パネル内 confirm dialog（state: confirmingBackfill）。
const data = await backfillMutation.trigger({});
const parsed = SyncRunResponseSchema.safeParse(data);
// 以降は差分 sync と同じ（mode="backfill"）
```

> **409 / HTTP error 取り扱い**: `trigger` は `!res.ok`（409 含む）で `FetchAuthedError(status, bodyText)` を throw し、
> `useAdminMutation` 内で `error` state + toast 処理が走る（`useAdminMutation.ts:247-259, 195-200`）。
> パネルは `try { await trigger(...) } catch (e) {}` で握り、`e instanceof FetchAuthedError && e.status === 409` なら
> `setInProgress("他の同期処理が実行中です。完了後に再試行してください。")` を出す。それ以外の error は
> `useAdminMutation` の toast に委ね、パネルは `mutation.error?.message` を補助表示するだけでよい。

#### 二重起動防止（AC-B3）

- クライアント側: `runMutation.isLoading || backfillMutation.isLoading` を**全ボタンの `disabled`** に接続。
  `useAdminMutation` 内 `isSubmittingRef` も同一インスタンスの二重 `trigger` を throw でブロックする（`useAdminMutation.ts:180-183`）。
- サーバ側: `withSyncMutex`（`apps/api/src/sync/audit.ts:103-155`）が D1 ロックを取り、競合時は `status:"skipped"` →
  route が **`409 { ok:false, error:"sync_in_progress", jobId }`** を返す（`manual.ts:96-99` / `backfill.ts:103-107`）。
  これを `inProgress` 表示で UI に反映する（クライアント disabled をすり抜けた多端末同時操作の防御層）。

#### UI 構造（OKLch トークンのみ・HEX 禁止 / 不変条件 §2）

`AdminSectionCard`（`_shared` 既存）でラップ、見出し「フォーム回答の手動再取込」。

- ボタン 1: **「フォーム回答を再取込（差分）」** `variant="primary"`, `disabled={busy}`, `loading={runMutation.isLoading}`。
- ボタン 2: **「全件 backfill（再構築）」** `variant="danger"`, `disabled={busy}`。click で confirm dialog → OK で `backfillMutation.trigger`。
- helper コピー: 「差分再取込は前回以降の Google Forms 回答を取り込みます。全件 backfill は `fullSync=true` で全回答を再取込します（実行前に確認します）。」

色は既存 `sync-status/page.tsx:79-90` と同じ CSS 変数トークン
（`text-[var(--ubm-color-text-primary)]` / `text-[var(--ubm-color-text-muted)]` /
`border-[var(--ubm-color-border-default)]` / `bg-[var(--ubm-color-surface)]`）を踏襲。

結果テーブル（`lastResult` がある場合のみ描画）:

| 行ラベル | 値 |
|---------|-----|
| モード | `mode==="run" ? "差分再取込" : "全件 backfill"` |
| status | `lastResult.status`（success / failed / skipped） |
| processedCount（取得行） | `lastResult.processedCount` |
| writeCount（反映件数） | `lastResult.writeCount` |
| failed（スキップ/失敗） | `lastResult.failed` |
| retryCount（再試行） | `lastResult.retryCount` |
| jobId | `lastResult.jobId` |
| skippedReason | `lastResult.skippedReason ?? "—"`（任意） |

> `inProgress` が非 null のときは結果テーブルの代わりに（または上部に）「他の同期処理が実行中です」を表示。
> `parseError` のときは error 文言を表示し結果テーブルは描画しない。

### 3.3 page への組み込み（`sync-status/page.tsx`）

`SyncStatusView`（`page.tsx:71-127`）の末尾、return ルート div 閉じ前に追記:

```tsx
<ManualFormResyncPanel />
```

import 追加（既存の相対 import スタイルに合わせる）:

```ts
import { ManualFormResyncPanel } from "../../../../src/features/admin/components/_sync/ManualFormResyncPanel.client";
```

> client component を Server Component（`SyncStatusView`）内でマウントするだけ。`force-dynamic`（`page.tsx:7`）は維持。
> diagnostics fetch 失敗（`!result.ok`）時は `SyncStatusView` 自体が描画されないため、本パネルは正常系のみ表示（許容）。
> Task A の `BackfillPublishStatePanel` と並置する場合は両 import / 両 JSX 行を残す。

---

## 4. 入力・出力・副作用

| 操作 | 入力 | 出力（画面） | 副作用（DB / 外部） |
|------|------|-------------|--------------------|
| 差分再取込ボタン | body `{}` → `POST /api/admin/sync/responses?fullSync=false` | 結果テーブル（status / processedCount / writeCount / cursor / jobId） | Forms responses fetch → D1 upsert。`sync_jobs` に `trigger='admin'` 行を記録 |
| 全件 backfill ボタン | confirm OK → body `{}` → `POST /api/admin/sync/responses?fullSync=true` | 同上（`mode="全件 backfill"`） | Forms responses full sync → D1 upsert。`sync_jobs` に記録 |

※ current 正本は Forms split endpoint。legacy `/admin/sync/run` / `/admin/sync/backfill` は使わない。

- **二重起動防止**: `busy = runMutation.isLoading || backfillMutation.isLoading` 中は全ボタン `disabled`。サーバ側 `409` は `inProgress` 表示。
- **schema mismatch**: 受信を `SyncRunResponseSchema.safeParse` で検証し、不一致は `parseError` 表示（DB 副作用は endpoint 側で完結済み・UI 表示のみの問題）。
- **HTTP error**: 401（未認証 / token 不備）/ 403（非 admin）/ 500（`internal_api_base_url_missing` / `SYNC_ADMIN_TOKEN not configured`）/ network は `useAdminMutation` が toast + `error` state を担う。パネルは `mutation.error?.message` を補助表示。
- **認証**: 本パネルが `/api/admin/sync/*` を叩けるには proxy が `SYNC_ADMIN_TOKEN` を注入する必要がある（§8.6 / 変更対象 `route.ts`）。未注入だと API の `requireSyncAdmin` が **401** を返す。

---

## 5. テスト方針

新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。`vitest` + jsdom + Testing Library（既存 admin component テスト準拠）。
`fetch` は `vi.spyOn(globalThis, "fetch")` でモックし `useAdminMutation` の素 fetch 経路を通す。
`Toast` provider 無しでも `useAdminMutation` 内 `try { useToast() } catch {}`（`useAdminMutation.ts:144-148`）で動作する。
全件 backfill の confirm は自前 dialog state を click で進めるか、`globalThis.confirm` を spy する（実装に合わせる）。

### 5.1 `ManualFormResyncPanel.spec.tsx`

| ケース | 検証内容 |
|--------|---------|
| TC-B1 差分 sync 表示 | 差分ボタン click → `fetch` が `SYNC_RESPONSES_PATH`(POST) で 1 回呼ばれ、レスポンス `{ok:true,result:{status:"succeeded",writeCount:3,...}}` が結果テーブルに描画 / 「差分再取込」ラベル |
| TC-B2 全件 backfill（confirm OK） | 全件ボタン click → confirm 承認 → `fetch` が `SYNC_RESPONSES_PATH`(POST) で呼ばれる / 「全件 backfill」ラベル / `writeCount` 表示 |
| TC-B3 全件 backfill（confirm キャンセル） | confirm 拒否 → `fetch` が**呼ばれない**（破壊的操作の confirm ガード） |
| TC-B4 pending 無効化 | fetch を未解決 Promise にし click 後、両ボタンが `disabled`（AC-B3 クライアント層） |
| TC-B5 409 sync_in_progress | fetch が 409 `{ok:false,error:"sync_in_progress",jobId:"x"}` → 「他の同期処理が実行中です」表示 / 結果テーブル非描画（AC-B3 サーバ層） |
| TC-B6 error 表示 | fetch が 500 / 非 ok → 結果テーブル非描画 + error 補助文言 |
| TC-B7 schema mismatch | fetch が contract 外 JSON（例 `{foo:1}`）→ `parseError` 表示・テーブル非描画 |
| TC-B8 onSynced callback | 差分成功時 `onSynced` が検証済み `SyncResult` で 1 回呼ばれる |

### 5.2 `manual-sync.spec.ts`

| ケース | 検証内容 |
|--------|---------|
| TC-S1 valid 200 result | `{status:"succeeded",jobId:"a",processedCount:3,writeCount:3,failed:0,retryCount:0,durationMs:0}` が `SyncResultSchema.safeParse().success` |
| TC-S2 200 wrapper | `{ok:true,result:{...}}` が `SyncRunResponseSchema` の result 枝で parse 成功 |
| TC-S3 409 wrapper | `{ok:false,error:"sync_in_progress",jobId:"a"}` が error 枝で parse 成功 |
| TC-S4 status enum reject | `status:"running"` は reject（running は SyncResult から除外、types.ts:24） |
| TC-S5 負数 reject | `writeCount:-1` 等 nonnegative 違反で reject |
| TC-S6 skippedReason optional | `skippedReason` 欠落でも success（任意フィールド） |

---

## 6. ローカル実行・検証コマンド

すべて `mise exec --` 経由でリポジトリルートから実行（Node 24 保証）。

```bash
# 型チェック（web 単体）
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# 本タスクの追加テストのみ
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_sync \
  apps/web/src/features/admin/diagnostics/__tests__/manual-sync.spec.ts

# web の全テスト
mise exec -- pnpm --filter @ubm-hyogo/web test

# Lint（ルート集約。boundary / no-inline-style / eslint / 各 package lint を内包）
mise exec -- pnpm lint
```

> `pnpm --filter @ubm-hyogo/web lint` は `tsc -p tsconfig.json --noEmit && eslint 'src/**/*.{ts,tsx}'`（web package.json `lint`）。
> ルート `pnpm lint` は inline `style={{...}}` を禁止する `verify:no-inline-style` を含むため、className（トークン変数）で記述する。
> `globalThis.confirm` / `globalThis.location` 等は `no-restricted-globals` に抵触しうる。`isBrowser()` ガード + scoped eslint-disable か、自前 dialog state を採用する（既存パターン: `useAdminMutation.ts:85-91, 270` の `isBrowser` / AbortError 扱い）。

---

## 7. DoD（完了の定義）

- [ ] `apps/web/src/features/admin/diagnostics/manual-sync.ts` に `SyncResultSchema` / `SyncRunResponseSchema` / 型 / `SYNC_RESPONSES_PATH` / `SYNC_RESPONSES_PATH` を新規追加。endpoint 契約（`apps/api/src/sync/types.ts:15-27` / `manual.ts:93-103` / `backfill.ts:101-111`）と整合。
- [ ] `ManualFormResyncPanel.client.tsx` を新規追加。`useAdminMutation`（`@/features/admin/hooks/useAdminMutation`）経由（不変条件 #10）・OKLch トークンのみ・新規 `<input>` を `src/components/admin/` に増やさない（不変条件 #9）。
- [ ] `sync-status/page.tsx` の `SyncStatusView` 末尾にパネルをマウント。既存表示（H1-H4 / pipeline counts / secrets readiness）と `force-dynamic` を破壊しない。Task A パネルと並置可能。
- [ ] `apps/web/app/api/admin/[...path]/route.ts` に sync 系パス（`sync/responses` / `sync/responses`）の `SYNC_ADMIN_TOKEN` → `Authorization: Bearer` 注入を追加（§8.6）。既存 cookie / x-internal-auth 転送・admin gate（`:30-41`）は維持。
- [ ] `apps/web/src/lib/env.ts` の `EnvSchema`（必要なら `AuthEnvSchema`）に `SYNC_ADMIN_TOKEN`（optional）を追加し、`getAuthEnv()` 経由で読めるようにする（`process.env` 直参照禁止 / task-02 不変条件）。
- [ ] `SYNC_ADMIN_TOKEN` は Cloudflare Secrets で注入（`bash scripts/cf.sh secret put SYNC_ADMIN_TOKEN --config apps/web/wrangler.toml --env <env>`）。`.dev.vars.example` に `op://...` 参照のみ追記。**toml に実値を書かない**。
- [ ] 新規 spec 2 ファイルが `*.spec.{ts,tsx}` 命名で全ケース pass。
- [ ] `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web test`（追加分含む）/ `pnpm lint` 成功。
- [ ] 差分 sync で `SyncResult` 表示、全件 backfill は confirm 必須、pending 中ボタン無効化、`409 sync_in_progress` 表示、HTTP error / schema mismatch 時に結果テーブル非描画 + error 表示（AC-B1..B3）。
- [ ] `apps/api` / `packages` への差分が 0（endpoint・sync layer は変更しない）。

---

## 8. 関連ファイルの実コード根拠

### 8.1 手動 sync endpoint `POST /admin/sync/responses`（正本・変更不要）
`apps/api/src/sync/manual.ts:93-103`
```ts
manualSyncRoute.post("/admin/sync/responses", requireSyncAdmin, async (c) => {
  const result = await runManualSync(c.env);
  if (result.status === "skipped") {
    return c.json(
      { ok: false, error: "sync_in_progress", jobId: result.jobId },
      409,
    );
  }
  const httpStatus = result.status === "failed" ? 500 : 200;
  return c.json({ ok: result.status !== "failed", result }, httpStatus);
});
```
- **引数**: `runManualSync(c.env)` のみ。`c.req` から body / query を**一切読まない** → `fullSync?` も `cursor` も**受け付けない**（AC-B2 注記の根拠）。
- **認証**: `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`、timing-safe 比較。`apps/api/src/middleware/require-sync-admin.ts:18-35`）。
- mount: `apps/api/src/index.ts:259`（`app.route("/", manualSyncRoute)`）。
- 互換 mount `POST /admin/sync`（`apps/api/src/routes/admin/sync.ts:13-23`）も `runManualSync` に委譲。UI は正本 `/admin/sync/responses` を使う。

### 8.2 cursor 既定挙動（full / cursor reset の解釈根拠）
`apps/api/src/sync/manual.ts:26-39, 41-60`
- `runManualSync(env, deps)` → `withSyncMutex(...) { runFetchMapUpsert(env, deps) }`（`:37`）。`runFetchMapUpsert` の第 3 引数 `cursorIso` は**呼び出し時に渡されず既定 `null`**（`:41-42`）。
- `cursorIso` が null のため `client.fetchAll(range)`（`:58-60`）= **全件取得**。`mapSheetRows` → `upsertMemberResponses`（`:81-83`）。差分 DELETE はしない。
- range 既定 `"Form Responses 1!A1:ZZ10000"`（`:45`）。
- → endpoint レベルでは `/admin/sync/responses?fullSync=false` が「保存済み回答も含む全件再取込（upsert）」であり、`fullSync` フラグや cursor reset の**引数は存在しない**。UI の full/cursor reset 選択は「差分 upsert（`/run`）」と「全件再構築（`/backfill`、破壊的 DELETE+再構築）」の 2 経路で表現する。

### 8.3 全件 backfill endpoint `POST /admin/sync/responses?fullSync=true`（破壊的・変更不要）
`apps/api/src/sync/responses.ts:101-111`
```ts
backfillSyncRoute.post("/admin/sync/responses?fullSync=true", requireSyncAdmin, async (c) => {
  const result = await runBackfill(c.env);
  if (result.status === "skipped") {
    return c.json(
      { ok: false, error: "sync_in_progress", jobId: result.jobId },
      409,
    );
  }
  const httpStatus = result.status === "failed" ? 500 : 200;
  return c.json({ ok: result.status !== "failed", result }, httpStatus);
});
```
- `runBackfill(c.env)` は全件 DELETE + 再構築（破壊的）。レスポンス形は `/run` と**同一**（`{ok, result:SyncResult}` / 409）。
- 認証 `requireSyncAdmin`。mount: `apps/api/src/index.ts:260`。

### 8.4 sync mutex（二重起動防止のサーバ層 / 409 の出どころ）
`apps/api/src/sync/audit.ts:103-155`
- `withSyncMutex(deps, "admin", body)`: D1 ロック取得 → 競合時 `startRun` が `status:'skipped'` を INSERT（`:45-50`）。
- `withSyncMutex` は `status:"skipped"` の `SyncResult` を返し（`:111-121`）、route が **409** にマップする（§8.1 / §8.3）。
- 成功時は `{ status:"succeeded"|"failed", jobId, ...DiffSummary }`（`:149-155`）。

### 8.5 レスポンス型（zod 再宣言の正本）
`apps/api/src/sync/types.ts:15-27`
```ts
export interface DiffSummary { processedCount: number; writeCount: number; failed: number; retryCount: number; durationMs: number; }
export interface SyncResult extends DiffSummary {
  status: Exclude<SyncLogStatus, "running">;  // success | failed | skipped
  jobId: string;
  skippedReason?: string;
}
```

### 8.6 認証ギャップ（本タスクで解消すべき core 事項）
**現状**: sync endpoint は `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`、`apps/api/src/middleware/require-sync-admin.ts:18-35`）。
一方で web の catch-all proxy は **`x-internal-auth`（INTERNAL_AUTH_SECRET）と cookie を注入するが、`authorization` はクライアントが送ってきた場合のみ転送**する:
`apps/web/app/api/admin/[...path]/route.ts:62-68`
```ts
const headers: Record<string, string> = { "x-internal-auth": internalSecret() };
const cookie = req.headers.get("cookie"); if (cookie) headers.cookie = cookie;
const authorization = req.headers.get("authorization"); if (authorization) headers.authorization = authorization;
```
ブラウザは `SYNC_ADMIN_TOKEN`（機密）を保持できないため、`/api/admin/sync/responses` への素のクライアント fetch は API 側 `requireSyncAdmin` で **401** になる。
（対比: `/admin/diagnostics/forms-pipeline` は `requireAdmin` = session JWT 検証（`apps/api/src/diagnostics/forms-pipeline.ts:386` / `apps/api/src/middleware/require-admin.ts:116-148`）で、proxy が cookie/JWT を転送するため到達可能。sync 系だけ Bearer なので到達不能。）

**解消方針（proxy 側で server-only に注入）**: `requireAdmin()`（proxy 内 session 検証, `route.ts:30-41`）を通過した admin リクエストのうち、`path` が `sync/responses` / `sync/responses`（必要なら `sync/responses-publish-state`=Task A 分も）のとき、proxy が server 環境の `SYNC_ADMIN_TOKEN` を `Authorization: Bearer <token>` として upstream へ付与する。クライアントへはトークンを返さない（proxy 内で完結）。
```ts
// route.ts proxy() 内（headers 構築後・upstream fetch 前）に追加する想定
const isSyncBearerPath = path[0] === "sync" &&
  (path[1] === "run" || path[1] === "backfill" || path[1] === "backfill-publish-state");
if (isSyncBearerPath) {
  const token = getAuthEnv().SYNC_ADMIN_TOKEN;  // env.ts に SYNC_ADMIN_TOKEN を追加
  if (token) headers.authorization = `Bearer ${token}`;
}
```
- `SYNC_ADMIN_TOKEN` は `apps/web/src/lib/env.ts` の `EnvSchema`（`:4-23`、`INTERNAL_AUTH_SECRET` 同様 optional）と `AuthEnvSchema`（`:41-51`）に追加し、`getAuthEnv()`（`:130`）で読む。`process.env` 直参照は禁止（task-02 不変条件）。
- 値は Cloudflare Secrets で注入（API 側 wrangler の `SYNC_ADMIN_TOKEN` と**同一値**にする）。toml には書かない（不変条件: 機密は Secrets / `.dev.vars.example` は op 参照のみ）。
- > 注: Task A（`sync-backfill-publish-state`）も同じ `requireSyncAdmin` 配下のため同じ注入が必要。本タスクで proxy 注入を実装すれば Task A の到達性も同時に満たせる（`path[1]==="backfill-publish-state"` を含めるかは A/B のマージ順で調整。重複追加にならないよう 1 箇所に集約）。

### 8.7 mutation 規約（AC-B3 / 不変条件 #10）
`apps/web/src/features/admin/hooks/useAdminMutation.ts`
- POST 非冪等 overload（retry 不可）: `:132-136`
- `trigger(payload, endpointOverride?)`: `:178-179`、fetch は `endpointOverride ?? endpoint`: `:225`
- 二重起動ブロック（`isSubmittingRef`）: `:180-183`
- `isLoading` 返却: `:149, :302`
- timeout（既定 10s / `timeoutMs` で延長）: `:43-44, 119-120, 187, 222`
- `!res.ok`（409 含む）→ `FetchAuthedError(status, bodyText)` throw: `:247-259`、401 → `AuthRequiredError`: `:236-237`
- 200 json 化（204 は undefined）: `:261-262`
- provider 無し toast guard: `:144-148`、`isBrowser`/AbortError 扱い: `:85-91, 270`
- `FetchAuthedError` re-export（`status` で 409 判定に使う）: `:67`

### 8.8 既存ページ（マウント先 / トークン例）
`apps/web/app/(admin)/admin/sync-status/page.tsx`
- `force-dynamic`: `:7`、タイトル「Google Form 反映診断」: `:45`
- `SyncStatusView` return ルート div: `:71-126`（末尾にパネル追記）
- diagnostics fetch（`safeServerFetch` / requireAdmin 経路）: `:37`
- OKLch トークン className 例: `:79`（`border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface)]`）、`:81/85/88`（`text-[var(--ubm-color-text-*)]`）

### 8.9 cron 取込本体（手動 sync が再現する処理 / 背景理解用・変更不要）
`apps/api/src/jobs/sync-forms-responses.ts` の `runResponseSync()` / `processResponse()`、cron `*/15 * * * *`（`apps/api/wrangler.toml` triggers, `apps/api/src/index.ts` scheduled handler）。手動 sync layer（`runManualSync`）は同じ map→upsert を mutex 付きでオンデマンド実行する位置づけ。
