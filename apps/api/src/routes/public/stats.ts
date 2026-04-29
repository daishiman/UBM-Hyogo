// GET /public/stats handler (04a)
// Cache-Control: public, max-age=60 (admin 集計の即時性は 1 分で許容)

import { Hono } from "hono";

import { ctx } from "../../repository/_shared/db";
import { getPublicStats } from "../../use-cases/public/get-public-stats";

export interface StatsEnv {
  DB: import("../../repository/_shared/db").D1Db;
}

export const statsRoute = (
  app: Hono<{ Bindings: StatsEnv }>,
): Hono<{ Bindings: StatsEnv }> => {
  app.get("/stats", async (c) => {
    const result = await getPublicStats({ ctx: ctx({ DB: c.env.DB }) });
    c.header("Cache-Control", "public, max-age=60");
    return c.json(result, 200);
  });
  return app;
};
