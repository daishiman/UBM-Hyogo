import type { MetadataRoute } from "next";

import { getEnv } from "@/lib/env";
import { getSiteUrl } from "@/lib/seo/site-metadata";

export const dynamic = "force-dynamic";

interface PublicMembersResponse {
  items: Array<{ memberId: string; fullName: string }>;
  pagination: { hasNext: boolean };
  generatedAt?: string;
}

async function fetchMemberIds(): Promise<PublicMembersResponse["items"]> {
  const all: PublicMembersResponse["items"] = [];
  try {
    const env = getEnv();
    for (let page = 1; page <= 20; page += 1) {
      const url = `${env.INTERNAL_API_BASE_URL}/public/members?limit=100&page=${page}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return all;
      const json = (await res.json()) as PublicMembersResponse;
      if (Array.isArray(json.items)) all.push(...json.items);
      if (!json.pagination?.hasNext) break;
    }
    return all;
  } catch (e) {
    console.warn("[sitemap] failed to fetch /public/members", e);
    return all;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: new URL("/", base).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: new URL("/members", base).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: new URL("/register", base).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
  const members = await fetchMemberIds();
  const memberEntries: MetadataRoute.Sitemap = members.map((m) => ({
    url: new URL(`/members/${encodeURIComponent(m.memberId)}`, base).toString(),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));
  return [...staticEntries, ...memberEntries];
}
