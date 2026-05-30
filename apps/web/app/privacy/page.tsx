// serial-05 / task-c: /privacy — blueprint 09e:561-620
// /privacy 静的ページ。task-12 で LegalProse primitive を経由して typography 統一。
// 文面は法務確認後に更新する想定（現時点は最小限の暫定版）。
// task-c で公開シェル（PublicHeader + PublicFooter）を mount し session-aware ナビ復活。

import type { Metadata } from "next";

import { LegalProse } from "../../src/components/legal/LegalProse";
import { PublicHeader } from "../../src/components/public/PublicHeader";
import { PublicFooter } from "../../src/components/public/PublicFooter";
import { getAuthView } from "../../src/lib/auth-view/getAuthView";

export const metadata: Metadata = {
  title: "プライバシーポリシー | UBM 兵庫支部会",
  description: "UBM 兵庫支部会のプライバシーポリシー",
};

export default async function PrivacyPage() {
  const authView = await getAuthView();
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-testid="public-shell"
      data-route-group="public"
      data-theme="warm"
      data-auth-state={authView.kind}
    >
      <header data-shell="topbar">
        <PublicHeader authView={authView} />
      </header>
      <main data-page="privacy" data-route="public" data-section-rhythm="comfortable">
        <LegalProse>
          <h1>プライバシーポリシー</h1>
          <p>
            UBM
            兵庫支部会（以下「当会」）は、会員管理サイトの運営にあたり、利用者の個人情報を以下の方針に基づいて取り扱います。
          </p>

          <h2>1. 取得する情報</h2>
          <ul>
            <li>Google アカウントによる認証情報（メールアドレス、表示名、プロフィール画像）</li>
            <li>Google フォーム経由で入力された会員登録情報</li>
            <li>サイト利用時のアクセスログ（最低限のもの）</li>
          </ul>

          <h2>2. 利用目的</h2>
          <ul>
            <li>会員認証および会員ステータスの確認</li>
            <li>会員間の情報共有および連絡</li>
            <li>サービスの安定運用および不正利用の防止</li>
          </ul>

          <h2>3. 第三者提供</h2>
          <p>法令に基づく場合を除き、本人の同意なく第三者へ提供することはありません。</p>

          <h2>4. 取得した情報の管理</h2>
          <p>
            取得した個人情報は Cloudflare
            のインフラ上で適切に管理し、不正アクセス・漏洩・改ざん等の防止に努めます。
          </p>

          <h2>5. 開示・訂正・削除</h2>
          <p>
            会員本人からの求めに応じ、合理的な範囲で個人情報の開示・訂正・削除に対応します。お問い合わせは
            Google フォームの再回答または管理者宛に直接ご連絡ください。
          </p>

          <h2>6. 本ポリシーの改定</h2>
          <p>
            本ポリシーは予告なく改定されることがあります。改定後の内容は本ページにて公開します。
          </p>

          <p>
            <a href="/" data-role="back">
              トップに戻る
            </a>
          </p>
        </LegalProse>
      </main>
      <footer data-shell="footer">
        <PublicFooter />
      </footer>
    </div>
  );
}
