// admin_users repository（read 中心）
// DDL: apps/api/migrations/0003_auth_support.sql
//   admin_users(admin_id PK, email UNIQUE, display_name, active, created_at)
// 不変条件 #5: D1 アクセスは apps/api 内のみ
import type { DbCtx } from "./_shared/db";
import type { AdminEmail, AdminId } from "./_shared/brand";

export type AdminRole = "owner" | "manager" | "viewer";

export interface AdminUserRow {
  adminId: AdminId;
  email: AdminEmail;
  displayName: string;
  active: boolean;
  createdAt: string;
}

interface RawAdminUserRow {
  adminId: string;
  email: string;
  displayName: string;
  active: number;
  createdAt: string;
}

const toRow = (r: RawAdminUserRow): AdminUserRow => ({
  adminId: r.adminId as AdminId,
  email: r.email as AdminEmail,
  displayName: r.displayName,
  active: r.active === 1,
  createdAt: r.createdAt,
});

export const findByEmail = async (
  c: DbCtx,
  email: AdminEmail,
): Promise<AdminUserRow | null> => {
  const r = await c.db
    .prepare(
      "SELECT admin_id AS adminId, email, display_name AS displayName, active, created_at AS createdAt FROM admin_users WHERE email = ?1 LIMIT 1",
    )
    .bind(email)
    .first<RawAdminUserRow>();
  return r ? toRow(r) : null;
};

export const findById = async (
  c: DbCtx,
  adminId: AdminId,
): Promise<AdminUserRow | null> => {
  const r = await c.db
    .prepare(
      "SELECT admin_id AS adminId, email, display_name AS displayName, active, created_at AS createdAt FROM admin_users WHERE admin_id = ?1 LIMIT 1",
    )
    .bind(adminId)
    .first<RawAdminUserRow>();
  return r ? toRow(r) : null;
};

export const listAll = async (c: DbCtx): Promise<AdminUserRow[]> => {
  const r = await c.db
    .prepare(
      "SELECT admin_id AS adminId, email, display_name AS displayName, active, created_at AS createdAt FROM admin_users ORDER BY created_at ASC",
    )
    .all<RawAdminUserRow>();
  return (r.results ?? []).map(toRow);
};

export const isActiveAdmin = async (
  c: DbCtx,
  email: AdminEmail,
): Promise<boolean> => {
  const r = await findByEmail(c, email);
  return r !== null && r.active;
};
