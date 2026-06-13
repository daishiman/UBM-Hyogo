export interface SchemaReviewTerm {
  technical: string;
  plain: string;
  description: string;
}

export const SCHEMA_REVIEW_TERMS: Record<string, SchemaReviewTerm> = {
  stableKey: {
    technical: "stableKey",
    plain: "永続的な名前",
    description: "フォームの設問が文言変更されても変わらない、設問を一意に識別するための名前です。",
  },
  questionId: {
    technical: "questionId",
    plain: "設問の元ID",
    description:
      "Googleフォーム側が設問に自動で振る識別子です。文言を変えると変わることがあります。",
  },
  alias: {
    technical: "alias",
    plain: "名前の対応づけ",
    description: "設問の元IDに永続的な名前を結びつけた対応関係です。",
  },
  resolve: {
    technical: "resolve",
    plain: "名前を割り当てる",
    description: "新しい設問に永続的な名前をつけて、過去の回答と新しい設問を対応づける操作です。",
  },
  unresolved: {
    technical: "unresolved",
    plain: "名前が未割当",
    description: "まだ永続的な名前がついていない設問です。割り当てると過去回答と繋がります。",
  },
  added: {
    technical: "added",
    plain: "新しく増えた設問",
    description: "前回との比較で新しく追加された設問です。",
  },
  changed: {
    technical: "changed",
    plain: "文言や型が変わった設問",
    description: "前回から文言や回答形式が変わった設問です。",
  },
  removed: {
    technical: "removed",
    plain: "なくなった設問",
    description: "前回はあったが今回なくなった設問です。",
  },
  revision: {
    technical: "revision",
    plain: "取り込んだ版",
    description: "ある時点で取り込んだフォーム構成のバージョンです。",
  },
  backfill: {
    technical: "backfill",
    plain: "過去回答への反映",
    description: "割り当てた名前を、過去の回答データへさかのぼって反映する処理です。",
  },
  recompute: {
    technical: "recompute",
    plain: "再集計",
    description: "取り消し後にデータの対応づけを計算し直す処理です。",
  },
  rollback: {
    technical: "rollback",
    plain: "割り当ての取り消し",
    description: "一度割り当てた名前を元に戻す操作です。",
  },
};

export function plainLabel(
  technical: string,
  options: { readonly includeTechnical?: boolean } = {},
): string {
  const term = SCHEMA_REVIEW_TERMS[technical];
  if (!term) return technical;
  if (!options.includeTechnical) return term.plain;
  return `${term.plain}（技術名: ${term.technical}）`;
}

export function termDescription(technical: string): string {
  return SCHEMA_REVIEW_TERMS[technical]?.description ?? "";
}
