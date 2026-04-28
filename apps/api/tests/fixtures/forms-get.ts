// 03a fixture: 31 項目・6 セクションの RawForm。
// 不変条件 #1: stableKey をテストでも直書きしない（label のみで構成）。
// label は packages/integrations-google の STABLE_KEY_BY_LABEL マッピングと一致させる。
import type { RawForm, RawFormItem } from "@ubm-hyogo/integrations-google";

const Q = (questionId: string, title: string, opts?: { required?: boolean }): RawFormItem => ({
  itemId: `item_${questionId}`,
  title,
  questionItem: {
    question: {
      questionId,
      required: opts?.required ?? false,
    },
  },
});

const SECTION = (title: string): RawFormItem => ({
  sectionHeaderItem: { title },
  title,
});

/**
 * 31 項目 × 6 sectionHeader fixture。
 * label は mapper の STABLE_KEY_BY_LABEL と一致しており、resolveStableKey は全件 known を返す。
 */
export const FORMS_GET_31_ITEMS: RawForm = {
  formId: "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg",
  revisionId: "rev-test-001",
  responderUri: "https://docs.google.com/forms/d/e/1FAIpQLSe/viewform",
  info: { title: "UBM 兵庫支部会 会員登録" },
  items: [
    SECTION("基本プロフィール"),
    Q("q01", "お名前（フルネーム）", { required: true }),
    Q("q02", "あだ名・ニックネーム"),
    Q("q03", "お住まい（都道府県・市区町村）"),
    Q("q04", "生年月日"),
    Q("q05", "職業・仕事内容"),
    Q("q06", "出身地"),
    SECTION("UBM プロフィール"),
    Q("q07", "UBM区画"),
    Q("q08", "UBM参加ステータス"),
    Q("q09", "UBMに入会・参加した時期"),
    Q("q10", "ビジネス概要"),
    Q("q11", "得意分野・スキル"),
    Q("q12", "現在の課題・相談したいこと"),
    Q("q13", "提供できること・協力できること"),
    SECTION("パーソナルプロフィール"),
    Q("q14", "趣味・好きなこと"),
    Q("q15", "最近ハマっていること"),
    Q("q16", "座右の銘・大切にしている言葉"),
    Q("q17", "仕事以外の活動"),
    SECTION("ソーシャルリンク"),
    Q("q18", "ホームページ URL"),
    Q("q19", "Facebook URL"),
    Q("q20", "Instagram URL"),
    Q("q21", "Threads URL"),
    Q("q22", "YouTube URL"),
    Q("q23", "TikTok URL"),
    Q("q24", "X URL"),
    Q("q25", "ブログ URL"),
    Q("q26", "note URL"),
    Q("q27", "LinkedIn URL"),
    Q("q28", "その他の SNS・URL"),
    SECTION("メッセージ"),
    Q("q29", "自己紹介・一言メッセージ"),
    SECTION("同意"),
    Q("q30", "ホームページへの掲載に同意しますか？", { required: true }),
    Q("q31", "勧誘ルール・免責事項への同意", { required: true }),
  ],
};

/**
 * unknown question を 1 件含むパターン（合計 31 項目を維持しつつ 1 件を未知 label に差し替え）。
 * AC-2 の diff queue 投入を検証する。
 */
export const FORMS_GET_WITH_UNKNOWN: RawForm = {
  ...FORMS_GET_31_ITEMS,
  revisionId: "rev-test-002",
  items: [
    ...(FORMS_GET_31_ITEMS.items ?? []).slice(0, -1),
    Q("q31x", "未知の新項目（Phase 6 FC-11 検証用）", { required: false }),
  ],
};

/**
 * revisionId だけ変えて items は同一（schemaHash を測るためのバリエーション）。
 */
export const FORMS_GET_REVISION_BUMPED: RawForm = {
  ...FORMS_GET_31_ITEMS,
  revisionId: "rev-test-bump",
};
