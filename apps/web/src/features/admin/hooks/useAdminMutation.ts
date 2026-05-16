"use client";

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

/**
 * Admin 用 mutation hook の型シグネチャ宣言。
 * 実装本体は serial-05/step-01 で投入する。
 *
 * 非機能要件（step-01 実装時の契約）:
 *  - 競合 fetch 防止: 連続 mutate() 呼び出し時は AbortController で前リクエストを cancel するか、
 *    isPending=true の間は新規 mutate() を no-op として扱う in-flight guard を実装すること。
 *  - error は ErrorBoundary (admin/error.tsx) で補足可能な Error インスタンスで throw すること。
 *  - toastMessage は React children として render されることを前提に、HTML を含めないこと。
 *  - mutation は apps/web/src/lib/admin/api.ts が公開する named helper に限定し、
 *    任意 endpoint string は受け取らないこと。
 *  - API error response は `{ error: string }` / `{ ok: false, error: string }` の両形を parse し
 *    Error.message に転記すること（Phase 1 AC-7 / Phase 5 T6 inventory に基づく契約）。
 */
export function useAdminMutation(
  mutation: AdminMutationKind,
  options?: AdminMutationOptions,
): AdminMutationResult {
  void mutation;
  void options;
  throw new Error("implementation in step-01");
}
