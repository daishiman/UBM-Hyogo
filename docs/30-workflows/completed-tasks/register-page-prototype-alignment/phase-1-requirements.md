---
phase: 1
title: 要件定義
workflow_id: register-page-prototype-alignment
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

根拠: `apps/web/app/(public)/register/page.tsx` および `apps/web/src/components/public/RegisterHeroCallout.tsx` / `FormPreviewSections.tsx` 配下のコードを変更するため CONST_004 デフォルト（実装仕様書）を適用する。docs-only スコープではない。

## 0. 前提

- `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の `MemberFormPage` (L68〜L217) を `/register` の正本デザインとする。
- 既存 page `apps/web/app/(public)/register/page.tsx` は Server Component で `RegisterHeroCallout` + `FormPreviewSections` + `previewError` のみを描画している（プロトタイプ 5 セクションのうち page-head と FormPreview 相当の 2 セクション分しか実装されていない）。
- OKLch design tokens（task-09）正本稼働中。`apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/design-tokens.md` が正本。
- `apps/web/src/components/ui/` には `Card` / `Chip` / `Button` / `Icon` 等の primitive が既に揃っており、プロトタイプ `primitives.jsx` の役割を担う。
- `apps/web/app/(public)/error.tsx` / `loading.tsx` は issue-880 で配置済（本 task では触らない）。
- CLAUDE.md「UI prototype alignment / MVP recovery」スコープに含まれる 19 routes のうち `/register` を対象とする。
- `_RegisterHeroCallout.component.spec.tsx_` / `_FormPreviewSections.component.spec.tsx_` が `apps/web/src/components/public/__tests__/` に存在する。既存 invariant assertion（`publicConsent` / `rulesConsent` / `target="_blank"` / sectionKey group / visibility ラベル）は維持する。

## 1. 解決すべき要件

`/register` ページの DOM を、プロトタイプ `MemberFormPage` と完全に整合する 5 セクション構成へ再構築する。デザイン正本（プロトタイプ）と現状 page のギャップ（Hero CTA radial-gradient / How it works 3-step / FAQ accordion / Bottom dark CTA / 設問プレビューの collapsible details + visibility chip）を全て埋める。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `apps/web/app/(public)/register/page.tsx` の `<header className="page-head">` 部分は維持し、eyebrow `REGISTER` / h1 / muted の 3 行を保つ | プロトタイプ L83-L89 整合済み |
| FR-02 | プロトタイプ「Hero CTA」セクション（L91-L114）を `RegisterHeroCallout` として再構成する。`Chip tone="accent"` で `Google Forms` / serif h2 / 説明文 / 2 ボタン（外部リンク "Googleフォームを開く" + ghost "トップに戻る"）/ radial-gradient 装飾を含む | プロトタイプ正本順位 |
| FR-03 | プロトタイプ「How it works」セクション（L116-L133）を `RegisterStepGrid` として新規追加する。`STEP 01/02/03` の 3-step grid 構造、各 step は mono 番号 + タイトル + 説明文 | プロトタイプ L116-L133 |
| FR-04 | プロトタイプ「Form 設問プレビュー」セクション（L135-L178）の構造を `FormPreviewSections` で実装し直す。header 行に eyebrow `FORM CONTENTS` + h2、右側に Chip 3 種（公開 N項目 / 会員限定 N項目 / 全 N項目）。本体は section ごとの `<details>` collapsible で、最初の section のみ `open`。各 field 行に visibility chip（`公開` / `会員` / `管理用` の 3 値）と `*必須` ラベル | プロトタイプ L135-L178 |
| FR-05 | プロトタイプ「FAQ」セクション（L180-L200）を `RegisterFaq` として新規追加する。3 問の `<details>` accordion。固定文言: 回答修正 / 公開と会員限定の差 / 退会導線 | プロトタイプ L184-L188 |
| FR-06 | プロトタイプ「Bottom CTA」セクション（L202-L214）を `RegisterBottomCTA` として新規追加する。dark theme card（`background: var(--text)` / `color: var(--panel)`）+ 中央寄せ + 大型外部リンクボタン | プロトタイプ L202-L214 |
| FR-07 | `RegisterHeroCallout` と `RegisterBottomCTA` の Google Form 外部リンクは `responderUrl` prop で受け取り、`target="_blank"` + `rel="noopener noreferrer"` を維持する | 不変条件 #7 |
| FR-08 | `RegisterHeroCallout` は `publicConsent` / `rulesConsent` 表記を本文 or 補足文として表示し、既存テスト `RegisterHeroCallout.component.spec.tsx` の TC-U-09 / TC-U-10 / TC-U-invariants#2 を pass させる（記述位置・言い回しは更新可、キー文字列は保持） | 不変条件 #2 / 既存テスト |
| FR-09 | `FormPreviewSections` は引き続き `preview.fields[].sectionKey` でグルーピングし、`preview.fields[].stableKey` を `data-stable-key` に出力する。既存テスト（happy / empty / unknown fallback）が pass する | 既存テスト保護 |
| FR-10 | `previewError` 時の `<p role="alert" data-role="preview-error">` 表示は維持する（A11y ＋ 既存挙動の互換） | 現状互換 |
| FR-11 | `responderUrl` 解決は現状通り `preview.responderUrl ?? FORM_RESPONDER_URL` の優先順を保つ | 現状互換 |
| FR-12 | 新規 3 component（`RegisterHeroCallout` / `RegisterStepGrid` / `RegisterFaq` / `RegisterBottomCTA`）と改修 1 component（`FormPreviewSections`）は全て `apps/web/src/components/public/` 配下に配置する | プロジェクト規約 |
| FR-13 | 新規 component には `data-component` 属性を付与し、Playwright / 単体テストから addressable にする | 既存パターン（`Hero` / `MemberDetailSections` 等） |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | OKLch トークン正本性。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。色は `var(--accent)` / `var(--text)` / `var(--text-2)` / `var(--text-3)` / `var(--border)` / `var(--panel)` / `var(--danger)` / `var(--ok)` 等の CSS 変数経由のみ |
| NFR-02 | テスト suffix は `*.spec.{ts,tsx}` のみ（不変条件 #8） |
| NFR-03 | `mise exec -- pnpm typecheck` / `lint` exit 0 |
| NFR-04 | `bash scripts/verify-pr-ready.sh` exit 0 |
| NFR-05 | `next build --webpack` で OpenNext Workers bundle build green |
| NFR-06 | `apps/web` の env 参照は `getEnv()` 系経由のみ。本 task は env 参照を増やさない |
| NFR-07 | a11y: `<details>` / `<summary>` の native semantics を活用。`Chip` 等の装飾要素には適切な `aria-label` を付与しない（テキスト内に意味が出ているため二重読み上げを避ける）。外部リンクは `rel="noopener noreferrer"` 必須 |
| NFR-08 | `apps/web` から D1 直接アクセスをしない（不変条件 #5、本 task は既存 `/public/form-preview` API のみ使用） |
| NFR-09 | Google Form 仕様には触れない（不変条件 #7、新規 endpoint 追加禁止） |
| NFR-10 | Workers SSR 安全性: `<details>` は SSR 互換 native element のため client island 化は不要。useState / useEffect は使わない（純 server component で構成） |

## 2. 不変条件

CLAUDE.md「UI prototype alignment / MVP recovery」継承：

1. 既存 API endpoint のみ接続（`/public/form-preview` のみ使用、新規追加なし）
2. OKLch トークン正本化（NFR-01）
3. プロトタイプ正本順位（`apps/web/src/components/ui/` の既存 primitive を流用し、新規 UI primitive を生やさない）
4. D1 直接アクセス禁止

CLAUDE.md ルート「重要な不変条件」継承：

5. 不変条件 #2: consent キーは `publicConsent` / `rulesConsent` の 2 種のみ（FR-08）
6. 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる
7. 不変条件 #7: MVP では Google Form 再回答を本人更新の正式な経路とする。`responderUrl` は外部リンク（`target="_blank"`）
8. 不変条件 #8: 新規 spec は `*.spec.{ts,tsx}` のみ

## 3. ステークホルダー観点

| 系統 | 観点 |
|------|------|
| システム系 | 現状 page は機能要件（CTA + consent 表記 + sections 一覧）は満たすが、プロトタイプの密度と階層が再現されておらず、MVP recovery スコープの完了条件を未達。視覚回帰 baseline も未確立 |
| 戦略系 | `/register` は会員導線の入口であり、訪問者が「5〜10 分の作業量」「自動同期」「公開と会員限定の差」を即座に把握できる UI が必要。FAQ 不在は離脱を増やす |
| 問題解決系 | 真の論点は「primitive を増やさずに primitive を再構成して prototype 5 セクションを構築する」ことであり、CSS-in-JS で inline style を多用するプロトタイプを `var(...)` token 参照に置き換えながら同じ視覚密度を保つかが要 |

## 4. スコープ / 非ゴール

### 4.1 スコープ（単一サイクル内完了 / CONST_007）

- `apps/web/app/(public)/register/page.tsx` の構成変更（既存 import 整理 + 新 component 接続）
- `apps/web/src/components/public/RegisterHeroCallout.tsx` を `RegisterHeroCallout.tsx` にリネーム or 全面改修
- `apps/web/src/components/public/RegisterStepGrid.tsx` 新規追加
- `apps/web/src/components/public/RegisterFaq.tsx` 新規追加
- `apps/web/src/components/public/RegisterBottomCTA.tsx` 新規追加
- `apps/web/src/components/public/FormPreviewSections.tsx` 改修（collapsible details + visibility chip + header count chips）
- 上記に対応する `*.component.spec.tsx` の更新／新規追加

### 4.2 非ゴール

- Google Form 自体の改修（field 追加・順序変更・consent キー変更）
- `apps/api` 配下の改修・新 endpoint 追加
- D1 schema 変更
- `/public/form-preview` API レスポンス shape 変更（`FormPreviewViewZ` への変更）
- 新規 design token / 新規 UI primitive の追加
- `/register` 以外の route（`/`, `/members`, `/login` 等）への波及修正
- visual baseline 取り直し（本タスクでは `register-prototype-alignment.spec.ts` の Phase 11 evidence として取得する）

## 5. 完了条件

- [ ] FR-01 〜 FR-13 全て満たす
- [ ] NFR-01 〜 NFR-10 全て満たす
- [ ] 既存 `RegisterHeroCallout.component.spec.tsx` / `FormPreviewSections.component.spec.tsx` の全 case が pass（更新後を含む）
- [ ] 新規 `RegisterStepGrid.component.spec.tsx` / `RegisterFaq.component.spec.tsx` / `RegisterBottomCTA.component.spec.tsx` を追加
- [ ] `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` exit 0
