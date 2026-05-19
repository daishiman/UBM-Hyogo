import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as envMod from "../../env";
import {
  buildBaseMetadata,
  buildPageMetadata,
  getSiteUrl,
  SITE,
} from "../site-metadata";

type PublicEnv = ReturnType<typeof envMod.getPublicEnv>;

describe("site-metadata", () => {
  let publicEnvSpy: { mockReturnValue: (v: PublicEnv) => unknown };

  beforeEach(() => {
    publicEnvSpy = vi.spyOn(
      envMod as unknown as { getPublicEnv: () => PublicEnv },
      "getPublicEnv",
    ) as unknown as { mockReturnValue: (v: PublicEnv) => unknown };
  });

  afterEach(() => vi.restoreAllMocks());

  describe("getSiteUrl", () => {
    it("returns production URL when ENVIRONMENT=production", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "production",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
      });
      expect(getSiteUrl().toString()).toBe(
        "https://ubm-hyogo-web.daishimanju.workers.dev/",
      );
    });

    it("returns staging web URL when ENVIRONMENT=staging", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "staging",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
      });
      expect(getSiteUrl().toString()).toBe(
        "https://ubm-hyogo-web-staging.daishimanju.workers.dev/",
      );
    });

    it("returns localhost for ENVIRONMENT=local", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "local",
        NEXT_PUBLIC_API_BASE_URL: "http://x.example.com",
      });
      expect(getSiteUrl().toString()).toContain("localhost:3000");
    });
  });

  describe("buildBaseMetadata", () => {
    it("sets noindex for non-production", () => {
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "staging",
        NEXT_PUBLIC_API_BASE_URL: "https://x.example.com",
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
      });
      expect(buildBaseMetadata().robots).toEqual({
        index: true,
        follow: true,
      });
    });
  });

  describe("buildPageMetadata", () => {
    const setLocal = () =>
      publicEnvSpy.mockReturnValue({
        ENVIRONMENT: "local",
        NEXT_PUBLIC_API_BASE_URL: "http://x.example.com",
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
});
