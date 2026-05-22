// GET /public/members/:memberId handler (04a)
// 不適格なら 404 (AC-4)、Cache-Control: no-store。

import { Hono } from "hono";

import { ctx } from "../../repository/_shared/db";
import {
  attendanceProviderMiddleware,
  type RepositoryProviderVariables,
} from "../../middleware/repository-providers";
import { getPublicMemberProfileUseCase } from "../../use-cases/public/get-public-member-profile";

export interface MemberProfileEnv {
  DB: D1Database;
}

export const memberProfileRoute = (
  app: Hono<{
    Bindings: MemberProfileEnv;
    Variables: RepositoryProviderVariables;
  }>,
): Hono<{
  Bindings: MemberProfileEnv;
  Variables: RepositoryProviderVariables;
}> => {
  app.use("/members/:memberId", attendanceProviderMiddleware);
  app.get("/members/:memberId", async (c) => {
    const memberId = c.req.param("memberId");
    const result = await getPublicMemberProfileUseCase(memberId, {
      ctx: {
        ...ctx({ DB: c.env.DB }),
        var: { attendanceProvider: c.var.attendanceProvider },
      },
    });
    c.header("Cache-Control", "no-store");
    return c.json(result, 200);
  });
  return app;
};
