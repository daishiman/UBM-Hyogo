# Task A — 公開状態 backfill 管理 UI

**[実装区分: 実装仕様書]**

> 親要件: `../phase-1.md` の §3「Task A（公開状態 backfill 管理 UI）」AC-A1..A4。
> 公開判定 3 条件 AND（`public_consent='consented' AND publish_state='public' AND is_deleted=0`）のうち
> `publish_state` が `member_only` のまま滞留している「以前許可した」メンバーを、
> 管理者が `admin/sync-status` 画面から救済（dry-run 確認 → apply 昇格）できるようにする。

---

## 1. 目的 / 受け入れ基準

### 目的
既存の救済 endpoint `POST /admin/sync/responses?fullSync=true-publish-state?dryRun=true|false`（実装済み・**変更不要**）に
管理 UI 導線を与え、管理者が画面操作だけで以下を完結できる状態にする。

1. **dry-run**: 実 DB を変更せず、`scanned / candidates / skipped` の内訳を確認する。
2. **apply**: 同意済み × `member_only` メンバーを `public` へ昇格させ、`applied` 件数を確認する。

### 受け入れ基準（親 `phase-1.md` AC-A 群）

| ID | 内容 | 充足方法 |
|----|------|---------|
| AC-A1 | 管理者が `admin/sync-status` から dry-run を実行し、`scanned/candidates/skipped` の内訳を確認できる | `BackfillPublishStatePanel.client.tsx` の「dry-run（確認のみ）」ボタン → 結果テーブル描画 |
| AC-A2 | 管理者が apply を実行し、同意済み×member_only が public へ昇格、`applied` 件数が表示される | 同パネルの「apply（昇格を実行）」ボタン → `applied` を結果テーブルに表示 |
| AC-A3 | apply は admin override（hidden / 非 system updated_by）と is_deleted を尊重しスキップする（既存 endpoint 仕様の踏襲） | endpoint 側で完結（本タスクは UI のみ）。`skipped.adminExplicit` / `skipped.deleted` を結果テーブルに表示して可視化 |
| AC-A4 | mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10） | `useAdminMutation<BackfillResult>("/api/admin/sync/responses?fullSync=true-publish-state", "POST", ...)` を使用。legacy `@/lib/useAdminMutation` を import しない |

### スコープ外（やらないこと）
- API endpoint・D1 schema・migration・Google Form schema の変更（AC-G2）。`apps/api` には一切触れない。
- Task B（手動 form sync UI）/ Task C（SLA 表示）/ Task D（外部リンク）の責務。
- 新規 primitive の追加（既存 `Button` / `FormField` / `AdminSectionCard` を再利用、不変条件 §3）。

---

## 2. 変更対象ファイル一覧

| パス | 区分 | 内容 |
|------|------|------|
| `apps/web/src/features/admin/diagnostics/backfill.ts` | 新規 | `BackfillResultSchema`（zod）+ `BackfillResult` 型 + endpoint パス定数 |
| `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | 新規 | dry-run / apply 操作パネル（client component） |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | 編集 | `SyncStatusView` 下部に `BackfillPublishStatePanel` をマウント |
| `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` | 新規 | パネルの単体テスト（dry-run/apply/pending/error） |
| `apps/web/src/features/admin/diagnostics/__tests__/backfill.spec.ts` | 新規 | `BackfillResultSchema` の parse/reject テスト |

> 配置方針: 既存 admin feature は `apps/web/src/features/admin/components/_<domain>/` で domain 分割されている
> （`_members/` `_meetings/` 等）。sync 系パネルは新規 `_sync/` サブディレクトリに集約する。
> zod / 型は `apps/web/src/features/admin/diagnostics/`（既存 `types.ts` と同階層）に置き、診断系と co-locate する。

> **【共通前提・重要】sync endpoint 認証経路（Task B §認証経路に集約）**
> backfill endpoint `POST /admin/sync/responses?fullSync=true-publish-state` は `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`）で保護される。
> web の admin catch-all proxy（`apps/web/app/api/admin/[...path]/route.ts`）は `x-internal-auth` と cookie は注入するが、
> `Authorization` ヘッダはクライアント送信時のみ転送するため、**ブラウザからの素の fetch では 401 で到達不能**である
> （ブラウザは機密 `SYNC_ADMIN_TOKEN` を保持できない）。
> 本タスク単独では proxy 変更を行わず、**proxy への server-only `Authorization: Bearer ${SYNC_ADMIN_TOKEN}` 注入**
> （`route.ts` 編集 + `env.ts` への optional フィールド追加 + Cloudflare Secrets 注入）は
> **Task B（`tasks/B-manual-form-resync-admin-ui.md` §認証経路）に1箇所集約**し、本タスクはそれに依存する。
> 実装時は Task B の proxy 変更を先に入れること（親 `phase-9.md` 共通課題を参照）。

---

## 3. 主要コンポーネント・関数・型のシグネチャ

### 3.1 zod schema + 型（`apps/web/src/features/admin/diagnostics/backfill.ts`）

endpoint 側の `BackfillResult`（`apps/api/src/routes/admin/sync-backfill-publish-state.ts:31-43`）と**完全一致**させる。
UI 側は API を信頼せず、受信レスポンスをこの schema で `safeParse` してから描画する（schema mismatch は error 表示）。

```ts
import { z } from "zod";

/**
 * `POST /admin/sync/responses?fullSync=true-publish-state` のレスポンス契約。
 * 正本は apps/api/src/routes/admin/sync-backfill-publish-state.ts:31-43。
 * apps/web から apps/api を直接 import しない（不変条件 #5）ため、ここで再宣言する。
 */
export const BackfillResultSchema = z.object({
  dryRun: z.boolean(),
  policy: z.literal("auto-publish-on-consent"),
  scanned: z.number().int().nonnegative(),
  candidates: z.number().int().nonnegative(),
  applied: z.number().int().nonnegative(),
  skipped: z.object({
    alreadyPublic: z.number().int().nonnegative(),
    adminExplicit: z.number().int().nonnegative(),
    consentNotMet: z.number().int().nonnegative(),
    deleted: z.number().int().nonnegative(),
  }),
});

export type BackfillResult = z.infer<typeof BackfillResultSchema>;

/** web → API proxy 経由のパス。catch-all proxy（app/api/admin/[...path]/route.ts）が url.search を転送する。 */
export const BACKFILL_PUBLISH_STATE_PATH = "/api/admin/sync/responses?fullSync=true-publish-state";
```

### 3.2 パネル component（`BackfillPublishStatePanel.client.tsx`）

```ts
"use client";

// props は不要（操作完結型パネル）。将来の拡張余地として onApplied callback のみ optional で受ける。
export interface BackfillPublishStatePanelProps {
  /** apply 成功時に親へ通知（任意）。診断 snapshot 再取得トリガ等に使う想定。未指定なら no-op。 */
  readonly onApplied?: (result: BackfillResult) => void;
}

export function BackfillPublishStatePanel(props: BackfillPublishStatePanelProps): JSX.Element;
```

#### 内部 state

| state | 型 | 役割 |
|-------|-----|------|
| `lastResult` | `BackfillResult \| null` | 直近の dry-run / apply の検証済みレスポンス。結果テーブルの描画ソース |
| `mode` | `"dryRun" \| "apply" \| null` | `lastResult` がどちらのモード由来かのラベル表示用 |
| `parseError` | `string \| null` | schema mismatch（`safeParse` 失敗）時の文言 |

#### mutation の使い方（AC-A4 / 不変条件 #10）

`useAdminMutation` は `POST` を非冪等 method として扱う overload を持つ（`useAdminMutation.ts:132-136`）。
`mutationFn` を渡さず**素の fetch 経路**を使うと endpoint へ POST し、`refreshOnSuccess` で `router.refresh()` される。
dry-run / apply の切替は **`endpointOverride`**（`trigger(payload, endpointOverride)` の第 2 引数。`useAdminMutation.ts:178-179, 225`）で
クエリ `?dryRun=true|false` を切り替える。これにより hook インスタンスは 1 つで済む。

```ts
import { useAdminMutation } from "../../hooks/useAdminMutation";
import { BackfillResultSchema, BACKFILL_PUBLISH_STATE_PATH } from "../../diagnostics/backfill";

const mutation = useAdminMutation<unknown>(BACKFILL_PUBLISH_STATE_PATH, "POST", {
  // 結果は手動で描画する。一覧側の再検証は dry-run では不要・apply 時のみ必要なので既定 refresh は切る。
  refreshOnSuccess: false,
  // 操作系なので既定 toast を抑止し、パネル内で結果を可視化する。
  successMessage: () => "",
});

// dry-run
const data = await mutation.trigger({}, `${BACKFILL_PUBLISH_STATE_PATH}?dryRun=true`);
// apply
const data = await mutation.trigger({}, `${BACKFILL_PUBLISH_STATE_PATH}?dryRun=false`);
```

> 受信後に `BackfillResultSchema.safeParse(data)` で検証。`success` なら `setLastResult` / `setMode`、
> 失敗なら `setParseError("backfill レスポンスの形式が一致しません")`。
> HTTP error（403/500/network）は `useAdminMutation` が `error` state と toast を担うため、
> パネルは `mutation.error` を読んで補助メッセージを出すだけでよい。

#### 二重起動防止（AC: pending 無効化）

- `useAdminMutation` は `isSubmittingRef` で同時 trigger を内部ブロックし（`useAdminMutation.ts:180-183`）、`isLoading` を返す。
- パネルは `mutation.isLoading` を両ボタンの `disabled`（`<Button disabled={mutation.isLoading}>`）と `loading` prop に渡す。
- apply ボタンは破壊的操作のため `variant="danger"`、dry-run は `variant="primary"`。

#### UI 構造（OKLch トークンのみ・HEX 禁止 / 不変条件 §2）

`AdminSectionCard`（`_shared` 既存）でラップし、見出しは「公開状態 backfill（救済）」。
ボタン 2 つ + 結果テーブルを内包する。色は既存 `sync-status/page.tsx:79-90` と同じ CSS 変数トークン
（`text-[var(--ubm-color-text-primary)]` / `text-[var(--ubm-color-text-muted)]` /
`border-[var(--ubm-color-border-default)]` / `bg-[var(--ubm-color-surface)]`）を踏襲する。

結果テーブル（`lastResult` がある場合のみ描画）:

| 行ラベル | 値 |
|---------|-----|
| モード | `dryRun ? "dry-run（確認のみ）" : "apply（昇格実行済み）"` |
| scanned | `lastResult.scanned` |
| candidates（昇格対象） | `lastResult.candidates` |
| applied（昇格実行） | `lastResult.applied` |
| skip: 既に公開 | `lastResult.skipped.alreadyPublic` |
| skip: 管理者明示設定 | `lastResult.skipped.adminExplicit` |
| skip: 同意未達 | `lastResult.skipped.consentNotMet` |
| skip: 削除済み | `lastResult.skipped.deleted` |

> 補足コピー（helper）: 「dry-run は DB を変更しません。apply は同意済み×会員限定のメンバーのみ公開へ昇格し、
> 管理者が明示設定したメンバーや削除済みは対象外です。」（AC-A3 の可視化を兼ねる）

### 3.3 page への組み込み（`sync-status/page.tsx`）

`SyncStatusView`（`page.tsx:71-127`）の末尾、`</div>`（return ルート div）閉じ前に追記:

```tsx
<BackfillPublishStatePanel />
```

import 追加（既存の相対 import スタイルに合わせる）:

```ts
import { BackfillPublishStatePanel } from "../../../../src/features/admin/components/_sync/BackfillPublishStatePanel.client";
```

> `BackfillPublishStatePanel` は client component。`SyncStatusView` は Server Component 内の関数だが、
> client component をマウントするだけなので問題ない（`page.tsx:7` の `force-dynamic` も維持）。
> diagnostics fetch が失敗（`!result.ok`）の場合は `SyncStatusView` 自体が描画されないため、
> backfill パネルは正常系（`parsed.success`）のときに表示される。これは許容（救済操作は診断成功が前提）。

---

## 4. 入力・出力・副作用

| 操作 | 入力 | 出力（画面） | 副作用（DB） |
|------|------|-------------|-------------|
| dry-run ボタン | body `{}` / query `?dryRun=true` | 結果テーブル（scanned/candidates/skipped、applied=0） | **なし**（読み取りのみ） |
| apply ボタン | body `{}` / query `?dryRun=false` | 結果テーブル（applied>0 可） | `member_status` の対象行を `publish_state='public', updated_by='system:backfill'` に UPDATE（endpoint 側で実行） |

- **二重起動防止**: `mutation.isLoading` 中は両ボタン `disabled` + `loading`。`useAdminMutation` の `isSubmittingRef` が二重 `trigger` を throw でブロック。
- **schema mismatch**: 受信を `BackfillResultSchema.safeParse` で検証し、不一致は `parseError` 表示（DB 副作用なし）。
- **HTTP error**: 403（権限）/ 500（`internal_api_base_url_missing` 等）/ network は `useAdminMutation` が toast + `error` state を担う。パネルは `mutation.error?.message` を補助表示。
- **apply 後の一覧反映**: 公開 `/members` は ISR（別レイヤ）。本パネルは admin 画面なので `refreshOnSuccess:false` のままで可。apply 完了は結果テーブルの `applied` で確認する。

---

## 5. テスト方針

新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。`vitest` + jsdom + Testing Library（既存 admin component テスト準拠）。
`fetch` は `vi.spyOn(globalThis, "fetch")` でモックし、`useAdminMutation` の素 fetch 経路を通す。
`Toast` provider を依存に持つため、`useAdminMutation` 内 `try { useToast() } catch {}`（`useAdminMutation.ts:144-148`）により provider 無しでも動作する想定でレンダリングする。

### 5.1 `BackfillPublishStatePanel.spec.tsx`

| ケース | 検証内容 |
|--------|---------|
| TC-A1 dry-run 表示 | dry-run ボタン click → `fetch` が `?dryRun=true` で 1 回呼ばれる / レスポンス（candidates=2 等）が結果テーブルに描画される / 「dry-run（確認のみ）」ラベル |
| TC-A2 apply 件数表示 | apply ボタン click → `fetch` が `?dryRun=false` / `applied` 件数が描画される / 「apply（昇格実行済み）」ラベル |
| TC-A3 skipped 内訳 | レスポンスの `skipped.adminExplicit` / `skipped.deleted` 等が各行に正しく表示される（AC-A3 可視化） |
| TC-A4 pending 無効化 | fetch を未解決 Promise にし、click 後に両ボタンが `disabled` になる（二重起動防止） |
| TC-A5 error 表示 | fetch が 500 / 非 ok レスポンス → 結果テーブルが描画されず error 文言が出る |
| TC-A6 schema mismatch | fetch が contract 外 JSON（例 `{ foo: 1 }`）を返す → `parseError` 文言が描画され DB 副作用扱いの表示が出ない |
| TC-A7 onApplied callback | apply 成功時に `onApplied` が検証済み `BackfillResult` で 1 回呼ばれる |

### 5.2 `backfill.spec.ts`

| ケース | 検証内容 |
|--------|---------|
| TC-B1 valid parse | endpoint 仕様準拠の object が `BackfillResultSchema.safeParse().success === true` |
| TC-B2 policy literal | `policy` が `"auto-publish-on-consent"` 以外なら reject |
| TC-B3 負数 reject | `scanned: -1` 等 nonnegative 違反で reject |
| TC-B4 skipped 欠落 reject | `skipped.deleted` 欠落で reject |

---

## 6. ローカル実行・検証コマンド

すべて `mise exec --` 経由でリポジトリルートから実行（Node 24 保証）。

```bash
# 型チェック（web 単体）
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# 本タスクの追加テストのみ
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_sync \
  apps/web/src/features/admin/diagnostics/__tests__/backfill.spec.ts

# web の全テスト
mise exec -- pnpm --filter @ubm-hyogo/web test

# Lint（ルート集約。boundary / no-inline-style / eslint / 各 package lint を内包）
mise exec -- pnpm lint
```

> `pnpm --filter @ubm-hyogo/web lint` は `tsc --noEmit && eslint 'src/**/*.{ts,tsx}'`（web package.json scripts）。
> ルート `pnpm lint` は `verify:no-inline-style` を含むため、inline `style={{...}}` を使わず className（トークン変数）で書くこと。

---

## 7. DoD（完了の定義）

- [ ] `apps/web/src/features/admin/diagnostics/backfill.ts` に `BackfillResultSchema` / `BackfillResult` / `BACKFILL_PUBLISH_STATE_PATH` を新規追加。endpoint 仕様（`sync-backfill-publish-state.ts:31-43`）と byte-level で整合。
- [ ] `BackfillPublishStatePanel.client.tsx` を新規追加。`useAdminMutation`（`@/features/admin/hooks/useAdminMutation`）経由・`FormField` 規約・OKLch トークンのみ・新規 `<input>` を `src/components/admin/` に増やさない（不変条件 #9 / §3）。
- [ ] `sync-status/page.tsx` の `SyncStatusView` 末尾にパネルをマウント。既存表示（H1-H4 / pipeline counts / secrets readiness）と `force-dynamic` を破壊しない。
- [ ] 新規 spec 2 ファイルが `*.spec.{ts,tsx}` 命名で全ケース pass。
- [ ] `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web test`（追加分含む）/ `pnpm lint` が成功。
- [ ] dry-run で DB 無変更・結果内訳表示、apply で `applied` 件数表示、pending 中ボタン無効化、HTTP error / schema mismatch 時に結果テーブル非描画 + error 表示（AC-A1..A4）。
- [ ] `apps/api` / `packages` への差分が 0（endpoint は変更しない）。

---

## 8. 関連ファイルの実コード根拠

### 8.1 公開フィルタ 3 条件 AND（RC-1）
`apps/api/src/repository/publicMembers.ts:37-39`
```
WHERE ms.public_consent = 'consented'
  AND ms.publish_state = 'public'
  AND ms.is_deleted = 0
```
（`member_only`/`hidden` 滞留メンバーは一覧に出ない → backfill が救済する対象）

### 8.2 救済 endpoint（変更不要）
`apps/api/src/routes/admin/sync-backfill-publish-state.ts:49-58`
```ts
adminSyncBackfillPublishStateRoute.post(
  "/sync/backfill-publish-state",
  requireSyncAdmin,
  async (c) => {
    const dryRunParam = c.req.query("dryRun");
    const dryRun = dryRunParam !== "false"; // default = true
    const result = await runBackfillPublishState(c.env.DB, { dryRun });
    return c.json(result, 200);
  },
);
```
`BackfillResult` shape: `:31-43`（`dryRun / policy:"auto-publish-on-consent" / scanned / candidates / applied / skipped{alreadyPublic, adminExplicit, consentNotMet, deleted}`）。
apply スキップ条件: is_deleted=1（`:89-92`）/ already public（`:98-101`）/ admin override（`:102-105`）/ consent 未達（`:113-117`）。昇格は `publish_state=?1, updated_by='system:backfill'`（`:129-133`）。

### 8.3 mutation 規約（AC-A4 / 不変条件 #10）
`apps/web/src/features/admin/hooks/useAdminMutation.ts`
- POST overload: `:132-136`
- `trigger(payload, endpointOverride?)`: `:178-179`、`endpointOverride ?? endpoint` で fetch: `:225`
- 二重起動ブロック（`isSubmittingRef`）: `:180-183`
- `isLoading` 返却: `:149, :302`
- provider 無しでも動作する toast guard: `:144-148`
- 200 レスポンス json 化（204 は undefined）: `:261-262`

### 8.4 既存ページ（マウント先 / トークン例）
`apps/web/app/(admin)/admin/sync-status/page.tsx`
- `force-dynamic`: `:7`
- `SyncStatusView` の return ルート div: `:71-126`（末尾にパネル追記）
- OKLch トークン className 例: `:79`（`border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface)]`）、`:81/85/88`（`text-[var(--ubm-color-text-*)])`）

### 8.5 既存 mutation + FormField + Button 使用例（実装パターン正本）
`apps/web/src/features/admin/components/_meetings/MeetingCreateForm.tsx`
- `useAdminMutation` import（feature hooks 経由）: `:5-8`
- `FormField` + `Input` + `Button(disabled)`: `:86-104`
`apps/web/src/features/admin/components/_members/MemberPublishSwitch.tsx:41` — endpoint は `/api/admin/...` proxy パスを渡す前例。

### 8.6 API proxy（query 転送・POST 対応の根拠）
`apps/web/app/api/admin/[...path]/route.ts`
- `${base}/admin/${path}${url.search}` で query 転送: `:59-60`（`?dryRun=...` が API へ届く）
- POST 対応: `:87`、admin gate: `:30-41`

### 8.7 publish_state enum 正本
`packages/shared/src/types/common.ts:5`（`public | member_only | hidden`）/ `packages/shared/src/zod/primitives.ts:25`（`PublishStateZ`）。default は `member_only`（`apps/api/migrations/0002_admin_managed.sql:13`、親 phase-1 RC-2）。
