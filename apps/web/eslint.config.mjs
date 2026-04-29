// 06b: apps/web 用 ESLint flat config（placeholder）。
//
// 不変条件と対応:
//  - #4: /profile 配下に編集 form / input / textarea を配置しない（overrides で <form> 等を禁止）
//  - #6: window.UBM 参照を禁止（no-restricted-globals + no-restricted-syntax）
//  - #8: localStorage 経由で gate state を退避しない（no-restricted-syntax）
//  - #9: `/no-access` ルートを採用しない（リテラル検出で error）
//
// ESLint dependency は本タスクではセットアップしない（infra タスクで導入）。
// flat config の構文のみ用意し、運用開始時にそのまま読み込めるようにしておく。

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value='/no-access']",
          message: "`/no-access` ルートは不採用（不変条件 #9）。/login で 5 状態を吸収すること。",
        },
        {
          selector: "MemberExpression[object.name='localStorage']",
          message: "localStorage は不採用（不変条件 #8）。URL query を正本にすること。",
        },
        {
          selector: "MemberExpression[object.name='UBM']",
          message: "window.UBM は不採用（不変条件 #6）。",
        },
      ],
      "no-restricted-globals": ["error", "UBM"],
    },
  },
  {
    // /profile 配下は read-only。編集 form / input / textarea を禁止する（不変条件 #4）。
    files: ["app/profile/**/*.tsx", "app/profile/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='form']",
          message: "/profile に編集 form を配置しない（不変条件 #4）。編集は外部 Google Form のみ。",
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message: "/profile に input を配置しない（不変条件 #4）。",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: "/profile に textarea を配置しない（不変条件 #4）。",
        },
        {
          selector: "Literal[value='/no-access']",
          message: "`/no-access` ルートは不採用（不変条件 #9）。",
        },
        {
          selector: "MemberExpression[object.name='localStorage']",
          message: "localStorage は不採用（不変条件 #8）。",
        },
        {
          selector: "MemberExpression[object.name='UBM']",
          message: "window.UBM は不採用（不変条件 #6）。",
        },
      ],
    },
  },
];
