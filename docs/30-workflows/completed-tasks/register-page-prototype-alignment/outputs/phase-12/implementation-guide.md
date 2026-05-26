# Implementation guide

## 概要

`/register` ページを `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx`
の `MemberFormPage` に整合させる実装ガイド。HERO eyebrow + ステップグリッド + 既存
CTA callout + FormPreview + FAQ + bottom CTA の 6 セクション構成へ組替える。

## なぜこの変更が必要か（中学生レベル説明）

入会案内ページ（/register）は「Google Form に飛ぶための入り口」です。今のページは
リンク 1 つしか目立たないので、お試しデザインに合わせて「3 つのステップ」「よくある質問」
「もう一度フォームへ進むボタン」を足して、読みやすくします。色やボタンの形は既に決まって
いるルール（OKLch トークン）から拾うだけで、新しい部品は作りません。

## 対象

| Path | 種別 |
| --- | --- |
| `apps/web/app/(public)/register/page.tsx` | 更新（セクション組替） |
| `apps/web/src/components/public/RegisterStepGrid.tsx` | 新規（Server Component） |
| `apps/web/src/components/public/RegisterFaq.tsx` | 新規（Server Component） |
| `apps/web/src/components/public/RegisterBottomCTA.tsx` | 新規（Server Component） |
| `apps/web/playwright/tests/register-prototype-alignment.spec.ts` | 新規（smoke + axe） |

## 影響範囲

- ルート: `/register`（public segment のみ）
- API: `/public/form-preview`（既存・契約不変）
- D1: 直接アクセスなし
- 認証: 影響なし（未認証ページ）
- デザイントークン: OKLch 既存トークンのみ使用

## 前提条件

- `apps/web/src/styles/tokens.css` の OKLch トークンが正本（HEX 直書き禁止）。
- `apps/web/src/components/public/RegisterHeroCallout.tsx` と
  `apps/web/src/components/public/FormPreviewSections.tsx` の現行 API を変えない。
- プロトタイプ `claude-design-prototype/pages-member.jsx` を design language 正本として使用。
- 既存 API endpoint surface (`/public/form-preview`) のみ利用。

## 実装詳細

### page.tsx のセクション組替

```tsx
export default async function RegisterPage() {
  const { preview, responderUrl, previewError } = await loadRegisterData();

  return (
    <main data-page="register" className="stack-lg" data-route="public" data-section-rhythm="comfortable">
      <header className="page-head">
        <p className="eyebrow">REGISTER</p>
        <h1>UBM 兵庫支部会への登録</h1>
        <p className="muted">Google Form 回答から自動同期・ログイン・マイページ確認までを一括ご案内します。</p>
      </header>
      <RegisterHeroCallout responderUrl={responderUrl} />
      <RegisterStepGrid />
      {previewError ? (
        <p role="alert" data-role="preview-error">{previewError}</p>
      ) : preview ? (
        <FormPreviewSections preview={preview} />
      ) : null}
      <RegisterFaq />
      <RegisterBottomCTA responderUrl={responderUrl} />
    </main>
  );
}
```

### RegisterStepGrid

3 step を Card primitive で並べる Server Component。`stack-md` + grid utility のみ使用し、
新しいスタイルは作らない。step は `1. Google Form 回答 / 2. 自動反映 / 3. ログインして確認`
の 3 つに固定。

### RegisterFaq

`<details>` ベースの FAQ セクション。質問 3 件は静的配列で持つ:

1. 回答内容の修正はどうすればいい?
2. 公開情報と会員限定情報の違いは?
3. 公開を止めたい / 退会したい場合は?

文言は `apps/web/src/components/public/RegisterFaq.tsx` 内 const として持つ
（admin-managed data には昇格させない）。

### RegisterBottomCTA

`responderUrl` への `target="_blank"` リンクを配置する。
不変条件 #7（外部リンク遷移、iframe 不採用）に従う。

## コード例

新 primitive はいずれも以下のパターン:

```tsx
import { Card } from "@/components/ui/Card";

export function RegisterStepGrid() {
  return (
    <section data-component="register-step-grid" className="stack-md">
      <h2 className="section-title">登録の流れ</h2>
      <ol className="register-step-grid">
        {STEPS.map((step) => (
          <li key={step.id}>
            <Card>
              <p className="step-no">STEP {step.no}</p>
              <p className="step-title">{step.title}</p>
              <p className="muted">{step.desc}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

## 設定

- 環境変数追加なし。
- `apps/web/wrangler.toml` 変更なし。
- `next.config` / `tsconfig` 変更なし。
- design-tokens.css 変更なし（既存 OKLch トークン参照のみ）。

## 検証

| Command | 目的 |
| --- | --- |
| `mise exec -- pnpm typecheck` | 新 primitive の型整合 |
| `mise exec -- pnpm lint` | ESLint / a11y / token gate |
| `mise exec -- pnpm --filter @ubm-hyogo/web verify:design-tokens` | HEX 直書き混入検知 |
| `pnpm --filter @ubm-hyogo/web exec playwright test register-prototype-alignment.spec.ts --project=desktop-chromium` | smoke + axe |
| `bash scripts/verify-pr-ready.sh` | PR pre-flight gate |

期待する Phase 11 evidence:

- `outputs/phase-11/screenshots/register-desktop.png`
- `outputs/phase-11/screenshots/register-mobile.png`
- `outputs/phase-11/evidence/playwright-report/results.json`
- `outputs/phase-11/evidence/axe-results.json`
- `outputs/phase-11/manual-test-result.md`

## 参考リンク

- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx`
- 親ワークフロー: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- design tokens 仕様: `docs/00-getting-started-manual/specs/design-tokens.md`
- 既存 page: `apps/web/app/(public)/register/page.tsx`
- 既存 RegisterHeroCallout: `apps/web/src/components/public/RegisterHeroCallout.tsx`
- 既存 FormPreviewSections: `apps/web/src/components/public/FormPreviewSections.tsx`
