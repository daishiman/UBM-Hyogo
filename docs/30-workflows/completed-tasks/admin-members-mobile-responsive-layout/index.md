---
task_id: admin-members-mobile-responsive-layout
spec_classification: implementation_spec
state: implemented_local_evidence_captured
created_at: 2026-06-10
task_type: implementation
visual_category: VISUAL
implementation_mode: new
related_issue: null
branch: feat/admin-members-mobile-responsive-layout
---

# admin 会員管理（/admin/members）モバイルレスポンシブ・レイアウト修正

staging `/admin/members`（会員管理）が携帯（≤640px）でテーブルが横にはみ出し、列（特に「公開」列）が見切れて操作不能になっている問題を、Phase 1-13 の単一責務実装仕様書群へ分解した実装仕様書ディレクトリ。後続の実装プロンプト（`03.実装.md`）が、このディレクトリだけを読めば確実にコードへ反映できる粒度で記述する。

## 実装区分

`[実装区分: 実装済みローカル evidence captured]` — モバイルでのカードレイアウト切替を `apps/web` 表現層（TSX 属性追加 + `globals.css` の `@media` カード化CSS + focused test + Playwright spec）へ反映済み。runtime screenshot / commit / PR は user-gated。

## ゴール（要旨）

- モバイル（≤640px）: 会員一覧を**カードレイアウト**（各会員1枚の縦積みカード）へ切替。横はみ出し・列見切れを解消。
- デスクトップ（≥641px）: **現行テーブルを完全維持**（DOM・スタイル・機械可読id 不変）。
- 方式: DOM は単一 `<table>` のまま、CSS `@media (max-width: 640px)` で `display: block` 化してカード見た目へ変換（DOM二重化なし＝testid 重複なし）。

## 真因

`apps/web` 表現層のレスポンシブCSS欠如のみ。`/admin/members` API endpoint / D1 / Google Form schema は**無罪・不変**。`MembersTable.tsx` の 8列 `<table>` にレスポンシブクラスが一切なく、ラッパー `overflow-hidden` で横スクロールも不可なため、狭幅で右側の列が見切れる。

## スコープ

### 対象（4ファイル）

| # | パス | 種別 |
| - | ---- | ---- |
| F1 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集（属性追加のみ） |
| F2 | `apps/web/src/styles/globals.css` | 編集（`@media` カード化CSS追加） |
| F3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | 編集（TC-MT-21〜24 追加） |
| F4 | `apps/web/playwright/tests/admin-members-mobile.spec.ts` | 新規（mobile visual smoke） |

### スコープ外（Phase 12 未タスク候補 OOS-1）

他 admin 一覧テーブル（`/admin/tags`・`/admin/meetings`・`/admin/requests`・`/admin/audit` 等）の同種レスポンシブ化。**別画面・別コンポーネント・別責務**のため今回サイクルから分離（「分量」理由ではない）。

## Phase 一覧

| Phase | 名称 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計 | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA / CI gate | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / Evidence | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | PR | [phase-13-pr.md](phase-13-pr.md) |

## SSOT

全 Phase の正本は [outputs/shared-context.md](outputs/shared-context.md)。命名・不変条件・受入条件・対象ファイルはここを唯一の参照元とする。

## 不変条件（要旨）

- I-1: API endpoint / D1 / Google Form schema / auth middleware 不変。
- I-2: 機械可読id（`admin-members-row-*` / 各 `aria-label` / `chip-dot` / `member-state-chip-row`）逐語不変。
- I-3: 行・セルの DOM 順序・個数不変。属性追加のみ。
- I-4: 色・寸法は OKLch トークン経由。HEX / `bg-[#xxx]` 禁止。
- I-5: breakpoint は CSS `@media` 正本。JS / matchMedia 分岐を作らない。
- I-6: デスクトップ表示は現行完全維持（リグレッションゼロ）。
- I-7: `apps/web` から D1 直接アクセス禁止を継続。
- I-8: 既存 unit test（TC-MT-01〜20）を1件も壊さない。

## 受入条件（要旨）

AC-1〜AC-9 は [outputs/shared-context.md §5](outputs/shared-context.md) に定義。要点: モバイルでカード表示・横はみ出しゼロ（AC-1）／全項目ラベル付き可視（AC-2）／公開トグル操作可能（AC-3）／デスクトップ完全維持（AC-4）／属性追加のみ（AC-5）／トークン経由のみ（AC-6）／既存+追加テスト緑（AC-7）／API差分ゼロ（AC-8）／typecheck・lint・vitest 緑（AC-9）。
