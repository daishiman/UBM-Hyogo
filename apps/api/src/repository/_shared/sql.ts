// SQL共通ヘルパー

/**
 * n個のプレースホルダーをカンマ区切りで生成する
 * 例: placeholders(3) => "?1,?2,?3"
 */
export const placeholders = (n: number): string =>
  Array.from({ length: n }, (_, i) => `?${i + 1}`).join(",");
