// publicRouter (04a)
// 4 endpoint を集約。session middleware は適用しない (AC-9 / 不変条件 #5 公開境界)。

import { Hono } from "hono";

import { statsRoute, type StatsEnv } from "./stats";
import { membersRoute, type MembersEnv } from "./members";
import {
  memberProfileRoute,
  type MemberProfileEnv,
} from "./member-profile";
import { formPreviewRoute, type FormPreviewEnv } from "./form-preview";

export type PublicEnv = StatsEnv & MembersEnv & MemberProfileEnv & FormPreviewEnv;

export const createPublicRouter = (): Hono<{ Bindings: PublicEnv }> => {
  const app = new Hono<{ Bindings: PublicEnv }>();
  statsRoute(app);
  membersRoute(app);
  memberProfileRoute(app);
  formPreviewRoute(app);
  return app;
};
