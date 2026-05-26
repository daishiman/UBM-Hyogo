---
phase: 5
title: 実装計画
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 5 — 実装計画

[実装区分: 実装仕様書]

## 0. 前提（precondition）

- Phase 1-3 で確定した AC / 設計 / レビューに従う。
- CLAUDE.md 不変条件 #2（consent キーは `publicConsent` / `rulesConsent`）、#7（外部 link 遷移 + iframe 不採用）を維持。
- UI prototype alignment 不変条件 #2（OKLch トークン正本化 / HEX 直書き禁止）、#3（プロトタイプ正本順位）、#4（D1 直接アクセス禁止）を維持。
- 新規 design token は追加しない（既存 `apps/web/src/styles/tokens.css` の変数 + `globals.css` の utility のみ使用）。

## 1. 変更対象ファイル一覧（CONST_005 §1）

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/(public)/register/page.tsx` | 編集 | 組立順序を Hero CTA → StepGrid → FormPreviewSections → Faq → BottomCTA に。preview 失敗時 `role="alert"` は維持 |
| `apps/web/src/components/public/RegisterHeroCallout.tsx` | 編集 | Hero CTA 化（Chip eyebrow + serif heading + 大型 Primary Button + 「トップに戻る」ghost Button）|
| `apps/web/src/components/public/FormPreviewSections.tsx` | 編集 | `<details>` collapsible + 集計 Chip（公開 / 会員限定 / 全件）+ section heading ナンバリング |
| `apps/web/src/components/public/RegisterStepGrid.tsx` | 新規 | 3 ステップカード（STEP 01/02/03）|
| `apps/web/src/components/public/RegisterFaq.tsx` | 新規 | FAQ collapsible リスト |
| `apps/web/src/components/public/RegisterBottomCTA.tsx` | 新規 | inverted カラー Bottom CTA |
| `apps/web/src/components/public/__tests__/RegisterHeroCallout.component.spec.tsx` | 編集 | Phase 4 RC-01..06 を反映 |
| `apps/web/src/components/public/__tests__/FormPreviewSections.component.spec.tsx` | 編集 | Phase 4 FPS-01..06 を反映 |
| `apps/web/src/components/public/__tests__/RegisterStepGrid.component.spec.tsx` | 新規 | Phase 4 RSG-01..04 |
| `apps/web/src/components/public/__tests__/RegisterFaq.component.spec.tsx` | 新規 | Phase 4 RF-01..04 |
| `apps/web/src/components/public/__tests__/RegisterBottomCTA.component.spec.tsx` | 新規 | Phase 4 RBC-01..04 |

> 新規/編集合計 11 ファイル。`apps/web/src/styles/` への追加は原則行わない（既存 utility class で組み立て可能）。どうしても必要な場合は `tokens.css` を増やさず `globals.css` 末尾に最小 utility を追加し、Phase 8 でレビュー。

## 2. 各 component の関数シグネチャ / props / 擬似 JSX（CONST_005 §2）

### 2.1 RegisterHeroCallout（Hero CTA 化）

```tsx
export interface RegisterHeroCalloutProps {
  responderUrl: string;
}

export function RegisterHeroCallout({ responderUrl }: RegisterHeroCalloutProps): JSX.Element {
  return (
    <section data-component="register-callout" className="card card-pad-lg register-hero">
      <div className="register-hero__bg" aria-hidden="true" />
      <div className="register-hero__inner">
        <Chip tone="accent" dot>Google Forms</Chip>
        <h2 className="serif register-hero__title">
          Google フォームで<br/>プロフィール情報をご登録ください
        </h2>
        <p className="body">
          ご回答内容は自動で本サイトに反映されます。所要時間は5〜10分ほどです。
          登録フォーム内で <code>publicConsent</code> と <code>rulesConsent</code> の同意項目にチェックして送信してください。
        </p>
        <div className="btn-row">
          <a
            href={responderUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-role="register-cta"
            className="btn btn-primary btn-lg"
          >
            <Icon name="external" size={15} aria-hidden="true" />
            Google フォームを開く
          </a>
          <Button variant="ghost" size="lg" asChild>
            <a href="/">トップに戻る</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

エラー時 / loading 時の分岐は本 component 内では持たない（page.tsx 側で previewError を `role="alert"` の段落として描画する既存挙動を維持）。

### 2.2 RegisterStepGrid（新規）

```tsx
export interface RegisterStep {
  n: string;        // "01" | "02" | "03"
  title: string;
  description: string;
}

export interface RegisterStepGridProps {
  steps?: RegisterStep[]; // default は内部定数
}

export function RegisterStepGrid({ steps = DEFAULT_STEPS }: RegisterStepGridProps): JSX.Element {
  return (
    <section data-component="register-step-grid" className="card card-pad-lg">
      <p className="eyebrow">HOW IT WORKS</p>
      <h2 className="h-section">登録の流れ</h2>
      <ol className="grid-3 register-step-grid__list">
        {steps.map((s) => (
          <li key={s.n} className="card-flat" data-role="register-step">
            <span className="mono register-step-grid__num">STEP {s.n}</span>
            <p className="register-step-grid__title">{s.title}</p>
            <p className="small muted">{s.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

`DEFAULT_STEPS` は同ファイル内（または `apps/web/src/lib/constants/register.ts` 新規）に集約。

### 2.3 FormPreviewSections（collapsible 化）

```tsx
export function FormPreviewSections({ preview }: FormPreviewSectionsProps): JSX.Element {
  const grouped = groupBySectionKey(preview.fields); // 既存ロジック保持
  const counts = countByVisibility(preview.fields);  // {public, member, admin, total}

  return (
    <section data-component="form-preview-sections" className="card card-pad-lg">
      <header className="row-between">
        <div>
          <p className="eyebrow">FORM CONTENTS</p>
          <h2 className="h-section">フォームの設問（プレビュー）</h2>
        </div>
        <div className="row-wrap">
          <Chip tone="info" data-role="count-public">公開 {counts.public}項目</Chip>
          <Chip data-role="count-member">会員限定 {counts.member}項目</Chip>
          <Chip outline data-role="count-total">全 {counts.total}項目</Chip>
        </div>
      </header>
      <p className="muted">Google Form 構成を以下の {preview.sectionCount} セクションで把握できます。</p>
      <div className="stack-sm">
        {grouped.map((section, i) => (
          <details
            key={section.sectionKey}
            data-section-key={section.sectionKey}
            open={i === 0}
            className="card-flat"
          >
            <summary>
              <span className="mono">{String(i + 1).padStart(2, "0")}</span>
              <span className="form-preview__section-title">{section.sectionTitle}</span>
              <span className="small muted">{section.fields.length}項目</span>
              <Icon name="chevronDown" size={14} aria-hidden="true" />
            </summary>
            <ul>
              {section.fields.map((field) => (
                <li key={field.stableKey} data-stable-key={field.stableKey}>
                  <span data-role="label">{field.label}</span>
                  {field.required ? <span data-role="required">必須</span> : null}
                  <Chip
                    size="sm"
                    tone={field.visibility === "public" ? "info" : field.visibility === "admin" ? "warn" : "default"}
                    data-role="visibility"
                    data-visibility={field.visibility}
                  >
                    {VISIBILITY_LABEL[field.visibility] ?? field.visibility}
                  </Chip>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
```

不変条件: `stableKey` 経由でのみ field を参照する既存原則を維持。

### 2.4 RegisterFaq（新規）

```tsx
export interface RegisterFaqItem {
  q: string;
  a: string;
}

export interface RegisterFaqProps {
  items?: RegisterFaqItem[];
}

export function RegisterFaq({ items = DEFAULT_FAQ }: RegisterFaqProps): JSX.Element {
  return (
    <section data-component="register-faq" className="card card-pad-lg">
      <p className="eyebrow">FAQ</p>
      <h2 className="h-section">よくあるご質問</h2>
      <div className="stack-sm">
        {items.map((f, i) => (
          <details key={i} data-role="register-faq-item" className="card-flat">
            <summary>
              <Icon name="info" size={14} aria-hidden="true" />
              <span>{f.q}</span>
              <Icon name="chevronDown" size={13} aria-hidden="true" />
            </summary>
            <p className="body">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
```

### 2.5 RegisterBottomCTA（新規）

```tsx
export interface RegisterBottomCTAProps {
  responderUrl: string;
}

export function RegisterBottomCTA({ responderUrl }: RegisterBottomCTAProps): JSX.Element {
  return (
    <section
      data-component="register-bottom-cta"
      data-variant="inverted"
      className="card card-pad-lg register-bottom-cta"
    >
      <h3 className="h-section">準備はできましたか？</h3>
      <p className="body">入力時間は5〜10分です。途中で保存されないのでまとまった時間でご回答ください。</p>
      <a
        href={responderUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-role="register-bottom-cta-link"
        className="btn btn-accent btn-lg"
      >
        <Icon name="external" size={15} aria-hidden="true" />
        Google フォームを開く
      </a>
    </section>
  );
}
```

## 3. page.tsx の組立順序（CONST_005 §3）

```tsx
return (
  <main data-page="register" className="stack-lg" data-route="public" data-section-rhythm="comfortable">
    <header className="page-head">
      <p className="eyebrow">MEMBER REGISTRATION</p>
      <h1>UBM 兵庫支部会への登録</h1>
      <p className="muted">回答は Google フォームから行います。数分で完了します。</p>
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

    <p>
      ログイン済みの方はそのまま <a href="/login">/login</a> に進んでください。
    </p>
  </main>
);
```

`generateMetadata` / `dynamic` / `revalidate` / `fetchPublic` の fallback 挙動は変更しない。

## 4. 使用する既存 primitive / tokens（CONST_005 §4）

| 種別 | 名前 | 用途 |
|------|------|------|
| primitive | `Card` / `CardContent` / etc. (`@/components/ui/Card`) | 廃止。`card card-pad-lg` utility に置換（プロトタイプ整合）|
| primitive | `Chip` (`@/components/ui/Chip`) | eyebrow / 集計 / visibility |
| primitive | `Button` (`@/components/ui/Button`) | ghost「トップに戻る」|
| primitive | `Icon` (`@/components/ui/Icon`) | external / chevronDown / info |
| token (CSS変数) | `var(--accent)`, `var(--text)`, `var(--text-2)`, `var(--text-3)`, `var(--panel)`, `var(--border)`, `var(--danger)` | 装飾 |
| utility class | `card`, `card-pad-lg`, `card-flat`, `stack-sm`, `stack-lg`, `grid-3`, `row-between`, `row-wrap`, `eyebrow`, `serif`, `body`, `small`, `muted`, `mono`, `btn`, `btn-primary`, `btn-accent`, `btn-lg`, `btn-row`, `h-section`, `page-head` | 既存 |

新規 token / 新規 primitive は追加しない。`register-hero__*` / `register-bottom-cta` 等の BEM-like class は **既存 token / utility のみで構成**し、`@apply` または最小限の宣言で `globals.css` 末尾にまとめる（OKLch 色は変数参照のみ）。

## 5. ローカル実行・検証コマンド（CONST_005 §5）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web test -- src/components/public/__tests__/RegisterHeroCallout
mise exec -- pnpm --filter web test -- src/components/public/__tests__/FormPreviewSections
mise exec -- pnpm --filter web test -- src/components/public/__tests__/RegisterStepGrid
mise exec -- pnpm --filter web test -- src/components/public/__tests__/RegisterFaq
mise exec -- pnpm --filter web test -- src/components/public/__tests__/RegisterBottomCTA
mise exec -- pnpm --filter web build
bash scripts/verify-pr-ready.sh
```

追加 grep gate（HEX 直書き 0 件検査）:

```bash
grep -nE 'bg-\[#|text-\[#|#[0-9a-fA-F]{6}' \
  apps/web/src/components/public/Register*.tsx \
  apps/web/src/components/public/FormPreviewSections.tsx \
  apps/web/app/\(public\)/register/page.tsx
# 期待: 0 件
```

## 6. DoD (Definition of Done) （CONST_005 §6）

- `mise exec -- pnpm --filter web typecheck` が 0 error。
- `mise exec -- pnpm --filter web lint` が 0 error / 0 warning。
- 上記 5 件の `--filter web test` が all green。
- `mise exec -- pnpm --filter web build` が成功（OpenNext Workers 互換、`next build --webpack` 経路）。
- HEX 直書き grep gate が 0 件。
- `publicConsent` / `rulesConsent` の文字列が `/register` 描画 DOM に維持されている（RC-03 で assert）。
- `responderUrl` fallback (`FORM_RESPONDER_URL`) が依然機能（preview fetch 失敗時にも CTA が生きる）。
- preview 取得失敗時 `role="alert"` メッセージが維持（既存 page.tsx 挙動）。
- 全 CTA リンクが `target="_blank"` + `rel="noopener noreferrer"`。
- 既存 snapshot 差分は意図的更新としてレビュー可能（snapshot 名・diff 内容を Phase 9 / Phase 10 で記録）。
- `bash scripts/verify-pr-ready.sh` が success。
