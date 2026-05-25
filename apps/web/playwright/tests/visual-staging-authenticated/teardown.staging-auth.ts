// workflow: issue-901 / Phase 5 §3 / T-04
// Removes the ephemeral storageState directory after the authenticated
// staging-visual run completes. Defense-in-depth on top of CI artifact filtering.

import { rm } from "node:fs/promises";
import { join } from "node:path";
import { test as teardown } from "@playwright/test";

teardown("remove storageState", async () => {
  await rm(join(__dirname, "..", "..", ".auth"), { recursive: true, force: true });
});
