import { STABLE_KEY } from "@ubm-hyogo/shared";

export const TEST_ACCOUNT_ACTOR = "seed:test-accounts";
export const TEST_ACCOUNT_EMAIL_DOMAIN = "test.ubm-hyogo.invalid";
export const TEST_ACCOUNT_PREFIX = "TEST-";

export type PublishState = "public" | "member_only" | "hidden";
export type ConsentState = "consented" | "declined" | "unknown";
export type PhotoSource = "admin" | "self";

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

export interface TestAccountsCatalog {
  readonly formId: string;
  readonly revisionId: string;
  readonly schemaHash: string;
  readonly submittedAt: string;
  readonly members: readonly TestMemberAccount[];
  readonly admins: readonly TestAdminAccount[];
  readonly meetings: readonly TestMeeting[];
}

type TestMemberProfile = NonNullable<TestMemberAccount["profile"]>;

const email = (local: string): `${string}@${typeof TEST_ACCOUNT_EMAIL_DOMAIN}` =>
  `${local}@${TEST_ACCOUNT_EMAIL_DOMAIN}`;

const buildSnsUrls = (slug: string): TestMemberProfile => ({
  [STABLE_KEY.urlWebsite]: `https://example.test/${slug}`,
  [STABLE_KEY.urlFacebook]: `https://facebook.com/${slug}`,
  [STABLE_KEY.urlInstagram]: `https://instagram.com/${slug}`,
  [STABLE_KEY.urlThreads]: `https://threads.net/@${slug}`,
  [STABLE_KEY.urlYoutube]: `https://youtube.com/@${slug}`,
  [STABLE_KEY.urlTiktok]: `https://www.tiktok.com/@${slug}`,
  [STABLE_KEY.urlX]: `https://x.com/${slug.replaceAll("-", "_")}`,
  [STABLE_KEY.urlBlog]: `https://blog.example.test/${slug}`,
  [STABLE_KEY.urlNote]: `https://note.com/${slug.replaceAll("-", "_")}`,
  [STABLE_KEY.urlLinkedin]: `https://www.linkedin.com/in/${slug}`,
  [STABLE_KEY.urlOthers]: `Podcast: https://podcast.example.test/${slug}`,
});

const buildProfile = (args: {
  readonly slug: string;
  readonly nickname: string;
  readonly location: string;
  readonly birthDate: string;
  readonly hometown: string;
  readonly ubmMembershipType: "member" | "non_member" | "academy";
  readonly ubmJoinDate: string;
  readonly businessOverview: string;
  readonly skills: string;
  readonly challenges: string;
  readonly canProvide: string;
  readonly hobbies: string;
  readonly recentInterest: string;
  readonly motto: string;
  readonly otherActivities: string;
  readonly selfIntroduction: string;
  readonly links?: TestMemberProfile;
}): TestMemberProfile => ({
  [STABLE_KEY.nickname]: args.nickname,
  [STABLE_KEY.location]: args.location,
  [STABLE_KEY.birthDate]: args.birthDate,
  [STABLE_KEY.hometown]: args.hometown,
  [STABLE_KEY.ubmMembershipType]: args.ubmMembershipType,
  [STABLE_KEY.ubmJoinDate]: args.ubmJoinDate,
  [STABLE_KEY.businessOverview]: args.businessOverview,
  [STABLE_KEY.skills]: args.skills,
  [STABLE_KEY.challenges]: args.challenges,
  [STABLE_KEY.canProvide]: args.canProvide,
  [STABLE_KEY.hobbies]: args.hobbies,
  [STABLE_KEY.recentInterest]: args.recentInterest,
  [STABLE_KEY.motto]: args.motto,
  [STABLE_KEY.otherActivities]: args.otherActivities,
  ...(args.links ?? buildSnsUrls(args.slug)),
  [STABLE_KEY.selfIntroduction]: args.selfIntroduction,
});

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
      profile: buildProfile({
        slug: "test-mem-01",
        nickname: "test-taro",
        location: "兵庫県神戸市中央区",
        birthDate: "1986-04-12",
        hometown: "兵庫県明石市",
        ubmMembershipType: "member",
        ubmJoinDate: "2024年4月",
        businessOverview:
          "神戸を拠点に、中小企業向けの業務改善とWebサービス開発を支援しています。",
        skills: "TypeScript / Cloudflare Workers / 業務フロー設計 / 生成AI活用",
        challenges: "地域事業者の小さな困りごとを継続的に拾える相談導線を整えたいです。",
        canProvide: "Webアプリの要件整理、業務自動化の壁打ち、地域事業者向けDX相談",
        hobbies: "登山、コーヒー、地域イベント巡り",
        recentInterest: "地域コミュニティとAI活用",
        motto: "小さく試して、早く学ぶ",
        otherActivities: "商店街の勉強会運営と学生向けプログラミング相談を続けています。",
        selfIntroduction: "UBM兵庫で、地域の事業者同士が実務の知恵を持ち寄れる場を育てたいです。",
      }),
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
      profile: buildProfile({
        slug: "test-mem-02",
        nickname: "hana-design",
        location: "兵庫県西宮市",
        birthDate: "1990-08-23",
        hometown: "兵庫県芦屋市",
        ubmMembershipType: "member",
        ubmJoinDate: "2023年11月",
        businessOverview: "ブランド設計と販促物制作を中心に、創業初期の見せ方を整えています。",
        skills: "ブランドデザイン / Figma / 印刷ディレクション / 写真選定",
        challenges: "制作後の運用まで伴走できるパートナー体制を増やしたいです。",
        canProvide: "ロゴ・チラシ・LPの初期設計、デザインレビュー、撮影前の構成相談",
        hobbies: "美術館巡り、パン屋探し、フィルム写真",
        recentInterest: "小規模事業者のブランド更新",
        motto: "伝わる形に整える",
        otherActivities: "地域マルシェのビジュアル監修をボランティアで担当しています。",
        selfIntroduction: "見た目だけでなく、事業者の言葉が自然に届くデザインを大切にしています。",
      }),
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
      profile: buildProfile({
        slug: "test-mem-03",
        nickname: "mark-saburo",
        location: "兵庫県姫路市",
        birthDate: "1982-01-30",
        hometown: "兵庫県たつの市",
        ubmMembershipType: "academy",
        ubmJoinDate: "2022年9月",
        businessOverview: "BtoBサービスの見込み顧客獲得と既存顧客向けCRM設計を支援しています。",
        skills: "マーケティング戦略 / CRM / MA設計 / セミナー企画",
        challenges: "地域企業でも無理なく続けられる効果測定の型を広めたいです。",
        canProvide: "顧客導線レビュー、メール施策設計、セミナー集客の相談",
        hobbies: "城巡り、ランニング、歴史小説",
        recentInterest: "地域企業の顧客データ活用",
        motto: "数字は対話のきっかけ",
        otherActivities: "商工会議所のマーケティング勉強会で講師をしています。",
        selfIntroduction: "隠し表示ケースでも、管理側で十分なプロフィールを確認できる状態を固定します。",
      }),
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
      ubmZone: "0_to_1",
      publicConsent: "consented",
      rulesConsent: "declined",
      publishState: "member_only",
      isDeleted: false,
      notificationOptOut: false,
      profile: buildProfile({
        slug: "test-mem-04",
        nickname: "sales-shiro",
        location: "兵庫県神戸市灘区",
        birthDate: "1978-06-05",
        hometown: "兵庫県神戸市須磨区",
        ubmMembershipType: "non_member",
        ubmJoinDate: "2025年1月",
        businessOverview: "法人向け新規開拓と既存顧客フォローの営業支援を行っています。",
        skills: "営業同行 / 提案資料レビュー / 顧客ヒアリング / 交渉設計",
        challenges: "紹介営業に頼りすぎない新規接点づくりを試したいです。",
        canProvide: "商談ロープレ、提案書の改善、営業チームの週次レビュー設計",
        hobbies: "野球観戦、銭湯、手帳術",
        recentInterest: "営業活動のAIメモ化",
        motto: "準備八割、現場二割",
        otherActivities: "若手営業向けの朝会を月1回開催しています。",
        selfIntroduction: "規約未同意ケースでもseedの全項目が壊れないことを確認するためのアカウントです。",
      }),
      tags: ["tag_s_sales", "tag_r_kobe"],
      attendance: [],
    },
    {
      memberId: "TEST-MEM-05",
      responseId: "TEST-RES-05",
      email: email("test-mem-05"),
      fullName: "[TEST] 削除済 五郎",
      occupation: "士業",
      ubmZone: "1_to_10",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: true,
      notificationOptOut: false,
      profile: buildProfile({
        slug: "test-mem-05",
        nickname: "legal-goro",
        location: "兵庫県加古川市",
        birthDate: "1975-12-18",
        hometown: "兵庫県高砂市",
        ubmMembershipType: "member",
        ubmJoinDate: "2021年6月",
        businessOverview: "中小企業の契約書確認と労務相談を中心に支援しています。",
        skills: "契約レビュー / 労務相談 / 補助金書類確認 / リスク整理",
        challenges: "専門用語を使わずに相談できる窓口を作りたいです。",
        canProvide: "契約書の一次チェック、事業リスクの棚卸し、専門家紹介",
        hobbies: "将棋、古本屋巡り、家庭菜園",
        recentInterest: "小規模事業者のバックオフィス標準化",
        motto: "早めの相談が一番安い",
        otherActivities: "地域NPOの規約整備を支援しています。",
        selfIntroduction: "削除済み状態でもcleanupと関連行削除が安全に動くことを確認します。",
      }),
      tags: ["tag_s_legal", "tag_st_observer"],
      attendance: ["TEST-MTG-02"],
    },
    {
      memberId: "TEST-MEM-06",
      responseId: "TEST-RES-06",
      email: email("test-mem-06"),
      fullName: "[TEST] 最小公開 六郎",
      occupation: "製造",
      ubmZone: "10_to_100",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: false,
      profile: buildProfile({
        slug: "test-mem-06",
        nickname: "roku-factory",
        location: "兵庫県淡路市",
        birthDate: "1988-03-14",
        hometown: "兵庫県洲本市",
        ubmMembershipType: "member",
        ubmJoinDate: "2024年10月",
        businessOverview:
          "淡路島で食品加工設備の改善と小ロット製造ラインの立ち上げを支援しています。",
        skills: "製造工程改善 / HACCP運用 / 設備保全 / 小ロット試作",
        challenges: "現場の紙記録を無理なくデジタル化し、品質確認を早くしたいです。",
        canProvide: "製造現場の改善相談、食品加工の試作相談、設備業者との調整",
        hobbies: "釣り、発酵食品づくり、島内サイクリング",
        recentInterest: "製造現場で使える音声入力",
        motto: "現場で続く形にする",
        otherActivities: "地元高校の工場見学受け入れを行っています。",
        selfIntroduction:
          "ユーザー目視対象のTEST-MEM-06です。公開詳細ページで全public項目の表示を確認できます。",
      }),
      tags: [],
      attendance: [],
    },
    {
      memberId: "TEST-MEM-07",
      responseId: "TEST-RES-07",
      email: email("test-mem-07"),
      fullName: "[TEST] 多タグ 通知停止 七海",
      occupation: "コミュニティ運営",
      ubmZone: "1_to_10",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: true,
      profile: buildProfile({
        slug: "test-mem-07",
        nickname: "nanami-community",
        location: "兵庫県尼崎市",
        birthDate: "1993-09-09",
        hometown: "兵庫県伊丹市",
        ubmMembershipType: "academy",
        ubmJoinDate: "2023年5月",
        businessOverview: "地域コミュニティの運営設計とイベント事務局を請け負っています。",
        skills: "コミュニティ設計 / イベント運営 / 参加者オンボーディング / Notion運用",
        challenges: "イベント後の関係性を継続する仕組みを作りたいです。",
        canProvide: "コミュニティ立ち上げ相談、イベント導線設計、参加者アンケート設計",
        hobbies: "ボードゲーム、街歩き、ラジオ投稿",
        recentInterest: "常連と初参加者が混ざりやすい場づくり",
        motto: "場は準備で半分決まる",
        otherActivities: "駅前の朝活コミュニティを共同運営しています。",
        selfIntroduction: "タグ多数・通知停止の公開アカウントとして、密度の高い詳細表示を確認します。",
      }),
      tags: ["tag_b_service", "tag_s_ops", "tag_i_dx", "tag_r_hanshin", "tag_ro_freelance", "tag_st_active"],
      attendance: ["TEST-MTG-01", "TEST-MTG-02", "TEST-MTG-03"],
    },
    {
      memberId: "TEST-MEM-08",
      responseId: "TEST-RES-08",
      email: email("test-mem-08"),
      fullName: "[TEST] 未登録ゲート 八郎",
      occupation: "金融",
      ubmZone: "0_to_1",
      publicConsent: "unknown",
      rulesConsent: "unknown",
      publishState: "member_only",
      isDeleted: false,
      notificationOptOut: false,
      profile: buildProfile({
        slug: "test-mem-08",
        nickname: "finance-hachiro",
        location: "兵庫県宝塚市",
        birthDate: "1984-11-02",
        hometown: "兵庫県川西市",
        ubmMembershipType: "non_member",
        ubmJoinDate: "2025年4月",
        businessOverview: "個人事業主向けの資金繰り相談と事業計画作成を支援しています。",
        skills: "資金繰り表 / 融資相談 / 事業計画 / キャッシュフロー整理",
        challenges: "数字が苦手な人でも使える月次確認の型を作りたいです。",
        canProvide: "資金計画の壁打ち、金融機関提出資料のレビュー、月次管理表の作成",
        hobbies: "落語、温泉、家計簿アプリ研究",
        recentInterest: "スモールビジネスの価格改定",
        motto: "お金の不安は見える化から",
        otherActivities: "創業相談会で資金計画の相談員をしています。",
        selfIntroduction: "未登録ゲートの状態でも全項目seedを保持するための確認アカウントです。",
      }),
      tags: ["tag_b_finance"],
      attendance: [],
    },
    {
      memberId: "TEST-MEM-09",
      responseId: "TEST-RES-09",
      email: email("test-mem-09"),
      fullName: "[TEST] 本人写真 九美",
      occupation: "人事",
      ubmZone: "1_to_10",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: false,
      profile: buildProfile({
        slug: "test-mem-09",
        nickname: "kumi-people",
        location: "兵庫県丹波市",
        birthDate: "1991-02-20",
        hometown: "兵庫県丹波篠山市",
        ubmMembershipType: "member",
        ubmJoinDate: "2024年1月",
        businessOverview: "採用広報とオンボーディング設計で、少人数組織の定着を支援しています。",
        skills: "採用広報 / 面談設計 / オンボーディング / 組織サーベイ",
        challenges: "初期メンバーが安心して意見を出せる評価制度を整えたいです。",
        canProvide: "採用ページの見直し、面談質問設計、入社後30日プラン作成",
        hobbies: "合唱、山の写真、発酵食品づくり",
        recentInterest: "地方企業の採用広報",
        motto: "人は環境で伸びる",
        otherActivities: "女性起業家向けの小さな相談会を運営しています。",
        selfIntroduction: "本人写真付きの公開アカウントとして、画像あり詳細ページと全項目表示を確認します。",
        links: {
          [STABLE_KEY.urlWebsite]: "https://example.test/test-mem-09",
          [STABLE_KEY.urlFacebook]: "https://facebook.com/test-mem-09",
          [STABLE_KEY.urlInstagram]: "https://instagram.com/test-mem-09",
          [STABLE_KEY.urlThreads]: "https://threads.net/@test-mem-09",
          [STABLE_KEY.urlYoutube]: "https://youtube.com/@test-mem-09",
          [STABLE_KEY.urlTiktok]: "https://www.tiktok.com/@test-mem-09",
          [STABLE_KEY.urlX]: "https://x.com/test_mem_09",
          [STABLE_KEY.urlBlog]: "https://blog.example.test/test-mem-09",
          [STABLE_KEY.urlNote]: "https://note.com/test_mem_09",
          [STABLE_KEY.urlLinkedin]: "https://www.linkedin.com/in/test-mem-09",
          [STABLE_KEY.urlOthers]: "地域採用相談: https://events.example.test/test-mem-09",
        },
      }),
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
      ubmZone: "10_to_100",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      notificationOptOut: false,
      profile: buildProfile({
        slug: "test-mem-10-edge",
        nickname: "edge-yamada-😀",
        location: "兵庫県豊岡市 / リモート中心",
        birthDate: "1980-10-10",
        hometown: "兵庫県養父市",
        ubmMembershipType: "member",
        ubmJoinDate: "2020年12月",
        businessOverview:
          "研究開発とセキュリティレビューを横断し、長い説明文・記号・絵文字を含むプロフィール表示の耐性を確認するためのテストアカウントです。",
        skills:
          "セキュリティレビュー / R&D / Threat Modeling / TypeScript / Workers / 'single quote' handling / emoji 😀",
        challenges:
          "長文の相談内容がカードやセクションを押し広げすぎず、改行・折り返し・検索データとして破綻しないことを確認したいです。",
        canProvide:
          "設計レビュー、脅威モデリング、ログ設計、境界値テスト、長文プロフィール表示の確認",
        hobbies: "雪道ドライブ、電子工作、長いREADMEを書くこと",
        recentInterest: "Edge Runtimeでの安全な入力処理と監査ログ",
        motto: "境界値は仕様を語る",
        otherActivities:
          "地域の開発者勉強会で、セキュリティとアクセシビリティを同じ設計レビューで扱う活動をしています。",
        selfIntroduction:
          "シングルクォート ' と絵文字 😀 と長い日本語を含め、公開詳細ページ・SQL escape・JSON保存のすべてを同時に検証します。",
      }),
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
