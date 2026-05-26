---
phase: 2
title: 設計
workflow_id: register-page-prototype-alignment
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 2 — 設計

[実装区分: 実装仕様書]

## 1. ファイル配置

| Path | 種別 | 役割 |
|------|------|------|
| `apps/web/app/(public)/register/page.tsx` | 改修 | 5 セクション構成を一直線に並べる Server Component |
| `apps/web/src/components/public/RegisterHeroCallout.tsx` | 改修（旧 `RegisterCallout.tsx` を rename） | Hero CTA + consent 表記（`publicConsent` / `rulesConsent` 維持） |
| `apps/web/src/components/public/RegisterStepGrid.tsx` | 新規 | How it works 3-step grid |
| `apps/web/src/components/public/FormPreviewSections.tsx` | 改修 | collapsible details + visibility chip + count chip header |
| `apps/web/src/components/public/RegisterFaq.tsx` | 新規 | 3 問 accordion |
| `apps/web/src/components/public/RegisterBottomCTA.tsx` | 新規 | dark themed bottom CTA |
| `apps/web/src/components/public/__tests__/RegisterHeroCallout.component.spec.tsx` | 改修（rename） | 旧 RegisterHeroCallout テストを継承（TC-U-09/10/invariants#2） |
| `apps/web/src/components/public/__tests__/RegisterStepGrid.component.spec.tsx` | 新規 | 3-step 描画 / mono 番号 / 説明文 |
| `apps/web/src/components/public/__tests__/RegisterFaq.component.spec.tsx` | 新規 | 3 details / summary 文言 |
| `apps/web/src/components/public/__tests__/RegisterBottomCTA.component.spec.tsx` | 新規 | 外部リンク target/rel / dark theme data-attribute |
| `apps/web/src/components/public/__tests__/FormPreviewSections.component.spec.tsx` | 改修 | header chip 3 種 / 初期 open / visibility chip |

> **判断**: rename を選択する理由は、`RegisterHeroCallout` の役割が「Card に同意項目を列挙する」から「プロトタイプの Hero CTA（radial-gradient + serif h2 + 2 ボタン）」へ大きく変わるため、命名と責務を一致させる方が後続レビュー摩擦が少ない。旧名は test fixture / docs 以外に外部参照が無い前提（page.tsx のみ）。

## 2. ページ全体構造

```
apps/web/app/(public)/register/page.tsx
└─ <main data-page="register" data-route="public" data-section-rhythm="comfortable" className="stack-lg">
   ├─ <header className="page-head"> eyebrow + h1 + muted   ── 既存維持
   ├─ <RegisterHeroCallout responderUrl />                  ── プロト L91-L114
   ├─ <RegisterStepGrid />                                  ── プロト L116-L133
   ├─ {previewError ? <p role="alert" data-role="preview-error"> : <FormPreviewSections preview={preview} />}
   ├─ <RegisterFaq />                                       ── プロト L180-L200
   └─ <RegisterBottomCTA responderUrl />                    ── プロト L202-L214
```

末尾の `<p>ログイン済みの方は…</p>` 行は `RegisterBottomCTA` の下に小さく残すか、`RegisterBottomCTA` 内補助文として吸収する（採用案: `RegisterBottomCTA` 配下に `<p className="small">` で吸収。プロトタイプには無いが既存挙動の互換のため文言は維持）。

## 3. コンポーネント設計

### 3.1 RegisterHeroCallout

```tsx
// apps/web/src/components/public/RegisterHeroCallout.tsx
// 不変条件 #2: consent キーは publicConsent / rulesConsent
// 不変条件 #7: 外部 link 遷移（target="_blank" + rel="noopener noreferrer"）

export interface RegisterHeroCalloutProps {
  responderUrl: string;
}

export function RegisterHeroCallout({ responderUrl }: RegisterHeroCalloutProps) {
  return (
    <section data-component="register-hero-callout" className="register-hero">
      <div className="register-hero__bg" aria-hidden="true" />
      <div className="register-hero__body">
        <span data-role="hero-chip" className="chip chip--accent chip--dot">
          Google Forms
        </span>
        <h2 className="register-hero__title">
          Googleフォームで<br />
          プロフィール情報をご登録ください
        </h2>
        <p className="register-hero__lead">
          ご回答いただいた内容は、自動で本サイトに反映されます。
          <strong>所要時間は5〜10分ほど</strong>です。
        </p>
        <p className="register-hero__consent">
          フォーム内の同意項目（<code>publicConsent</code> /{" "}
          <code>rulesConsent</code>）にチェックして送信してください。
        </p>
        <div className="register-hero__actions">
          <a
            href={responderUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-role="register-cta"
            className="btn btn--primary btn--lg"
          >
            Googleフォームを開く
          </a>
          <a href="/" data-role="back-home" className="btn btn--ghost btn--lg">
            トップに戻る
          </a>
        </div>
      </div>
    </section>
  );
}
```

- スタイルは `apps/web/src/styles/tokens.css` 由来 CSS 変数 + `apps/web/src/styles/globals.css`（または同 register 用 CSS module）で実装。radial-gradient は `background: radial-gradient(circle, color-mix(in oklch, var(--accent) 16%, transparent), transparent 70%);` を `.register-hero__bg` に適用。
- `data-role="register-cta"` を保持し既存テスト assertion を pass させる。
- consent 文の挿入位置は CTA 直前に置き、`publicConsent` / `rulesConsent` の生キー文字列を `<code>` で残す。

### 3.2 RegisterStepGrid

```tsx
// apps/web/src/components/public/RegisterStepGrid.tsx
const STEPS = [
  { n: "01", t: "Googleフォームで回答", d: "上のボタンからフォームを開いて、ご自身のペースで回答ください。" },
  { n: "02", t: "自動反映（最大15分）", d: "ご回答は本サイトに自動取り込みされ、メンバー一覧・詳細ページに掲載されます。" },
  { n: "03", t: "ログインして確認", d: "ご登録のメールアドレスで本サイトにログインすると、マイページから公開内容をご確認いただけます。" },
] as const;

export function RegisterStepGrid() {
  return (
    <section data-component="register-step-grid" className="register-steps">
      <p className="eyebrow">HOW IT WORKS</p>
      <h2 className="h-section">登録の流れ</h2>
      <ol className="register-steps__grid">
        {STEPS.map((s) => (
          <li key={s.n} className="register-steps__item" data-step={s.n}>
            <span className="mono register-steps__num">STEP {s.n}</span>
            <h3 className="register-steps__title">{s.t}</h3>
            <p className="register-steps__desc">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- `<ol>` を採用し semantic な順序を持たせる（プロトは `div` だが、step は明確な順序付きリスト）。
- 3-column grid は `grid-template-columns: repeat(3, minmax(0, 1fr))` を `.register-steps__grid` に。

### 3.3 FormPreviewSections（改修）

```tsx
// apps/web/src/components/public/FormPreviewSections.tsx
import type { z } from "zod";
import { FormPreviewViewZ } from "@ubm-hyogo/shared";

export type FormPreviewView = z.infer<typeof FormPreviewViewZ>;
type Field = FormPreviewView["fields"][number];

export interface FormPreviewSectionsProps {
  preview: FormPreviewView;
}

const VISIBILITY_LABEL: Record<string, string> = {
  public: "公開",
  member: "会員",
  admin: "管理用",
};
const VISIBILITY_LONG_LABEL: Record<string, string> = {
  public: "公開",
  member: "会員のみ",   // ← 既存 spec が「会員のみ」を assert しているため field 行は短縮 "会員"、header は別途
  admin: "管理者のみ",
};

export function FormPreviewSections({ preview }: FormPreviewSectionsProps) {
  const grouped = new Map<string, { sectionKey: string; sectionTitle: string; fields: Field[] }>();
  for (const f of preview.fields) {
    const existing = grouped.get(f.sectionKey);
    if (existing) existing.fields.push(f);
    else grouped.set(f.sectionKey, { sectionKey: f.sectionKey, sectionTitle: f.sectionTitle, fields: [f] });
  }

  const counts = {
    public: preview.fields.filter((f) => f.visibility === "public").length,
    member: preview.fields.filter((f) => f.visibility === "member").length,
    total: preview.fields.length,
  };

  return (
    <section data-component="form-preview-sections" className="form-preview">
      <header className="form-preview__header">
        <div>
          <p className="eyebrow">FORM CONTENTS</p>
          <h2 className="h-section">フォームの設問（プレビュー）</h2>
          <p className="form-preview__lead">
            Google Form 構成を以下の {preview.sectionCount} セクションで把握できます。
          </p>
        </div>
        <div className="form-preview__counts" role="group" aria-label="項目数サマリー">
          <span data-tone="info" className="chip">公開 {counts.public}項目</span>
          <span data-tone="stone" className="chip">会員限定 {counts.member}項目</span>
          <span data-tone="outline" className="chip">全 {counts.total}項目</span>
        </div>
      </header>
      <div className="form-preview__sections">
        {[...grouped.values()].map((section, i) => (
          <details
            key={section.sectionKey}
            data-section-key={section.sectionKey}
            open={i === 0}
            className="form-preview__section"
          >
            <summary className="form-preview__summary">
              <span className="mono form-preview__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="form-preview__title">{section.sectionTitle}</span>
              <span className="form-preview__count">{section.fields.length}項目</span>
            </summary>
            <ul className="form-preview__fields">
              {section.fields.map((field) => (
                <li key={field.stableKey} data-stable-key={field.stableKey} className="form-preview__field">
                  <span data-role="label">{field.label}</span>
                  <span
                    data-role="visibility"
                    data-visibility={field.visibility}
                    data-tone={field.visibility === "public" ? "info" : field.visibility === "member" ? "stone" : "warn"}
                    className="chip chip--sm"
                  >
                    {VISIBILITY_LONG_LABEL[field.visibility] ?? field.visibility}
                  </span>
                  {field.required ? <span data-role="required">必須</span> : null}
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

> **既存テスト互換**: `data-section-key` / `data-stable-key` / `data-role="visibility"` / `data-role="required"` / `data-visibility` を維持。`VISIBILITY_LONG_LABEL` で `公開` / `会員のみ` / `管理者のみ` 文字列を field 行に出すことで、既存 happy-path spec が pass する。empty case で `<p>` に sectionCount 数字を含める要件も維持（`.form-preview__lead` 内）。

### 3.4 RegisterFaq

```tsx
// apps/web/src/components/public/RegisterFaq.tsx
const FAQS = [
  {
    q: "回答内容の修正はどうすればいい？",
    a: "同じメールアドレスで再度Googleフォームに回答すると、古い回答は自動的に新しい回答に上書きされます。再掲載に手続きは不要です。",
  },
  {
    q: "公開情報と会員限定情報の違いは？",
    a: "「公開」項目は本サイトの誰でも閲覧可能です。「会員限定」項目はログインしたメンバーのみ閲覧可能です。「管理用」項目は管理者のみが参照します。",
  },
  {
    q: "公開を止めたい / 退会したい場合は？",
    a: "ログイン後のマイページから、公開停止または退会申請を送っていただけます。",
  },
] as const;

export function RegisterFaq() {
  return (
    <section data-component="register-faq" className="register-faq">
      <p className="eyebrow">FAQ</p>
      <h2 className="h-section">よくあるご質問</h2>
      <div className="register-faq__list">
        {FAQS.map((f, i) => (
          <details key={i} className="register-faq__item">
            <summary className="register-faq__summary">{f.q}</summary>
            <p className="register-faq__answer">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
```

### 3.5 RegisterBottomCTA

```tsx
// apps/web/src/components/public/RegisterBottomCTA.tsx
// 不変条件 #7: 外部 link 遷移

export interface RegisterBottomCTAProps {
  responderUrl: string;
}

export function RegisterBottomCTA({ responderUrl }: RegisterBottomCTAProps) {
  return (
    <section data-component="register-bottom-cta" className="register-bottom-cta" data-theme="dark">
      <h3 className="register-bottom-cta__title">準備はできましたか？</h3>
      <p className="register-bottom-cta__lead">
        入力時間は5〜10分です。途中で保存されないのでまとまった時間でご回答ください。
      </p>
      <a
        href={responderUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-role="bottom-cta"
        className="btn btn--accent btn--lg"
      >
        Googleフォームを開く
      </a>
      <p className="register-bottom-cta__note">
        ログイン済みの方はそのまま <a href="/login">/login</a> に進んでください。
      </p>
    </section>
  );
}
```

- dark theme は `data-theme="dark"` + CSS `[data-theme="dark"] { background: var(--text); color: var(--panel); border-color: var(--text); }` で表現（HEX 禁止）。
- 末尾の `/login` 誘導は既存 page 文言を吸収。

## 4. page.tsx 改修

```tsx
import type { Metadata } from "next";
import type { z } from "zod";
import { FormPreviewViewZ } from "@ubm-hyogo/shared";

import { buildPageMetadata } from "@/lib/seo/site-metadata";
import { FormPreviewSections } from "../../../src/components/public/FormPreviewSections";
import { RegisterHeroCallout } from "../../../src/components/public/RegisterHeroCallout";
import { RegisterStepGrid } from "../../../src/components/public/RegisterStepGrid";
import { RegisterFaq } from "../../../src/components/public/RegisterFaq";
import { RegisterBottomCTA } from "../../../src/components/public/RegisterBottomCTA";
import { FORM_RESPONDER_URL } from "../../../src/lib/constants/form";
import { fetchPublic } from "../../../src/lib/fetch/public";

type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

export const dynamic = "force-dynamic";
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "入会案内",
    description: "UBM 兵庫支部会への入会フォーム案内。Google Form に遷移します",
    path: "/register",
  });
}

export default async function RegisterPage() {
  let preview: FormPreviewView | null = null;
  let responderUrl: string = FORM_RESPONDER_URL;
  let previewError: string | null = null;

  try {
    preview = await fetchPublic<FormPreviewView>("/public/form-preview", { revalidate: 600 });
    responderUrl = preview.responderUrl ?? FORM_RESPONDER_URL;
  } catch (_err) {
    previewError =
      "フォーム情報を取得できませんでした。登録は下のリンクから進めてください。";
  }

  return (
    <main
      data-page="register"
      data-route="public"
      data-section-rhythm="comfortable"
      className="stack-lg"
    >
      <header className="page-head">
        <p className="eyebrow">REGISTER</p>
        <h1>メンバー登録</h1>
        <p className="muted">
          回答はGoogleフォームから行います。数分で完了します。
        </p>
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

- h1 / muted 文言はプロトタイプ L86-L87 に合わせ「メンバー登録」「回答はGoogleフォームから行います。数分で完了します。」に更新。既存「UBM 兵庫支部会への登録」「登録は次の流れで進みます…」は How it works セクションに吸収されているため重複を排除。

## 5. スタイル方針（tokens.css 経由のみ）

| 用途 | 採用 var |
|------|----------|
| 主要テキスト | `var(--text)` |
| 補助テキスト | `var(--text-2)` / `var(--text-3)` |
| アクセント | `var(--accent)` |
| 区切り線 | `var(--border)` |
| Card 背景 | `var(--surface)` / `var(--panel)` |
| 危険・必須マーカー | `var(--danger)` |
| 成功 chip 背景 | `var(--ok-soft)` / `var(--ok)` |
| Bottom CTA 反転 | `data-theme="dark"` → `background: var(--text)` + `color: var(--panel)` |

`bg-[#...]` / `text-[#...]` / HEX 直書きは **一切しない**。CI `verify-design-tokens` で grep される。

## 6. a11y 設計

| 要素 | 仕様 |
|------|------|
| `<details>` / `<summary>` | native semantics 利用。`aria-expanded` は browser が自動付与 |
| 外部リンク | `rel="noopener noreferrer"` 必須。視覚的 icon を付けるが `aria-hidden` で読み上げ除外 |
| Chip（count / visibility） | テキスト内に意味を含むため `aria-label` 不要 |
| Hero radial-gradient 装飾 | `<div aria-hidden="true">` |
| Step grid | `<ol>` で順序を semantics 化 |
| FAQ heading | `<h2>` 1 階層、各 details 内は本文段落のみ |
| Bottom CTA | `<h3>` で `<h2>` 配下の階層整合 |

## 7. データフロー

```
RegisterPage (Server Component)
  ├─ fetchPublic("/public/form-preview", { revalidate: 600 })
  │     ├─ success → preview / responderUrl
  │     └─ throw   → previewError = "...取得できませんでした..."
  ├─ <RegisterHeroCallout responderUrl />       ← 取得失敗時は FORM_RESPONDER_URL fallback
  ├─ <RegisterStepGrid />                       ← 固定文言
  ├─ <FormPreviewSections preview /> | <p role="alert">
  ├─ <RegisterFaq />                            ← 固定文言
  └─ <RegisterBottomCTA responderUrl />         ← 取得失敗時も同じ fallback
```

## 8. 既存システム影響範囲

| 範囲 | 影響 |
|------|------|
| `apps/web/app/(public)/register/page.tsx` | 構成変更。`generateMetadata` / `revalidate` / `fetchPublic` 呼び出しは維持 |
| `apps/web/src/components/public/RegisterHeroCallout.tsx` | `RegisterHeroCallout.tsx` に rename + 改修。外部参照は page.tsx のみ |
| `apps/web/src/components/public/FormPreviewSections.tsx` | 内部構造改修。Public API（props 型）と `data-*` 属性は互換維持 |
| 既存 spec | 既存 assertion は維持しつつ、改修箇所に対し header chip 3 種 / 初期 open / collapsible details の新 assertion を追加 |
| `verify-design-tokens` CI gate | 新規スタイル定義は CSS 変数経由のため pass |
| Workers SSR / OpenNext bundle | 全 component が Server Component（`"use client"` 不要） |
| visual baseline | `/register` の baseline は Phase 11 で再取得し、本 workflow の evidence として管理する |
