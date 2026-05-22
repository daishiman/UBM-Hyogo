# Phase 5: コア実装手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 区分 | 実装 |
| 想定所要 | 0.75 人日 |

## 目的

Phase 1-4 で確定した SSOT / 設計に基づき、コードを実装する。

## 実装手順（順序固定）

### Step 1: `useConfirmDialog.ts` の新規実装

**ファイル**: `apps/web/src/features/admin/hooks/useConfirmDialog.ts`

```typescript
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type ConfirmKind = "approve" | "reject" | "delete" | "remove";

export interface UseConfirmDialogOptions {
  readonly requireNote?: boolean;
  readonly maxNoteLength?: number;
}

export interface UseConfirmDialogState {
  readonly open: boolean;
  readonly kind: ConfirmKind | null;
  readonly note: string;
  readonly submitting: boolean;
  readonly validationError: string | null;
}

export interface UseConfirmDialogReturn extends UseConfirmDialogState {
  readonly context: unknown;
  readonly openConfirm: (kind: ConfirmKind, ctx?: unknown) => void;
  readonly closeConfirm: () => void;
  readonly setNote: (note: string) => void;
  readonly submit: () => Promise<void>;
}

const INITIAL = {
  open: false,
  kind: null as ConfirmKind | null,
  note: "",
  submitting: false,
  validationError: null as string | null,
  context: null as unknown,
};

export function useConfirmDialog(
  onSubmit: (kind: ConfirmKind, note: string, context: unknown) => Promise<void>,
  options: UseConfirmDialogOptions = {},
): UseConfirmDialogReturn {
  const [state, setState] = useState(INITIAL);
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const validate = useCallback(
    (kind: ConfirmKind, note: string): string | null => {
      const requireNote = options.requireNote ?? (kind === "reject");
      if (requireNote && note.trim() === "") {
        return "理由を入力してください";
      }
      const max = options.maxNoteLength ?? 500;
      if (note.length > max) {
        return `${max}文字以内で入力してください`;
      }
      return null;
    },
    [options.requireNote, options.maxNoteLength],
  );

  const openConfirm = useCallback((kind: ConfirmKind, ctx?: unknown) => {
    setState({ ...INITIAL, open: true, kind, context: ctx ?? null });
  }, []);

  const closeConfirm = useCallback(() => {
    setState((s) => (s.submitting ? s : INITIAL));
  }, []);

  const setNote = useCallback((note: string) => {
    setState((s) => ({ ...s, note, validationError: null }));
  }, []);

  const submit = useCallback(async () => {
    const { kind, note, context } = state;
    if (!kind) return;
    const err = validate(kind, note);
    if (err) {
      setState((s) => ({ ...s, validationError: err }));
      return;
    }
    setState((s) => ({ ...s, submitting: true, validationError: null }));
    try {
      await onSubmitRef.current(kind, note, context);
      setState(INITIAL);
    } catch {
      setState((s) => ({ ...s, submitting: false }));
    }
  }, [state, validate]);

  return { ...state, openConfirm, closeConfirm, setNote, submit };
}
```

### Step 2: `ConfirmDialog.tsx` の新規実装

**ファイル**: `apps/web/src/components/ui/ConfirmDialog.tsx`

Phase 3.2 の markup を実装。`useEffect` で ESC key listener を `document` に登録、unmount で cleanup。
styling は既存 token (`var(--ubm-color-surface)`, `var(--ubm-color-danger)` 等) を使用。

### Step 3: hooks `index.ts` への export 追加

**ファイル**: `apps/web/src/features/admin/hooks/index.ts`

`useConfirmDialog` と型を re-export。既存 export を壊さないこと。

### Step 4: `MeetingPanel.tsx` の refactor

**ファイル**: `apps/web/src/components/admin/MeetingPanel.tsx`

差分:
- `useConfirmDialog` import 追加
- `ConfirmDialog` component import 追加
- `confirm` hook instance を `attendanceMutation` / `meetingUpdateMutation` 定義の直後で生成
- `onRemove` と `onSoftDelete` を **openConfirm 呼び出しのみ** に変更
- 実 mutation 実行は `useConfirmDialog` の onSubmit callback 内で行う
- `setAttended` / `setToast` / `router.refresh()` 呼び出しも callback 内へ移動
- JSX 末尾に `<ConfirmDialog ... />` を 1 個追加（kind に応じて title/description 切替）

### Step 5: `MeetingAttendancePanel.tsx` の refactor

**ファイル**: `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`

差分:
- `useAdminMutation` + `AdminMutationError` import 追加
- 生 `fetch` を削除
- `useAdminMutation` instance を作り、`onRegister` 内で `trigger({ memberId, attended: true })`
- endpoint は `/api/admin/meetings/${sessionId}/attendances`、payload は `{ memberId, attended: true }`
- 409 / 422 / 5xx の error 分岐は Phase 2 の error mapping のとおり
- 既存 `data-testid` (`attendance-register`, `attendance-candidate`, `admin-meetings-table`, `toast`) は変更しない

### Step 6: test ファイル追加

Phase 4 の 4 spec ファイル分を実装:
- `apps/web/src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx`
- `apps/web/src/components/ui/__tests__/ConfirmDialog.spec.tsx`
- `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx`（既存にケース追加）
- `apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx`

### Step 7: design token gate 確認

新規 `ConfirmDialog.tsx` / 修正した `MeetingPanel.tsx` に HEX 直書き / `bg-[#xxx]` がないことを
`rg -n '#[0-9a-fA-F]{3,6}' apps/web/src/components/ui/ConfirmDialog.tsx` で確認。

## 実装時の不変条件チェック

| # | 項目 | 確認方法 |
| --- | --- | --- |
| 1 | API path 複数形 alias `/attendances` | `rg -n "/api/admin/meetings/.+/attendance(?!s)" apps/web` が 0 件。`apps/web/src/lib/admin/api.ts` と整合 |
| 2 | 直接 fetch なし | `rg "fetch\(" apps/web/app/\(admin\)/admin/meetings` が 0 件 |
| 3 | legacy `@/lib/useAdminMutation` 参照増加なし | `rg "lib/useAdminMutation"` の件数が増えていない |
| 4 | `*.test.` ファイル無し | `rg --files apps/web | rg "\.test\."` が 0 件 |
| 5 | export shape 維持 | `MeetingPanel`, `filterCandidates`, `MeetingsListView` 等の型/関数 export が変わっていない |

## 完了条件

- [ ] Step 1-7 すべて実装完了
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm test apps/web -- useConfirmDialog ConfirmDialog MeetingPanel MeetingAttendancePanel` green
- [ ] 不変条件チェック 5 項目すべて PASS

## リスク

- `useAdminMutation` の signature 実装が Phase 3 想定と異なる場合は、Phase 3.4 の疑似コードを **実 signature に合わせて修正してから** 実装する。仕様書を後追いで更新せず、Phase 3 を hotfix する。
