# Phase 3 — 設計レビュー

> 正本: [`_shared-context.md`](./_shared-context.md)。本フェーズは Phase 2 設計の妥当性を検証し Phase 4 への GO/NO-GO を判定する。
> 状態: **implemented_local_evidence_captured**

## 目的

Phase 2 設計を不変条件・代替案・リスクの観点で検証し、Phase 4（テスト作成）へ進めるかを判定する。eyebrow を「削除」する方針は複数の代替案（翻訳して残す / 装飾を維持して翻訳）を退けた上での決定であり、その経緯と却下理由を [`outputs/phase-03/alternatives.md`](./outputs/phase-03/alternatives.md) に記録する。eyebrow 削除に伴う余白崩れ・テスト破壊のリスクと緩和策を明確化する。

## 実行タスク

1. **不変条件適合チェック**（SSOT §2）:
   - apps/web 内のみ・`apps/api` / `packages/shared` diff 空 ✓
   - D1 直接アクセス禁止・`Stats` props 契約 / `PublicStatsView` 型不変 ✓
   - DOM contract 保持（eyebrow 除く）✓
   - OKLch トークン正本・CSS は削除のみ・HEX 0 ✓
   - 新規 component 0 / 新規 primitive 0 ✓
   - 単一サイクル単一 PR（CONST_007）✓
   - eyebrow 削除はホームのみ利用で他画面非波及 ✓
2. **代替案レビュー**（alternatives.md に記録）:
   - 案 A「英語 overline を翻訳して残す」（例: `ABOUT → 概要`）。
   - 案 B「装飾スタイル（letter-spacing 等の overline 体裁）を維持したまま翻訳」。
   - 採用案「overline 要素ごと削除」。AskUserQuestion 2026-06-11 でユーザーが「直下に日本語見出しがあり重複・最もすっきり」を理由に削除を選択した経緯と、A/B の却下理由（重複が残る・装飾維持はギミック不要の意図に逆行）を明記する。
3. **リスク評価と緩和**:
   - リスク R-1: eyebrow 削除後の見出し上端余白崩れ（特に CTA heading の margin-top）。→ 緩和: Phase 2 D で margin-top 0 を設計済 + Phase 11 スクリーンショットで視覚確認（user-gated）。
   - リスク R-2: eyebrow assertion を持つ既存テスト（T1–T4）の破壊。→ 緩和: Phase 4 で同一サイクルにテスト更新（eyebrow 不在 assert へ転換）。
   - リスク R-3: dead CSS の取り残し。→ 緩和: SSOT §1D の削除対象4・保持1をセレクタ文字列で特定して削除。
4. **GO/NO-GO 判定**: 上記が全て充足する場合 **GO**（Phase 4 へ進行）。

## 成果物

- [`outputs/phase-03/main.md`](./outputs/phase-03/main.md) — 設計レビュー本体（不変条件適合・GO 判定・リスクと緩和）
- [`outputs/phase-03/alternatives.md`](./outputs/phase-03/alternatives.md) — 代替案（翻訳して残す / 装飾維持で翻訳）と却下理由・ユーザー選択経緯

## 参照資料

- [`_shared-context.md`](./_shared-context.md) — §0（デザイン決定の経緯）/ §1D（CSS 削除・CTA 余白）/ §2（不変条件）
- [`phase-02.md`](./phase-02.md) — レビュー対象の設計
- SSOT §5（Phase 11 視覚証跡・余白崩れ確認の正本）

## 統合テスト連携

- レビュー観点に「既存 component spec を破壊しないテスト更新計画があること」を含め、Phase 4 のテスト方針（T1–T4）と整合確認する。
- API 統合テストは新設しないため、統合観点の検証は SSOT §4 のローカル検証コマンド（英語残存 grep / `git diff dev -- apps/api packages/shared` 空）に委ねる。

## 完了条件

- [ ] SSOT §2 の不変条件 1–7 すべてに設計が適合することを確認した
- [ ] 代替案（翻訳して残す / 装飾維持で翻訳）を alternatives.md に記録し却下理由を明記した
- [ ] ユーザーが「削除」を選んだ経緯（AskUserQuestion 2026-06-11）を記録した
- [ ] リスク R-1（余白崩れ）/ R-2（テスト破壊）/ R-3（dead CSS 残置）と緩和策を整理した
- [ ] Phase 4 への GO 判定を記録した
