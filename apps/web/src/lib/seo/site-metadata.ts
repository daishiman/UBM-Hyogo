import type { Metadata } from "next";

import { getPublicEnv } from "../env";

export const SITE = {
  name: "UBM 兵庫支部会",
  shortName: "UBM Hyogo",
  description:
    "兵庫を拠点に活動する UBM 支部会のメンバーディレクトリと活動紹介",
  ogImagePath: "/opengraph-image",
  locale: "ja_JP",
} as const;

const SITE_URL_MAP: Record<string, string> = {
  production: "https://ubm-hyogo-web.daishimanju.workers.dev",
  staging: "https://ubm-hyogo-web-staging.daishimanju.workers.dev",
  local: "http://localhost:3000",
};

export function getSiteUrl(): URL {
  const env = getPublicEnv();
  return new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
}

export function buildBaseMetadata(): Metadata {
  const base = getSiteUrl();
  const env = getPublicEnv();
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
  ogImage?: string;
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
