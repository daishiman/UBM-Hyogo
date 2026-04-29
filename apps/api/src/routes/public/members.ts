// GET /public/members handler (04a)
// Cache-Control: no-store (admin の publishState 変更を即時反映するため)

import { Hono } from "hono";

import { ctx } from "../../repository/_shared/db";
import { parsePublicMemberQuery } from "../../_shared/search-query-parser";
import { listPublicMembersUseCase } from "../../use-cases/public/list-public-members";

export interface MembersEnv {
  DB: import("../../repository/_shared/db").D1Db;
}

export const membersRoute = (
  app: Hono<{ Bindings: MembersEnv }>,
): Hono<{ Bindings: MembersEnv }> => {
  app.get("/members", async (c) => {
    const url = new URL(c.req.url);
    const raw: Record<string, string | string[]> = {};
    for (const key of url.searchParams.keys()) {
      const all = url.searchParams.getAll(key);
      raw[key] = all.length > 1 ? all : (all[0] ?? "");
    }
    const query = parsePublicMemberQuery(raw);
    const result = await listPublicMembersUseCase(query, {
      ctx: ctx({ DB: c.env.DB }),
    });
    c.header("Cache-Control", "no-store");
    return c.json(result, 200);
  });
  return app;
};
