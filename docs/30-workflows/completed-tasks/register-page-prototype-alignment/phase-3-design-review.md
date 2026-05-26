---
phase: 3
title: 設計レビュー
workflow_id: register-page-prototype-alignment
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 3 — 設計レビュー

[実装区分: 実装仕様書]

## 1. レビュー観点 × 判定

| 観点 | 結果 | コメント |
|------|------|---------|
| 要件カバレッジ（FR-01..13） | PASS | Hero / Step / Preview / Faq / BottomCTA の 5 セクションを Phase 2 §3 で網羅。`previewError` / `responderUrl` fallback / page-head は §4 で維持 |
| 不変条件 #2（publicConsent / rulesConsent） | PASS | `RegisterHeroCallout.tsx` の consent 段落で生キーを `<code>` 保持。既存テストの `expect(text).toContain("publicConsent")` を満たす |
| 不変条件 #5（D1 直接禁止） | PASS | 本 task は `/public/form-preview` API のみ消費。D1 binding 参照なし |
| 不変条件 #7（外部リンク） | PASS | Hero / Bottom 両 CTA で `target="_blank"` + `rel="noopener noreferrer"` 維持 |
| 不変条件 #8（spec suffix） | PASS | 新規テストファイル名は全て `.component.spec.tsx` |
| プロトタイプ正本順位 | PASS | 既存 `apps/web/src/components/ui/` primitive を流用し、新規 UI primitive を生やさない（`RegisterHeroCallout` 等は public surface 層で primitive 合成） |
| OKLch トークン純度（NFR-01） | PASS | 色は全て `var(--accent)` / `var(--text)` / `var(--text-2)` / `var(--text-3)` / `var(--border)` / `var(--panel)` / `var(--danger)` 経由。HEX / `bg-[#...]` なし。dark theme は `data-theme="dark"` 経由で token 反転 |
| Workers SSR 互換 | PASS | 全 component が Server Component。`useState` / `useEffect` 不使用。`<details>` は SSR 互換 native element |
| a11y（NFR-07） | PASS | native `<details>` + 装飾 div の `aria-hidden` + 外部リンク `rel` 適切 |
| テスタビリティ | PASS | 全 component に `data-component` 属性 + 既存 `data-role` / `data-stable-key` / `data-visibility` 維持 |
| 既存テスト後方互換 | PASS | Phase 2 §3.1 / §3.3 で既存 assertion（`data-role="register-cta"` / `data-section-key` / `data-stable-key` / `data-role="visibility"` / 文言「公開」「会員のみ」「管理者のみ」「必須」）を全て保持 |
| Workers env 不変条件 | PASS | `apps/web/src/lib/env.ts` 経由の env 参照を新規追加しない（fetch / SEO は既存 helper 経由） |

## 2. 既存テスト影響分析

### 2.1 `RegisterHeroCallout.component.spec.tsx` → `RegisterHeroCallout.component.spec.tsx`

| 既存 case | 影響 | 対応 |
|----------|------|------|
| TC-U-09: CTA `href === responderUrl` | 互換 | rename + `data-role="register-cta"` 維持で pass |
| TC-U-10: `target="_blank"` / `rel` | 互換 | 同上 |
| invariants #2: `publicConsent` / `rulesConsent` テキスト | 互換 | `RegisterHeroCallout` の consent 段落で `<code>` 保持し、`container.textContent` に含める |

**更新方針**: spec ファイル名を rename し、import path を `../RegisterHeroCallout` に更新。assertion ロジックは変更不要。追加で「serif h2 が含まれる」「`<a href="/" data-role="back-home">` が存在する」「`data-component="register-hero-callout"` が存在する」の 3 assertion を新規追加する。

### 2.2 `FormPreviewSections.component.spec.tsx`

| 既存 case | 影響 | 対応 |
|----------|------|------|
| happy: sectionKey でグループ化 / 公開・会員のみ・管理者のみ / 必須 badge | 互換 | `data-section-key` / `data-stable-key` / `data-role="visibility"` / `data-role="required"` + 長尺ラベル文言を維持 |
| empty: header 文言に sectionCount を含む | 互換 | `.form-preview__lead` の `<p>` に sectionCount を埋め込む |
| variant: unknown visibility fallback | 互換 | `VISIBILITY_LONG_LABEL[field.visibility] ?? field.visibility` で同等 fallback を維持 |

**更新方針**: 既存 3 case をそのまま保ちつつ、以下 4 assertion を追加:
1. header の Chip 3 種（公開 / 会員限定 / 全）が描画され、それぞれ counts と一致する
2. 各 section が `<details>` 要素であり、最初の section のみ `open` 属性を持つ
3. `data-component="form-preview-sections"` が存在
4. 各 section に `<summary>` 内の数字（01, 02, ...）が連番で出力される

### 2.3 新規追加 spec

- `RegisterStepGrid.component.spec.tsx`: `<ol>` に 3 つの `<li>` / `STEP 01` `STEP 02` `STEP 03` テキスト / `data-step` 属性
- `RegisterFaq.component.spec.tsx`: 3 つの `<details>` / summary 文言 3 種が全て描画される / details が初期 closed
- `RegisterBottomCTA.component.spec.tsx`: 外部 CTA の `href` / `target` / `rel` / `data-role="bottom-cta"` / `data-theme="dark"` 属性 / 内部 `/login` 補助リンク

## 3. リスク評価 × 緩和

| リスク | 影響度 | 緩和策 |
|--------|--------|--------|
| rename `RegisterHeroCallout → RegisterHeroCallout` で外部参照漏れ | 中 | git grep で `RegisterHeroCallout` を全文検索し、page.tsx 1 箇所のみと確認した上で実装。spec rename も同時に行う |
| `<details>` の `open={i === 0}` が SSR / hydration mismatch を起こす | 低 | 純 server component で `open` は静的に決まるため hydration 対象外。Workers SSR で問題なし |
| dark theme の `data-theme="dark"` が既存 global CSS と競合 | 低 | scope を `[data-component="register-bottom-cta"][data-theme="dark"]` に限定する CSS 設計とする |
| プロトタイプの `Icon name="external"` 等を再現しないと密度が落ちる | 中 | 既存 `apps/web/src/components/ui/Icon.tsx` を任意で流用可能。本 spec では「テキストのみで意味は伝わる」ため Icon 流用は Phase 5 実装判断に委ねる（Phase 1 / 2 では必須にしない） |
| visual baseline 取り直しが他 task の baseline と衝突 | 中 | 本 spec のスコープから baseline 取得を除外。Phase 11 / 別 issue で staging 取得 |
| `FormPreviewSections` 改修で field 行の DOM 階層が変わり既存 selector が壊れる | 中 | `data-section-key` / `data-stable-key` / `data-role="visibility"` / `data-role="required"` の 4 属性は不変として固定し、Playwright e2e でも引き続き使用可能 |

## 4. 代替案 × 採用根拠

### 4.1 rename vs. 旧名維持

- **採用**: `RegisterHeroCallout.tsx` → `RegisterHeroCallout.tsx` rename
- 却下案: 旧名のまま機能を Hero CTA に置き換える
- 根拠: 旧名は「同意項目を Card に列挙する callout」の意で命名されており、新責務（radial-gradient Hero + 2 CTA）と乖離する。後続レビューと grep 性のため命名を一致させる。外部参照は page.tsx 1 箇所のみで rename コストは低い。

### 4.2 `<details>` native vs. React state 制御

- **採用**: `<details>` native
- 却下案: `useState` で開閉制御
- 根拠: Server Component 維持（Workers SSR 互換 + bundle 削減）/ keyboard a11y（Space / Enter）が browser native でサポート / `open={i === 0}` 初期表示も SSR で完結。

### 4.3 3 component 分割 vs. 1 巨大 component

- **採用**: 5 component（Hero / Step / Preview / Faq / Bottom）に分割
- 却下案: page.tsx 内に inline 化
- 根拠: 単体テストの粒度が下がる / 再利用性低下 / Phase 11 視覚検証時に component 単位の Storybook-like 検証が不能。

### 4.4 新規 UI primitive 追加 vs. CSS-only 装飾

- **採用**: 新規 UI primitive を追加しない（CSS で表現）
- 却下案: `HeroCard` / `StepNumber` 等を `apps/web/src/components/ui/` に追加
- 根拠: CLAUDE.md「UI prototype alignment / MVP recovery」不変条件 #3「プロトタイプ未掲載画面でも同じ primitives 群で構成し、新規 primitive を生やさない」と整合。`/register` 専用の装飾は public surface 層に閉じる。

## 5. Open Questions

1. **Hero / Bottom CTA に `Icon name="external"` を入れるか**: プロトタイプには icon あり。本 spec では Phase 5 実装判断に委ね、視覚密度を見て決定する。仕様としては「icon は任意、入れる場合は `aria-hidden="true"` を付与」とする。
2. **RegisterFaq の details を 1 つだけ初期 open にするか**: プロトタイプは全て closed。本 spec も全 closed を採用（ユーザー操作で能動的に開かせる）。
3. **page h1 文言**: プロトタイプ「メンバー登録」と既存「UBM 兵庫支部会への登録」のどちらを正本とするか。本 spec はプロトタイプ準拠で「メンバー登録」を採用。SEO の `generateMetadata` の `title: "入会案内"` は別レイヤーのため変更しない。
4. **末尾「ログイン済みの方は…」文言の扱い**: `RegisterBottomCTA` 内に `<p className="register-bottom-cta__note">` として吸収する案を採用。プロトタイプには無いが既存挙動の互換のため文言は保持。
5. **visual baseline 取得の責務**: 本 spec は実装＋単体テストまで。Phase 11 で staging visual baseline を再取得するが、required check への追加可否は別 issue で判断する。

## 6. 判定

**PASS** — Phase 4（テスト計画）へ進行可。

- 全観点 PASS
- 既存テストへの後方互換が確認できた
- リスク 6 件は Phase 5 実装時の判断・運用で吸収可能なレベル
- Open Questions は Phase 5 着手時に確定する性質のものであり、Phase 2 / 3 の設計を blocker にはしない
