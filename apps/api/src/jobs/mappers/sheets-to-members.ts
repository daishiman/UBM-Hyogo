// UT-09: Sheets row → D1 member_responses 行 への mapping。
// Sheets schema をコードに固定しない方針 (不変条件 #1) のため、ヘッダ行から index を構築する。

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
  "氏名": "fullName",
  "ニックネーム": "nickname",
  "所在地": "location",
  "生年月日": "birthDate",
  "職業": "occupation",
  "出身地": "hometown",
  "UBMゾーン": "ubmZone",
  "UBM会員種別": "ubmMembershipType",
  "UBM入会日": "ubmJoinDate",
  "事業概要": "businessOverview",
  "強み・スキル": "skills",
  "課題": "challenges",
  "提供できること": "canProvide",
  "趣味": "hobbies",
  "最近の関心": "recentInterest",
  "座右の銘": "motto",
  "その他の活動": "otherActivities",
  "Webサイト": "urlWebsite",
  "Facebook": "urlFacebook",
  "Instagram": "urlInstagram",
  "Threads": "urlThreads",
  "YouTube": "urlYoutube",
  "TikTok": "urlTiktok",
  "X": "urlX",
  "ブログ": "urlBlog",
  "note": "urlNote",
  "LinkedIn": "urlLinkedin",
  "その他URL": "urlOthers",
  "自己紹介": "selfIntroduction",
  "公開同意": "publicConsent",
  "規約同意": "rulesConsent",
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
      if (col.key === "publicConsent" || col.key === "rulesConsent") {
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
    "fullName",
    "nickname",
    "location",
    "birthDate",
    "occupation",
    "hometown",
    "ubmZone",
    "ubmMembershipType",
    "ubmJoinDate",
    "businessOverview",
    "skills",
    "challenges",
    "canProvide",
    "hobbies",
    "recentInterest",
    "motto",
    "otherActivities",
    "urlWebsite",
    "urlFacebook",
    "urlInstagram",
    "urlThreads",
    "urlYoutube",
    "urlTiktok",
    "urlX",
    "urlBlog",
    "urlNote",
    "urlLinkedin",
    "urlOthers",
    "selfIntroduction",
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
