import * as me from "./me.mjs";
import * as pub from "./public.mjs";
import * as admin from "./admin.mjs";
import * as identityConflicts from "./identity-conflicts.mjs";

export const schemas = {
  ...me,
  ...pub,
  ...admin,
  ...identityConflicts,
};

export { fixtures } from "./fixtures.mjs";
