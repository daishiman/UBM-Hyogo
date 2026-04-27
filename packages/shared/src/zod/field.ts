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
