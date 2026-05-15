# Implementation Guide — serial-05-step-01-members-note-mutation-ui

## Part 1: 中学生レベル

学校の文化祭で、みんなが同じ受付ノートに連絡を書くとします。書き方が人によって違うと、あとから見直す人が困ります。そこで、最初に「この紙にはこう書く」「書いたら先生に知らせる」という決まりを作ります。

このタスクの `useAdminMutation` は、その「書き方の決まり」です。管理画面でメモを保存したり、あとで別の管理画面が変更を保存したりするときに、同じ方法で送信し、成功したら画面を更新し、失敗したら理由を表示します。

### 用語の言い換え

| 用語 | 日常語の言い換え |
| --- | --- |
| hook | 何度も使う手順セット |
| mutation | 保存や変更の操作 |
| endpoint | 送信先の受付窓口 |
| toast | 画面に少しだけ出るお知らせ |
| router.refresh | 最新の内容をもう一度読み直す操作 |

## Part 2: 技術者レベル

### Owner Boundary

| Surface | Owner | Rule |
| --- | --- | --- |
| ToastProvider / ErrorBoundary / route guard | `parallel-08-shared-foundation` | serial-05/step-01 着手前に completed |
| `useAdminMutation.ts` / `hooks/index.ts` | `serial-05-step-01-members-note-mutation-ui` | create owner。parallel-08 は実体作成しない |
| 401/403 error class | `parallel-10-auth-session-handling` | serial-05/step-01 着手前に completed |

### TypeScript Contract

```ts
export interface UseAdminMutationOptions<T> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T>;
```

### API Usage

```ts
const { trigger, isLoading } = useAdminMutation(
  `/api/admin/members/${memberId}/notes`,
  "POST",
  { onSuccess: onSaved },
);

await trigger({ body });
```

### Error Handling

- 2xx: parse JSON, call `onSuccess`, call `router.refresh`, show success toast.
- 4xx/5xx: parse `message ?? error`, call `onError`, show error toast.
- 401/403: use the shared `apps/web/src/lib/fetch/errors.ts` `FetchAuthedError`; do not create a task-local replacement class.
- Concurrent submit: `isLoading` prevents duplicate trigger.

### Screenshot Evidence

Local mock visual screenshots are stored in `outputs/phase-11/`:

- `ss-01-notes-initial.png`
- `ss-02-noteform-new.png`
- `ss-03-noteform-edit.png`
- `ss-04-saving-state.png`
- `ss-05-success-toast.png`
- `ss-06-validation-error.png`

### Configuration

| Parameter | Value |
| --- | --- |
| body length | 1-2000 chars |
| allowed methods | `POST`, `PATCH`, `PUT` |
| import path for downstream | `@/features/admin/hooks` |
| verification commands | `pnpm --filter @ubm-hyogo/web test -- <spec>` / `pnpm typecheck` / `pnpm lint` / `pnpm verify:tokens` / `bash scripts/coverage-guard.sh` |
