import { STABLE_KEY } from "@ubm-hyogo/shared";

export const TEST_ACCOUNT_ACTOR = "seed:test-accounts";
export const TEST_ACCOUNT_EMAIL_DOMAIN = "test.ubm-hyogo.invalid";
export const TEST_ACCOUNT_PREFIX = "TEST-";

export type PublishState = "public" | "member_only" | "hidden";
export type ConsentState = "consented" | "declined" | "unknown";
export type PhotoSource = "admin" | "self";
export type TestRequestNoteType = "visibility_request" | "delete_request";

export interface TestMemberAccount {
  readonly memberId: `TEST-MEM-${string}`;
  readonly responseId: `TEST-RES-${string}`;
  readonly email: `${string}@${typeof TEST_ACCOUNT_EMAIL_DOMAIN}`;
  readonly fullName: string;
  readonly occupation: string;
  readonly ubmZone: string | null;
  readonly publicConsent: ConsentState;
  readonly rulesConsent: ConsentState;
  readonly publishState: PublishState;
  readonly isDeleted: boolean;
  readonly notificationOptOut: boolean;
  readonly profile?: Readonly<Record<string, string | null>>;
  readonly tags: readonly string[];
  readonly attendance: readonly string[];
  readonly photo?: {
    readonly source: PhotoSource;
    readonly processingStatus: "none" | "completed";
    readonly hasThumb: boolean;
  };
}

export interface TestAdminAccount {
  readonly adminId: `TEST-ADM-${string}`;
  readonly email: `${string}@${typeof TEST_ACCOUNT_EMAIL_DOMAIN}`;
  readonly displayName: string;
  readonly active: boolean;
}

export interface TestMeeting {
  readonly sessionId: `TEST-MTG-${string}`;
  readonly title: string;
  readonly heldOn: string;
}

export interface TestMemberRequest {
  readonly noteId: `TEST-NOTE-${string}`;
  readonly memberId: TestMemberAccount["memberId"];
  readonly noteType: TestRequestNoteType;
  readonly payload: Record<string, unknown>;
  readonly reason: string;
}

export interface TestAccountsCatalog {
  readonly formId: string;
  readonly revisionId: string;
  readonly schemaHash: string;
  readonly submittedAt: string;
  readonly members: readonly TestMemberAccount[];
  readonly admins: readonly TestAdminAccount[];
  readonly meetings: readonly TestMeeting[];
  readonly requests: readonly TestMemberRequest[];
}

const email = (local: string): `${string}@${typeof TEST_ACCOUNT_EMAIL_DOMAIN}` =>
  `${local}@${TEST_ACCOUNT_EMAIL_DOMAIN}`;

export const testAccountsCatalog = {
  formId: "TEST-FORM-ACCOUNTS",
  revisionId: "TEST-REV-ACCOUNTS",
  schemaHash: "TEST-SCHEMA-HASH-ACCOUNTS",
  submittedAt: "2026-06-03T10:30:00.000Z",
  meetings: [
    { sessionId: "TEST-MTG-01", title: "[TEST] 交流会", heldOn: "2026-06-10" },
    { sessionId: "TEST-MTG-02", title: "[TEST] 勉強会", heldOn: "2026-07-10" },
    { sessionId: "TEST-MTG-03", title: "[TEST] 相談会", heldOn: "2026-08-10" },
  ],
  requests: [
    {
      noteId: "TEST-NOTE-V01",
      memberId: "TEST-MEM-01",
      noteType: "visibility_request",
      payload: { desiredState: "hidden" },
      reason: "都合により一時的に掲載を止めたいです",
    },
    {
      noteId: "TEST-NOTE-V02",
      memberId: "TEST-MEM-02",
      noteType: "visibility_request",
      payload: { desiredState: "public" },
      reason: "公開できるようになったので掲載をお願いします",
    },
    {
      noteId: "TEST-NOTE-D01",
      memberId: "TEST-MEM-07",
      noteType: "delete_request",
      payload: {},
      reason: "退会を希望します",
    },
  ],
  admins: [
    {
      adminId: "TEST-ADM-01",
      email: email("test-admin-01"),
      displayName: "[TEST] 管理者 有効1",
      active: true,
    },
    {
      adminId: "TEST-ADM-02",
      email: email("test-admin-02"),
      displayName: "[TEST] 管理者 有効2",
      active: true,
    },
    {
      adminId: "TEST-ADM-03",
      email: email("test-admin-03"),
      displayName: "[TEST] 管理者 無効",
      active: false,
    },
  ],
  members: [
    {
      memberId: "TEST-MEM-01",
      responseId: "TEST-RES-01",
      email: email("test-mem-01"),
      fullName: "[TEST] 公開 ログイン 太郎",
      occupation: "経営者",
      ubmZone: "0_to_1",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: false,
      profile: {
        [STABLE_KEY.nickname]: "test-taro",
        [STABLE_KEY.location]: "兵庫県神戸市中央区",
        [STABLE_KEY.hometown]: "兵庫県明石市",
        [STABLE_KEY.ubmMembershipType]: "member",
        [STABLE_KEY.businessOverview]:
          "神戸を拠点に、中小企業向けの業務改善とWebサービス開発を支援しています。",
        [STABLE_KEY.skills]:
          "TypeScript / Cloudflare Workers / 業務フロー設計 / 生成AI活用",
        [STABLE_KEY.canProvide]:
          "Webアプリの要件整理、業務自動化の壁打ち、地域事業者向けDX相談",
        [STABLE_KEY.hobbies]: "登山、コーヒー、地域イベント巡り",
        [STABLE_KEY.recentInterest]: "地域コミュニティとAI活用",
        [STABLE_KEY.motto]: "小さく試して、早く学ぶ",
        [STABLE_KEY.otherActivities]:
          "商店街の勉強会運営と学生向けプログラミング相談を続けています。",
        [STABLE_KEY.urlWebsite]: "https://example.test/test-mem-01",
        [STABLE_KEY.urlFacebook]: "https://facebook.com/test.mem.01",
        [STABLE_KEY.urlInstagram]: "https://instagram.com/test.mem.01",
        [STABLE_KEY.urlThreads]: "https://threads.net/@test.mem.01",
        [STABLE_KEY.urlYoutube]: "https://youtube.com/@test-mem-01",
        [STABLE_KEY.urlTiktok]: "https://www.tiktok.com/@test.mem.01",
        [STABLE_KEY.urlX]: "https://x.com/test_mem_01",
        [STABLE_KEY.urlBlog]: "https://blog.example.test/test-mem-01",
        [STABLE_KEY.urlNote]: "https://note.com/test_mem_01",
        [STABLE_KEY.urlLinkedin]: "https://www.linkedin.com/in/test-mem-01",
        [STABLE_KEY.urlOthers]: "Podcast: https://podcast.example.test/test-mem-01",
        [STABLE_KEY.selfIntroduction]:
          "UBM兵庫で、地域の事業者同士が実務の知恵を持ち寄れる場を育てたいです。",
      },
      tags: ["tag_b_it", "tag_s_dev", "tag_r_kobe", "tag_ro_owner", "tag_st_active"],
      attendance: ["TEST-MTG-01", "TEST-MTG-02"],
      photo: { source: "admin", processingStatus: "none", hasThumb: false },
    },
    {
      memberId: "TEST-MEM-02",
      responseId: "TEST-RES-02",
      email: email("test-mem-02"),
      fullName: "[TEST] 会員限定 花子",
      occupation: "デザイナー",
      ubmZone: "1_to_10",
      publicConsent: "declined",
      rulesConsent: "consented",
      publishState: "member_only",
      isDeleted: false,
      notificationOptOut: false,
      tags: ["tag_s_design", "tag_i_0to1", "tag_r_nishinomiya"],
      attendance: ["TEST-MTG-01"],
    },
    {
      memberId: "TEST-MEM-03",
      responseId: "TEST-RES-03",
      email: email("test-mem-03"),
      fullName: "[TEST] 公開 複数出席 三郎",
      occupation: "マーケター",
      ubmZone: "10_to_100",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "hidden",
      isDeleted: false,
      notificationOptOut: false,
      tags: ["tag_s_marketing", "tag_i_1to10", "tag_r_himeji", "tag_st_active"],
      attendance: ["TEST-MTG-01", "TEST-MTG-02", "TEST-MTG-03"],
      photo: { source: "admin", processingStatus: "none", hasThumb: false },
    },
    {
      memberId: "TEST-MEM-04",
      responseId: "TEST-RES-04",
      email: email("test-mem-04"),
      fullName: "[TEST] 規約未同意 四郎",
      occupation: "営業",
      ubmZone: "Kobe",
      publicConsent: "consented",
      rulesConsent: "declined",
      publishState: "member_only",
      isDeleted: false,
      notificationOptOut: false,
      tags: ["tag_s_sales", "tag_r_kobe"],
      attendance: [],
    },
    {
      memberId: "TEST-MEM-05",
      responseId: "TEST-RES-05",
      email: email("test-mem-05"),
      fullName: "[TEST] 削除済 五郎",
      occupation: "士業",
      ubmZone: null,
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: true,
      notificationOptOut: false,
      tags: ["tag_s_legal", "tag_st_observer"],
      attendance: ["TEST-MTG-02"],
    },
    {
      memberId: "TEST-MEM-06",
      responseId: "TEST-RES-06",
      email: email("test-mem-06"),
      fullName: "[TEST] 最小公開 六郎",
      occupation: "製造",
      ubmZone: "Awaji",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: false,
      tags: [],
      attendance: [],
    },
    {
      memberId: "TEST-MEM-07",
      responseId: "TEST-RES-07",
      email: email("test-mem-07"),
      fullName: "[TEST] 多タグ 通知停止 七海",
      occupation: "コミュニティ運営",
      ubmZone: "Hanshin",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: true,
      tags: ["tag_b_service", "tag_s_ops", "tag_i_dx", "tag_r_hanshin", "tag_ro_freelance", "tag_st_active"],
      attendance: ["TEST-MTG-01", "TEST-MTG-02", "TEST-MTG-03"],
    },
    {
      memberId: "TEST-MEM-08",
      responseId: "TEST-RES-08",
      email: email("test-mem-08"),
      fullName: "[TEST] 未登録ゲート 八郎",
      occupation: "金融",
      ubmZone: null,
      publicConsent: "unknown",
      rulesConsent: "unknown",
      publishState: "member_only",
      isDeleted: false,
      notificationOptOut: false,
      tags: ["tag_b_finance"],
      attendance: [],
    },
    {
      memberId: "TEST-MEM-09",
      responseId: "TEST-RES-09",
      email: email("test-mem-09"),
      fullName: "[TEST] 本人写真 九美",
      occupation: "人事",
      ubmZone: "Tanba",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: false,
      tags: ["tag_s_hr", "tag_r_tanba", "tag_ro_executive"],
      attendance: ["TEST-MTG-03"],
      photo: { source: "self", processingStatus: "completed", hasThumb: true },
    },
    {
      memberId: "TEST-MEM-10",
      responseId: "TEST-RES-10",
      email: email("test-mem-10"),
      fullName: "[TEST] 山田'太郎😀 長い名前エッジケース",
      occupation: "R&D / セキュリティ",
      ubmZone: "Tajima",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: false,
      tags: ["tag_s_dev", "tag_s_legal", "tag_i_global", "tag_r_tajima"],
      attendance: ["TEST-MTG-02"],
      photo: { source: "admin", processingStatus: "none", hasThumb: false },
    },
  ],
} as const satisfies TestAccountsCatalog;

export const isLoginableTestMember = (member: TestMemberAccount): boolean =>
  member.rulesConsent === "consented" && !member.isDeleted;

export const isPublicListedTestMember = (member: TestMemberAccount): boolean =>
  member.publicConsent === "consented" && member.publishState === "public" && !member.isDeleted;
