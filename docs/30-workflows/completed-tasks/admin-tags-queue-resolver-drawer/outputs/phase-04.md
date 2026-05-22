# Phase 4 — 詳細設計

## 4.1 型定義

```ts
// apps/web/src/components/admin/TagQueuePanel.tsx（既存 export 維持）
export type TagQueueStatus = "queued" | "reviewing" | "resolved" | "rejected" | "dlq";
export interface TagQueueItem { /* 既存と同一 */ }

// apps/web/src/components/admin/TagsQueueResolveDrawer.tsx
import { tagQueueResolveBodySchema, type TagQueueResolveBody } from "@ubm-hyogo/shared";

export interface TagsQueueResolveDrawerProps {
  readonly queueId: string;
  readonly memberId: string;
  readonly suggestedTags: readonly string[];
  readonly status: TagQueueStatus;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onResolved?: (queueId: string) => void;
}

export interface TagQueueResolveResponse {
  ok: boolean;
  result?: {
    status: "resolved" | "rejected";
    tagCodes?: string[];
    idempotent: boolean;
    memberId: string;
    resolvedAt: string;
  };
}
```

## 4.2 useAdminMutation 配線

```ts
// browser/BFF path。upstream API 正本は /admin/tags/queue/:queueId/resolve。
const endpoint = `/api/admin/tags/queue/${encodeURIComponent(queueId)}/resolve`;
const { trigger, isLoading, error } = useAdminMutation<TagQueueResolveResponse>(
  endpoint,
  "POST",
  {
    successMessage: (data) => data.result?.idempotent
      ? "既に処理済です"
      : action === "confirmed" ? "承認しました" : "却下しました",
    onSuccess: () => {
      onResolved?.(queueId);
      onClose();
    },
  },
);
```

submit 時は `tagQueueResolveBodySchema.safeParse(body)` で client 側 validation を実施し、fail なら inline error を表示して trigger 不発に。

`@ubm-hyogo/shared` は `packages/shared/package.json` で root export のみを公開しているため、deep import (`@ubm-hyogo/shared/schemas/admin/tag-queue-resolve`) は使わない。

## 4.2.1 useAdminMutation 後方互換拡張

```ts
export interface UseAdminMutationOptions<T> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string | ((data: T) => string);
}

const successMessage = typeof options?.successMessage === "function"
  ? options.successMessage(data)
  : options?.successMessage;
toast(successMessage ?? "保存しました");
```

既存 caller の string 指定はそのまま動作し、本 drawer だけが response mapper を使って `idempotent: true` を「既に処理済です」と表示する。

## 4.3 UI フロー

1. `TagQueuePanel` の各 list item に「Resolve」button を追加（drawer trigger）
2. 選択 item で `<TagsQueueResolveDrawer open={true}>` を render
3. drawer 内:
   - header: `queueId` / `memberId` / status badge（token color）
   - radio group: `action = "confirmed" | "rejected"`（初期値: `"confirmed"`）
   - confirmed branch:
     - checkbox list（`suggestedTags` 全選択初期値、`tagCodes.length >= 1` を validation）
   - rejected branch:
     - `<textarea>` `reason`（trim 後 1 文字以上）
   - footer: 「送信」(primary) / 「キャンセル」(ghost)
4. 送信 → `tagQueueResolveBodySchema.safeParse` → trigger
5. 200 → toast（useAdminMutation 内）+ onClose + router.refresh（hook 内蔵）

## 4.4 a11y 要件

| 要件 | 実装 |
| --- | --- |
| dialog role | `role="dialog" aria-modal="true"` |
| label | `aria-labelledby="tag-resolve-h"` |
| ESC で close | `useEffect` で keydown listener |
| focus trap | 最初の focusable に initial focus、Tab/Shift+Tab で trap |
| return focus | 開いたトリガー button に return focus |
| terminal status | 「送信」を disabled + `aria-disabled="true"` |
| validation error | `aria-describedby` で error 文を関連付け |
| live region | toast は既存 `useToast` の `role="status"` を流用 |

## 4.5 design token mapping (`_tagQueueStatus.ts`)

```ts
export const TAG_QUEUE_STATUS_TOKEN: Record<TagQueueStatus, { label: string; tokenVar: string }> = {
  queued:    { label: "未対応",   tokenVar: "var(--status-info-bg)" },
  reviewing: { label: "対応中",   tokenVar: "var(--status-warn-bg)" },
  resolved:  { label: "承認済",   tokenVar: "var(--status-success-bg)" },
  rejected:  { label: "却下",     tokenVar: "var(--status-danger-bg)" },
  dlq:       { label: "DLQ",     tokenVar: "var(--status-neutral-bg)" },
};
```

`tokens.css` には `--status-info-bg` 等を OKLch で既存 palette から派生定義する。HEX 直書き禁止。

## 4.6 JSDoc 文面案（TagsQueueResolveDrawer）

```
/**
 * Tag assignment queue の resolve drawer。
 *
 * 不変条件 #13: tag 書き込みは tagQueueResolve workflow 経由のみ。
 * 本 component の mutation は POST /admin/tags/queue/:queueId/resolve に限定し、
 * `tagQueueResolveBodySchema` で client / server 双方検証する。
 */
```
