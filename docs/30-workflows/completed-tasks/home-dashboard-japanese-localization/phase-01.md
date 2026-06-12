# Phase 1 — 要件定義

> 正本: [`_shared-context.md`](./_shared-context.md)。本文書の文言・行番号・方針はすべて SSOT を引用する。
> 状態: **implemented_local_evidence_captured**（ローカル実装・証跡取得済み。commit/PR は user-gated）

## 目的

公開トップ `/`（ホーム画面）で英語表記になっている項目を、非エンジニアの会員にも直感的にわかる日本語へ整えるための要件を確定する。ホバー等のギミックは導入せず（ユーザー明示）、**文言の日本語化**と**意味が重複する英語 overline（eyebrow）の削除**の 2 系統に範囲を限定する。タスク分類・スコープ・既存命名規則・変更ファイル一覧・実装モードを記録し、後続 Phase の判断基準を一意に固定する。

## 実行タスク

1. **タスク分類の確定記録**: 実装区分=実装仕様書（CONST_004 デフォルト・コード変更を伴う）、タスク種別=**VISUAL UI task**（見た目が変わる・apps/web home 表示 + public API 境界補強）、`workflow_state=implemented_local_evidence_captured`。`artifacts.json.metadata` に `taskType:"implementation"` / `visual:true` / `visualEvidence:"VISUAL"` / `implementation_mode:"new"` が記録済みであることを照合する。
2. **ユーザー要求の要約記録**: 「ホーム画面の英語表記を、システムに詳しくない利用者にも直感的にわかる日本語へ。技術的・英語表記は読みにくい。ホバーでブーンと開く等のギミックは不要」（SSOT §0 逐語要約）。
3. **確定デザイン決定の記録**（AskUserQuestion 2026-06-11・SSOT §0）:
   - 見出し上の英語 overline は**削除**し直下の日本語見出しのみにする（重複解消・最もすっきり）。
   - 統計カード4ラベルを `公開メンバー / 事業フェーズ / 年間の支部会 / 最終データ更新` に、同期バッジを `Forms 同期中 → 自動で最新化` に。値・サブ行は現状維持。
4. **スコープ確定**: 対象は公開トップ `/` = `apps/web/app/(public)/page.tsx` が構成する 6 セクションのみ。`apps/api` / `packages/shared` / D1 / Google Form 仕様は不変（SSOT §2-1）。
5. **既存命名規則の記録**: `data-component` / `data-stat` / `data-role` の BEM 風 DOM contract、コンポーネント props は camelCase（`eyebrow` / `title` / `subtitle` 等）。
6. **inventory 転記**: マッピング表（A 統計ラベル / B 同期バッジ / C eyebrow 削除 6 箇所）と変更ファイル一覧（F1–F6 実装 + T1–T4 テスト）を [`outputs/phase-01/inventory.md`](./outputs/phase-01/inventory.md) に転記する。
7. **carry-over 確認**: 本タスクは新規 workflow。前タスクからの未完了引き継ぎは無し（`implementation_mode="new"`）。

## 成果物

- [`outputs/phase-01/main.md`](./outputs/phase-01/main.md) — 要件定義本体（タスク分類・要求要約・スコープ・命名規則・carry-over）
- [`outputs/phase-01/inventory.md`](./outputs/phase-01/inventory.md) — §1 マッピング表（A/B/C）と変更ファイル一覧（F1–F6 / T1–T4）

## 参照資料

- [`_shared-context.md`](./_shared-context.md) — §0（タスク要旨・ユーザー要求・デザイン決定）/ §1（マッピング表）/ §2（不変条件）/ §3（変更ファイル一覧）
- `apps/web/app/(public)/page.tsx` — ホーム構成（6 セクション・Hero への `eyebrow` prop・FEATURED MEMBERS overline）
- `apps/web/src/components/public/Stats.tsx` — 統計カード4ラベル + 同期バッジ
- `apps/web/src/components/public/{AboutUbm,Timeline,CallToActionCTA,Hero}.tsx` — overline を持つセクション

## 統合テスト連携

- 本タスクは**表現層の静的レンダリング**が対象であり、API 統合テストは新設しない（`apps/api` 非接触・SSOT §2-1）。
- 既存の component spec（`Stats/AboutUbm/Timeline/CallToActionCTA.component.spec.tsx`）と `app/(public)/page.spec.tsx` を回帰の正本とし、Phase 4 で更新方針を確定する。
- 統合観点の DoD は SSOT §4 のローカル検証コマンド（focused vitest / typecheck / lint / verify-design-tokens / 英語残存 grep / `git diff dev -- apps/api packages/shared` 空）に集約する。

## 完了条件

- [ ] タスク分類（実装仕様書 / VISUAL UI task / implemented_local_evidence_captured）を main.md に明示記録した
- [ ] ユーザー要求と確定デザイン決定（overline 削除・4 ラベル・同期バッジ）を要約記録した
- [ ] スコープ（公開トップ `/` の 6 セクション・apps/web public API 境界補強のみ）を確定した
- [ ] 既存命名規則（data-role / data-stat / data-component の BEM 風 contract・camelCase props）を記録した
- [ ] inventory.md に §1 マッピング表（A/B/C）と変更ファイル一覧（F1–F6 + T1–T4）を転記した
- [ ] `implementation_mode="new"` と carry-over（前タスクとの差異=新規 workflow）を記録した
