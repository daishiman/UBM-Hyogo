import { Icon } from "../ui/Icon";

export interface RegisterFaqItem {
  readonly question: string;
  readonly answer: string;
}

const DEFAULT_FAQ: readonly RegisterFaqItem[] = [
  {
    question: "回答内容の修正はどうすればいい？",
    answer:
      "同じメールアドレスで再度 Google フォームに回答すると、新しい回答として取り込まれます。",
  },
  {
    question: "公開情報と会員限定情報の違いは？",
    answer:
      "公開項目は誰でも閲覧できます。会員限定項目はログインしたメンバーのみ、管理用項目は管理者のみが参照します。",
  },
  {
    question: "公開を止めたい、または退会したい場合は？",
    answer:
      "ログイン後のマイページから公開停止または退会申請を送ってください。",
  },
];

export interface RegisterFaqProps {
  readonly items?: readonly RegisterFaqItem[];
}

export function RegisterFaq({ items = DEFAULT_FAQ }: RegisterFaqProps) {
  return (
    <section data-component="register-faq" aria-labelledby="register-faq-heading">
      <p className="eyebrow">FAQ</p>
      <h2 id="register-faq-heading">よくあるご質問</h2>
      <div className="register-faq-list">
        {items.map((item) => (
          <details key={item.question} className="register-faq-item">
            <summary>
              <Icon name="check" size="sm" />
              <span>{item.question}</span>
              <Icon name="chevron-down" size="sm" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
