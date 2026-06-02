import { Hono } from "hono";

import { fetchMemberSummary, type OgEnv } from "./member-source";
import { renderDefaultOg, renderMemberOg, renderStaticFallbackOg } from "./render";

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export const app = new Hono<{ Bindings: OgEnv }>();

function withImageHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "image/png");
  headers.set("Cache-Control", CACHE_CONTROL);
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, {
    status: 200,
    headers,
  });
}

async function defaultImageResponse(): Promise<Response> {
  try {
    return withImageHeaders(await renderDefaultOg());
  } catch {
    return withImageHeaders(renderStaticFallbackOg());
  }
}

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "ubm-hyogo-og",
  }),
);

app.get("/members/:id", async (c) => {
  const summary = await fetchMemberSummary(c.req.param("id"), c.env);
  if (!summary) return defaultImageResponse();
  try {
    return withImageHeaders(await renderMemberOg(summary));
  } catch {
    return defaultImageResponse();
  }
});

app.notFound(defaultImageResponse);

export default app;
