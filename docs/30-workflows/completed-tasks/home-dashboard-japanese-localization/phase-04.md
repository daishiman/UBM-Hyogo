# Phase 4 — テスト作成

> 正本: [`_shared-context.md`](./_shared-context.md) §1E（テスト更新）。本フェーズは TDD 観点でテスト更新方針（T1–T4）を具体化する。
> 状態: **implemented_local_evidence_captured**

## 目的

新文言（公開メンバー / 事業フェーズ / 年間の支部会 / 最終データ更新 / 自動で最新化）と eyebrow 不在を assert するよう、既存 4 テストファイル（T1–T4）の変更ケースを TDD 観点で具体化する。各テストの「旧 assertion → 新 assertion → 期待値」を [`outputs/phase-04/test-plan.md`](./outputs/phase-04/test-plan.md) に表で固定し、命名規則（`*.component.spec.tsx`・`*.spec.{ts,tsx}` のみ・`*.test` 禁止）との整合を確認する。

## 実行タスク

1. **テスト操作対象の明確化**: これらは**静的レンダリングの DOM 構造 assertion**であり、コンポーネントへ **props 経由**で入力する（内部 state ではない）。`Stats` は `stats` props、`AboutUbm` / `Timeline` / `CallToActionCTA` は固定構造の render。eyebrow の有無は DOM 上の `[data-role="eyebrow"]` 要素数で検証する。
2. **T1 `Stats.component.spec.tsx`**（SSOT §1E）:
   - L69 `toContain("Forms 同期中")` → `toContain("自動で最新化")` に変更。
   - 新規 `it`: 4 ラベルが日本語であることを `[data-stat="members"|"zones"|"meetings"|"sync"] [data-role="label"]` の textContent で assert（`公開メンバー` / `事業フェーズ` / `年間の支部会` / `最終データ更新`）。
3. **T2 `AboutUbm.component.spec.tsx`**（SSOT §1E）:
   - L33-39「renders both eyebrows ABOUT and THREE ZONES」を置換: `[data-role="eyebrow"]` が **0 件**であること + `section-heading` が `事業支援コミュニティ「UBM」` / `UBM区画` であることを assert。
4. **T3 `Timeline.component.spec.tsx`**（SSOT §1E）:
   - L23-25 eyebrow `RECENT MEETINGS` の assert を削除。
   - L36「header still rendered」を `[data-role="eyebrow"]` truthy → `[data-role="section-heading"]`（`最近の支部会`）truthy に変更。
5. **T4 `CallToActionCTA.component.spec.tsx`**（SSOT §1E）:
   - L80-83「eyebrow text 'FOR MEMBERS'」の `it` を削除。
   - L91 `[data-role="eyebrow"]` `.not.toBeNull()` → `.toBeNull()` に変更。
   - L85 の data-role 列挙文言から `eyebrow` を除外。
6. **変更不要/最小更新の確認**: `app/(public)/page.spec.tsx`（全セクション stub 済・FEATURED MEMBERS overline 未 assert）は**変更不要**。`Hero.component.spec.tsx` は Hero の optional eyebrow contract を維持し、サンプル文言だけを日本語へ更新する（SSOT §1E）。
7. **命名規則整合**: 4 ファイルはすべて `*.component.spec.tsx`（`*.spec.{ts,tsx}` 規約・`*.test` 禁止＝不変条件 #8）に合致。新規ファイル作成は無し（既存編集のみ）。
8. **test-plan.md 作成**: ファイル / 旧 assertion / 新 assertion / 期待値の表と、新文言・eyebrow 不在 assertion の列挙を記述する。

## 成果物

- [`outputs/phase-04/main.md`](./outputs/phase-04/main.md) — テスト作成本体（操作対象 props/state 明記・T1–T4 方針・命名規則整合）
- [`outputs/phase-04/test-plan.md`](./outputs/phase-04/test-plan.md) — ファイル別の旧/新 assertion 表 + 新文言・eyebrow 不在 assertion 一覧

## 参照資料

- [`_shared-context.md`](./_shared-context.md) — §1E（T1–T4 行番号付き更新方針）/ §1A,B（新ラベル・バッジ文言）/ §1C（eyebrow 削除）
- `apps/web/src/components/public/__tests__/{Stats,AboutUbm,Timeline,CallToActionCTA}.component.spec.tsx` — 編集対象テスト
- CLAUDE.md 不変条件 #8（`*.spec.{ts,tsx}` のみ・`*.test` 禁止）

## 統合テスト連携

- 本タスクの「統合」は **component レベルの DOM レンダリング統合**であり、focused vitest（SSOT §4-1）が正本。`Stats / AboutUbm / Timeline / CallToActionCTA / page` の 5 ファイルを一括実行する。
- API 統合テストは追加しない（`apps/api` diff 空）。eyebrow 削除・文言置換の回帰は SSOT §4-4 の英語残存 grep（ヒット 0 期待）でも二重に担保する。

## 完了条件

- [ ] T1 で同期バッジ `自動で最新化` と 4 ラベル日本語の assertion を具体化した
- [ ] T2 で `[data-role="eyebrow"]` 0 件 + section-heading 日本語の assertion を具体化した
- [ ] T3 で RECENT MEETINGS assert 削除 + section-heading `最近の支部会` truthy へ転換した
- [ ] T4 で FOR MEMBERS it 削除 + eyebrow `.toBeNull()` + data-role 列挙から eyebrow 除外を具体化した
- [ ] テスト操作対象が props 経由（内部 state ではない）であることを明記した
- [ ] 命名規則（`*.component.spec.tsx`・`*.test` 禁止）との整合と、page spec 変更不要 / Hero spec 最小更新を確認した
- [ ] test-plan.md に旧/新 assertion 表と新文言・eyebrow 不在 assertion 一覧を記述した
