export interface RegisterStep {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

const DEFAULT_STEPS: readonly RegisterStep[] = [
  {
    number: "01",
    title: "Google フォームで回答",
    description: "上のボタンからフォームを開いて、ご自身のペースで回答してください。",
  },
  {
    number: "02",
    title: "自動反映",
    description: "回答内容は同期処理で取り込まれ、公開項目はメンバー一覧と詳細ページに反映されます。",
  },
  {
    number: "03",
    title: "ログインして確認",
    description: "登録したメールアドレスでログインすると、マイページから掲載内容を確認できます。",
  },
];

export interface RegisterStepGridProps {
  readonly steps?: readonly RegisterStep[];
}

export function RegisterStepGrid({ steps = DEFAULT_STEPS }: RegisterStepGridProps) {
  return (
    <section data-component="register-step-grid" aria-labelledby="register-steps-heading">
      <p className="eyebrow">How it works</p>
      <h2 id="register-steps-heading">登録の流れ</h2>
      <div className="register-step-grid">
        {steps.map((step) => (
          <article key={step.number} className="register-step-card">
            <p className="mono">STEP {step.number}</p>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
