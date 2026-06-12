export type IdentityConflictAction = "merge" | "dismiss";

export const IDENTITY_CONFLICT_ANNOUNCEMENTS = {
  merge: "統合しました。一覧から非表示にしました。",
  dismiss: "別人として確定しました。候補を一覧から非表示にしました。",
} as const satisfies Record<IdentityConflictAction, string>;

export function announcementFor(action: IdentityConflictAction): string {
  return IDENTITY_CONFLICT_ANNOUNCEMENTS[action];
}
