# Phase 6: UI / Component 設計

[実装区分: 実装仕様書]

各 component の Props・状態・描画責務・a11y 要件を確定する。
Phase 9（実装ガイド）はここを 1:1 でコード化する。

---

## 1. 全 component 一覧

| Component | path | 区分 | render |
|-----------|------|------|--------|
| `ProfilePage` | `app/profile/page.tsx` | M (edit) | Server |
| `PublicVisibilityBanner` | `_components/PublicVisibilityBanner.tsx` | C (new) | Server |
| `StatusSummary` | `_components/StatusSummary.tsx` | M (rebuild) | Server |
| `RequestActionPanel` | `_components/RequestActionPanel.tsx` | M (minor) | Server wrapper |
| `VisibilityRequest.client` | `_components/VisibilityRequest.client.tsx` | R (token only) | Client |
| `VisibilityRequestDialog` | `_components/VisibilityRequestDialog.tsx` | M (Dialog 化) | Client |
| `DeleteRequest.client` | `_components/DeleteRequest.client.tsx` | R (token only) | Client |
| `DeleteRequestDialog` | `_components/DeleteRequestDialog.tsx` | M (Dialog 化) | Client |
| `RequestPendingBanner` | `_components/RequestPendingBanner.tsx` | M (minor) | Server |
| `RequestErrorMessage` | `_components/RequestErrorMessage.tsx` | M (minor) | Client |

副作用境界: `VisibilityRequestDialog` / `DeleteRequestDialog` は純 UI とし、`fetchAuthed` / `router.refresh()` / `router.replace()` / Sentry capture は `VisibilityRequest.client` / `DeleteRequest.client` が担当する。

---

## 2. `ProfilePage` (page.tsx)

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage(): Promise<JSX.Element> {
  try {
    const [session, profile] = await Promise.all([
      fetchAuthed<MeSessionResponse>("/me"),
      fetchAuthed<MeProfileResponse>("/me/profile"),
    ]);
    return (
      <main className="…tokens…">
        <PublicVisibilityBanner
          publishState={profile.statusSummary.publishState}
          authGateState={session.authGateState}
        />
        <StatusSummary
          statusSummary={profile.statusSummary}
          authGateState={session.authGateState}
        />
        <RequestActionPanel
          publishState={profile.statusSummary.publishState}
          rulesConsent={profile.statusSummary.rulesConsent}
          pendingRequests={profile.pendingRequests}
        />
        {/* ProfileFields, EditCta, AttendanceList は既存維持 */}
      </main>
    );
  } catch (e) {
    if (e instanceof AuthRequiredError) redirect("/login?redirect=/profile");
    if (isNotFound(e)) notFound();
    throw e; // → error.tsx
  }
}
```

---

## 3. `PublicVisibilityBanner`（new）

### 3.1 Props

```ts
export interface PublicVisibilityBannerProps {
  readonly publishState: PublishState;
  readonly authGateState: AuthGateState;
}
```

### 3.2 内部ロジック（純粋関数）

```ts
function deriveBannerView(props: PublicVisibilityBannerProps): {
  tone: "success" | "info" | "warning" | "danger";
  title: string;
  description: string;
} {
  if (props.authGateState === "deleted") {
    return { tone: "danger", title: "アカウントは削除待ちです", description: "管理者の処理が完了するまで再ログインできません。" };
  }
  if (props.authGateState === "rules_declined") {
    return { tone: "warning", title: "規約の再同意が必要です", description: "最新の利用規約に同意するまで一部機能が制限されます。" };
  }
  switch (props.publishState) {
    case "public":
      return { tone: "success", title: "プロフィールは公開中です", description: "会員一覧に表示されます。" };
    case "member_only":
      return { tone: "info", title: "プロフィールは会員限定公開です", description: "ログインした会員にのみ表示されます。" };
    case "hidden":
      return { tone: "warning", title: "プロフィールは非公開です", description: "会員一覧には表示されません。" };
  }
}
```

### 3.3 描画

```tsx
<section data-region="public-visibility-banner">
  <Banner tone={view.tone} title={view.title}>
    {view.description}
  </Banner>
</section>
```

a11y: Banner が `role="status"` を内部で付与（ui-primitive 側）。

---

## 4. `StatusSummary`（rebuild）

### 4.1 Props

```ts
export interface StatusSummaryProps {
  readonly statusSummary: MeProfileResponse["statusSummary"];
  readonly authGateState: AuthGateState;
}
```

### 4.2 描画

```tsx
<section data-region="status-summary">
  <Card>
    <h2>公開範囲</h2>
    <dl>
      {fields.map(f => (
        <div key={f.fieldId}>
          <dt>{f.label}</dt>
          <dd>
            <Badge tone={f.visibility === "public" ? "info" : "muted"}>
              {f.visibility === "public" ? "公開" : "非公開"}
            </Badge>
          </dd>
        </div>
      ))}
    </dl>
    {rulesConsent === "declined" && <Badge tone="warning">規約未同意</Badge>}
    {authGateState === "rules_declined" && <Badge tone="warning">規約再同意待ち</Badge>}
  </Card>
</section>
```

---

## 5. `RequestActionPanel`（minor）

### 5.1 Props

```ts
export interface RequestActionPanelProps {
  readonly publishState: PublishState;
  readonly rulesConsent: RulesConsent;
  readonly pendingRequests?: PendingRequests;
}
```

### 5.2 ロジック

```ts
const visibilityPending = pendingRequests?.visibility ?? null;
const deletePending = pendingRequests?.delete ?? null;
```

pending 表示は server response のみを正本にする。submit 成功時は `router.refresh()` で再取得し、optimistic fallback state は持たない。

### 5.3 描画

```tsx
<section data-region="request-action-panel">
  <Card>
    <h2>申請</h2>

    {visibilityPending && <RequestPendingBanner type="visibility_request" createdAt={visibilityPending.createdAt} />}
    <VisibilityRequest.client
      disabled={visibilityPending}
      currentState={publishState}
    />

    {deletePending && <RequestPendingBanner type="delete_request" createdAt={deletePending.createdAt} />}
    <DeleteRequest.client disabled={deletePending} />
  </Card>
</section>
```

---

## 6. `VisibilityRequestDialog`（Dialog primitive 化）

### 6.1 Props

```ts
export interface VisibilityRequestDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: VisibilityRequestInput) => Promise<void>;
  readonly currentState: PublishState;
}
```

### 6.2 UI 要素

- Dialog title: 「公開範囲変更の申請」（`aria-labelledby` 紐付け）
- desiredState は `hidden` / `public` の 2 値（公開停止 / 再公開）で、radio group は持たない
- textarea (任意): 申請理由 ≤500（`aria-describedby` で残文字数）
- submit button: 「申請する」（500 字超で disabled）
- cancel button: 「キャンセル」
- focus trap（ui-primitive Dialog 提供） + ESC 閉じる + click outside 閉じる

### 6.3 submit ハンドリング

```ts
async function handleSubmit() {
  setSubmitting(true);
  try {
    await onSubmit({ desiredState, reason: reason || undefined });
  } catch (e) {
    setError(extractMessage(e));
  } finally {
    setSubmitting(false);
  }
}
```

`onSubmit` の実体は `VisibilityRequest.client` に置く。成功時は client island が `onClose()` → `router.refresh()` を実行し、refresh 失敗時は `RequestErrorMessage` で「申請は送信済みです。最新状態を確認するため再読み込みしてください。」を表示する。

---

## 7. `DeleteRequestDialog`（Dialog primitive 化）

### 7.1 Props

```ts
export interface DeleteRequestDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: DeleteRequestInput) => Promise<void>;
}
```

### 7.2 UI 要素

- Dialog title: 「アカウント削除の申請」
- 警告 Banner（danger）: 「削除申請後は管理者が承認するまで取り消し不可」
- textarea (任意): 削除理由 ≤500
- input: 「削除を申請する」と打鍵させる確認入力
- submit button: **確認文字列 完全一致 + IME 確定後**でのみ enabled
- cancel button

### 7.3 確認入力ロジック

```ts
const [confirmText, setConfirmText] = useState("");
const [composing, setComposing] = useState(false);
const canSubmit = !composing && confirmText === "削除を申請する";

<input
  value={confirmText}
  onChange={e => setConfirmText(e.target.value)}
  onCompositionStart={() => setComposing(true)}
  onCompositionEnd={() => setComposing(false)}
  aria-describedby="delete-confirm-help"
/>
```

---

## 8. `RequestPendingBanner`（minor）

```ts
export interface RequestPendingBannerProps {
  readonly type: "visibility" | "delete";
  readonly submittedAt: string;
}
```

```tsx
<Banner tone="info" role="status">
  {type === "visibility"
    ? "公開範囲変更の申請を確認中です"
    : "アカウント削除の申請を確認中です"}
  （提出: {formatJaDateTime(submittedAt)}）
</Banner>
```

---

## 9. `RequestErrorMessage`（minor）

```ts
export interface RequestErrorMessageProps {
  readonly message: string;
  readonly onDismiss?: () => void;
}
```

Dialog 内の送信失敗表示も `<p role="alert">` の直書きではなく、この component を使う。

```tsx
<Banner tone="danger" role="alert" aria-live="polite">
  {message}
  {onDismiss && <button onClick={onDismiss}>閉じる</button>}
</Banner>
```

---

## 10. a11y 要件まとめ

| 要素 | 要件 |
|------|------|
| Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Dialog focus trap | open 時に最初の focusable へ移動、close 時に trigger に戻す |
| Banner（info/success/warning） | `role="status"` |
| Banner（danger） | `role="alert"` + `aria-live="polite"` |
| radio group | `<fieldset>` + `<legend>` |
| 確認入力 | `aria-describedby` で説明文紐付け |
| 残文字数表示 | `aria-live="polite"` の補助領域 |

jest-axe で全領域 critical violation 0 を強制。

---

## 11. tokens 適用方針

- 色 / 余白 / 角丸 / 影 / typography は **すべて** `apps/web/src/styles/tokens.css` の OKLch 変数から参照
- HEX 直書き禁止（`bg-[#xxx]` `text-[#xxx]` 含む）
- profile token grep gate の grep gate を pass する
- ui-primitive 側で tokens を吸収済の場合、本 component では `<Card tone="…">` のような prop 経由のみ

---

## 12. 完了条件

- 全 10 component の Props 型が Phase 4 の型と整合
- 4 領域 + 2 Dialog の a11y 要件が網羅
- `data-region` 属性 5 種（public-visibility-banner / status-summary / request-action-panel / visibility-request-dialog / delete-request-dialog）が付与され、Phase 7 / task-18 で selector 利用可
