# Phase 10: 最終レビュー

> 正本は `outputs/phase-10/final-review-result.md`。本ファイルは root index からの導線兼サマリ。
> 本プロンプト（タスク仕様書作成）ではコード実装・PR 作成を行わず、仕様のみを確定する。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 9 / 次 Phase: 11
- 作成日: 2026-06-02

## 目的

受け入れ条件 AC-1〜AC-7 が Phase 1〜9 の設計・テスト計画で完全に満たされる見込みかを最終判定し、
blocker の有無と MINOR 指摘（後続 Phase 12 で未タスク化の候補）を確定する。
本サイクルは `workflow_state: spec_created`（実装未実施）であり、実装の合否判定は Gate-B（後続実装プロンプト）に委ねる。

## 実行タスク

1. AC-1〜AC-7 ごとに、対応する設計（Phase 2）/テスト計画（Phase 4）/実装手順（Phase 5）の充足を確認する。
2. blocker（仕様矛盾・不変条件違反・API/D1/Form schema 変更の混入）が無いことを確認する。
3. MINOR 指摘（任意改善）を洗い出し、Phase 12 で未タスク化の候補として記録する。
4. `spec_created` のため実装の実機確認は Gate-B（後続実装プロンプト）で行う旨を明記する。

## 参照資料

- `outputs/phase-10/final-review-result.md`（最終レビュー正本）
- `phase-2.md`（設計）/ `phase-4.md`（テスト計画）/ `phase-5.md`（実装手順）
- `outputs/phase-1/requirements.md`（AC 正本）

## 成果物

- `outputs/phase-10/final-review-result.md`
- `phase-10.md`（本ファイル）

## 統合テスト連携

AC 別判定テーブルの各 AC は、Phase 4 のテストケース（`useImeSafeInput.spec.tsx` / `Search.spec.tsx` /
`SelectedFiltersBar.client.spec.tsx` / `MemberFilters.client.spec.tsx` / `Input.spec.tsx`）と 1:1 で対応する。
実装後に当該 spec を全 Green にすることでレビュー判定を実証する。

## 完了条件

- [x] AC-1〜AC-7 の充足判定テーブルを作成
- [x] blocker 無しを確認
- [x] MINOR 指摘を列挙し Phase 12 連携を明記
- [x] 実装合否は Gate-B（後続実装プロンプト）pending と明記
