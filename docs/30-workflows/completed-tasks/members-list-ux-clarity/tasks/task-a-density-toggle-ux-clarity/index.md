<!-- workflow: members-list-ux-clarity / task: A density-toggle-ux-clarity / phase: index -->

# Task A — density-toggle-ux-clarity

[実装区分: 実装仕様書]

## 概要

`/members` 公開ページ `DensityToggle` (ゆったり/密/リスト) の意味伝達を強化する。
プロトタイプ正本の主ラベルは維持しつつ、`sublabel` (カード詳細 / カード簡易 / 1行リスト) と
`HelpHint` (詳細説明 popover) を追加し、各モードの用途が 2 秒以内に判別できる状態にする。

新 primitive は追加せず、既存 `Segmented` の option shape を後方互換に拡張し、
`HelpHint` は feature レベル client component (`<details><summary>` ベース) として実装する。

## スコープ

- `apps/web/src/components/public/DensityToggle.client.tsx` (props/構造拡張)
- `apps/web/src/components/ui/Segmented.tsx` (`SegmentedOption` 型に `sublabel?` / `description?` を加法追加)
- `apps/web/src/components/public/DensityToggle.client.tsx` 内の `<details data-component="help-hint">` (`<details>` ベース)
- `apps/web/src/styles/legacy-public.css` (sublabel / help-hint スタイル — OKLch tokens のみ)
- `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` (既存テスト互換維持 + AC-1/AC-2 検証追加)

## 依存関係

| 項目 | 内容 |
| ---- | ---- |
| 親 workflow | `docs/30-workflows/completed-tasks/members-list-ux-clarity/` (Phase 1-3 完了) |
| 並列タスク | Task B (`member-filters-live-affordance`) — 変更面非干渉 |
| 後続タスク | Task C (`members-page-integration-and-visual-baseline`) — Task A 完了後に visual baseline 取得 |
| 不変条件 | INV-1〜INV-6 (親 index.md 参照)・新 primitive 禁止・OKLch tokens 正本・URL query SSOT |

## 担当 AC (親 phase-1-requirements.md 参照)

- AC-1: sublabel 表示 + `aria-description` 提供
- AC-2: HelpHint icon + popover で用途説明 3 行
- AC-7: `verify-design-tokens` GREEN 維持 (HEX 禁止・新 primitive 0)

## 成果物 (本タスクで生成)

| Phase | ファイル | 役割 |
| ----- | -------- | ---- |
| 1 | `phase-1-requirements.md` | 背景・AC・Out-of-scope |
| 2 | `phase-2-design.md` | UI 構造 / props / data-* / a11y |
| 3 | `phase-3-design-review.md` | 代替案比較・採用根拠 |
| 4 | `phase-4-test-plan.md` | vitest テストケース一覧 |
| 5 | `phase-5-implementation.md` | 実装手順 (CONST_005 必須項目) |
| 6 | `phase-6-test-additions.md` | 補助テスト追加 |
| 7 | `phase-7-coverage.md` | カバレッジ確認 |
| 8 | `phase-8-refactor.md` | リファクタ計画 |
| 9 | `phase-9-qa.md` | 品質保証 |
| 10 | `phase-10-final-review.md` | 最終レビュー |
| 11 | `phase-11-manual-test.md` | 手動検証 + スクリーンショット項目 |
| 12 | 親root `../../outputs/phase-12/*` | parent strict 7 集約。sub task配下にstrict 7を複製しない |
| 13 | `phase-13-pr.md` | PR title / body / 検証手順 |

> Phase 12 strict 7 outputs は **必ず親root `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/` に集約**する。sub task配下には複製しない。

## 状態

- 仕様書状態: `spec_created`
- branch: `feat/members-list-ux-clarity`
- 1 サイクル完了スコープ (CONST_007) 遵守: 推定 +120 / -10 LOC、新 primitive 0、API 変更 0
