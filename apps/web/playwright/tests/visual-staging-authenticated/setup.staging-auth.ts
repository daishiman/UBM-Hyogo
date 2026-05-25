// workflow: issue-901 / Phase 5 §2 / T-03
// Playwright dedicated setup project: mints member / admin storageState JSON
// for the staging-visual-authenticated project. Runs once per Playwright invocation.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test as setup, expect } from "@playwright/test";
import { mintStagingStorageState } from "../../scripts/mint-staging-storage-state";

const AUTH_DIR = join(__dirname, "..", "..", ".auth");
export const MEMBER_STATE = join(AUTH_DIR, "member.storageState.json");
export const ADMIN_STATE = join(AUTH_DIR, "admin.storageState.json");

setup("mint member storageState", async () => {
  await mintStagingStorageState({ role: "member", out: MEMBER_STATE });
  expect(existsSync(MEMBER_STATE)).toBe(true);
  const json = JSON.parse(readFileSync(MEMBER_STATE, "utf8"));
  expect(json.cookies?.[0]?.name).toBe("authjs.session-token");
});

setup("mint admin storageState", async () => {
  await mintStagingStorageState({ role: "admin", out: ADMIN_STATE });
  expect(existsSync(ADMIN_STATE)).toBe(true);
  const json = JSON.parse(readFileSync(ADMIN_STATE, "utf8"));
  expect(json.cookies?.[0]?.name).toBe("authjs.session-token");
});
