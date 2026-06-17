export interface TagGlossaryTerm {
  readonly key: string;
  readonly label: string;
  readonly description: string;
}

export const TAG_MANAGEMENT_GLOSSARY = [
  {
    key: "tag-definition",
    label: "タグ定義",
    description: "会員に付けるタグの名前、コード、カテゴリを管理する場所です。",
  },
  {
    key: "tag-assignment",
    label: "タグ割当",
    description: "提案されたタグを確認し、メンバーに付ける作業をする場所です。",
  },
  {
    key: "tag-code",
    label: "コード",
    description: "システムがタグを区別するための短い名前です。表示名から自動生成できます。",
  },
  {
    key: "tag-label",
    label: "表示名",
    description: "管理画面や会員ディレクトリに表示する、人が読むためのタグ名です。",
  },
  {
    key: "tag-category",
    label: "カテゴリ",
    description: "タグを用途ごとに整理するための分類です。",
  },
  {
    key: "tag-suggestion",
    label: "提案タグ",
    description: "回答内容などから候補として出てきたタグです。",
  },
  {
    key: "tag-unresolved",
    label: "未解決",
    description: "まだ確認や割当が終わっていない提案タグです。",
  },
  {
    key: "tag-resolve",
    label: "割当を確定する",
    description: "提案タグを確認し、対象メンバーのタグとして保存する操作です。",
  },
] as const satisfies readonly TagGlossaryTerm[];

export const TAG_MANAGEMENT_COPY = {
  createFormDescription:
    "ここで新しいタグを作成します。タグは会員ディレクトリでメンバーを分類・検索するためのラベルです。",
  assignmentHeaderDescription:
    "AI が提案した未解決のタグを確認し、メンバーに割り当てます。",
  definitionGuideBody:
    "この画面では、会員に付けるタグの語彙を作ります。作ったタグはタグ割当画面でメンバーに付けられます。",
  assignmentGuideBody:
    "この画面では、提案された未解決のタグを確認し、メンバーに割り当てます。タグそのものを追加・編集する場合はタグ定義を使います。",
} as const;

export function getTagTerm(key: string): TagGlossaryTerm | undefined {
  return TAG_MANAGEMENT_GLOSSARY.find((term) => term.key === key);
}
