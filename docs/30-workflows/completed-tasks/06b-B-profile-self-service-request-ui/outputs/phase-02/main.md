# Phase 2 成果物: 設計 — 06b-B-profile-self-service-request-ui

## 1. コンポーネント分解

| Component | 種別 | 責務 | 主要 props | 状態 owner |
| --- | --- | --- | --- | --- |
| `RequestActionPanel` | client | 公開停止 / 再公開 / 退会のトリガを束ねる | `publishState: "public"\|"hidden"\|"member_only"`, `rulesConsent: "consented"\|"declined"\|"unknown"`, `pendingTypes: ("visibility_request"\|"delete_request")[]` | 自身（dialog 開閉のみ） |
| `VisibilityRequestDialog` | client | 確認 + reason 入力 + submit | `desiredState: "hidden"\|"public"`, `open: boolean`, `onClose(): void`, `onAccepted(accepted: QueueAccepted): void` | 自身（form / submitting / error） |
| `DeleteRequestDialog` | client | 二段確認（不可逆チェック必須）+ reason + submit | `open`, `onClose`, `onAccepted` | 自身 |
| `RequestPendingBanner` | client | 申請受付済表示 + 該当ボタン disable 連動 | `type: "visibility_request"\|"delete_request"`, `acceptedAt?: string` | props のみ |
| `RequestErrorMessage` | client | code → 文言マッピング（`role=alert`） | `code: RequestErrorCode`, `onRetry?(): void` | props のみ |

ファイル配置:

```
apps/web/app/profile/_components/
  RequestActionPanel.tsx        // 新規（client）
  VisibilityRequestDialog.tsx   // 新規（client）
  DeleteRequestDialog.tsx       // 新規（client）
  RequestPendingBanner.tsx      // 新規
  RequestErrorMessage.tsx       // 新規
apps/web/src/lib/api/
  me-requests.ts                // 新規 client helper
  me-requests.types.ts          // 新規（type 集約）
```

`page.tsx` への差分は `<RequestActionPanel ... />` を 1 箇所追加するのみ。Server Component 側で本文編集 UI を追加できない構造に閉じる。

## 2. client helper シグネチャ

```ts
// apps/web/src/lib/api/me-requests.types.ts
export type VisibilityRequestInput = { desiredState: "hidden" | "public"; reason?: string };
export type DeleteRequestInput = { reason?: string };
export type QueueAccepted = {
  queueId: string;
  type: "visibility_request" | "delete_request";
  status: "pending";
  createdAt: string;
};
export type RequestErrorCode =
  | "DUPLICATE_PENDING_REQUEST"
  | "INVALID_REQUEST"
  | "RULES_CONSENT_REQUIRED"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "NETWORK"
  | "SERVER";
export type RequestResult =
  | { ok: true; accepted: QueueAccepted }
  | { ok: false; code: RequestErrorCode; status?: number };

// apps/web/src/lib/api/me-requests.ts
export async function requestVisibilityChange(input: VisibilityRequestInput): Promise<RequestResult>;
export async function requestDelete(input: DeleteRequestInput): Promise<RequestResult>;
```

実装方針:

- `fetchAuthed<QueueAccepted>("/me/visibility-request", { method: "POST", body: JSON.stringify(input), headers: { "content-type": "application/json" } })`。
- `FetchAuthedError.status` から code を導出（409→DUPLICATE_PENDING_REQUEST、422→INVALID_REQUEST、403→RULES_CONSENT_REQUIRED、429→RATE_LIMITED、5xx→SERVER）。
- `AuthRequiredError` は throw を継続させ、呼び出し元が `router.push("/login?redirect=/profile")` を行う。
- `TypeError`（fetch 失敗）→ `NETWORK`。

shared 型同期: `MeVisibilityRequestBody` / `MeDeleteRequestBody` の field と 1:1 対応。Phase 4 で `expectTypeOf` 互換テストを追加。

## 3. 状態管理戦略

| 観点 | 選定 | 理由 |
| --- | --- | --- |
| Form state | `useState`（reason / submitting / error / accepted） | 単一画面・2 form のため context 過剰 |
| 送信処理 | `useTransition` + helper 直接呼出 | Server Action を増やしても利得なし（OpenNext + Workers 境界の単純化） |
| 楽観的更新 | しない | 申請は管理者承認後に反映。即時反映は state 乖離リスク |
| pending 表示 | 202 受信後に client local state でバナー表示。reload で消える前提を docstring に明記。MINOR-01 として Phase 12 で `/me/profile` に `pendingRequestTypes` 追加を follow-up |
| 二重送信防止 | `submitting` flag + button `disabled` + 409 で server-side 抑止 |

## 4. エラーマッピング

| HTTP / 例外 | code | 文言 | UI 挙動 |
| --- | --- | --- | --- |
| 202 | — | 「申請を受け付けました」 | dialog close + pending banner |
| 409 | DUPLICATE_PENDING_REQUEST | 「既に申請を受け付けています。管理者の対応をお待ちください。」 | banner + ボタン disabled |
| 422 | INVALID_REQUEST | 「入力内容を確認してください。」 | dialog 内 inline error |
| 403 | RULES_CONSENT_REQUIRED | 「会則同意の更新が必要です。」 | panel 非表示 + 案内 |
| 429 | RATE_LIMITED | 「短時間に申請が集中しています。時間を置いて再度お試しください。」 | dialog 内 alert |
| 401 | UNAUTHORIZED | （非表示・redirect） | `/login?redirect=/profile` |
| network | NETWORK | 「通信に失敗しました。再試行してください。」 | retry ボタン |
| 5xx | SERVER | 「サーバーで問題が発生しました。」 | retry ボタン |

## 5. 不変条件の構造的担保

| 不変条件 | 守り方 |
| --- | --- |
| #4 本文編集禁止 | dialog の form は `desiredState` / `reason` / 確認 checkbox のみ。氏名等の field を一切 import しない |
| #5 D1 直接禁止 | client helper は `fetchAuthed` のみ。`apps/web` から `cloudflare:d1` import 禁止 |
| #11 self-service 境界 | URL を `"/me/visibility-request"` `"/me/delete-request"` の 2 箇所に固定。`:memberId` を含めない |
| #7 responseId 非表示 | UI に `responseId` を一切描画しない |

## 6. dependency / ownership

| モジュール | owner | co-owner | 同期タイミング |
| --- | --- | --- | --- |
| `apps/web/src/lib/api/me-requests.ts` | 06b-B | 06b-C | wave 末尾 |
| `apps/web/app/profile/_components/Request*` | 06b-B | 06b-C | wave 末尾 |
| `MeVisibilityRequestBodyZ` / `MeDeleteRequestBodyZ` | 04b（既存） | 06b-B（参照） | 変更なし |

## 7. validation matrix（Phase 4-9 で実行）

| コマンド | gate |
| --- | --- |
| `pnpm typecheck` | green |
| `pnpm lint` | green |
| `pnpm test --filter @web` | unit Line 80%+ / Branch 60%+ |
| `pnpm test:e2e -- profile.visibility-request profile.delete-request` | S1〜S5 緑 |
| `rg cloudflare:d1 apps/web` | 0 hit |
| `rg ":memberId" apps/web/src/lib/api/me-requests.ts` | 0 hit |

## 8. 文言テーブル（i18n）

| key | text |
| --- | --- |
| panel.heading | 公開設定と退会 |
| btn.hide | 公開を停止する |
| btn.republish | 再公開を申請する |
| btn.delete | 退会を申請する |
| dialog.visibility.hide.title | 公開を停止しますか？ |
| dialog.visibility.republish.title | 再公開を申請しますか？ |
| dialog.delete.title | 退会を申請しますか？ |
| dialog.delete.warning | 退会後はマイページにアクセスできなくなり、参加履歴の表示も停止されます。 |
| confirm.checkbox | 上記内容を確認しました |
| reason.label | 任意理由（500 文字以内） |
| accepted.banner | 申請を受け付けました。管理者の対応をお待ちください。 |
| error.duplicate | 既に申請を受け付けています。管理者の対応をお待ちください。 |

## 9. 次 Phase への handoff

Phase 3 へ：component 表 / helper シグネチャ / 状態戦略 / error マッピング / 不変条件構造的担保 / ownership / validation matrix / 文言テーブル。
