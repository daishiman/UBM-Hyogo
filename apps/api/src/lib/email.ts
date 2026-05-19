// ut-07c-followup-001: email 正規化を NFKC + trim + lowercase に集約する。
// service / parse-attendance / route の 3 箇所で同一規則を適用するため
// pure function として独立させる。
export function normalizeEmail(s: string): string {
  return s.normalize("NFKC").trim().toLowerCase();
}
