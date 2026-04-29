// GET /public/form-preview handler (04a)
// Cache-Control: public, max-age=60 (schema sync 反映遅延は 1 分まで許容)

import { Hono } from "hono";

import { ctx } from "../../repository/_shared/db";
import {
  getFormPreviewUseCase,
  type GetFormPreviewEnv,
} from "../../use-cases/public/get-form-preview";

export interface FormPreviewEnv extends GetFormPreviewEnv {
  DB: import("../../repository/_shared/db").D1Db;
}

export const formPreviewRoute = (
  app: Hono<{ Bindings: FormPreviewEnv }>,
): Hono<{ Bindings: FormPreviewEnv }> => {
  app.get("/form-preview", async (c) => {
    const result = await getFormPreviewUseCase({
      ctx: ctx({ DB: c.env.DB }),
      env: {
        GOOGLE_FORM_ID: c.env.GOOGLE_FORM_ID,
        FORM_ID: c.env.FORM_ID,
        GOOGLE_FORM_RESPONDER_URL: c.env.GOOGLE_FORM_RESPONDER_URL,
      },
    });
    c.header("Cache-Control", "public, max-age=60");
    return c.json(result, 200);
  });
  return app;
};
