import type { ConsentStatus, SheetRow } from "./types";

// Sheets 列インデックス（0 始まり）
// [0] タイムスタンプ, [1] メールアドレス（system field 不変条件 3）, [2..] Form 回答
const COL = {
  TIMESTAMP: 0,
  EMAIL: 1,
  FULL_NAME: 2,
  NICKNAME: 3,
  LOCATION: 4,
  BIRTH_DATE: 5,
  OCCUPATION: 6,
  HOMETOWN: 7,
  UBM_ZONE: 8,
  UBM_MEMBERSHIP_TYPE: 9,
  UBM_JOIN_DATE: 10,
  BUSINESS_OVERVIEW: 11,
  SKILLS: 12,
  CHALLENGES: 13,
  CAN_PROVIDE: 14,
  HOBBIES: 15,
  RECENT_INTEREST: 16,
  MOTTO: 17,
  OTHER_ACTIVITIES: 18,
  URL_WEBSITE: 19,
  URL_FACEBOOK: 20,
  URL_INSTAGRAM: 21,
  URL_THREADS: 22,
  URL_YOUTUBE: 23,
  URL_TIKTOK: 24,
  URL_X: 25,
  URL_BLOG: 26,
  URL_NOTE: 27,
  URL_LINKEDIN: 28,
  URL_OTHERS: 29,
  SELF_INTRODUCTION: 30,
  PUBLIC_CONSENT: 31, // 不変条件 2
  RULES_CONSENT: 32,  // 不変条件 2
} as const;

function normalizeConsent(value: string | undefined): ConsentStatus {
  if (!value) return "unknown";
  const v = value.trim().toLowerCase();
  if (v.includes("同意") || v === "yes" || v === "true" || v === "consented") return "consented";
  if (v.includes("同意しない") || v === "no" || v === "false" || v === "declined") return "declined";
  return "unknown";
}

function cell(row: string[], idx: number): string | undefined {
  const v = row[idx];
  return v !== undefined && v !== "" ? v : undefined;
}

export function mapRowToSheetRow(raw: string[]): SheetRow {
  return {
    responseEmail: raw[COL.EMAIL] ?? "",        // 不変条件 3: system field
    submittedAt: raw[COL.TIMESTAMP] ?? "",
    fullName: cell(raw, COL.FULL_NAME),
    nickname: cell(raw, COL.NICKNAME),
    location: cell(raw, COL.LOCATION),
    birthDate: cell(raw, COL.BIRTH_DATE),
    occupation: cell(raw, COL.OCCUPATION),
    hometown: cell(raw, COL.HOMETOWN),
    ubmZone: cell(raw, COL.UBM_ZONE),
    ubmMembershipType: cell(raw, COL.UBM_MEMBERSHIP_TYPE),
    ubmJoinDate: cell(raw, COL.UBM_JOIN_DATE),
    businessOverview: cell(raw, COL.BUSINESS_OVERVIEW),
    skills: cell(raw, COL.SKILLS),
    challenges: cell(raw, COL.CHALLENGES),
    canProvide: cell(raw, COL.CAN_PROVIDE),
    hobbies: cell(raw, COL.HOBBIES),
    recentInterest: cell(raw, COL.RECENT_INTEREST),
    motto: cell(raw, COL.MOTTO),
    otherActivities: cell(raw, COL.OTHER_ACTIVITIES),
    urlWebsite: cell(raw, COL.URL_WEBSITE),
    urlFacebook: cell(raw, COL.URL_FACEBOOK),
    urlInstagram: cell(raw, COL.URL_INSTAGRAM),
    urlThreads: cell(raw, COL.URL_THREADS),
    urlYoutube: cell(raw, COL.URL_YOUTUBE),
    urlTiktok: cell(raw, COL.URL_TIKTOK),
    urlX: cell(raw, COL.URL_X),
    urlBlog: cell(raw, COL.URL_BLOG),
    urlNote: cell(raw, COL.URL_NOTE),
    urlLinkedin: cell(raw, COL.URL_LINKEDIN),
    urlOthers: cell(raw, COL.URL_OTHERS),
    selfIntroduction: cell(raw, COL.SELF_INTRODUCTION),
    publicConsent: normalizeConsent(cell(raw, COL.PUBLIC_CONSENT)),
    rulesConsent: normalizeConsent(cell(raw, COL.RULES_CONSENT)),
  };
}

// responseId = email + submittedAt のハッシュで冪等キー生成（不変条件 7）
export async function generateResponseId(email: string, submittedAt: string): Promise<string> {
  const data = new TextEncoder().encode(`${email}::${submittedAt}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
