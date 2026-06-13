# Phase 3: 設計レビュー

> SSOT: [`shared-context.md`](./shared-context.md)。Phase 1-2 の設計が Phase 4 へ進める品質かを判定するゲート。

## 目的

Phase 1（要件）と Phase 2（設計）が、4 条件（価値性 / 実現性 / 整合性 / 運用性）と責務境界の観点で Phase 4 へ進める品質に達しているかを判定する。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| 価値性 | ✅ PASS | 非エンジニアのコード入力障壁・画面間の理解コストを下げる（AC-1〜AC-9）。誰のどのコストを下げるか明確（SSOT §2）。 |
| 実現性 | ✅ PASS | 全て apps/web 表現層・既存 primitive 合成・純関数追加で 1 サイクル完了（CONST_007）。新 API/D1/Form なし。 |
| 整合性 | ✅ PASS | 定義（tag master CRUD）/ 割当（queue resolve）の責務境界を維持。state 所有権（`code`/`codeDirty`）が 1 コンポーネントに閉じる。用語集 SSOT 化で文言ドリフトを防ぐ。 |
| 運用性 | ✅ PASS | 用語集 SSOT・純関数の決定論で回帰テストが安定。既存 DOM contract 非破壊で既存 spec を壊さない。 |

## 責務境界レビュー

- `tagCodeAutogen.ts`（純関数・ロジック）と `TagDefinitionCreateForm.tsx`（state/描画）を分離 → テスト容易性確保。
- `tagManagementGlossary.ts`（純データ SSOT）と `TagManagementGuide.tsx`（描画）を分離 → 文言の一元管理。
- C2（命名）は label 文字列のみで副作用最小。

## リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| 日本語表示名でコード自動生成が `tag_<hash>` に倒れ、見栄えが技術的 | code は技術識別子であり非エンジニアが見る主情報は表示名。ヒントで「自動生成（編集可）」を明示。OOS-2 で将来の読み変換を分離。 |
| 自動補完がユーザーの手動入力を上書きする UX 事故 | `codeDirty` フラグで手動編集後は自動上書き停止（AC-2）。 |
| ガイド追加で既存テストの DOM 構造が変わり回帰 | 追加のみ・testid/role/aria 不変（不変条件 §7-7）。Phase 6/9 で既存 spec PASS を確認。 |
| HEX 直書き混入 | OKLch token のみ・`verify:tokens` gate（AC-11）。 |

## 真の論点の再確認

SSOT §2 の一次結論（2 画面の責務関係が非エンジニアに伝わらない）に対し、設計は「責務境界を保ったまま表現層で説明と相互リンクを足す」方針で一貫している。1 画面統合（OOS-1）は API 層を要するため本サイクル外で正しい。

## 実行タスク

- 4 条件（価値性/実現性/整合性/運用性）で Phase 1-2 を評価する。
- 責務境界（ロジック/state/データ/描画の分離）を確認する。
- リスクと緩和策を列挙する。
- Phase 4 進行可否を判定する。

## 参照資料

- [`shared-context.md`](./shared-context.md) §2, §4, §6, §7, §12
- [`phase-1-requirements.md`](./phase-1-requirements.md)
- [`phase-2-design.md`](./phase-2-design.md)

## 成果物

- 本 `phase-3-design-review.md`（4 条件 PASS 判定 + リスク表）。
- Phase 4 進行可否判定: **PASS（進行可）**。

## 統合テスト連携

- Phase 4 のテスト計画は本 Phase のリスク表（手動上書き / 既存 DOM 非破壊 / pattern 適合）を必ずカバーケースに含める。

## 完了条件

- [ ] 4 条件すべて PASS 判定済み。
- [ ] 責務境界レビュー完了。
- [ ] リスクと緩和策を列挙済み。
- [ ] Phase 4 進行可否を判定済み（PASS）。
