// 05b: auth use-case test 用の seed helper
import type { InMemoryD1 } from "../../../repository/__tests__/_setup";
import {
  MEMBER_IDENTITY_1,
  MEMBER_IDENTITY_2,
  MEMBER_IDENTITY_DELETED,
  MEMBER_STATUS_CONSENTED,
  MEMBER_STATUS_NOT_CONSENTED,
  MEMBER_STATUS_DELETED,
} from "../../../repository/__fixtures__/members.fixture";
import type { AnyRow } from "../../../repository/__fixtures__/d1mock";

const insert = async (
  env: InMemoryD1,
  table: string,
  row: AnyRow,
): Promise<void> => {
  const cols = Object.keys(row);
  const ph = cols.map((_, i) => `?${i + 1}`).join(",");
  await env.db
    .prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${ph})`)
    .bind(...Object.values(row))
    .run();
};

export const seedValidMember = async (env: InMemoryD1): Promise<void> => {
  await insert(env, "member_identities", MEMBER_IDENTITY_1);
  await insert(env, "member_status", MEMBER_STATUS_CONSENTED);
};

export const seedRulesDeclinedMember = async (env: InMemoryD1): Promise<void> => {
  await insert(env, "member_identities", MEMBER_IDENTITY_2);
  await insert(env, "member_status", MEMBER_STATUS_NOT_CONSENTED);
};

export const seedDeletedMember = async (env: InMemoryD1): Promise<void> => {
  await insert(env, "member_identities", MEMBER_IDENTITY_DELETED);
  await insert(env, "member_status", MEMBER_STATUS_DELETED);
};

export const seedAdminUser = async (
  env: InMemoryD1,
  email: string,
): Promise<void> => {
  await insert(env, "admin_users", {
    admin_id: "ad_001",
    email,
    display_name: "admin",
    active: 1,
    created_at: "2026-01-01T00:00:00Z",
  });
};

export const VALID_EMAIL = "user1@example.com";
export const RULES_DECLINED_EMAIL = "user2@example.com";
export const DELETED_EMAIL = "deleted@example.com";
export const UNKNOWN_EMAIL = "unknown@example.com";
