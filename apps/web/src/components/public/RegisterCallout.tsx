// task-12: 入会登録 Google Form responderUrl への外部 CTA
// 不変条件 #2: consent キーは publicConsent / rulesConsent の 2 種のみ
// 不変条件 #7: 外部 link 遷移（target="_blank" + rel="noopener noreferrer"）。iframe 不採用
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/Card";

export interface RegisterCalloutProps {
  responderUrl: string;
}

export function RegisterCallout({ responderUrl }: RegisterCalloutProps) {
  return (
    <section data-component="register-callout" className="register-callout">
      <Card>
        <CardHeader>
          <CardTitle>Google フォームから登録</CardTitle>
          <CardDescription>
            登録フォーム内で次の 2 つの同意項目（<code>publicConsent</code> と
            <code>rulesConsent</code>）にチェックして送信してください。回答内容は自動同期されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="consent-list">
            <li>
              <strong>publicConsent</strong>: 一般会員ディレクトリへの公開掲載に同意
            </li>
            <li>
              <strong>rulesConsent</strong>: 利用規約への同意
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <a
            href={responderUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-role="register-cta"
            className="cta-button"
          >
            Google フォームを開く
          </a>
        </CardFooter>
      </Card>
    </section>
  );
}
