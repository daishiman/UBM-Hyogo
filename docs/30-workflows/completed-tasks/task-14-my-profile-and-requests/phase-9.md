# Phase 9: 実装ガイド（コードレベル詳細）

[実装区分: 実装仕様書]

Phase 6 で確定した Props と Phase 8 の順序に従い、各ファイルへ書く具体コードのテンプレート。

## 0. 必須契約と参考例の境界

必須契約は Props、`data-region`、副作用境界、a11y、tokens、API 呼び出し規約である。以下の JSX は既存 component 実装に合わせて調整してよい参考例だが、次は変更不可:

- Dialog は純 UI。`fetchAuthed` / `router.refresh()` は `VisibilityRequest.client` / `DeleteRequest.client` が担当する
- component から `/api/me/*` を hardcode しない。client island は `fetchAuthed("/me/visibility-request")` / `fetchAuthed("/me/delete-request")` を呼ぶ
- Dialog 内エラーは `RequestErrorMessage` を使う
- task-18 selector は 5 種: `public-visibility-banner`, `status-summary`, `request-action-panel`, `visibility-request-dialog`, `delete-request-dialog`

---

## 1. `PublicVisibilityBanner.tsx`（new）

```tsx
// apps/web/app/profile/_components/PublicVisibilityBanner.tsx
import { Banner } from "@/src/ui/Banner";
import type { PublishState, AuthGateState } from "@/src/lib/api/me-types";

export interface PublicVisibilityBannerProps {
  readonly publishState: PublishState;
  readonly authGateState: AuthGateState;
}

type View = {
  readonly tone: "success" | "info" | "warning" | "danger";
  readonly title: string;
  readonly description: string;
};

export function deriveBannerView(p: PublicVisibilityBannerProps): View {
  if (p.authGateState === "deleted") {
    return {
      tone: "danger",
      title: "アカウントは削除待ちです",
      description: "管理者の処理が完了するまで再ログインできません。",
    };
  }
  if (p.authGateState === "rules_declined") {
    return {
      tone: "warning",
      title: "規約の再同意が必要です",
      description: "最新の利用規約に同意するまで一部機能が制限されます。",
    };
  }
  switch (p.publishState) {
    case "public":
      return { tone: "success", title: "プロフィールは公開中です", description: "会員一覧に表示されます。" };
    case "member_only":
      return { tone: "info", title: "プロフィールは会員限定公開です", description: "ログインした会員にのみ表示されます。" };
    case "hidden":
      return { tone: "warning", title: "プロフィールは非公開です", description: "会員一覧には表示されません。" };
  }
}

export function PublicVisibilityBanner(props: PublicVisibilityBannerProps): JSX.Element {
  const v = deriveBannerView(props);
  return (
    <section data-region="public-visibility-banner">
      <Banner tone={v.tone} title={v.title}>{v.description}</Banner>
    </section>
  );
}
```

---

## 2. `StatusSummary.tsx`（rebuild）

```tsx
// apps/web/app/profile/_components/StatusSummary.tsx
import { Card } from "@/src/ui/Card";
import { Badge } from "@/src/ui/Badge";
import type { MeProfileResponse, AuthGateState } from "@/src/lib/api/me-types";

export interface StatusSummaryProps {
  readonly statusSummary: MeProfileResponse["statusSummary"];
  readonly authGateState: AuthGateState;
}

export function StatusSummary({ statusSummary, authGateState }: StatusSummaryProps): JSX.Element {
  const { fields, rulesConsent } = statusSummary;
  return (
    <section data-region="status-summary">
      <Card>
        <h2>公開範囲</h2>
        {fields.length === 0 ? (
          <p>公開範囲設定はまだありません。</p>
        ) : (
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
        )}
        <div className="mt-3 flex gap-2">
          {rulesConsent === "declined" && <Badge tone="warning">規約未同意</Badge>}
          {authGateState === "rules_declined" && <Badge tone="warning">規約再同意待ち</Badge>}
        </div>
      </Card>
    </section>
  );
}
```

---

## 3. `RequestActionPanel.tsx`（minor）

```tsx
import { Card } from "@/src/ui/Card";
import { RequestPendingBanner } from "./RequestPendingBanner";
import { VisibilityRequestClient } from "./VisibilityRequest.client";
import { DeleteRequestClient } from "./DeleteRequest.client";
import type { PublishState, RulesConsent, PendingRequests } from "@/src/lib/api/me-types";

export interface RequestActionPanelProps {
  readonly publishState: PublishState;
  readonly rulesConsent: RulesConsent;
  readonly pendingRequests?: PendingRequests;
}

export function RequestActionPanel({ publishState, rulesConsent, pendingRequests }: RequestActionPanelProps) {
  const visibility = pendingRequests?.visibility ?? null;
  const del = pendingRequests?.delete ?? null;

  return (
    <section data-region="request-action-panel">
      <Card>
        <h2>申請</h2>
        {visibility && <RequestPendingBanner type="visibility_request" createdAt={visibility.createdAt} />}
        <VisibilityRequestClient disabled={!!visibility} currentState={publishState} />
        {del && <RequestPendingBanner type="delete_request" createdAt={del.createdAt} />}
        <DeleteRequestClient disabled={!!del} />
      </Card>
    </section>
  );
}
```

---

## 4. `VisibilityRequestDialog.tsx`（Dialog primitive 化）

```tsx
'use client';
import { Dialog } from "@/src/ui/Dialog";
import { Button } from "@/src/ui/Button";
import { RequestErrorMessage } from "./RequestErrorMessage";
import { useState } from "react";
import type { PublishState } from "@/src/lib/api/me-types";
import type { VisibilityDesiredState } from "@/src/lib/api/me-requests.types";

export interface VisibilityRequestInput {
  readonly desiredState: VisibilityDesiredState;
  readonly reason?: string;
}
export interface VisibilityRequestDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: VisibilityRequestInput) => Promise<void>;
  readonly currentState: PublishState;
}

export function VisibilityRequestDialog({ open, onClose, onSubmit, currentState }: VisibilityRequestDialogProps) {
  const desired: VisibilityDesiredState = currentState === "hidden" ? "public" : "hidden";
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonOver = reason.length > 500;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ desiredState: desired, reason: reason || undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="visibility-req-title">
      <h2 id="visibility-req-title">公開範囲変更の申請</h2>
      <label>
        申請理由（任意・500 文字以内）
        <textarea value={reason} onChange={e => setReason(e.target.value)} aria-describedby="reason-help" />
        <span id="reason-help" aria-live="polite">{reason.length} / 500</span>
      </label>
      {error && <RequestErrorMessage message={error} />}
      <div>
        <Button onClick={onClose} variant="ghost">キャンセル</Button>
        <Button onClick={handleSubmit} disabled={submitting || reasonOver}>申請する</Button>
      </div>
    </Dialog>
  );
}
```

---

## 5. `DeleteRequestDialog.tsx`（Dialog primitive 化 + IME）

```tsx
'use client';
import { Dialog } from "@/src/ui/Dialog";
import { Banner } from "@/src/ui/Banner";
import { Button } from "@/src/ui/Button";
import { RequestErrorMessage } from "./RequestErrorMessage";
import { useState } from "react";

export interface DeleteRequestInput {
  readonly reason?: string;
  readonly confirmText: string;
}
export interface DeleteRequestDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: DeleteRequestInput) => Promise<void>;
}

const CONFIRM = "削除を申請する";

export function DeleteRequestDialog({ open, onClose, onSubmit }: DeleteRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [composing, setComposing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !composing && !submitting && confirmText === CONFIRM && reason.length <= 500;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ reason: reason || undefined, confirmText });
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-req-title">
      <h2 id="delete-req-title">アカウント削除の申請</h2>
      <Banner tone="danger">
        削除申請後は管理者が承認するまで取り消しできません。
      </Banner>
      <label>
        削除理由（任意・500 文字以内）
        <textarea value={reason} onChange={e => setReason(e.target.value)} />
      </label>
      <label>
        確認のため「{CONFIRM}」と入力してください
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          aria-describedby="delete-confirm-help"
        />
        <span id="delete-confirm-help">確定後に削除ボタンが有効になります。</span>
      </label>
      {error && <RequestErrorMessage message={error} />}
      <div>
        <Button onClick={onClose} variant="ghost">キャンセル</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} variant="danger">削除を申請する</Button>
      </div>
    </Dialog>
  );
}
```

---

## 6. `RequestPendingBanner.tsx`（minor）

```tsx
import { Banner } from "@/src/ui/Banner";

export interface RequestPendingBannerProps {
  readonly type: "visibility" | "delete";
  readonly submittedAt: string;
}

export function RequestPendingBanner({ type, submittedAt }: RequestPendingBannerProps) {
  const label = type === "visibility" ? "公開範囲変更" : "アカウント削除";
  const at = new Date(submittedAt).toLocaleString("ja-JP");
  return (
    <Banner tone="info" role="status">
      {label}の申請を確認中です（提出: {at}）
    </Banner>
  );
}
```

---

## 7. `RequestErrorMessage.tsx`（minor）

```tsx
'use client';
import { Banner } from "@/src/ui/Banner";

export interface RequestErrorMessageProps {
  readonly message: string;
  readonly onDismiss?: () => void;
}

export function RequestErrorMessage({ message, onDismiss }: RequestErrorMessageProps) {
  return (
    <Banner tone="danger" role="alert" aria-live="polite">
      {message}
      {onDismiss && <button onClick={onDismiss} aria-label="閉じる">×</button>}
    </Banner>
  );
}
```

---

## 8. `page.tsx`（edit）

```tsx
// apps/web/app/profile/page.tsx
import { redirect, notFound } from "next/navigation";
import { fetchAuthed, AuthRequiredError } from "@/src/lib/fetch/authed";
import type { MeSessionResponse, MeProfileResponse } from "@/src/lib/api/me-types";
import { PublicVisibilityBanner } from "./_components/PublicVisibilityBanner";
import { StatusSummary } from "./_components/StatusSummary";
import { RequestActionPanel } from "./_components/RequestActionPanel";
// 既存: ProfileFields / EditCta / AttendanceList を維持

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  let session: MeSessionResponse;
  let profile: MeProfileResponse;
  try {
    [session, profile] = await Promise.all([
      fetchAuthed<MeSessionResponse>("/me"),
      fetchAuthed<MeProfileResponse>("/me/profile"),
    ]);
  } catch (e) {
    if (e instanceof AuthRequiredError) redirect("/login?redirect=/profile");
    if (isNotFoundLike(e)) notFound();
    throw e;
  }

  return (
    <main>
      <PublicVisibilityBanner
        publishState={profile.statusSummary.publishState}
        authGateState={session.authGateState}
      />
      <StatusSummary statusSummary={profile.statusSummary} authGateState={session.authGateState} />
      <RequestActionPanel
        publishState={profile.statusSummary.publishState}
        rulesConsent={profile.statusSummary.rulesConsent}
        pendingRequests={profile.pendingRequests}
      />
      {/* 既存: ProfileFields, EditCta, AttendanceList を引き続き render */}
    </main>
  );
}
```

---

## 9. client island の submit 統合

`VisibilityRequest.client.tsx` / `DeleteRequest.client.tsx` の `onSubmit` に fetchAuthed 呼出を実装:

```ts
async function onVisibilitySubmit(input: VisibilityRequestInput) {
  await fetchAuthed("/me/visibility-request", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
  });
  try {
    router.refresh();
  } catch {
    setError("申請は送信済みです。最新状態を確認するため再読み込みしてください。");
  }
}
```

削除申請も同じ境界で `fetchAuthed("/me/delete-request")` を使う。`/api/me/*` は既存 proxy route の実体 path であり、client island の呼び出し文字列には使わない。`router` は `next/navigation` の `useRouter()` で取得。

---

## 10. tokens 適用ガイドライン

- 色 / 背景 / border / 影 → `tokens.css` の OKLch 変数（例: `var(--color-surface-success)`）
- 余白 → `space-*`、文字サイズ → `text-*`、角丸 → `rounded-*`（Tailwind tokens）
- HEX 直書き / `bg-[#xxx]` 禁止
- ui-primitive 側に prop で tone を渡し、HEX を持たない設計を維持

---

## 11. 完了条件

- 上記 9 ファイル（new 1 + edit 8）+ client island 2 + page.tsx の編集が完了
- 各ファイルのコードが Phase 4 / 6 の型と整合
- token 違反 0 / typecheck green
