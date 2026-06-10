import type { DiffType, SchemaDiffItem } from "./SchemaDiffPanel";

export type SchemaStatKey = "unresolved" | "added" | "changed" | "removed";

export interface SchemaTerm {
  readonly plainLabel: string;
  readonly technicalName: string;
  readonly description: string;
}

export interface SchemaDiffTypeDescription {
  readonly label: string;
  readonly technicalName: DiffType;
  readonly description: string;
  readonly actionHint: string;
}

export interface SchemaStatDescription {
  readonly label: string;
  readonly hint: string;
}

export const SCHEMA_GLOSSARY: readonly SchemaTerm[] = [
  {
    plainLabel: "項目キー",
    technicalName: "stableKey",
    description: "フォームの設問名が変わっても、会員データの保存先として使い続ける名前です。",
  },
  {
    plainLabel: "対応づけ",
    technicalName: "resolve",
    description: "Google Form の設問を項目キーへ結び、回答を正しい保存先へ反映できる状態にします。",
  },
  {
    plainLabel: "フォーム版数",
    technicalName: "revision",
    description: "取り込んだ Google Form の設問構成の版です。履歴を見ると、いつ何が変わったか確認できます。",
  },
];

const DIFF_TYPE_DESCRIPTIONS: Record<DiffType, SchemaDiffTypeDescription> = {
  added: {
    label: "新しく増えた設問",
    technicalName: "added",
    description: "Google Form に追加された設問です。既存の項目キーに対応づけるか、新しい保存先として扱うかを確認します。",
    actionHint: "必要なら項目キーへ対応づけます。",
  },
  changed: {
    label: "内容が変わった設問",
    technicalName: "changed",
    description: "設問の文言や型が変わった候補です。同じ会員データとして扱うか確認します。",
    actionHint: "同じ意味なら既存の項目キーへ対応づけます。",
  },
  removed: {
    label: "削除された設問",
    technicalName: "removed",
    description: "Google Form から消えた設問です。履歴として確認し、必要な対応がないか見ます。",
    actionHint: "通常は履歴確認が中心です。",
  },
  unresolved: {
    label: "未対応の設問",
    technicalName: "unresolved",
    description: "まだ保存先が決まっていない設問です。このままだと会員回答の表示先が確定しません。",
    actionHint: "優先して項目キーへ対応づけます。",
  },
};

const STAT_DESCRIPTIONS: Record<SchemaStatKey, SchemaStatDescription> = {
  unresolved: {
    label: "未対応",
    hint: "対応づけ待ち。クリックして項目キーを選びます。",
  },
  added: {
    label: "新規設問",
    hint: "新しく増えた設問。保存先を確認します。",
  },
  changed: {
    label: "変更候補",
    hint: "文言や型の変更。既存項目との同一性を確認します。",
  },
  removed: {
    label: "削除候補",
    hint: "フォームから消えた設問。履歴として確認します。",
  },
};

const STATUS_LABELS: Record<SchemaDiffItem["status"], string> = {
  queued: "対応づけ待ち",
  resolved: "対応づけ済み",
};

export const describeDiffType = (type: DiffType): SchemaDiffTypeDescription =>
  DIFF_TYPE_DESCRIPTIONS[type];

export const describeSchemaStat = (key: SchemaStatKey): SchemaStatDescription =>
  STAT_DESCRIPTIONS[key];

export const describeSchemaStatus = (status: SchemaDiffItem["status"]): string =>
  STATUS_LABELS[status];
