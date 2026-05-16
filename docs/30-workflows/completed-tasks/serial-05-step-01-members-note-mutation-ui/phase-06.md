# Phase 6: 実装

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は T1..T6 を実コードとして `apps/web` 配下に追加・編集する Phase。コード変更が本質。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (リファクタリング) |
| 状態 | pending |

## 目的

Phase 5 計画に従い T1..T7 を実コードに落とす。

## 変更対象ファイル一覧

| 種別 | パス | 種類 |
| --- | --- | --- |
| 新規 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | TS module |
| 新規 | `apps/web/src/features/admin/hooks/index.ts` | barrel |
| 新規 | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | spec |
| 新規 | `apps/web/src/features/admin/components/_members/NoteForm.tsx` | TSX |
| 新規 | `apps/web/src/features/admin/components/_members/__tests__/NoteForm.spec.tsx` | spec |
| 編集 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | TSX |

## 実装手順

### Wave 1: T1 useAdminMutation.ts

```typescript
"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Phase 1 で確定した toast lib

export interface UseAdminMutationOptions<T> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export class FetchAuthedError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "FetchAuthedError";
    this.status = status;
  }
}

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T> {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSubmittingRef = useRef(false);

  const trigger = useCallback(
    async (payload: unknown): Promise<T> => {
      if (isSubmittingRef.current) {
        throw new Error("mutation already in flight");
      }
      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(endpoint, {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        });
        if (res.status === 401 || res.status === 403) {
          throw new FetchAuthedError(res.status, "認証が必要です");
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = body?.message ?? body?.error ?? "サーバーエラー";
          throw new Error(msg);
        }
        const data = (await res.json()) as T;
        await options?.onSuccess?.(data);
        router.refresh();
        toast.success(options?.successMessage ?? "✓ 保存しました");
        return data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        if (!(err instanceof FetchAuthedError)) {
          toast.error(`✗ ${err.message}`);
          options?.onError?.(err);
        }
        throw err;
      } finally {
        isSubmittingRef.current = false;
        setIsLoading(false);
      }
    },
    [endpoint, method, options, router],
  );

  return { trigger, isLoading, error };
}
```

### Wave 2: T2 / T3

**T2** `hooks/index.ts`:
```ts
export { useAdminMutation, FetchAuthedError } from "./useAdminMutation";
export type { UseAdminMutationOptions, UseAdminMutationReturn } from "./useAdminMutation";
```

**T3** `useAdminMutation.spec.ts`: Phase 4 の TC-01..TC-09 を vitest + `@testing-library/react` + `next/navigation` mock で実装。

### Wave 3: T4 NoteForm.tsx

```tsx
"use client";
import { useState } from "react";
import { z } from "zod";
import { useAdminMutation } from "@/features/admin/hooks";

const NoteBodySchema = z.object({ body: z.string().min(1, "本文は必須です").max(2000, "2000文字以内にしてください") });

export interface NoteFormProps {
  readonly memberId: string;
  readonly initialBody?: string;
  readonly noteId?: string;
  readonly onSuccess?: () => void | Promise<void>;
  readonly onCancel?: () => void;
}

export function NoteForm({ memberId, initialBody, noteId, onSuccess, onCancel }: NoteFormProps) {
  const [body, setBody] = useState(initialBody ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEdit = !!noteId;
  const endpoint = isEdit
    ? `/api/admin/members/${memberId}/notes/${noteId}`
    : `/api/admin/members/${memberId}/notes`;
  const method = isEdit ? "PATCH" : "POST";

  const { trigger, isLoading } = useAdminMutation(endpoint, method, {
    onSuccess: async () => { await onSuccess?.(); },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = NoteBodySchema.safeParse({ body });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "入力エラー");
      return;
    }
    setValidationError(null);
    try { await trigger({ body: parsed.data.body }); } catch { /* hook 内で toast 済 */ }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="note-body">本文</label>
      <textarea
        id="note-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-invalid={!!validationError}
        aria-describedby={validationError ? "note-body-error" : undefined}
        disabled={isLoading}
      />
      {validationError && <p id="note-body-error" role="alert">{validationError}</p>}
      <button type="submit" disabled={isLoading}>{isEdit ? "更新" : "追加"}</button>
      <button type="button" onClick={onCancel} disabled={isLoading}>キャンセル</button>
    </form>
  );
}
```

### Wave 4: T5 / T6

**T5** `NoteForm.spec.tsx`: Phase 4 の TC-10..TC-17 を実装。`useAdminMutation` は `vi.mock` で差し替え。

**T6** `MemberDrawer.tsx` 拡張: Phase 2 の JSX snippet を既存 drawer 末尾に追加。`notes` 配列が drawer fetch に含まれない場合は本 Phase で fetch 拡張も実施（Phase 3 で MAJOR 判定済前提）。

### Wave 5: T7 手動動作確認

```bash
mise exec -- pnpm dev
# → http://localhost:3000/admin/members
# → admin login (manjumoto.daishi@senpai-lab.com)
# → member row → drawer → 「メモを追加」→ 本文入力 → 「追加」→ toast 確認
# → drawer リフレッシュ確認
# → note 一覧から編集 → 「更新」→ toast 確認
```

## 検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- useAdminMutation.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test -- NoteForm.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.notes.integration.spec.tsx
mise exec -- pnpm build
bash scripts/coverage-guard.sh
```

## DoD

- [ ] T1..T6 実装完了
- [ ] 全 unit test green
- [ ] `pnpm typecheck` / `pnpm lint` green
- [ ] coverage Statements/Branches/Functions/Lines >=80%
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] design token 違反 0（`pnpm verify:tokens` に合格）
- [ ] T7 動作確認完了

## タスク100%実行確認【必須】

- [ ] 変更対象ファイル 6 件すべて commit-ready
- [ ] PR 作成前に hooks の barrel export から `useAdminMutation` を import できる

## 次Phase

Phase 7 (リファクタリング): 実装後の冗長性・命名・SRP を見直し。
