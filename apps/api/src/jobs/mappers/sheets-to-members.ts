// UT-09: Sheets row → D1 member_responses 行 への mapping。
// Sheets schema をコードに固定しない方針 (不変条件 #1) のため、ヘッダ行から index を構築する。

import { STABLE_KEY } from "@ubm-hyogo/shared";

export interface MemberRow {
  responseId: string;
  responseEmail: string;
  submittedAt: string;
  fullName: string | null;
  nickname: string | null;
  location: string | null;
  birthDate: string | null;
  occupation: string | null;
  hometown: string | null;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  ubmJoinDate: string | null;
  businessOverview: string | null;
  skills: string | null;
  challenges: string | null;
  canProvide: string | null;
  hobbies: string | null;
  recentInterest: string | null;
  motto: string | null;
  otherActivities: string | null;
  urlWebsite: string | null;
  urlFacebook: string | null;
  urlInstagram: string | null;
  urlThreads: string | null;
  urlYoutube: string | null;
  urlTiktok: string | null;
  urlX: string | null;
  urlBlog: string | null;
  urlNote: string | null;
  urlLinkedin: string | null;
  urlOthers: string | null;
  selfIntroduction: string | null;
  publicConsent: "consented" | "declined" | "unknown";
  rulesConsent: "consented" | "declined" | "unknown";
  extraFieldsJson: string | null;
  unmappedQuestionIdsJson: string | null;
}

const DB_FIELD_MAP: Record<string, keyof MemberRow> = {
  "タイムスタンプ": "submittedAt",
  "メールアドレス": "responseEmail",
  "氏名": STABLE_KEY.fullName,
  "ニックネーム": STABLE_KEY.nickname,
  "所在地": STABLE_KEY.location,
  "生年月日": STABLE_KEY.birthDate,
  "職業": STABLE_KEY.occupation,
  "出身地": STABLE_KEY.hometown,
  "UBMゾーン": STABLE_KEY.ubmZone,
  "UBM会員種別": STABLE_KEY.ubmMembershipType,
  "UBM入会日": STABLE_KEY.ubmJoinDate,
  "事業概要": STABLE_KEY.businessOverview,
  "強み・スキル": STABLE_KEY.skills,
  "課題": STABLE_KEY.challenges,
  "提供できること": STABLE_KEY.canProvide,
  "趣味": STABLE_KEY.hobbies,
  "最近の関心": STABLE_KEY.recentInterest,
  "座右の銘": STABLE_KEY.motto,
  "その他の活動": STABLE_KEY.otherActivities,
  "Webサイト": STABLE_KEY.urlWebsite,
  "Facebook": STABLE_KEY.urlFacebook,
  "Instagram": STABLE_KEY.urlInstagram,
  "Threads": STABLE_KEY.urlThreads,
  "YouTube": STABLE_KEY.urlYoutube,
  "TikTok": STABLE_KEY.urlTiktok,
  "X": STABLE_KEY.urlX,
  "ブログ": STABLE_KEY.urlBlog,
  "note": STABLE_KEY.urlNote,
  "LinkedIn": STABLE_KEY.urlLinkedin,
  "その他URL": STABLE_KEY.urlOthers,
  "自己紹介": STABLE_KEY.selfIntroduction,
  "公開同意": STABLE_KEY.publicConsent,
  "規約同意": STABLE_KEY.rulesConsent,
};

const CONSENT_MAP: Record<string, "consented" | "declined" | "unknown"> = {
  "はい": "consented",
  "同意する": "consented",
  "yes": "consented",
  "true": "consented",
  "いいえ": "declined",
  "同意しない": "declined",
  "no": "declined",
  "false": "declined",
};

export interface MapResult {
  readonly rows: MemberRow[];
  readonly skipped: Array<{ rowIndex: number; reason: string }>;
}

export function mapSheetRows(values: string[][]): MapResult {
  if (values.length === 0) return { rows: [], skipped: [] };
  const [header, ...body] = values;
  const indexMap: Array<{ idx: number; key: keyof MemberRow | null; raw: string }> =
    header.map((raw, idx) => ({
      idx,
      raw,
      key: DB_FIELD_MAP[raw.trim()] ?? null,
    }));

  const rows: MemberRow[] = [];
  const skipped: Array<{ rowIndex: number; reason: string }> = [];

  body.forEach((row, i) => {
    const rowIndex = i + 2; // header は 1 行目
    const submittedAtIdx = indexMap.find((c) => c.key === "submittedAt");
    const emailIdx = indexMap.find((c) => c.key === "responseEmail");
    const submittedAt = submittedAtIdx ? row[submittedAtIdx.idx] : undefined;
    const responseEmail = emailIdx ? row[emailIdx.idx] : undefined;

    if (!submittedAt || !responseEmail) {
      skipped.push({ rowIndex, reason: "missing submittedAt or responseEmail" });
      return;
    }

    const responseId = `${submittedAt}__${responseEmail}`.toLowerCase();
    const extra: Record<string, string> = {};
    const unmapped: string[] = [];

    const partial: Partial<MemberRow> = {
      responseId,
      responseEmail,
      submittedAt,
      publicConsent: "unknown",
      rulesConsent: "unknown",
    };

    indexMap.forEach((col) => {
      const value = row[col.idx];
      if (value === undefined || value === null || value === "") return;
      if (!col.key) {
        extra[col.raw] = value;
        unmapped.push(col.raw);
        return;
      }
      if (col.key === STABLE_KEY.publicConsent || col.key === STABLE_KEY.rulesConsent) {
        partial[col.key] = CONSENT_MAP[value.trim().toLowerCase()] ?? "unknown";
      } else if (col.key !== "responseId") {
        (partial as Record<string, string>)[col.key] = value;
      }
    });

    rows.push(fillNulls(partial as MemberRow, extra, unmapped));
  });

  return { rows, skipped };
}

function fillNulls(
  partial: MemberRow,
  extra: Record<string, string>,
  unmapped: string[],
): MemberRow {
  const keys: (keyof MemberRow)[] = [
    STABLE_KEY.fullName,
    STABLE_KEY.nickname,
    STABLE_KEY.location,
    STABLE_KEY.birthDate,
    STABLE_KEY.occupation,
    STABLE_KEY.hometown,
    STABLE_KEY.ubmZone,
    STABLE_KEY.ubmMembershipType,
    STABLE_KEY.ubmJoinDate,
    STABLE_KEY.businessOverview,
    STABLE_KEY.skills,
    STABLE_KEY.challenges,
    STABLE_KEY.canProvide,
    STABLE_KEY.hobbies,
    STABLE_KEY.recentInterest,
    STABLE_KEY.motto,
    STABLE_KEY.otherActivities,
    STABLE_KEY.urlWebsite,
    STABLE_KEY.urlFacebook,
    STABLE_KEY.urlInstagram,
    STABLE_KEY.urlThreads,
    STABLE_KEY.urlYoutube,
    STABLE_KEY.urlTiktok,
    STABLE_KEY.urlX,
    STABLE_KEY.urlBlog,
    STABLE_KEY.urlNote,
    STABLE_KEY.urlLinkedin,
    STABLE_KEY.urlOthers,
    STABLE_KEY.selfIntroduction,
  ];
  const out = { ...partial } as unknown as Record<string, unknown>;
  for (const k of keys) {
    if (out[k as string] === undefined) {
      out[k as string] = null;
    }
  }
  out.extraFieldsJson =
    Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;
  out.unmappedQuestionIdsJson =
    unmapped.length > 0 ? JSON.stringify(unmapped) : null;
  return out as unknown as MemberRow;
}
