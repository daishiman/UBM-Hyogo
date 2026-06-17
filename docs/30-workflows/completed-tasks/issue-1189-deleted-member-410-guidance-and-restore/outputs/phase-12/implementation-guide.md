# Phase 12: 実装ガイド（implementation-guide）

> **implemented_local_evidence_captured**: 以下は本 wave で実装済みの C1/C2 と検証結果を説明する。
> 識別子・行番号は 2026-06-12 時点の実コードに基づく。

## Part 1: なぜ必要か / 何をするか（中学生レベル）

なぜ必要かというと、退会済みの人に「再読み込み」を出しても何も解決せず、本人と管理者の両方が次に何をすればよいか分からないからです。
何をするかは単純で、本人には退会済みであることと問い合わせ先を明示し、管理者には既存の復元 API を押せるボタンとして見せます。

### 例え話

あるお店に「会員カード」の仕組みがあります。会員カードを解約（退会）した人が、
ある日マイページ（自分のページ）を開いてみたとします。

いまのお店のマイページは、こう表示します。

> 「アカウントの利用状態を確認できませんでした。管理者に確認してください。」（＋「再読み込み」ボタン）

これでは本人は「壊れたのかな？」と思って再読み込みを何度も押しますが、何度押しても同じです。
**解約済みだから表示できない**のに、その理由をどこにも書いていないからです。
しかも「管理者に確認して」と言われた管理者（お店の受付）の画面にも、
「この人の会員カードを元に戻すボタン」が**ありません**。本人も受付も、どちらも行き止まりです。

### だから何をするか（2 つだけ）

1. **本人向けの案内を正直にする**: マイページに「このアカウントは退会済みです。
   誤って退会した場合や利用再開をご希望の場合は、受付（支部会の運営）にお問い合わせください」と
   はっきり書き、意味のない「再読み込み」ボタンを消して、かわりに「お店の入口（公開サイトのトップ）へ戻る」ボタンを置く。
2. **受付（管理者）に「復元ボタン」を用意する**: 受付の画面の「退会済み」欄にボタンを 1 つ追加する。
   押すと「本当に復元しますか？」と確認してから、会員カードを元に戻す。
   実は「元に戻す仕組み」自体は裏側にもう完成して置いてあるので、**ボタンと配線をつなぐだけ**でよい。

裏側の仕組み（API やデータベース）は一切作り変えません。新しく作るのは「案内の文章」と「ボタン」だけです。

### 今回作ったもの

- `/profile` の 410 表示: 退会済みの理由、問い合わせ案内、公開サイトトップへの CTA。
- `MemberDrawer` の復元操作: 退会済みセクションの復元ボタン、確認ダイアログ、成功時の即時表示更新。
- focused test と local static screenshot: 410 表示、復元ボタン、復元後状態の回帰証跡。

---

## Part 2: 技術者レベル

### 全体像

| concern | 対象 | 変更内容 |
|---------|------|---------|
| C1（会員・パターン A） | `apps/web/app/(member)/profile/_lib/session-error-display.ts:34-42` | 410 分岐の title/detail/CTA を退会明示へ。`retryHref` 削除・`actionHref`/`actionLabel` 追加・`dataCause:"session-410"` 維持 |
| C2（管理者・パターン B） | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:273-289` | 退会済みセクションへ復元ボタン（`data-testid="member-restore-button"`）を追加し、既存 `POST /admin/members/:memberId/restore` を `useAdminMutation` で配線 |

変更ファイル 5 件: `session-error-display.ts`（編集）/ `session-error-display.spec.ts`（編集）/ `page.spec.tsx`（編集）/ `MemberDrawer.tsx`（編集）/ `MemberDrawer.restore.spec.tsx`（新規）。
**`apps/api` / D1 / Google Form は変更ゼロ**。表示器 `apps/web/src/components/member/SectionError.tsx` も変更なし
（`ProfileSessionErrorDisplay` の既存フィールド `actionHref`/`actionLabel` を使うため表示器側の改修は不要）。

### C1: ProfileSessionErrorDisplay 型（既存・変更なし）

```ts
// apps/web/app/(member)/profile/_lib/session-error-display.ts:7-14（現行）
export interface ProfileSessionErrorDisplay {
  readonly title: string;
  readonly detail: string;
  readonly retryHref?: string;
  readonly actionHref?: string;
  readonly actionLabel?: string;
  readonly dataCause: ProfileSessionCause;
}
```

型は変更しない。410 分岐が `retryHref` の代わりに `actionHref`/`actionLabel` を返すだけで、
既存 404 分岐（`actionHref:"/login?redirect=/profile"`）と同じ表示経路に乗る。

### C1: 410 分岐 Before / After

**Before（現行 `session-error-display.ts:34-42`）:**

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

**After（実装済み）:**

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

ポイント:

- `retryHref` を**削除**（無意味な再読み込み導線を出さない）。
- `dataCause: "session-410"` は**維持**（既存の data-cause 契約・テストセレクタ互換）。
- 404 / 5xx / FAILED 分岐（`session-error-display.ts:24-32, 44-60`）は**一切変更しない**。

### C2: useAdminMutation 配線（MemberDrawer.tsx）

`MemberDrawerBody`（`detail` / `onUpdated` を props で受領済み）に以下を配線した。
admin mutation は不変条件 #10 により `@/features/admin/hooks/useAdminMutation` 経由（legacy `@/lib/useAdminMutation` 禁止）。

```tsx
const restoreMutation = useAdminMutation<{ id: string; restoredAt: string }>(
  `/api/admin/members/${encodeURIComponent(memberId)}/restore`,
  "POST",
  {
    successMessage: "会員を復元しました",
    refreshOnSuccess: false,
    onSuccess: () => {
      setRestoreError(null);
      onUpdated({
        status: { ...detail.status, isDeleted: false },
        profile: { ...detail.profile, isDeleted: false },
      });
    },
    onError: (error) => {
      setRestoreError(
        error instanceof FetchAuthedError && error.status === 409
          ? "すでに復元済みの可能性があります。画面を再読み込みしてください。"
          : "復元に失敗しました。時間をおいて再度お試しください。",
      );
    },
  },
);
```

退会済みセクション（`MemberDrawer.tsx:273-289` の `detail.status.isDeleted ?` ブロック）へボタンを追加:

```tsx
<Button
  type="button"
  variant="primary"
  size="sm"
  loading={restoreMutation.isLoading}
  data-testid="member-restore-button"
  onClick={() => {
    if (restoreMutation.isLoading) return;
    if (!globalThis.confirm("この会員を復元しますか？復元すると退会前の状態に戻ります。")) return;
    void restoreMutation.trigger({}).catch(() => {
      /* エラー表示は onError と useAdminMutation の toast に委譲 */
    });
  }}
>
  {restoreMutation.isLoading ? "復元中…" : "この会員を復元する"}
</Button>
```

配線の根拠（既存資産・すべて変更なし）:

- `useAdminMutation` の POST overload（`useAdminMutation.ts:132-136`）: 非冪等 method のため retry オプション不可（型レベルガード）。
- 二重送信防止は `useAdminMutation` 内蔵の `isSubmittingRef`（`useAdminMutation.ts:180-183`: in-flight 中の `trigger` は throw）+ ボタン `disabled={isLoading}` の二重ガード。
- 成功 toast は `successMessage` 経由（既定 toast「✓ 保存しました」を上書き）。
- 失敗 toast / 401 リダイレクトは `handleFailure` が処理し、drawer 内の復元エラー文言は `onError` で表示する。
- 既存セクションの文言「復元する場合は管理者にお問い合わせください」（`MemberDrawer.tsx:286`）は、ボタン設置に合わせて「下のボタンから復元できます」等へ更新する（管理者自身が操作者のため）。

### restore API 契約（`apps/api/src/routes/admin/member-delete.ts:121-168`・不変）

### APIシグネチャ

```ts
POST /api/admin/members/:memberId/restore
// request body: {}
// success response: { id: string; restoredAt: string }
```

| 応答 | 条件 | body |
|------|------|------|
| 200 | 復元成功（`member_status.is_deleted=0` 化 + `deleted_members` 行削除 + audit `admin.member.restored` 自動記録） | `{ id: string, restoredAt: string }` |
| 400 | memberId 欠落 | `{ ok: false, error: "missing memberId" }` |
| 404 | member 不存在 | `{ ok: false, error: "member not found" }` / `{ ok: false, error: "not found" }` |
| 409 | 退会済みでない（`is_deleted !== 1`） | `{ ok: false, error: "member_not_deleted" }` |

audit 記録は API 側で自動実行されるため、web 側で追加の audit 処理は**不要**。

### 使用例

```tsx
await restoreMutation.trigger({});
```

`memberId` は `MemberDrawer` の props から受け取り、endpoint は
`/api/admin/members/${encodeURIComponent(memberId)}/restore` として構築する。

### エラーハンドリング / エッジケース

| ケース | 挙動（設計） | 検証テスト |
|--------|-------------|-----------|
| 409 `member_not_deleted`（他管理者が先に復元済み） | `FetchAuthedError` を `onError` で専用文言「すでに復元済みの可能性があります。画面を再読み込みしてください。」へ写像。drawer 表示は変更されない | T-11 |
| `globalThis.confirm` キャンセル | `trigger` を呼ばない（API 不呼出・状態不変） | T-09 |
| `isLoading` 中の連打 | ボタン `disabled` + `isSubmittingRef` ガードで二重送信なし | T-12 |
| 401（セッション切れ） | `AuthRequiredError` → `toLoginRedirect` で /login へ（useAdminMutation 既存挙動） | 既存 hook テストでカバー（本 spec では非対象） |
| network error / timeout（10s） | POST は retry なし（非冪等）。汎用エラー表示・状態不変 | T-11（失敗系の代表として） |
| 復元成功 | `onUpdated({status:{...detail.status,isDeleted:false}})` で drawer 即時更新（退会済みセクション消滅）+ toast「会員を復元しました」 | T-10 |

### エッジケース

- 他管理者が先に復元した場合は 409 を専用文言にする。
- confirm cancel では POST を発火しない。
- pending 中は button disabled と hook 内 in-flight guard の二重防御で連打を止める。
- 401 は既存 `useAdminMutation` の login redirect に委譲する。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| restore endpoint | `/api/admin/members/:memberId/restore` |
| success message | `会員を復元しました` |
| 410 data-cause | `session-410` |
| 410 CTA | `/` / `公開サイトのトップへ戻る` |
| visual screenshot dir | `outputs/phase-11/screenshots/` |

### 不変条件との対応

- **#10**: mutation は `@/features/admin/hooks/useAdminMutation` 経由（上記配線）。
- **#11**: memberId をログ・`/me/*` レスポンスへ新規露出しない。C1 は文言変更のみで memberId 非使用。C2 の memberId は admin 画面内の既存表示範囲（drawer 内）に閉じる。
- **トークン**: ボタンは既存 `Button` primitive（`variant="primary"`）を使用し HEX 直書きなし（`verify:tokens` PASS 維持）。
- **テスト**: 新規は `MemberDrawer.restore.spec.tsx`（`*.spec.tsx`）のみ。

### テスト構成

| ファイル | 観点 |
| --- | --- |
| `session-error-display.spec.ts` | 410 mapping の title/detail/CTA/data-cause |
| `page.spec.tsx` | `/profile` Server Component degrade 表示 |
| `MemberDrawer.restore.spec.tsx` | restore success / cancel / 409 / 404 / network / pending guard |
| `outputs/phase-11/screenshots/*.png` | local static visual contract |

### DoD

- AC-1〜AC-10（[../phase-10/phase-10.md](../phase-10/phase-10.md) の AC-T マトリクス）を充足する。
- T-01〜T-12 全 PASS（focused Vitest 3 files / 24 tests PASS）。`typecheck` / `lint` / `verify:tokens` / `verify:phase12-compliance` も PASS。

## 視覚証跡

本タスクは **VISUAL**（/profile 410 バナー・admin MemberDrawer の見た目変更あり）。
スクリーンショット 3 点は **local static visual contract として present**（local focused evidence も PASS）。
staging authenticated visual と D1 restore mutation は user-gated のまま分離する。
canonical 名は [../phase-11/screenshot-plan.json](../phase-11/screenshot-plan.json) と一致させる:

| TC | canonical 名 | 状態 |
|----|--------------|------|
| TC-11-1 | [`profile-410-deleted-guidance.png`](../phase-11/screenshots/profile-410-deleted-guidance.png) | present |
| TC-11-2 | [`admin-member-drawer-restore-button.png`](../phase-11/screenshots/admin-member-drawer-restore-button.png) | present |
| TC-11-3 | [`admin-member-drawer-after-restore.png`](../phase-11/screenshots/admin-member-drawer-after-restore.png) | present |

取得手順・3 層評価（Semantic / Visual / AI UX）は [../phase-11/phase-11.md](../phase-11/phase-11.md) と
[../phase-11/manual-test-result.md](../phase-11/manual-test-result.md) を参照。capture metadata は
[../phase-11/screenshots/phase11-capture-metadata.json](../phase-11/screenshots/phase11-capture-metadata.json)。
staging 実機証跡（MT-3）は user-gated。
