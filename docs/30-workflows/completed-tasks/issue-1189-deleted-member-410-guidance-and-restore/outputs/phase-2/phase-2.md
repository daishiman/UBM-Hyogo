# Phase 2: 設計

## 2.1 責務境界（C1 / C2）

| concern | 責務 | 編集対象 | 変更しないもの |
|---------|------|---------|---------------|
| C1（会員・パターン A） | 410 error code → 表示情報の**写像のみ**変更（純関数の戻り値） | `apps/web/app/(member)/profile/_lib/session-error-display.ts`（410 分岐のみ） | `SectionError.tsx`（表示能力は既存で充足）/ `page.tsx`（呼出フロー不変）/ 404・5xx・FAILED 分岐 |
| C2（管理者・パターン B） | DELETED セクションへの復元ボタン追加と既存 restore API の配線 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（DELETED セクション + ローカルコンポーネント追加） | `apps/api` 全体 / catch-all proxy / `useAdminMutation` 本体 / drawer の他セクション |

両 concern とも **表現層のみ**。状態所有権は現行設計を維持する:

- **drawer の `detail` state は `MemberDrawer` 親（`MemberDrawer.tsx:47` の `useState<AdminMemberDetailView>`）が所有**し、子は `onUpdated(patch)` callback で patch を返す（`MemberDrawerBody` props: `{ memberId, detail, onUpdated }` / `MemberDrawer.tsx:107-113`）。
- 復元ボタンは `MemberPublishSwitch` / `NotificationOptOutToggle` と同じパターン: 成功時に `onUpdated({ status: { ...detail.status, isDeleted: false } })` を発火し、親 state 更新 → `MemberStateChipRow` と退会済みセクションが**再 fetch なしで即時更新**される。

## 2.2 既存コンポーネント再利用判定（新規 primitive ゼロ）

| 部品 | 判定 | 根拠 |
|------|------|------|
| `SectionError`（`apps/web/src/components/member/SectionError.tsx`） | **再利用（変更不要）** | props 契約: `actionHref && actionLabel` 両方あるときのみ action リンク描画 / `retryHref` あるときのみ「再読み込み」リンク描画 / `data-cause` 属性出力。410 の After 表示（action あり・retry なし）は**戻り値の変更だけ**で実現できる |
| `useAdminMutation`（`@/features/admin/hooks/useAdminMutation`） | **再利用（不変条件 #10 の正規経路）** | `useAdminMutation<T>(endpoint, "POST", { successMessage, onSuccess, refreshOnSuccess })` → `{ trigger, isLoading }`。401 redirect / 失敗 toast / in-flight 多重送信ガードを内蔵。MemberDrawer.tsx は import 済み（L14） |
| `globalThis.confirm(...)` | **再利用（前例踏襲）** | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx:53` の前例に合わせる。専用 dialog コンポーネントの新設は YAGNI |
| `FormField` | **対象外** | admin panel の form input は `FormField` 経由が標準（CLAUDE.md 不変条件 #9）だが、**今回追加するのは `<button>` のみで input を一切増やさない**ため FormField の適用対象外。`<input>` 直書き禁止ルールにも抵触しない |
| 新規 primitive | **ゼロ** | ボタンは既存トークン（`var(--ubm-*)`）+ Tailwind utility のローカルスタイルで構成し、共有 primitive を生やさない（UI WF 不変条件 #3） |

## 2.3 C1: 410 分岐の Before / After（`session-error-display.ts:34-42`）

型 `ProfileSessionErrorDisplay`（title/detail/retryHref?/actionHref?/actionLabel?/dataCause）は変更しない。

**Before（現行）:**

```ts
if (code === "MEMBER_SESSION_410") {
  return {
    title: "セッション情報を取得できませんでした",
    detail:
      "アカウントの利用状態を確認できませんでした。管理者に確認してください。",
    retryHref: "/profile",
    dataCause: "session-410",
  };
}
```

**After（確定文言・index.md 合意済み）:**

```ts
if (code === "MEMBER_SESSION_410") {
  return {
    title: "このアカウントは退会済みです",
    detail:
      "退会手続きが完了しているため、マイページを表示できません。誤って退会された場合や利用再開をご希望の場合は、支部会の運営（管理者）にお問い合わせください。",
    actionHref: "/",
    actionLabel: "公開サイトのトップへ戻る",
    dataCause: "session-410",
  };
}
```

設計ポイント:

1. `retryHref` を**返さない**ことで `SectionError` が「再読み込み」リンクを描画しなくなる（410 は再読み込みで解消しない恒久状態のため。AC-2）。
2. `actionHref:"/"` + `actionLabel` の組で公開トップへの導線を出す（404 分岐が `actionHref:"/login?redirect=/profile"` で同じ機構を使っている前例あり）。
3. `dataCause:"session-410"` は維持（既存テスト・運用上の DOM 診断フックとの互換。AC-2）。
4. 404 / 5xx（`isMemberSession5xx`）/ FAILED（既定分岐）は**一切触らない**（AC-3）。

## 2.4 C2: DELETED セクションの Before / After（`MemberDrawer.tsx:273-289`）

**Before（現行・静的文言のみ）:**

```tsx
{/* DELETED */}
{detail.status.isDeleted ? (
  <section
    aria-labelledby="drawer-deleted-heading"
    className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-danger)] bg-[var(--ubm-color-danger-soft)] p-3"
  >
    <h3 id="drawer-deleted-heading" className="...">退会済み</h3>
    <p className="mt-1 text-sm text-[var(--ubm-color-text-secondary)]">
      この会員は論理削除されています。復元する場合は管理者にお問い合わせください。
    </p>
  </section>
) : null}
```

**After（JSX 構造案・実装時はファイル内の既存スタイル並びに合わせて微調整可）:**

```tsx
{/* DELETED */}
{detail.status.isDeleted ? (
  <section
    aria-labelledby="drawer-deleted-heading"
    className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-danger)] bg-[var(--ubm-color-danger-soft)] p-3"
  >
    <h3 id="drawer-deleted-heading" className="...">退会済み</h3>
    <p className="mt-1 text-sm text-[var(--ubm-color-text-secondary)]">
      この会員は論理削除されています。下のボタンから復元できます。
    </p>
    <MemberRestoreButton
      memberId={memberId}
      onRestored={() =>
        onUpdated({ status: { ...detail.status, isDeleted: false } })
      }
    />
  </section>
) : null}
```

文言調整の根拠: ボタン追加後に「復元する場合は管理者にお問い合わせください」が自己矛盾する（見ているのが管理者本人）ため、最小限の文言差し替えを C2 スコープに含める（Phase 3 MINOR-2 で決定記録）。

**`MemberRestoreButton`（MemberDrawer.tsx 内ローカルコンポーネント・設計案）:**

```tsx
interface MemberRestoreButtonProps {
  readonly memberId: string;
  readonly onRestored: () => void;
}

function MemberRestoreButton({ memberId, onRestored }: MemberRestoreButtonProps) {
  const { trigger, isLoading } = useAdminMutation<{ id: string; restoredAt: string }>(
    `/api/admin/members/${encodeURIComponent(memberId)}/restore`,
    "POST",
    {
      successMessage: "会員を復元しました",
      onSuccess: () => onRestored(),
      refreshOnSuccess: false,
    },
  );

  return (
    <button
      type="button"
      disabled={isLoading}
      aria-label="この会員を復元する"
      onClick={() => {
        if (
          !globalThis.confirm(
            "この会員を復元しますか？退会済み状態が解除され、会員データが再び有効になります。",
          )
        ) {
          return;
        }
        trigger({}).catch(() => {
          // エラー表示（toast）と error state は useAdminMutation が処理済み。
          // unhandled rejection 回避のための握り。
        });
      }}
      className="mt-2 rounded-[var(--ubm-radius-sm)] border border-[var(--ubm-color-danger)] px-3 py-1.5 text-sm font-semibold text-[var(--ubm-color-danger)] disabled:opacity-50"
    >
      {isLoading ? "復元中…" : "この会員を復元する"}
    </button>
  );
}
```

設計ポイント:

1. **endpoint 文字列形式**は同ファイル内の既存呼び出し（`NotificationOptOutToggle` の `` `/api/admin/members/${encodeURIComponent(memberId)}/notification-pref` `` / `MemberDrawer.tsx:653`）に合わせる。実装時もこの並びを正とする。
2. web→API は既存 catch-all proxy（`apps/web/app/api/admin/[...path]/route.ts`・POST 対応済み）を経由するため**追加配線は不要**。
3. `refreshOnSuccess: false`: drawer 内の即時更新は `onUpdated` patch で完結させ、`router.refresh()` による全体再描画を避ける（`NotificationOptOutToggle` と同方針）。
4. POST body は `{}`（restore API は body を要求しない。`useAdminMutation` が JSON 化して送る）。

## 2.5 状態所有権とデータフロー（成功時）

```
[MemberRestoreButton] click
  → globalThis.confirm() === true
  → useAdminMutation.trigger({})
  → POST /api/admin/members/:id/restore（proxy 経由）
  → 200 { id, restoredAt }
  → onSuccess → onRestored() → onUpdated({ status: { ...detail.status, isDeleted: false } })
  → MemberDrawer 親 state 更新（detail.status.isDeleted = false）
  → 退会済みセクションが条件描画から外れて消滅 + MemberStateChipRow 即時更新
  → toast「会員を復元しました」（useAdminMutation の successMessage）
```

復元ボタンは **internal state（独自の loading flag 等）を持たず、mutation hook の `isLoading` をそのまま使う**（VSCPKR-03 対策: 状態の二重管理は hook 側の in-flight ガード `isSubmittingRef` と競合し、disabled 表示と実送信状態がズレる欠陥パターン）。`isDeleted` の真偽も親の `detail` を唯一の正とし、ボタン側で複製しない。

## 2.6 エラーパス設計

`useAdminMutation` の内蔵処理（`handleFailure`）に委ね、ボタン側に独自のエラー UI を増やさない:

| パス | 挙動 | 担保 |
|------|------|------|
| confirm キャンセル | `trigger` を呼ばない（POST 不発・state 不変） | onClick 早期 return（T-09） |
| 409 `member_not_deleted` | `FetchAuthedError(409, body)` → hook が body から message 抽出し toast `✗ ...` 表示。drawer state 不変（onUpdated 不発火）・ボタンは enabled に戻る | hook 既存実装（T-10） |
| 404 not found | 同上（`treat404AsSuccess` は**指定しない**＝既定 false で失敗扱い。復元対象不在を成功に倒してはならない） | hook 既存実装 |
| 5xx / network error | 同上 toast 表示。POST は非冪等のため **retry policy は型レベルで渡せない**（hook の overload 設計）→ 自動再試行なしが正 | hook 既存実装 |
| 401 | `AuthRequiredError` → hook が login redirect | hook 既存実装 |
| 実行中（in-flight） | `isLoading=true` → `disabled` + ラベル「復元中…」。hook 側 `isSubmittingRef` で多重送信も二重ガード | T-11 |
| 失敗後の UI | セクション・ボタンは描画されたまま（UI 非破壊）。再クリックで再試行可能 | T-10 |

## 2.7 アクセシビリティ

- C1: `SectionError` の `role="alert"` / `aria-live="polite"` は不変（コンポーネント非接触のため構造的に維持）。リンクは `<a>`（`data-role="action"`）で keyboard 到達可能。
- C2: 復元ボタンは `<button type="button">` + `aria-label="この会員を復元する"` + `disabled` 属性（実行中は支援技術にも操作不可が伝わる）。セクション見出し `aria-labelledby="drawer-deleted-heading"` は不変。
- 破壊的操作の確認は `globalThis.confirm`（ブラウザネイティブ dialog で a11y 担保済み・前例踏襲）。

## 2.8 スタイリング

- 追加スタイルは既存トークンのみ: `--ubm-radius-sm` / `--ubm-color-danger` / 既存 utility（HEX 直書き・`bg-[#xxx]` 禁止。AC-9）。
- DELETED セクションの既存配色（`--ubm-color-danger` / `--ubm-color-danger-soft`）と整合する danger 系 outline ボタンとする。

## 参照資料

- [phase-1.md](../phase-1/phase-1.md) — 要件定義（AC・スコープ・現状分析）
- [index.md](../../index.md) — 変更対象ファイル表・不変条件
- `apps/web/app/(member)/profile/_lib/session-error-display.ts:34-42` — C1 編集箇所
- `apps/web/src/components/member/SectionError.tsx` — 表示器の props 契約（不変）
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:273-289`（DELETED）/ `:640-693`（NotificationOptOutToggle = 配線パターン前例）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` — mutation 正規経路（overload・handleFailure・isSubmittingRef）
- `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx:53` — confirm 前例
- `apps/api/src/routes/admin/member-delete.ts:121-168` — restore API 契約（不変）

## 実行タスク

- [x] C1/C2 の責務境界と状態所有権（親所有 + `onUpdated` patch）を設計した（§2.1, §2.5）
- [x] 既存コンポーネント再利用判定を行い、新規 primitive ゼロ・FormField 対象外（ボタンのみで input なし）を明記した（§2.2）
- [x] C1 の 410 分岐 Before/After を確定文言でコード例として固定した（§2.3）
- [x] C2 の DELETED セクション JSX 構造案と `MemberRestoreButton` 設計を固定した（§2.4）
- [x] エラーパス（confirm キャンセル / 409 / 404 / 5xx / network / 401 / in-flight）を設計した（§2.6）
- [x] internal state を持たず hook の `isLoading` を使う方針（VSCPKR-03 対策）を明記した（§2.5）
- [x] アクセシビリティ（role=alert 維持・ボタンの aria / disabled）とスタイリング方針を設計した（§2.7, §2.8）

## 完了条件

- [x] Before/After が現行コード（2026-06-12 Read 検証済み）と一致する Before を起点としている
- [x] 全設計が「表現層のみ・既存 API 配線のみ」の不変条件内に収まっている
- [x] エラーパスが AC-6 の全ケース（409/404/5xx/network/disabled/UI 非破壊）を網羅している
- [x] Phase 4 のテスト設計が参照できる粒度（props・endpoint・文言・data 属性）まで確定している

## 成果物

- 本ドキュメント（`outputs/phase-2/phase-2.md`）: 設計（責務境界 / 再利用判定 / Before・After / データフロー / エラーパス / a11y / スタイリング）
