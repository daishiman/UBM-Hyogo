import type { ReactElement } from "react";
import {
  schemaHistoryGlossary,
  schemaHistoryPurposeSteps,
} from "../../lib/admin/schemaHistoryGlossary";

export function SchemaHistoryPurposeExplainer(): ReactElement {
  return (
    <section
      className="schema-history-purpose"
      data-testid="schema-history-purpose-explainer"
      aria-labelledby="schema-history-purpose-heading"
    >
      <div>
        <p className="schema-history-purpose__eyebrow">対応づけの記録</p>
        <h2 id="schema-history-purpose-heading">この画面で分かること</h2>
        <p className="schema-history-purpose__lead">
          Google
          フォームの設問が変わったとき、管理者がどの設問を同じ意味として紐付けたかを確認する監査画面です。
        </p>
      </div>

      <ol className="schema-history-purpose__steps" aria-label="設問の紐付け履歴の流れ">
        {schemaHistoryPurposeSteps.map((step, index) => (
          <li key={step.title} className="schema-history-purpose__step">
            <span className="schema-history-purpose__step-index">{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <dl className="schema-history-purpose__glossary">
        {schemaHistoryGlossary.map((item) => (
          <div key={item.term} className="schema-history-purpose__term">
            <dt>{item.term}</dt>
            <dd>{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
