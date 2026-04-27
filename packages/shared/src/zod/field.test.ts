import { describe, expect, it } from "vitest";

import { FieldByStableKeyZ, STABLE_KEY_LIST } from "./field";

describe("zod field schemas — 31 stableKeys (AC-3 / 不変条件 #1)", () => {
  it("declares exactly 31 stableKeys", () => {
    expect(STABLE_KEY_LIST).toHaveLength(31);
  });

  const validFixtures: Record<string, unknown> = {
    fullName: "山田 太郎",
    nickname: "たろちゃん",
    location: "兵庫県神戸市",
    birthDate: "1990-04-01",
    occupation: "エンジニア",
    hometown: "神戸",
    ubmZone: "0_to_1",
    ubmMembershipType: "member",
    ubmJoinDate: "2024-01",
    businessOverview: "Webサービスを開発しています。",
    skills: "TypeScript / Cloudflare Workers",
    challenges: "売上を伸ばしたい",
    canProvide: "技術アドバイス",
    hobbies: "登山",
    recentInterest: "AI",
    motto: "凡事徹底",
    otherActivities: "地域コミュニティ運営",
    urlWebsite: "https://example.com",
    urlFacebook: "https://facebook.com/u",
    urlInstagram: "https://instagram.com/u",
    urlThreads: "https://threads.net/u",
    urlYoutube: "https://youtube.com/@u",
    urlTiktok: "https://tiktok.com/@u",
    urlX: "https://x.com/u",
    urlBlog: "https://blog.example.com",
    urlNote: "https://note.com/u",
    urlLinkedin: "https://linkedin.com/in/u",
    urlOthers: "上記以外のSNS情報",
    selfIntroduction: "よろしくお願いします。",
    publicConsent: "consented",
    rulesConsent: "consented",
  };

  it.each(STABLE_KEY_LIST)("PASS valid fixture for %s", (key) => {
    const schema = FieldByStableKeyZ[key];
    expect(schema.parse(validFixtures[key])).toBeDefined();
  });

  const invalidFixtures: Record<string, unknown> = {
    fullName: "",
    nickname: "",
    location: "",
    birthDate: "",
    occupation: "",
    hometown: "",
    ubmZone: "unknown_zone",
    ubmMembershipType: "ghost",
    ubmJoinDate: "",
    businessOverview: "",
    skills: "",
    challenges: "",
    canProvide: "",
    hobbies: "",
    recentInterest: "",
    motto: "",
    otherActivities: "",
    urlWebsite: "not-a-url",
    urlFacebook: "not-a-url",
    urlInstagram: "not-a-url",
    urlThreads: "not-a-url",
    urlYoutube: "not-a-url",
    urlTiktok: "not-a-url",
    urlX: "not-a-url",
    urlBlog: "not-a-url",
    urlNote: "not-a-url",
    urlLinkedin: "not-a-url",
    urlOthers: "",
    selfIntroduction: "",
    publicConsent: "maybe",
    rulesConsent: "maybe",
  };

  it.each(STABLE_KEY_LIST)("FAIL invalid fixture for %s", (key) => {
    const schema = FieldByStableKeyZ[key];
    expect(schema.safeParse(invalidFixtures[key]).success).toBe(false);
  });
});
