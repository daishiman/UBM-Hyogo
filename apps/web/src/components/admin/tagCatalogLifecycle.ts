import { FetchAuthedError } from "../../features/admin/hooks/useAdminMutation";

export type TagLifecycleOperation = "reactivate" | "deactivate" | "physical-delete";

export interface TagDefinitionItem {
  readonly tagId: string;
  readonly code: string;
  readonly label: string;
  readonly category: string;
  readonly active: boolean;
}

export interface TagLifecycleDescriptor {
  readonly operation: TagLifecycleOperation;
  readonly label: string;
  readonly description: string;
  readonly endpoint: (tagId: string) => string;
  readonly method: "POST" | "DELETE";
  readonly destructive: boolean;
}

export const TAG_LIFECYCLE_DESCRIPTORS: Record<
  TagLifecycleOperation,
  TagLifecycleDescriptor
> = {
  reactivate: {
    operation: "reactivate",
    label: "棚に戻す",
    description: "停止中のタグを再び選択肢に戻します。",
    endpoint: (tagId) => `/api/admin/tags/${tagId}/reactivate`,
    method: "POST",
    destructive: false,
  },
  deactivate: {
    operation: "deactivate",
    label: "しまう",
    description: "タグを論理削除し、通常の選択肢から外します。",
    endpoint: (tagId) => `/api/admin/tags/${tagId}`,
    method: "DELETE",
    destructive: false,
  },
  "physical-delete": {
    operation: "physical-delete",
    label: "完全削除",
    description: "タグ定義を物理削除します。使用中のタグは削除できません。",
    endpoint: (tagId) => `/api/admin/tags/${tagId}/physical`,
    method: "DELETE",
    destructive: true,
  },
};

export function statusLabel(active: boolean): string {
  return active ? "有効" : "停止中";
}

export function visibleLifecycleOperations(
  tag: Pick<TagDefinitionItem, "active">,
): readonly TagLifecycleOperation[] {
  return tag.active
    ? ["deactivate", "physical-delete"]
    : ["reactivate", "physical-delete"];
}

export function applyLifecycleSuccess(
  items: readonly TagDefinitionItem[],
  tagId: string,
  operation: TagLifecycleOperation,
  row?: TagDefinitionItem,
): TagDefinitionItem[] {
  if (operation === "physical-delete") {
    return items.filter((item) => item.tagId !== tagId);
  }
  if (row) {
    return items.map((item) => (item.tagId === tagId ? row : item));
  }
  if (operation === "deactivate") {
    return items.map((item) =>
      item.tagId === tagId ? { ...item, active: false } : item,
    );
  }
  return items.map((item) =>
    item.tagId === tagId ? { ...item, active: true } : item,
  );
}

interface TagLifecycleErrorBody {
  readonly error?: unknown;
  readonly referenceCount?: unknown;
}

export function parseTagLifecycleError(
  error: Error,
): { readonly code: string; readonly message: string; readonly referenceCount?: number } {
  if (error instanceof FetchAuthedError) {
    let body: TagLifecycleErrorBody | null = null;
    try {
      body = JSON.parse(error.bodyText) as TagLifecycleErrorBody;
    } catch {
      body = null;
    }
    const code = typeof body?.error === "string" ? body.error : `http_${error.status}`;
    if (code === "tag_has_references") {
      const referenceCount =
        typeof body?.referenceCount === "number" ? body.referenceCount : undefined;
      return {
        code,
        message:
          referenceCount === undefined
            ? "使用中のため削除できません。"
            : `${referenceCount}人に使用中のため削除不可`,
        ...(referenceCount === undefined ? {} : { referenceCount }),
      };
    }
    if (code === "tag_not_found") {
      return { code, message: "対象タグが見つかりません。画面を更新してください。" };
    }
    return { code, message: "タグ操作に失敗しました。" };
  }
  return { code: "unknown", message: error.message || "タグ操作に失敗しました。" };
}
