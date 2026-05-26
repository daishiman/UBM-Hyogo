// task-12: 入会登録 Google Form responderUrl への外部 CTA
// 不変条件 #7: 外部 link 遷移（target="_blank" + rel="noopener noreferrer"）。iframe 不採用
import { Icon } from "../ui/Icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/Card";

export interface RegisterHeroCalloutProps {
  readonly responderUrl: string;
  readonly sectionCount: number;
  readonly fieldCount: number;
}

export function RegisterHeroCallout({
  responderUrl,
  sectionCount,
  fieldCount,
}: RegisterHeroCalloutProps) {
  return (
    <section data-component="register-callout" className="register-callout">
      <Card>
        <CardHeader>
          <p className="eyebrow">Google Forms</p>
          <CardTitle>Google フォームでプロフィール情報をご登録ください</CardTitle>
          <CardDescription>
            ご回答いただいた内容は本サイトに取り込まれます。所要時間は 5〜10 分ほどです。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="register-callout__metrics" aria-label="フォーム概要">
            <div>
              <dt>セクション</dt>
              <dd>{sectionCount}</dd>
            </div>
            <div>
              <dt>設問</dt>
              <dd>{fieldCount}</dd>
            </div>
          </dl>
        </CardContent>
        <CardContent>
          <p className="register-callout__consent">
            フォーム内の同意項目は <code>publicConsent</code> と{" "}
            <code>rulesConsent</code> です。公開掲載と利用規約を確認して送信してください。
          </p>
        </CardContent>
        <CardFooter>
          <a
            href={responderUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-role="register-cta"
            className="ui-button ui-button-primary ui-button-lg"
          >
            <Icon name="external-link" size="sm" />
            Google フォームを開く
          </a>
          <a href="/" className="ui-button ui-button-ghost ui-button-lg">
            <Icon name="arrow-left" size="sm" />
            トップに戻る
          </a>
        </CardFooter>
      </Card>
    </section>
  );
}
