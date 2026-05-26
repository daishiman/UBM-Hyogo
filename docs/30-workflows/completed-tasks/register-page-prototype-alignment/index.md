---
workflow_id: register-page-prototype-alignment
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
spec_classification: implementation_spec
created_at: 2026-05-26
---

# register-page-prototype-alignment — `/register` ページのプロトタイプ整合

## 実装区分

`[実装区分: 実装仕様書]`

理由: `apps/web/app/(public)/register/page.tsx` と `apps/web/src/components/public/` 配下に
新規 primitive 接続 / セクション追加が伴うため、コード変更必須（CONST_004 デフォルト）。
`docs-only` ではない。

## 概要

`docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の `MemberFormPage`
が定義する登録案内 UI（HERO eyebrow + ステップ説明 + フォーム導線 + FormPreview + FAQ +
bottom CTA）と現在の `/register` ページ実装の乖離を解消する。プロトタイプの primitive
構成・rhythm・トーンを正本に、既存 OKLch トークン / 既存 API（`/public/form-preview`）
のみで再構築する。

親ワークフロー `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` の task-12 系列に
属し、CONST_007「単一サイクル完了」に従って本サイクル内で完了させる。

## 現状確認（2026-05-26 時点・最新コード）

| セクション | プロトタイプ要素 | 現状 (`apps/web/app/(public)/register/page.tsx`) |
|------------|------------------|------------------------------------------------|
| HERO eyebrow | `REGISTER` eyebrow + `登録の流れ` 見出し + ステップ説明 muted | eyebrow / h1 / muted 1 行のみ。ステップの視覚化なし |
| ステップグリッド | 3-step grid（フォーム回答 → 自動同期 → ログイン → マイページ確認） | テキスト 1 文に圧縮。grid primitive 未配置 |
| Form CTA callout | `RegisterHeroCallout` + 副次リンク + フォーム ID/section 数表示 | `RegisterHeroCallout` 接続済（責務範囲 OK） |
| FormPreview セクション | `FormPreviewSections` + section ヘッダ + question 件数バッジ | `FormPreviewSections` 接続済（責務範囲 OK） |
| FAQ | プロトタイプの想定問答（3 件: 締切 / 会費 / 個人情報 / 退会） | **未配置** |
| 注意書き | privacy / terms link + 個人情報取扱の補足 muted | `/login` 案内 1 行のみ |
| bottom CTA | Google Form responderUrl への再 CTA + 戻る導線 | **未配置** |
| 共通 | `data-section-rhythm="comfortable"` / `stack-lg` | 設定済（責務範囲 OK） |

`/register` のグローバル layout 由来要素（`PublicHeader` / `PublicFooter`）は `(public)/layout.tsx`
で共通配置済みのため本タスクの対象外。

## 仕様書ファイル一覧

| Phase | ファイル |
|-------|---------|
| 1 | `phase-1-requirements.md` |
| 2 | `phase-2-design.md` |
| 3 | `phase-3-design-review.md` |
| 4 | `phase-4-test-plan.md` |
| 5 | `phase-5-implementation.md` |
| 6 | `phase-6-test-additions.md` |
| 7 | `phase-7-coverage.md` |
| 8 | `phase-8-refactor.md` |
| 9 | `phase-9-qa.md` |
| 10 | `phase-10-final-review.md` |
| 11 | `phase-11-manual-test.md` |
| 12 | `phase-12-documentation.md` |
| 13 | `phase-13-pr.md` |

## スコープ

今回サイクルで完了（CONST_007）:

- 更新: `apps/web/app/(public)/register/page.tsx`（セクション組替 + 新 primitive 接続）
- 既存維持: `apps/web/src/components/public/RegisterHeroCallout.tsx`
- 既存維持: `apps/web/src/components/public/FormPreviewSections.tsx`
- 新規: `apps/web/src/components/public/RegisterStepGrid.tsx`
- 新規: `apps/web/src/components/public/RegisterFaq.tsx`
- 新規: `apps/web/src/components/public/RegisterBottomCTA.tsx`
- Playwright smoke 1 ケース追加: `/register` 各セクション可視 + accessible name 検証
- Phase 11 evidence: Playwright screenshot + axe 結果 + manual test result

先送りなし。FAQ の追加データ集約・StepGrid 共通化等は本タスク内で完結する責務に閉じ込めるため、
別タスク化は不要（Phase 12 未タスク検出で再確認）。

## 不変条件適合性

| # | 条件 | 本タスクの適合 |
|---|------|----------------|
| 1 | 実フォーム schema をコードに固定しすぎない | UI セクションのみ追加。schema 参照は既存 `FormPreviewSections` 経由のみ |
| 2 | consent キーは `publicConsent` / `rulesConsent` に統一 | 本タスクで consent 入力 UI は追加しない（Google Form 側で完結） |
| 3 | `responseEmail` は system field 扱い | UI 側では一切露出させない |
| 4 | Google Form schema 外データは admin-managed | FAQ 文言は静的 i18n リソース扱いで admin-managed と区別 |
| 5 | D1 直接アクセス禁止 | 該当なし（既存 `fetchPublic` 経由のみ） |
| 6 | GAS prototype は本番仕様に昇格させない | 参照しない |
| 7 | Google Form 再回答が本人更新の正式経路 | bottom CTA も `responderUrl` への `target="_blank"` で誘導 |
| 8 | テストは `*.spec.{ts,tsx}` のみ | Playwright spec も `.spec.ts` で追加 |
| 9 | admin form input は `FormField` 経由 | 本タスクは public segment のため対象外 |
| 10 | admin mutation は `@/features/admin/hooks/useAdminMutation` | 本タスクは public segment のため対象外 |

加えて UI prototype alignment MVP recovery 共通の不変条件にも適合:

- 既存 API endpoint surface のみ利用（`/public/form-preview`）
- OKLch トークン正本化（`apps/web/src/styles/tokens.css` のみ参照、HEX 直書き禁止）
- プロトタイプ正本順位の維持（`claude-design-prototype/` を design language 正本）
- `apps/web` から D1 binding 直接アクセス禁止

## 実装対象ファイル

- `apps/web/app/(public)/register/page.tsx`（編集）
- `apps/web/src/components/public/RegisterHeroCallout.tsx` → `RegisterHeroCallout.tsx`（**rename + 再設計**。Phase 2 設計の正本判断。詳細は下記 reconciliation 参照）
- `apps/web/src/components/public/FormPreviewSections.tsx`（編集 — collapsible 化 + visibility chip）
- `apps/web/src/components/public/RegisterStepGrid.tsx`（新規）
- `apps/web/src/components/public/RegisterFaq.tsx`（新規）
- `apps/web/src/components/public/RegisterBottomCTA.tsx`（新規）
- `apps/web/playwright/tests/register-prototype-alignment.spec.ts`（新規）

## Reconciliation note（Phase 2 設計と Phase 5 仕様の整合）

並列エージェントによる仕様書生成時、`RegisterHeroCallout` 周りで以下の差異が発生したため、ここで **Phase 2 設計の判断を正本** として固定する:

| 観点 | Phase 1-3（設計正本） | Phase 5 以降の表記 | 採用 |
|------|----------------------|--------------------|------|
| ファイル名 | `RegisterHeroCallout.tsx`（rename） | `RegisterHeroCallout.tsx` 維持の表記が混在 | **`RegisterHeroCallout.tsx` へ rename を採用** |
| 既存 spec | `RegisterHeroCallout.component.spec.tsx` → `RegisterHeroCallout.component.spec.tsx` へ rename | 既存 spec を編集の表記が混在 | **rename + 既存ケースを継承** |
| import path 更新箇所 | `apps/web/app/(public)/register/page.tsx` のみ | 同左 | 同左 |
| data-component / data-role | `data-component="register-callout"` / `data-role="register-cta"` を **不変**として継承 | 同左 | 同左（既存 spec/E2E への影響を最小化） |

実装着手時のチェック:
- Phase 5 のテキスト中で `RegisterHeroCallout`（旧名）と書かれていても、実装は `RegisterHeroCallout` に置換する。
- data-attribute は変更しないため、selector ベースの既存 Playwright/E2E は破壊されない。
