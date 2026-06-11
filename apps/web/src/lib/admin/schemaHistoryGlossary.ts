export interface SchemaHistoryPurposeStep {
  readonly title: string;
  readonly description: string;
}

export interface SchemaHistoryGlossaryTerm {
  readonly term: string;
  readonly description: string;
}

export const schemaHistoryPurposeSteps: readonly SchemaHistoryPurposeStep[] = [
  {
    title: "フォーム設問の変化を確認",
    description: "Google フォーム側で増えた設問や文言変更の履歴を追跡します。",
  },
  {
    title: "同じ意味の設問を紐付け",
    description: "管理者が新旧の設問を同じ stableKey に結び直した記録を確認します。",
  },
  {
    title: "解消済みの判断を監査",
    description: "いつ、誰が、どの設問をどう紐付けたかを後から確認できます。",
  },
];

export const schemaHistoryGlossary: readonly SchemaHistoryGlossaryTerm[] = [
  {
    term: "設問の紐付け",
    description: "文言が変わった設問を、同じ回答項目として扱えるように結び直す操作です。",
  },
  {
    term: "stableKey",
    description: "フォーム文言が変わっても同じ意味の項目を追跡するための内部キーです。",
  },
  {
    term: "旧→新",
    description: "紐付け前の stableKey と、管理者が選んだ紐付け先の stableKey です。",
  },
  {
    term: "batchId",
    description: "同じ処理で記録された監査ログをまとめて探すための識別子です。",
  },
];
