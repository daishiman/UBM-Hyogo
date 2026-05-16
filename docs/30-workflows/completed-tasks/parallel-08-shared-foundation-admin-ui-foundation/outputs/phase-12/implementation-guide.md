# Implementation Guide

## Part 1: 中学生レベル

管理画面は、学校の職員室のように、いろいろな先生が同じ道具を使って仕事をします。連絡メモを出す場所、失敗したときにやり直す場所、入ってよい人かを見る係がばらばらだと、同じ作業でも人によってやり方が変わってしまいます。

このタスクでは、管理画面で共通に使う土台を先にそろえます。小さい通知を出す箱を画面全体で使えるようにし、あとで「保存」「承認」「却下」などの変更を行うための共通の呼び出し口を作ります。中身の本格実装は次の作業で入れますが、名前と置き場所を先に決めることで、後続の作業が同じ入口を使えます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| ToastProvider | 小さい通知を出すための箱 |
| hook | 画面部品から使える共通の道具 |
| skeleton | 中身はまだ少ない仮の骨組み |
| barrel export | 道具箱の入口を一つにまとめること |
| middleware | 入ってよい人か先に見る係 |

## Part 2: 技術者レベル

### Changed files

| Path | Role |
| --- | --- |
| `apps/web/app/layout.tsx` | Root layout wraps children with `ToastProvider`. |
| `apps/web/src/components/ui/Toast.tsx` | `ToastContext.Provider` value is stabilized with `useMemo`. |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | Defines `AdminMutationOptions`, `AdminMutationResult`, and sentinel `useAdminMutation`. |
| `apps/web/src/features/admin/hooks/index.ts` | Re-exports the admin hook contract. |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | Verifies signature, sentinel throw, and barrel export. |
| `apps/web/src/__tests__/static-invariants.runtime.spec.ts` | Pins root `ToastProvider` placement under `<body>`. |
| `apps/web/src/components/ui/__tests__/primitives.component.spec.tsx` | Verifies toast trigger, auto-dismiss, and provider boundary. |

### TypeScript contract

```ts
export interface AdminMutationOptions {
  readonly onSuccess?: (data: unknown) => void;
  readonly onError?: (error: Error) => void;
  readonly toastMessage?: string;
}

export interface AdminMutationResult {
  readonly mutate: (payload: unknown) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

export type AdminMutationKind =
  | "patchMemberStatus"
  | "postMemberNote"
  | "patchMemberNote"
  | "deleteMember"
  | "restoreMember"
  | "resolveTagQueue"
  | "postSchemaAlias"
  | "resolveAdminRequest"
  | "createMeeting"
  | "updateMeeting"
  | "addAttendance"
  | "removeAttendance";

export function useAdminMutation(
  mutation: AdminMutationKind,
  options?: AdminMutationOptions,
): AdminMutationResult;
```

The current implementation intentionally throws `Error("implementation in step-01")`. Serial-05 step-01 owns the fetch, AbortController or in-flight guard, toast, and error propagation implementation. The first argument is restricted to existing `apps/web/src/lib/admin/api.ts` helper names rather than arbitrary endpoint strings, so the hook cannot become a generic UI-side escape hatch for unsupported admin mutations.

### API error boundary

Current API routes include both `{ error: string }` and `{ ok: false, error: string }` response shapes. This workflow records that inventory and requires serial-05 step-01 to normalize both into an `Error` instance.
