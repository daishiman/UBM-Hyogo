import type { MiddlewareHandler } from "hono";

import type { Env } from "../env";

export const trailingSlashRedirect =
  (): MiddlewareHandler<{ Bindings: Env }> =>
  async (c, next) => {
    if (c.req.method !== "OPTIONS") {
      const url = new URL(c.req.url);
      if (url.pathname !== "/" && url.pathname.endsWith("/")) {
        const normalizedPath = url.pathname.replace(/\/+$/, "");
        return c.redirect(`${normalizedPath}${url.search}`, 308);
      }
    }
    return next();
  };
