import { SCHEMA_GLOSSARY } from "./schemaGlossary";

const FLOW_STEPS = [
  {
    title: "変更を検知",
    body: "Google Form の設問追加・文言変更・削除を取り込みます。",
  },
  {
    title: "項目を対応づけ",
    body: "設問を会員データの保存先である項目キーへ結びます。",
  },
  {
    title: "会員データへ反映",
    body: "一覧・詳細・マイページで回答が正しい項目として表示されます。",
  },
] as const;

export function SchemaPurposeExplainer() {
  return (
    <section
      className="ui-card card-pad-lg schema-purpose-card"
      aria-labelledby="schema-purpose-h"
      data-region="schema-purpose-explainer"
    >
      <div className="schema-purpose-card__intro">
        <div>
          <div className="eyebrow">フォーム項目の対応づけガイド</div>
          <h2 id="schema-purpose-h" className="h-section">
            このページでできること
          </h2>
        </div>
        <p className="muted">
          Google Form の設問が変わったとき、会員データの保存先へ正しく結びつけます。
          対応づけが済むと、回答は管理画面とマイページで同じ項目として扱えます。
        </p>
      </div>

      <ol className="schema-flow-steps" aria-label="schema review flow">
        {FLOW_STEPS.map((step, index) => (
          <li key={step.title} className="schema-flow-step">
            <span className="schema-flow-step__index">{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="schema-purpose-card__outcome">
        <strong>得られる結果</strong>
        <span>
          フォームの変更後も、会員回答が一覧・詳細・マイページで正しい項目名のまま表示されます。
        </span>
      </div>

      <dl className="schema-glossary" aria-label="schema terms glossary">
        {SCHEMA_GLOSSARY.map((term) => (
          <div key={term.technicalName} className="schema-glossary__item">
            <dt>
              {term.plainLabel} <code>{term.technicalName}</code>
            </dt>
            <dd>{term.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
