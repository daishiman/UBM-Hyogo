// serial-06-form-response-binding: PublicMemberProfile fixture
// - 6 セクション混在（visibility=public / member / admin）
// - adapter unit spec / Playwright route mock 双方で参照
// - stableKey は packages/shared の STABLE_KEY const 経由（lint-stablekey-literal.mjs 不変条件 #1）
import { STABLE_KEY } from "@ubm-hyogo/shared";

import type { PublicMemberProfile } from "../lib/adapters/member-detail";

export const samplePublicMemberProfile: PublicMemberProfile = {
  memberId: "member-fixture-001",
  summary: {
    fullName: "兵庫 太郎",
    nickname: "ひょうご",
    location: "神戸市",
    occupation: "エンジニア",
    ubmZone: "1_to_10",
    ubmMembershipType: "member",
  },
  publicSections: [
    {
      key: "basic",
      title: "基本情報",
      fields: [
        {
          stableKey: STABLE_KEY.fullName,
          label: "氏名",
          value: "兵庫 太郎",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.nickname,
          label: "ニックネーム",
          value: "ひょうご",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
      ],
    },
    {
      key: "contact",
      title: "コンタクト",
      fields: [
        // visibility=member → adapter で filter される
        {
          stableKey: "responseEmail",
          label: "メールアドレス",
          value: "taro@example.com",
          kind: "system",
          visibility: "member",
          source: "derived",
        },
      ],
    },
    {
      key: "profile",
      title: "プロフィール",
      fields: [
        {
          stableKey: STABLE_KEY.location,
          label: "活動エリア",
          value: "神戸市",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.occupation,
          label: "職業",
          value: "エンジニア",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.hometown,
          label: "出身地",
          value: "兵庫県明石市",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.selfIntroduction,
          label: "自己紹介",
          value: "兵庫支部会で機械学習を学んでいます。",
          kind: "paragraph",
          visibility: "public",
          source: "forms",
        },
      ],
    },
    {
      key: "ubm",
      title: "UBM 関連",
      fields: [
        {
          stableKey: STABLE_KEY.ubmZone,
          label: "ゾーン",
          value: "1_to_10",
          kind: "dropdown",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.ubmMembershipType,
          label: "会員区分",
          value: "member",
          kind: "dropdown",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.businessOverview,
          label: "ビジネス概要",
          value: "Web サービスを開発しています。",
          kind: "paragraph",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.skills,
          label: "スキル",
          value: "TypeScript / Cloudflare Workers",
          kind: "paragraph",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.canProvide,
          label: "提供できること",
          value: "技術相談",
          kind: "paragraph",
          visibility: "public",
          source: "forms",
        },
      ],
    },
    {
      key: "interests",
      title: "興味関心",
      fields: [
        {
          stableKey: STABLE_KEY.hobbies,
          label: "趣味",
          value: "機械学習・Web 開発",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.recentInterest,
          label: "最近の関心",
          value: "地域 AI",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.motto,
          label: "座右の銘",
          value: "継続は力なり",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.otherActivities,
          label: "その他の活動",
          value: "地域コミュニティ運営",
          kind: "paragraph",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.urlOthers,
          label: "その他リンク",
          value: "Podcast: https://example.com/podcast",
          kind: "paragraph",
          visibility: "public",
          source: "forms",
        },
      ],
    },
    {
      key: "consent",
      title: "同意",
      fields: [
        // visibility=admin → adapter で section 丸ごと除外される
        {
          stableKey: STABLE_KEY.publicConsent,
          label: "公開同意",
          value: "consented",
          kind: "consent",
          visibility: "admin",
          source: "forms",
        },
        {
          stableKey: STABLE_KEY.rulesConsent,
          label: "規約同意",
          value: "consented",
          kind: "consent",
          visibility: "admin",
          source: "forms",
        },
      ],
    },
  ],
  attendance: [
    {
      sessionId: "sess-001",
      title: "第1回 兵庫支部会",
      heldOn: "2026-01-15",
    },
  ],
  tags: [{ code: "engineer", label: "エンジニア", category: STABLE_KEY.occupation }],
};
