# Phase 3 成果物 — 設計レビュー main

> 正本: [`../../_shared-context.md`](../../_shared-context.md)。Phase 2 設計の妥当性検証と GO/NO-GO 判定。

## 1. 不変条件適合チェック（SSOT §2）

| # | 不変条件 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 1 | apps/web 内のみ・apps/api / packages/shared diff 空 | ✓ | F1–F7 はすべて apps/web 配下。新 endpoint・D1・Form 変更なし |
| 2 | D1 直接アクセス禁止・`Stats` props / `PublicStatsView` 型不変 | ✓ | データは `/public/stats` 経由のまま・型契約不変 |
| 3 | DOM contract 保持（eyebrow 除く） | ✓ | 変更は eyebrow 削除 + ラベル文字列のみ。data-component/data-stat/aria/role/id/href/testid 不変 |
| 4 | OKLch トークン正本・HEX 0 | ✓ | CSS は削除のみ・色追加 0。`verify-design-tokens` 緑維持 |
| 5 | 新規 component 0 / 新規 primitive 0 | ✓ | 既存 5 コンポーネント編集のみ |
| 6 | 単一サイクル単一 PR（CONST_007） | ✓ | 実装7 + テスト6 を 1 サイクルで完了・バックログ分離なし |
| 7 | eyebrow 削除は他画面非波及 | ✓ | 対象コンポーネントはホームからのみ利用（grep 確認済み） |

## 2. 代替案レビュー（要約）

検討した 2 案（A: 翻訳して残す / B: 装飾維持で翻訳）と採用案（削除）の比較・却下理由は [`alternatives.md`](./alternatives.md) を正とする。要点:

- ユーザーは AskUserQuestion 2026-06-11 で「直下に日本語見出しがあり重複・最もすっきり」を理由に **overline 削除**を選択。
- A は重複表示が残り「直感的にわかる」要求に弱い。B は装飾を強める方向でギミック不要の意図に逆行。

## 3. リスクと緩和

| ID | リスク | 緩和策 |
| --- | --- | --- |
| R-1 | eyebrow 削除後の見出し上端余白崩れ（特に CTA heading margin-top） | Phase 2 D-6 で margin-top 0 を設計済 + Phase 11 スクリーンショットで視覚確認（user-gated・SSOT §5） |
| R-2 | eyebrow assertion を持つ既存テスト（T1–T4）の破壊 | Phase 4 で同一サイクルにテスト更新（eyebrow 不在 assert へ転換） |
| R-3 | dead CSS の取り残し | SSOT §1D の削除対象4・保持1 をセレクタ文字列で特定して削除・行番号依存しない |
| R-4 | 英語表記の取り残し回帰 | SSOT §4-4 の英語残存 grep（ヒット 0 期待）で機械検出 |

## 4. GO/NO-GO 判定

- 不変条件 1–7 すべて適合・代替案検討済・リスク R-1..R-4 に緩和策あり。
- **判定: GO**（Phase 4 テスト作成へ進行）。
