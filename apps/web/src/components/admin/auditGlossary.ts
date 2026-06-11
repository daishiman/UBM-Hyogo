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
