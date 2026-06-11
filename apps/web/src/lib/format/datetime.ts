// task-15: JST 表示の正本 helper。Recent Actions / drawer 等で使用。
const JST_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatJstDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return JST_FORMATTER.format(d);
}

// admin-members-timestamp-jst-and-identity-label-clarity (F1):
// 非エンジニア向けに秒まで表示する完全な JST 表記。
// ロケール実装差を避けるため formatToParts で確定的に組み立てる。
const JST_PARTS_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * 非エンジニア向けの完全な JST 表記。例: "2026年6月9日 19:34:19"
 * - 年月日は漢字区切り（月日のゼロ埋めは外す）
 * - 時刻はコロン区切りで秒まで（時分秒は 2 桁ゼロ埋め維持）
 * - 不正値 / 空文字は元入力をそのまま返す（fail-soft・例外なし）
 */
export function formatJstDateTimeWithSeconds(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = JST_PARTS_FORMATTER.formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === t)?.value ?? "";
  const y = get("year");
  const mo = Number(get("month"));
  const da = Number(get("day"));
  const hh = get("hour");
  const mi = get("minute");
  const ss = get("second");
  return `${y}年${mo}月${da}日 ${hh}:${mi}:${ss}`;
}
