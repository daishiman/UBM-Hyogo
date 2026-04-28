// 02c が正本管理する branded type 定義（02a / 02b も import する）
// 既存 packages/shared/src/branded を再 export しつつ、repository 内専用 brand を追加する
// 不変条件 #5: D1 アクセスは apps/api 内に閉じる
export {
  type MemberId,
  type ResponseId,
  type ResponseEmail,
  type StableKey,
  type SessionId,
  type TagId,
  type AdminId,
  asMemberId,
  asResponseId,
  asResponseEmail,
  asStableKey,
  asSessionId,
  asTagId,
  asAdminId,
} from "@ubm-hyogo/shared";

// repository 専用 brand。@ubm-hyogo/shared 側に未定義のため独自宣言する。
declare const __repoBrand: unique symbol;
type RepoBrand<T, B extends string> = T & { readonly [__repoBrand]: B };

export type AdminEmail = RepoBrand<string, "AdminEmail">;
export type MagicTokenValue = RepoBrand<string, "MagicTokenValue">;
export type AuditAction = RepoBrand<string, "AuditAction">;

export const adminEmail = (s: string): AdminEmail => s as AdminEmail;
export const magicTokenValue = (s: string): MagicTokenValue => s as MagicTokenValue;
export const auditAction = (s: string): AuditAction => s as AuditAction;
