import { SCHEMA_REVIEW_TERMS, plainLabel } from "./schemaReviewTerms";

const GUIDE_TERMS = ["stableKey", "questionId", "alias", "resolve", "backfill", "rollback"];

export function SchemaReviewGuide() {
  return (
    <section className="ui-card card-pad-lg" aria-labelledby="schema-guide-h">
      <div className="eyebrow">このページでできること</div>
      <h2 id="schema-guide-h" className="h-section">
        フォームの設問変更を、過去データと繋げて整理します
      </h2>
      <ol className="schema-review-guide-flow" data-component="schema-review-guide-flow">
        <li>フォームの設問が増減・変更されたことを自動で見つけます</li>
        <li>新しい設問に{plainLabel("stableKey")}を割り当てます</li>
        <li>割り当てると、過去の回答が新しい設問に自動で対応づきます</li>
      </ol>
      <dl className="schema-review-glossary" data-component="schema-review-glossary">
        {GUIDE_TERMS.map((key) => {
          const term = SCHEMA_REVIEW_TERMS[key]!;
          return (
            <div key={key}>
              <dt>{plainLabel(key)}</dt>
              <dd>{term.description}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
