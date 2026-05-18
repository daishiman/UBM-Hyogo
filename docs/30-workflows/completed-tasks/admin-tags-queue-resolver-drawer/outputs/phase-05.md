# Phase 5 — 実装手順

各 step は Edit/Write 単位の最小差分。順序厳守。

## Step 1: tokens.css に status semantic token を追加

**file**: `apps/web/src/styles/tokens.css`

既存 palette 変数（`--color-info-500` 等）から `--status-info-bg` / `--status-warn-bg` / `--status-success-bg` / `--status-danger-bg` / `--status-neutral-bg` を OKLch で派生定義。HEX 直書き禁止。

## Step 2: status mapping helper を新規

**file**: `apps/web/src/components/admin/_tagQueueStatus.ts`（新規 Write）

Phase 4.5 の `TAG_QUEUE_STATUS_TOKEN` を export。型は `TagQueueStatus`（`TagQueuePanel` から re-export）。

## Step 3: TagsQueueResolveDrawer を新規実装

**file**: `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx`（新規 Write）

骨子:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
import { tagQueueResolveBodySchema } from "@ubm-hyogo/shared";
import type { TagsQueueResolveDrawerProps, TagQueueResolveResponse } from "./TagsQueueResolveDrawer.types";

export function TagsQueueResolveDrawer({ ... }: TagsQueueResolveDrawerProps) {
  const [action, setAction] = useState<"confirmed" | "rejected">("confirmed");
  const [tagCodes, setTagCodes] = useState<string[]>([...suggestedTags]);
  const [reason, setReason] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { trigger, isLoading } = useAdminMutation<TagQueueResolveResponse>(
    `/api/admin/tags/queue/${encodeURIComponent(queueId)}/resolve`,
    "POST",
    { onSuccess: () => { onResolved?.(queueId); onClose(); } },
  );

  // ESC handler, focus trap, return focus は useEffect で実装
  // submit → safeParse → trigger
}
```

## Step 4: useAdminMutation の successMessage mapper を追加

**file**: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（Edit）

`successMessage?: string | ((data: T) => string)` に拡張し、toast 直前で mapper を評価する。既存 caller の string 指定は変更しない。focused spec `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` に mapper case を追加する。

## Step 5: TagQueuePanel を縮約

**file**: `apps/web/src/components/admin/TagQueuePanel.tsx`（Edit）

- `resolveTagQueue` import / onConfirm / onReject / rejectReason state / busy state を削除
- 各 list item に `<button aria-label="resolve" onClick={() => setDrawerOpen(true)}>` を追加
- 選択 item の review pane を「`<TagsQueueResolveDrawer>` を render」に置き換え
- `data-testid="admin-tag-queue-list"` / `data-testid="admin-tag-review-panel"` の後方互換は維持

## Step 6: TagQueuePanel.component.spec.tsx を更新

**file**: `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx`（Edit）

- `vi.mock("../../../lib/admin/api", ...)` を削除
- 代わりに `vi.mock("../TagsQueueResolveDrawer", () => ({ TagsQueueResolveDrawer: vi.fn(() => null) }))` でモック
- 「mutation confirmed: ...」「mutation rejected: ...」テストは drawer spec に移管

## Step 7: TagsQueueResolveDrawer.spec.tsx を新規

**file**: `apps/web/src/components/admin/__tests__/TagsQueueResolveDrawer.spec.tsx`（新規 Write）

詳細は Phase 6 参照。`useAdminMutation` を `vi.mock` し、trigger 呼び出しと payload を検証。

## Step 8: typecheck / lint / test 実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- TagsQueueResolveDrawer TagQueuePanel --run
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

green を確認してから Phase 6 へ。
