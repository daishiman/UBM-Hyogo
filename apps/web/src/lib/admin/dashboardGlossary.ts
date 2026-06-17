// admin-dashboard-jp-clarity: dashboard display labels only. API codes stay unchanged.

export const DASHBOARD_KPI_LABELS = {
  totalMembers: "会員総数",
  publicMembers: "サイト公開中",
  untaggedMembers: "タグ未設定",
  unresolvedSchema: "要対応のフォーム項目",
} as const;

export const MEMBER_STATUS_LABELS: Record<"public" | "member_only" | "hidden", string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "admin.member.status_updated": "会員の公開状態を変更",
  "member.status_updated": "会員の公開状態を変更",
  "admin.member.deleted": "会員を削除",
  "member.deleted": "会員を削除",
  "member.note.created": "会員メモを追加",
  "admin.meeting.created": "開催回を作成",
  "attendance.add": "出席を記録",
  "attendance.import.add": "出席を一括取り込み",
  "attendance.remove": "出席を取り消し",
  "admin.tag.created": "タグを作成",
  "admin.tag.updated": "タグを更新",
  "tag.queue.resolved": "タグ付けキューを解決",
  "admin.tag.queue_resolved": "タグ付けキューを解決",
  "admin.tag.queue_dlq_moved": "タグ付けキューを保留へ移動",
};

export function describeAuditAction(code: string): string {
  return AUDIT_ACTION_LABELS[code] ?? code;
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  member: "会員",
  meeting: "開催回",
  tag: "タグ",
  admin_member_note: "会員メモ",
  schema: "フォーム項目",
};

export function describeTargetType(type: string): string {
  return TARGET_TYPE_LABELS[type] ?? type;
}

export function describeTarget(targetType: string, targetId: string | null): string {
  const label = describeTargetType(targetType);
  return targetId ? `${label} ${targetId}` : label;
}
