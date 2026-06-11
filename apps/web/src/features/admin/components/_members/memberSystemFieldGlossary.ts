// admin-members-timestamp-jst-and-identity-label-clarity (F2):
// 会員管理 詳細ドロワーの IDENTITY / DIAGNOSTICS で使う
// 「英語キー → 日本語ラベル」「真偽値の日本語表記」を集約する純データ/純関数 SSOT。
//
// 各コンポーネントはこの SSOT を参照して日本語ラベル主・英語キー併記で描画する。
// 英語キー併記は描画側で行うため、本ファイルは日本語ラベルのみ保持する。

/** IDENTITY (system field) — 英語キー → 日本語ラベル */
export const MEMBER_IDENTITY_FIELD_LABELS = {
  memberId: "会員ID",
  responseEmail: "回答メールアドレス",
  notificationOptOut: "通知の受け取り停止",
  isDeleted: "退会済み",
} as const satisfies Record<string, string>;

/** DIAGNOSTICS — 英語キー → 日本語ラベル */
export const MEMBER_DIAGNOSTICS_FIELD_LABELS = {
  matchedResponse: "照合できたフォーム回答",
  responseFields: "取得できた項目数",
  publicVisible: "公開ディレクトリに表示",
  h3Hidden: "同意・公開設定により非表示",
  h4MissingFields: "未入力の項目あり",
} as const satisfies Record<string, string>;

/** セクション見出し — 英語 → 日本語 */
export const MEMBER_SYSTEM_SECTION_LABELS = {
  identity: "本人情報（システム項目）",
  diagnostics: "診断情報",
} as const;

/** 真偽値の日本語表記。true→「はい」/ false→「いいえ」 */
export function formatBooleanJa(value: boolean): string {
  return value ? "はい" : "いいえ";
}
