# Phase 3 — 設計レビュー

> **[実装区分: 実装仕様書]**。Phase 4（テスト作成）へ進めるかを判定する。

## 1. 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | admin が member_tags の参照整合性破れ（孤児行）を検出・監査できるようになる。これまで「削除時にしか参照状態が分からない」盲点を解消 |
| 実現性 | PASS | read 関数 2 + read-only endpoint 1 + テスト + fixture 健全性確認のみ。migration / schema 変更ゼロ。1 サイクルで完了可能（CONST_007） |
| 整合性 | PASS | documented no-FK 架構（0022:4）を反転せず維持・強化。invariant #5 / #8 / #13 すべて適合。issue-1070 ガードと責務分離して非破壊共存 |
| 運用性 | PASS | read-only ゆえ運用リスク低。endpoint は監査用途で副作用なし。既存 fixture は実測で健全なため、既存テストへの影響は回帰確認に限定 |

## 2. 因果・依存・責務境界の確認

- **強化ループ**: orphan detection が可視化 → admin が手動で孤児を解消 → 整合性向上（本タスクは検出まで・解消 mutation は範囲外）
- **バランスループ**: count guard（削除時防止）が新規孤児発生を抑制 → orphan detection の検出対象が増えない
- **責務所有権**: detection = read（member_tags / tag_definitions の状態を変更しない）。mutation 経路（`assign*` 4 関数）とは完全分離

## 3. リスクとレビュー指摘

| リスク | 影響 | 対策（Phase 5/6 で対応） |
|--------|------|---------------------------|
| `/tags/orphans` が `/tags/:tagId` に capture される | endpoint が動作しない | Phase 5 で登録順序を実測し `:tagId` 系より前に挿入。contract test で `count` キー存在を検証 |
| `detect`/`count` prefix が readonly type guard に抵触 | typecheck 失敗 | Phase 1 で禁止 prefix（insert/update/delete/upsert/assign/bulk）に非該当を確認済。Phase 4 で `memberTags.readonly.test-d.ts` の typecheck green を確認 |
| `members.contract.spec.ts` fixture 前提の誤読 | 不要な差分・回帰 | `tag_a`/`tag_b` は既に `tag_definitions` に定義済み。Phase 6 では fixture を編集せず、既存ケース green と孤児 0 を確認 |
| `NOT IN` サブクエリで tag_definitions が空の時の挙動 | 誤検出 | tag_definitions は seed（0004）で常に 41 行存在。空テーブル時の挙動も orphan spec のエッジケースで検証 |

## 4. 設計レビュー判定

**判定: PASS（Phase 4 へ進行可）**

- DB-level FK 不採用の意思決定（ADR-1119）は documented 架構と整合し根拠十分。
- 追加 surface は read-only で副作用ゼロ・低リスク。
- 1 サイクル完結スコープ（CONST_007）を満たす。先送り項目なし（FK は「不採用の確定」であり先送りではない）。

## 完了条件（Phase 3）

- [x] 4 条件すべて PASS
- [x] リスクと対策を Phase 5/6 へ引き継ぎ
- [x] Phase 4 進行可を判定
- [x] 出力: [outputs/phase-3/design-review-result.md](outputs/phase-3/design-review-result.md)
