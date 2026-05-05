// SQL共通ヘルパー

/**
 * n個のプレースホルダーをカンマ区切りで生成する
 * 例: placeholders(3) => "?1,?2,?3"
 *     placeholders(2, 3) => "?3,?4"
 */
export const placeholders = (n: number, start = 1): string =>
  Array.from({ length: n }, (_, i) => `?${start + i}`).join(",");

export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`);
