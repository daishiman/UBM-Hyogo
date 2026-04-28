# Phase 9: 品質保証 — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 9（品質保証） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 上位依存 | Phase 8（リファクタリング） |
| 後続 | Phase 10（最終レビュー） |

## 1. 目的

docs-only タスクの品質ゲートを定義する。本タスクではコード（`apps/web` / `apps/api` / `packages/*`）を変更しないため、**`typecheck` / `lint` / `test` は適用外**である。代わりに以下 4 軸でドキュメントの完全性を担保する。

1. **リンク整合**: ドキュメント内の相対パス・相互参照が壊れていない。
2. **schema 整合**: `artifacts.json` の `outputs` と実ファイルの完全一致。
3. **spec 網羅**: `acceptance_criteria` の 4 項目が Phase 1〜8 の各成果物に追跡可能。
4. **不変条件非衝突**: `CLAUDE.md` の重要不変条件と矛盾しない。

## 2. 成果物

- 本ファイル `outputs/phase-9/main.md`
- [`outputs/phase-9/quality-gate.md`](./quality-gate.md) — 品質ゲート定義・チェックリスト・Go/No-Go 判定基準

## 3. 品質ゲートの位置付け

| Phase | 役割 | 本 Phase との関係 |
| --- | --- | --- |
| Phase 7 | カバレッジ確認（test-matrix の網羅率） | 入力（カバレッジ表 → 品質ゲートの前提） |
| Phase 9 | **品質保証（本 Phase）** | docs 整合・schema 整合・spec 網羅・不変条件非衝突 |
| Phase 10 | 最終レビュー（Go/No-Go 判定） | 出力（本 Phase の判定結果を引き渡す） |

## 4. 完了条件

- [x] `quality-gate.md` に docs-only 用の品質基準が記載されている。
- [x] artifacts.json と outputs/ の一致チェック項目が列挙されている。
- [x] aiworkflow-requirements との整合チェック項目が列挙されている。
- [x] CLAUDE.md 不変条件との非衝突チェックが列挙されている。
- [x] Go/No-Go 判定基準が明示されている。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。

## 5. 後続 Phase への申し送り

- Phase 10（最終レビュー）は本 Phase の `quality-gate.md` を起点にチェックリストを実行する。
- Phase 11（手動テスト）は Phase 2 §6 の EV-1〜EV-7 を別系統で記録する（本 Phase はテスト実行ではなく docs 品質ゲートに限定）。
- 不合格項目があれば Phase 8 / Phase 5 にループバックさせる。
