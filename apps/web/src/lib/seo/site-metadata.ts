import type { Metadata } from "next";

import { getPublicEnvSafe, type Env } from "../env";

export const SITE = {
  name: "UBM 兵庫支部会",
  shortName: "UBM Hyogo",
  description:
    "兵庫を拠点に活動する UBM 支部会のメンバーディレクトリと活動紹介",
  ogImagePath: "/og-default.png",
  locale: "ja_JP",
} as const;

const SITE_URL_MAP: Record<string, string> = {
  production: "https://ubm-hyogo-web-production.daishimanju.workers.dev",
  staging: "https://ubm-hyogo-web-staging.daishimanju.workers.dev",
  local: "http://localhost:3000",
};

const DEFAULT_PUBLIC_ENV = {
  ENVIRONMENT: "local",
  // localhost-allow:local-fallback
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:8787",
} as const satisfies Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL">;

function resolvePublicEnv(): Pick<
  Env,
  "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL" | "OG_IMAGE_BASE_URL"
> {
  return getPublicEnvSafe() ?? DEFAULT_PUBLIC_ENV;
}

export function getSiteUrl(): URL {
  const env = resolvePublicEnv();
  return new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
}

export function buildMemberOgImageUrl(memberId: string): string | undefined {
  const base = resolvePublicEnv().OG_IMAGE_BASE_URL?.trim();
  if (!base) return undefined;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}/members/${encodeURIComponent(memberId)}`;
}

export function buildBaseMetadata(): Metadata {
  const base = getSiteUrl();
  const env = resolvePublicEnv();
  return {
    metadataBase: base,
    title: { default: SITE.name, template: `%s | ${SITE.name}` },
    description: SITE.description,
    applicationName: SITE.shortName,
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url: base.toString(),
      title: SITE.name,
      description: SITE.description,
      images: [
        {
          url: SITE.ogImagePath,
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE.name,
      description: SITE.description,
      images: [SITE.ogImagePath],
    },
    robots:
      env.ENVIRONMENT === "production"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export interface PageMetaInput {
  title: string;
  description?: string;
  path: string;
  /** Absolute path or relative path. Relative path is resolved against metadataBase. */
  ogImage?: string | undefined;
  twitterCard?: "summary" | "summary_large_image";
}

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const base = getSiteUrl();
  const url = new URL(input.path, base).toString();
  const description = input.description ?? SITE.description;
  const ogImage = input.ogImage ?? SITE.ogImagePath;
  return {
    title: input.title,
    description,
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url,
      title: input.title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: input.twitterCard ?? "summary_large_image",
      title: input.title,
      description,
      images: [ogImage],
    },
  };
}
