export interface AuditErrorView {
  readonly title: string;
  readonly hint?: string;
}

export function toAuditErrorView(error: string): AuditErrorView {
  const normalized = error.toLowerCase();
  if (error.includes("404")) {
    return {
      title: "監査ログを読み込めませんでした（404）",
      hint: "API endpoint への疎通、staging deploy 状態、admin 認可を確認してください。",
    };
  }
  if (error.includes("401") || error.includes("403")) {
    return {
      title: "監査ログを読み込めませんでした（認可エラー）",
      hint: "管理者セッションの有効期限、または権限を確認してください。",
    };
  }
  if (normalized.includes("cursor")) {
    return {
      title: "監査ログを読み込めませんでした（ページ位置エラー）",
      hint: "ページ位置（cursor）が無効です。リセットして最初のページから絞り込み直してください。",
    };
  }
  if (normalized.includes("from") && (normalized.includes("to") || normalized.includes("before") || normalized.includes("range"))) {
    return {
      title: "監査ログを読み込めませんでした（期間指定エラー）",
      hint: "期間の指定（from / to）の前後を確認してください。from は to より前の日時にしてください。",
    };
  }
  return {
    title: `監査ログを読み込めませんでした: ${error}`,
    hint: "時間をおいて再読み込みするか、絞り込み条件を変えて試してください。",
  };
}
