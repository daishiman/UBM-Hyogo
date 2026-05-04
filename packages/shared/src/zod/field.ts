import { z } from "zod";

import { ConsentStatusZ } from "./primitives";

const text = (max = 200) => z.string().min(1).max(max);
const paragraph = z.string().min(1).max(4000);
const url = z.string().url();
const dateLike = z.string().min(1);

export const UbmZoneZ = z.enum(["0_to_1", "1_to_10", "10_to_100"]);
export const UbmMembershipTypeZ = z.enum(["member", "non_member", "academy"]);

export const FieldByStableKeyZ = {
  // section1: basic_profile
  fullName: text(),
  nickname: text(),
  location: text(),
  birthDate: dateLike,
  occupation: text(),
  hometown: text(),
  // section2: ubm_profile
  ubmZone: UbmZoneZ,
  ubmMembershipType: UbmMembershipTypeZ,
  ubmJoinDate: text(),
  businessOverview: paragraph,
  skills: paragraph,
  challenges: paragraph,
  canProvide: paragraph,
  // section3: personal_profile
  hobbies: text(),
  recentInterest: text(),
  motto: text(),
  otherActivities: paragraph,
  // section4: social_links (10 url + 1 paragraph)
  urlWebsite: url,
  urlFacebook: url,
  urlInstagram: url,
  urlThreads: url,
  urlYoutube: url,
  urlTiktok: url,
  urlX: url,
  urlBlog: url,
  urlNote: url,
  urlLinkedin: url,
  urlOthers: paragraph,
  // section5: message
  selfIntroduction: paragraph,
  // section6: consent
  publicConsent: ConsentStatusZ,
  rulesConsent: ConsentStatusZ,
} as const;

export const STABLE_KEY_LIST = Object.keys(FieldByStableKeyZ) as Array<
  keyof typeof FieldByStableKeyZ
>;

if (STABLE_KEY_LIST.length !== 31) {
  throw new Error(
    `field.ts must declare exactly 31 stableKeys, got ${STABLE_KEY_LIST.length}`,
  );
}

export type StableKeyName = keyof typeof FieldByStableKeyZ;

export type FieldZodMap = typeof FieldByStableKeyZ;

// 正本 stableKey 文字列定数群（不変条件 #1: 二重定義禁止 / 文字列リテラル直書き禁止）。
// 静的検査 scripts/lint-stablekey-literal.mjs により本ファイル外での literal 直書きは禁止される。
// アプリケーションコードは必ず本 const 経由で stableKey 値を参照すること。
export const STABLE_KEY = {
  fullName: "fullName",
  nickname: "nickname",
  location: "location",
  birthDate: "birthDate",
  occupation: "occupation",
  hometown: "hometown",
  ubmZone: "ubmZone",
  ubmMembershipType: "ubmMembershipType",
  ubmJoinDate: "ubmJoinDate",
  businessOverview: "businessOverview",
  skills: "skills",
  challenges: "challenges",
  canProvide: "canProvide",
  hobbies: "hobbies",
  recentInterest: "recentInterest",
  motto: "motto",
  otherActivities: "otherActivities",
  urlWebsite: "urlWebsite",
  urlFacebook: "urlFacebook",
  urlInstagram: "urlInstagram",
  urlThreads: "urlThreads",
  urlYoutube: "urlYoutube",
  urlTiktok: "urlTiktok",
  urlX: "urlX",
  urlBlog: "urlBlog",
  urlNote: "urlNote",
  urlLinkedin: "urlLinkedin",
  urlOthers: "urlOthers",
  selfIntroduction: "selfIntroduction",
  publicConsent: "publicConsent",
  rulesConsent: "rulesConsent",
} as const satisfies { readonly [K in StableKeyName]: K };
