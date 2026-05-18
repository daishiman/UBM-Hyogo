import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";
import { getSiteUrl } from "@/lib/seo/site-metadata";

export default function robots(): MetadataRoute.Robots {
  const env = getPublicEnv();
  const base = getSiteUrl();
  if (env.ENVIRONMENT !== "production") {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: new URL("/sitemap.xml", base).toString(),
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/members", "/members/", "/register"],
        disallow: ["/admin", "/admin/", "/profile", "/login", "/api"],
      },
    ],
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.host,
  };
}
