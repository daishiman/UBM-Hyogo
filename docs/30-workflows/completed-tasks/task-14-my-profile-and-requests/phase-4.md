# Phase 4: データ設計（型・DTO・adapter）

[実装区分: 実装仕様書]

`/profile` で扱う型・DTO・view-model を確定する。
**新規型は最小限**。既存 `apps/web/src/lib/api/me-types.ts` を流用し、adapter が必要な場合のみ `lib/api/me.ts` に view-model を 1 段挟む。

---

## 1. 既存型（read-only）

`apps/web/src/lib/api/me-types.ts`（変更禁止、参照のみ）:

```ts
export type PublishState = "public" | "member_only" | "hidden";
type VisibilityDesiredState = "hidden" | "public";
export type AuthGateState = "active" | "rules_declined" | "deleted";
export type RulesConsent = "consented" | "declined" | "unknown";
export type FieldVisibility = "public" | "member" | "admin";

export interface FieldVisibilityRow {
  readonly fieldId: string;
  readonly label: string;
  readonly visibility: FieldVisibility;
}

export interface PendingVisibilityRequest {
  readonly queueId: string;
  readonly status: "pending";
  readonly createdAt: string;
  readonly desiredState: VisibilityDesiredState;
}

export interface PendingDeleteRequest {
  readonly queueId: string;
  readonly status: "pending";
  readonly createdAt: string;
}

export interface PendingRequests {
  readonly visibility?: PendingVisibilityRequest;
  readonly delete?: PendingDeleteRequest;
}

export interface MeProfileResponse {
  readonly profile: MemberProfile;
  readonly statusSummary: {
    readonly publishState: PublishState;
    readonly rulesConsent: RulesConsent;
    readonly publicConsent: RulesConsent;
    readonly isDeleted: false;
  };
  readonly pendingRequests: PendingRequests;
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
}

export interface MeSessionResponse {
  readonly user: MeSessionUser;
  readonly authGateState: AuthGateState;
}
```

**確認手順**: 実装着手時に `cat apps/web/src/lib/api/me-types.ts` で上記 shape の存在を grep。乖離があれば adapter を `lib/api/me.ts` に追加する（型の **書き換えは禁止**）。

---

## 2. 入出力型（POST 申請）

```ts
// VisibilityRequest.client → fetchAuthed("/me/visibility-request")
export interface VisibilityRequestInput {
  readonly desiredState: VisibilityDesiredState;   // "hidden" | "public"
  readonly reason?: string;                        // ≤500 文字
}
export interface VisibilityRequestResponse {
  readonly ok: true;
  readonly requestId: string;
}

// DeleteRequest.client → fetchAuthed("/me/delete-request")
export interface DeleteRequestInput {
  readonly reason?: string;               // ≤500 文字
  readonly confirmText: string;           // "削除を申請する" 必須
}
export interface DeleteRequestResponse {
  readonly ok: true;
  readonly requestId: string;
}
```

note / reason は前後 trim、`> 500` 文字は client 側で submit disabled。
`confirmText` は client で **完全一致** + `compositionend` 後のみ有効。

---

## 3. View-Model（Banner tone 決定用）

`PublicVisibilityBanner` 内部で計算する純粋関数の入出力。

```ts
type BannerTone = "success" | "info" | "warning" | "danger";

interface BannerInput {
  readonly publishState: PublishState;
  readonly authGateState: AuthGateState;
}
interface BannerView {
  readonly tone: BannerTone;
  readonly title: string;
  readonly description: string;
}

function deriveBannerView(input: BannerInput): BannerView;
```

決定表（Phase 2 §3 の再掲）:

| publishState | authGateState | tone | title |
|-------------|---------------|------|-------|
| public | active | success | プロフィールは公開中です |
| member_only | active | info | プロフィールは会員限定公開です |
| hidden | active | warning | プロフィールは非公開です |
| any | rules_declined | warning | 規約の再同意が必要です |
| any | deleted | danger | アカウントは削除待ちです |

優先度: `deleted` > `rules_declined` > `publishState` 別 tone。

---

## 4. pendingRequests ロジック

```ts
const visibilityPending = pendingRequests.visibility ?? null;
const deletePending = pendingRequests.delete ?? null;
```

API mirror は pending row のみを `{ visibility?: ..., delete?: ... }` として返す。object に該当 key がなければ enabled とする。submit 直後の optimistic pending は採用せず、成功後は `router.refresh()` で server state を再取得する。

---

## 5. adapter 戦略

| ケース | 対応 |
|--------|------|
| API 応答が `me-types.ts` の型と完全一致 | adapter 不要、props に直渡し |
| API 応答に追加フィールドがある | view-model は `me-types.ts` の subset のみ参照 |
| API 応答が type 名違い（snake_case 等） | `apps/web/src/lib/api/me.ts` に adapter を追加（**新規 path のみ・既存型は不変**） |
| API 応答が完全に乖離 | Phase 1 のリスク §11.1 へエスカレーション |

---

## 6. data-region 属性（task-18 契約）

各領域に test-id 兼 a11y landmark として `data-region` を必ず付与:

```tsx
<section data-region="public-visibility-banner">…</section>
<section data-region="status-summary">…</section>
<section data-region="request-action-panel">…</section>
<button data-region="visibility-request-dialog">…</button>  // trigger
<div role="dialog" data-region="visibility-request-dialog">…</div>  // open 時
<button data-region="delete-request-dialog">…</button>  // trigger
<div role="dialog" data-region="delete-request-dialog">…</div>  // open 時
```

task-18 Playwright spec はこれを selector として参照する。

---

## 7. 完了条件

- 既存 `me-types.ts` を参照のみで使用、必要時のみ `lib/api/me.ts` に adapter 追加
- 入出力型 / view-model / filter ロジックがすべて型安全
- `data-region` 5 種（public-visibility-banner / status-summary / request-action-panel / visibility-request-dialog / delete-request-dialog）が Phase 6 の component 設計に反映済
