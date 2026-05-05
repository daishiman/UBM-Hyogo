# Output Phase 5: 実装ランブック — 06b-B-profile-self-service-request-ui

## status

SPEC_FINALIZED（実装ランブック本体）。実装本体・commit・push・PR は本仕様書タスクに含めない。

## 0. 事前 baseline 確認

```bash
mise exec -- pnpm --filter @ubm/web typecheck
mise exec -- pnpm --filter @ubm/web lint
mise exec -- pnpm --filter @ubm/web test --run
rg -n "request(Visibility|Delete)|RequestActionPanel|VisibilityRequestDialog|DeleteRequestDialog" apps/web/
```

期待: typecheck/lint/test 全 GREEN、grep 0 hit。

## 1. 実装ステップ概要

| # | 種別 | パス | 主目的 | 対応 TC |
| --- | --- | --- | --- | --- |
| 1 | 新規 | `apps/web/src/lib/api/me-requests.types.ts` | API zod 由来の型 re-export | TC-I-01 / TC-I-02 |
| 2 | 新規 | `apps/web/src/lib/api/me-requests.ts` | helper `requestVisibilityChange` / `requestDelete` | TC-U-13..20 / TC-I-03..05 |
| 3 | 新規 | `apps/web/app/profile/_components/RequestErrorMessage.tsx`（client） | code → 文言 + role=alert | TC-U-11 |
| 4 | 新規 | `apps/web/app/profile/_components/RequestPendingBanner.tsx` | 受付済み banner（aria-live=polite） | TC-U-12 |
| 5 | 新規 | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`（client） | 公開停止/再公開 dialog | TC-U-05..08, TC-U-21 |
| 6 | 新規 | `apps/web/app/profile/_components/DeleteRequestDialog.tsx`（client） | 退会 二段確認 dialog | TC-U-09, TC-U-10, TC-U-21 |
| 7 | 新規 | `apps/web/app/profile/_components/RequestActionPanel.tsx`（client） | 3 ボタン束ね、dialog 開閉、banner 表示 | TC-U-01..06, TC-U-12 |
| 8 | 編集 | `apps/web/app/profile/page.tsx` | `<RequestActionPanel>` を `<EditCta>` 直後に配置 | — |
| 9 | 新規 | `apps/web/playwright/tests/profile-visibility-request.spec.ts` | E2E 正常+409+422+network | TC-E-01,02,04,05,06 |
| 9 | 新規 | `apps/web/playwright/tests/profile-delete-request.spec.ts` | E2E 退会動線 | TC-E-03 |

## 2. ステップ1 — 型 re-export

```ts
// apps/web/src/lib/api/me-requests.types.ts
import type { z } from "zod";
import type {
  MeVisibilityRequestBodyZ,
  MeDeleteRequestBodyZ,
  MeQueueAcceptedZ,
} from "../../../../api/src/routes/me/schemas"; // 当面 relative。Phase 12 で shared 化候補

export type VisibilityRequestInput = z.infer<typeof MeVisibilityRequestBodyZ>;
export type DeleteRequestInput = z.infer<typeof MeDeleteRequestBodyZ>;
export type QueueAccepted = z.infer<typeof MeQueueAcceptedZ>;

export type RequestErrorCode =
  | "DUPLICATE_PENDING_REQUEST"
  | "INVALID_REQUEST"
  | "RULES_CONSENT_REQUIRED"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "NETWORK"
  | "SERVER";

export type RequestResult<T = QueueAccepted> =
  | { ok: true; accepted: T }
  | { ok: false; code: RequestErrorCode; status?: number };
```

## 3. ステップ2 — client helper

```ts
// apps/web/src/lib/api/me-requests.ts
// idempotency 保証なし。network failure 後の re-submit は API 側 UNIQUE で 409 にフォールバック。
import { fetchAuthed, AuthRequiredError, FetchAuthedError } from "../fetch/authed";
import type {
  VisibilityRequestInput, DeleteRequestInput, QueueAccepted, RequestResult, RequestErrorCode,
} from "./me-requests.types";

function statusToCode(status: number): RequestErrorCode {
  switch (status) {
    case 409: return "DUPLICATE_PENDING_REQUEST";
    case 422: return "INVALID_REQUEST";
    case 403: return "RULES_CONSENT_REQUIRED";
    case 429: return "RATE_LIMITED";
    default:  return status >= 500 ? "SERVER" : "INVALID_REQUEST";
  }
}

export async function requestVisibilityChange(input: VisibilityRequestInput): Promise<RequestResult> {
  try {
    const accepted = await fetchAuthed<QueueAccepted>("/me/visibility-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return { ok: true, accepted };
  } catch (err) {
    if (err instanceof AuthRequiredError) throw err;
    if (err instanceof FetchAuthedError) return { ok: false, code: statusToCode(err.status), status: err.status };
    return { ok: false, code: "NETWORK" };
  }
}
// requestDelete も同形（URL を `/me/delete-request` に変える）
```

実装規約:
- URL は文字列リテラルで直書き（不変条件 #11 を grep で固定）。
- `AuthRequiredError` は再 throw → Server Component 側で `redirect("/login?redirect=/profile")`。
- edge runtime 上で `node:*` を import しない。

## 4. ステップ3-7 — Component 実装方針

### 共通

- 全て `"use client"`。
- TailwindCSS のみで styling。
- 独自 dialog 実装（依存追加なし）: focus trap / esc / overlay click を自前で。
- `useTransition` で submit pending を管理（`aria-busy` 連動）。
- `router.refresh()` を 202 後に呼び、profile Server Component を再取得（pending 情報が将来追加される場合に備える）。

### `RequestErrorMessage`

| 要件 | 実装 |
| --- | --- |
| props | `{ code: RequestErrorCode; onRetry?: () => void }` |
| root | `<div role="alert">` |
| 文言 | Phase 6 ステップ5 文言テーブルに 1:1 対応 |
| retry | `NETWORK` / `SERVER` のみ表示 |

### `RequestPendingBanner`

| 要件 | 実装 |
| --- | --- |
| props | `{ type: "visibility_request" \| "delete_request"; createdAt?: string }` |
| root | `<div role="status" aria-live="polite">` |

### `VisibilityRequestDialog`

| 要件 | 実装 |
| --- | --- |
| props | `desiredState`, `open`, `onClose`, `onSubmitted` |
| form | `reason?: string`（textarea, maxLength=500）のみ。本文編集 field 禁止 |
| submit | `useTransition` + helper 呼び出し → 結果分岐 |
| a11y | `role="dialog" aria-modal="true" aria-labelledby aria-describedby` |

### `DeleteRequestDialog`

| 要件 | 実装 |
| --- | --- |
| 不可逆性 | 強調文 + `aria-describedby` で submit に関連付け |
| 二段確認 | `<input type="checkbox" required>` 未入力時 submit `disabled` |

### `RequestActionPanel`

| 要件 | 実装 |
| --- | --- |
| props | `{ publishState, rulesConsent }` |
| 早期 return | `rulesConsent !== "consented"` で案内文のみ表示 |
| ボタン | `publishState=public` → 公開停止、`publishState=hidden` → 再公開、退会は常時 |
| state | `openVisibility`, `openDelete`, `pendingType` |
| banner | submit 成功時に `<RequestPendingBanner>` を panel 上部に表示 |

## 5. ステップ8 — page.tsx への組込み

差分（疑似 diff）:

```tsx
 import { EditCta } from "./_components/EditCta";
 import { AttendanceList } from "./_components/AttendanceList";
+import { RequestActionPanel } from "./_components/RequestActionPanel";
...
       <EditCta editResponseUrl={editResponseUrl} fallbackResponderUrl={fallbackResponderUrl} />
+      <RequestActionPanel
+        publishState={statusSummary.publishState}
+        rulesConsent={statusSummary.rulesConsent}
+      />
       <AttendanceList attendance={profile.attendance} />
```

`page.tsx` は Server Component のまま、`RequestActionPanel` のみ client。境界破壊なし。

## 6. ステップ9 — Playwright spec

```ts
// 例: visibility-request.spec.ts（要点）
test("S1 公開停止申請が 202 で受け付けられ banner が表示される", async ({ page }) => {
  await page.route("**/me/visibility-request", route =>
    route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({
      queueId: "q1", type: "visibility_request", status: "pending", createdAt: new Date().toISOString(),
    })}));
  await page.goto("/profile");
  await page.getByRole("button", { name: "公開を停止する" }).click();
  await page.getByRole("button", { name: "申請する" }).click();
  await expect(page.getByRole("status")).toContainText("申請を受け付けました");
});
```

E2E 安定性 3 層: `waitForLoadState("domcontentloaded")` → `waitForSelector({ state: "visible" })` → 100ms `waitForTimeout`。

## 7. 検証コマンド（PASS 条件）

| コマンド | PASS 条件 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm/web typecheck` | error 0 |
| `mise exec -- pnpm --filter @ubm/web lint` | warning/error 0 |
| `mise exec -- pnpm --filter @ubm/web test --run` | TC-U-01..21 / TC-I-01..05 / TC-A-01..06 全 PASS |
| `mise exec -- pnpm --filter @ubm/web exec playwright test e2e/profile/` | TC-E-01..09 全 PASS |
| `mise exec -- pnpm --filter @ubm/web test --run --coverage` | Line ≥ 80% / Branch ≥ 60% / Function ≥ 80% |

## 8. 不変条件 静的 grep（CI gate）

```bash
rg -n "name=\"(displayName|email|kana|address|phone)\"" apps/web/app/profile/_components/Request*.tsx   # 0 hit
rg -n "cloudflare:d1|D1Database" apps/web/                                                              # 0 hit
rg -n "/me/[^\"]*/[^\"]+" apps/web/src/lib/api/me-requests.ts                                           # 期待 2 endpoints
rg -n "responseId" apps/web/app/profile/_components/Request*.tsx                                        # 0 hit
```

## 9. Cloudflare Workers / OpenNext 注意点

| 項目 | 方針 |
| --- | --- |
| fetch | `fetchAuthed` のみ経由。生 `fetch` を直接 component 内で使わない |
| cookie 透過 | `fetchAuthed` 内部の Cookie ヘッダ構築に委譲 |
| edge runtime | `node:*` を import しない。`Buffer` / `process.env` 直参照を避ける |
| Server → Client 境界 | `page.tsx` から渡す props は serializable のみ（プリミティブ + plain object） |
| router.refresh | `useRouter` from `next/navigation`（client component 内のみ） |

## 10. canUseTool / SDK callback

本タスクでは Claude Agent SDK や canUseTool は **使用しない**。fetch 経由の通常 API 呼び出しのみ。

## 11. 失敗時の自動修復方針（Phase 9 で再実行）

| 失敗 | 復旧 |
| --- | --- |
| typecheck | unused import / `z.infer` 同期破れ最小修正 |
| lint | `pnpm lint --fix` → 残違反を手修正 |
| unit | TC ID で原因切り分け、helper を疑う前に dialog form state を疑う |
| E2E flaky | E2E 安定性 3 層適用、`page.waitForResponse` で route stub の到達を待つ |
