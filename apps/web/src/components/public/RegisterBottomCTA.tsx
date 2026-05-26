import { Icon } from "../ui/Icon";

export interface RegisterBottomCTAProps {
  readonly responderUrl: string;
}

export function RegisterBottomCTA({ responderUrl }: RegisterBottomCTAProps) {
  return (
    <section data-component="register-bottom-cta" aria-labelledby="register-bottom-cta-heading">
      <h2 id="register-bottom-cta-heading">準備はできましたか？</h2>
      <p>入力時間は 5〜10 分です。途中で保存されないため、まとまった時間でご回答ください。</p>
      <a
        href={responderUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-role="register-bottom-cta"
        className="ui-button ui-button-primary ui-button-lg"
      >
        <Icon name="external-link" size="sm" />
        Google フォームを開く
      </a>
    </section>
  );
}
