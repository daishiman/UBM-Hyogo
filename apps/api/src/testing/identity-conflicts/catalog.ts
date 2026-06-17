export const IDENTITY_CONFLICT_SEED_ACTOR = "seed:identity-conflicts";
export const IDENTITY_CONFLICT_SEED_EMAIL_DOMAIN = "test.ubm-hyogo.invalid";

export interface IdentityConflictSeedMember {
  readonly memberId: `TEST-MEM-${string}`;
  readonly responseId: `TEST-RES-${string}`;
  readonly email: `${string}@${typeof IDENTITY_CONFLICT_SEED_EMAIL_DOMAIN}`;
  readonly fullName: string;
  readonly occupation: string;
  readonly ubmZone: "0_to_1" | "1_to_10" | "10_to_100";
  readonly lastSubmittedAt: string;
  readonly location: string;
  readonly businessOverview: string;
  readonly selfIntroduction: string;
}

export interface IdentityConflictSeedCatalog {
  readonly formId: string;
  readonly revisionId: string;
  readonly schemaHash: string;
  readonly members: readonly IdentityConflictSeedMember[];
}

const email = (
  local: string,
): `${string}@${typeof IDENTITY_CONFLICT_SEED_EMAIL_DOMAIN}` =>
  `${local}@${IDENTITY_CONFLICT_SEED_EMAIL_DOMAIN}`;

export const identityConflictSeedCatalog = {
  formId: "TEST-FORM-DUP",
  revisionId: "TEST-REV-DUP",
  schemaHash: "TEST-SCHEMA-HASH-DUP",
  members: [
    {
      memberId: "TEST-MEM-21",
      responseId: "TEST-RES-21",
      email: email("test-dup-21"),
      fullName: "[TEST] 重複 完全一致 太郎",
      occupation: "行政書士",
      ubmZone: "0_to_1",
      lastSubmittedAt: "2026-06-09T10:00:00.000Z",
      location: "兵庫県神戸市",
      businessOverview: "完全一致パターンの古い登録です。",
      selfIntroduction: "重複候補の動作確認用データです。",
    },
    {
      memberId: "TEST-MEM-22",
      responseId: "TEST-RES-22",
      email: email("test-dup-22"),
      fullName: "[TEST] 重複 完全一致 太郎",
      occupation: "行政書士",
      ubmZone: "0_to_1",
      lastSubmittedAt: "2026-06-09T10:01:00.000Z",
      location: "兵庫県神戸市",
      businessOverview: "完全一致パターンの新しい登録です。",
      selfIntroduction: "統合操作の確認に使います。",
    },
    {
      memberId: "TEST-MEM-23",
      responseId: "TEST-RES-23",
      email: email("test-dup-23"),
      fullName: "[TEST] 重複 表記ゆれ 花子",
      occupation: "ＷＥＢデザイナー",
      ubmZone: "1_to_10",
      lastSubmittedAt: "2026-06-09T10:02:00.000Z",
      location: "兵庫県西宮市",
      businessOverview: "全角WEB表記の登録です。",
      selfIntroduction: "NFKC 正規化の確認に使います。",
    },
    {
      memberId: "TEST-MEM-24",
      responseId: "TEST-RES-24",
      email: email("test-dup-24"),
      fullName: "[TEST] 重複 表記ゆれ 花子",
      occupation: "WEBデザイナー",
      ubmZone: "1_to_10",
      lastSubmittedAt: "2026-06-09T10:03:00.000Z",
      location: "兵庫県西宮市",
      businessOverview: "半角WEB表記の登録です。",
      selfIntroduction: "NFKC 正規化の確認に使います。",
    },
    {
      memberId: "TEST-MEM-25",
      responseId: "TEST-RES-25",
      email: email("test-dup-25"),
      fullName: "[TEST] 重複 余白 次郎",
      occupation: "製造コンサルタント",
      ubmZone: "10_to_100",
      lastSubmittedAt: "2026-06-09T10:04:00.000Z",
      location: "兵庫県姫路市",
      businessOverview: "余白なしの登録です。",
      selfIntroduction: "trim 正規化の確認に使います。",
    },
    {
      memberId: "TEST-MEM-26",
      responseId: "TEST-RES-26",
      email: email("test-dup-26"),
      fullName: "[TEST] 重複 余白 次郎 ",
      occupation: "製造コンサルタント ",
      ubmZone: "10_to_100",
      lastSubmittedAt: "2026-06-09T10:05:00.000Z",
      location: "兵庫県姫路市",
      businessOverview: "末尾空白を含む登録です。",
      selfIntroduction: "trim 正規化の確認に使います。",
    },
    {
      memberId: "TEST-MEM-27",
      responseId: "TEST-RES-27",
      email: email("test-dup-27"),
      fullName: "[TEST] 重複 転居 三郎",
      occupation: "不動産業",
      ubmZone: "0_to_1",
      lastSubmittedAt: "2026-06-09T10:06:00.000Z",
      location: "兵庫県明石市",
      businessOverview: "転居前の登録です。",
      selfIntroduction: "ゾーン違いでも候補化されることを確認します。",
    },
    {
      memberId: "TEST-MEM-28",
      responseId: "TEST-RES-28",
      email: email("test-dup-28"),
      fullName: "[TEST] 重複 転居 三郎",
      occupation: "不動産業",
      ubmZone: "1_to_10",
      lastSubmittedAt: "2026-06-09T10:07:00.000Z",
      location: "兵庫県加古川市",
      businessOverview: "転居後の登録です。",
      selfIntroduction: "ゾーン違いでも候補化されることを確認します。",
    },
    {
      memberId: "TEST-MEM-29",
      responseId: "TEST-RES-29",
      email: email("test-dup-29"),
      fullName: "[TEST] 重複 同姓同名 美咲",
      occupation: "美容師",
      ubmZone: "1_to_10",
      lastSubmittedAt: "2026-06-09T10:08:00.000Z",
      location: "兵庫県尼崎市",
      businessOverview: "同姓同名の別人想定です。",
      selfIntroduction: "別人として確定の確認に使います。",
    },
    {
      memberId: "TEST-MEM-30",
      responseId: "TEST-RES-30",
      email: email("test-dup-30"),
      fullName: "[TEST] 重複 同姓同名 美咲",
      occupation: "美容師",
      ubmZone: "10_to_100",
      lastSubmittedAt: "2026-06-09T10:09:00.000Z",
      location: "兵庫県宝塚市",
      businessOverview: "同姓同名の別人想定です。",
      selfIntroduction: "別人として確定の確認に使います。",
    },
  ],
} as const satisfies IdentityConflictSeedCatalog;
