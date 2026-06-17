export interface AuditGlossaryEntry {
  readonly term: string;
  readonly plain: string;
  readonly technical: string;
}

export const AUDIT_GLOSSARY: readonly AuditGlossaryEntry[] = [
  {
    term: "action",
    plain: "どんな操作をしたか（操作の種類）",
    technical: "action",
  },
  {
    term: "actor",
    plain: "操作した人（実行者）",
    technical: "actorEmail",
  },
  {
    term: "target",
    plain: "操作の対象（誰の・どのデータ）",
    technical: "targetType / targetId",
  },
  {
    term: "batchId",
    plain: "一括処理をまとめる目印（同じ作業の塊）",
    technical: "batchId",
  },
  {
    term: "PII",
    plain: "個人情報は自動で伏せ字になります",
    technical: "PII redaction",
  },
];

export const AUDIT_ACTION_PRESETS = [
  "attendance.add",
  "attendance.remove",
  "identity.merge",
  "identity.dismiss",
  "admin.member.tag_assigned",
  "admin.member.tag_unassigned",
  "admin.member.status_updated",
  "admin.tag.created",
  "admin.request.approve",
  "admin.meeting.created",
] as const;

export const AUDIT_TARGET_TYPE_PRESETS = [
  "meeting",
  "member",
  "admin_member_note",
  "tag",
] as const;

export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  "attendance.add": "出席を追加",
  "attendance.remove": "出席を取り消し",
  "identity.merge": "会員の名寄せ（統合）",
  "identity.dismiss": "名寄せ候補を却下",
  "admin.member.tag_assigned": "タグを割り当て",
  "admin.member.tag_unassigned": "タグを解除",
  "admin.member.status_updated": "会員ステータスを更新",
  "admin.tag.created": "タグを作成",
  "admin.request.approve": "申請を承認",
  "admin.meeting.created": "開催日を作成",
};

export const AUDIT_TARGET_TYPE_LABELS: Readonly<Record<string, string>> = {
  meeting: "開催日",
  member: "会員",
  admin_member_note: "管理メモ",
  tag: "タグ",
};

export const AUDIT_FIELD_LABELS: Readonly<Record<string, string>> = {
  action: "操作の種類",
  actorEmail: "実行者（メール）",
  targetType: "対象の種類",
  targetId: "対象ID",
  from: "期間（開始）",
  to: "期間（終了）",
  batchId: "一括処理ID",
  limit: "表示件数",
};

export const describeAuditAction = (code: string): string => AUDIT_ACTION_LABELS[code] ?? code;

export const describeAuditTargetType = (code: string | null): string =>
  code == null ? "—" : (AUDIT_TARGET_TYPE_LABELS[code] ?? code);

export const describeAuditField = (key: string): string => AUDIT_FIELD_LABELS[key] ?? key;
