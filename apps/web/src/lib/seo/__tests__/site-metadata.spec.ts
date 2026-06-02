import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as envMod from "../../env";
import {
  buildBaseMetadata,
  buildMemberOgImageUrl,
  buildPageMetadata,
  getSiteUrl,
  SITE,
} from "../site-metadata";

type PublicEnv = NonNullable<ReturnType<typeof envMod.getPublicEnvSafe>>;

describe("site-metadata", () => {
  let publicEnvSpy: { mockReturnValue: (v: PublicEnv | undefined) => unknown };

  beforeEach(() => {
    publicEnvSpy = vi.spyOn(
      envMod as unknown as { getPublicEnvSafe: () => PublicEnv | undefined },
      "getPublicEnvSafe",
    ) as unknown as { mockReturnValue: (v: PublicEnv | undefined) => unknown };
  });

  afterEach(() => vi.restoreAllMocks());

  describe("getSiteUrl", () => {
    it("returns production URL when ENVIRONMENT=production", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "production",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
        OG_IMAGE_BASE_URL: "https://og.example.com",
      });
      expect(getSiteUrl().toString()).toBe(
        "https://ubm-hyogo-web-production.daishimanju.workers.dev/",
      );
    });

    it("returns staging web URL when ENVIRONMENT=staging", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "staging",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
        OG_IMAGE_BASE_URL: "https://og.example.com",
      });
      expect(getSiteUrl().toString()).toBe(
        "https://ubm-hyogo-web-staging.daishimanju.workers.dev/",
      );
    });

    it("returns localhost for ENVIRONMENT=local", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "local",
        NEXT_PUBLIC_API_BASE_URL: "http://x.example.com",
        OG_IMAGE_BASE_URL: "https://og.example.com",
      });
      expect(getSiteUrl().toString()).toContain("localhost:3000");
    });

    it("returns localhost when public env parsing fails", () => {
      publicEnvSpy.mockReturnValue(undefined);
      expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
    });
  });

  describe("buildBaseMetadata", () => {
    it("sets noindex for non-production", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "staging",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
        OG_IMAGE_BASE_URL: "https://og.example.com",
      });
      const md = buildBaseMetadata();
      expect(md.robots).toEqual({ index: false, follow: false });
      const og = md.openGraph as { siteName?: string };
      expect(og.siteName).toBe(SITE.name);
      const tw = md.twitter as { card?: string };
      expect(tw.card).toBe("summary_large_image");
    });

    it("sets index:true for production", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "production",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
        OG_IMAGE_BASE_URL: "https://og.example.com",
      });
      expect(buildBaseMetadata().robots).toEqual({
        index: true,
        follow: true,
      });
    });

    it("falls back to noindex metadata when public env parsing fails", () => {
      publicEnvSpy.mockReturnValue(undefined);
      expect(() => buildBaseMetadata()).not.toThrow();
      const md = buildBaseMetadata();
      expect(String(md.metadataBase)).toBe("http://localhost:3000/");
      expect(md.robots).toEqual({ index: false, follow: false });
    });
  });

  describe("buildPageMetadata", () => {
    const setLocal = () =>
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "local",
        NEXT_PUBLIC_API_BASE_URL: "http://x.example.com",
        OG_IMAGE_BASE_URL: "https://og.example.com",
      });

    it("includes title and OG image", () => {
      setLocal();
      const md = buildPageMetadata({
        title: "T",
        description: "D",
        path: "/x",
      });
      expect(md.title).toBe("T");
      const og = md.openGraph as { url?: string };
      expect(og.url).toContain("/x");
      const tw = md.twitter as { card?: string };
      expect(tw.card).toBe("summary_large_image");
    });

    it("supports twitterCard override to summary", () => {
      setLocal();
      const md = buildPageMetadata({
        title: "T",
        path: "/x",
        twitterCard: "summary",
      });
      const tw = md.twitter as { card?: string };
      expect(tw.card).toBe("summary");
    });
  });

  describe("buildMemberOgImageUrl", () => {
    it("builds an absolute OG worker member image URL", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "production",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
        OG_IMAGE_BASE_URL: "https://og.example.com/",
      });
      expect(buildMemberOgImageUrl("m 1")).toBe("https://og.example.com/members/m%201");
    });

    it("returns undefined when OG_IMAGE_BASE_URL is not configured", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "production",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
      });
      expect(buildMemberOgImageUrl("m-1")).toBeUndefined();
    });
  });
});
