# Phase 11: 手動テスト（NON_VISUAL）

## NON_VISUAL 宣言

| 項目 | 内容 |
|------|------|
| タスク種別 | docs-only（GitHub issue #524 本文整合 + ローカルミラー md 整合） |
| visualEvidence | **NON_VISUAL** |
| 非視覚的理由 | UI/UX の追加・変更が一切ない。成果物は GitHub issue 本文テキストと markdown のみ。レンダリング画面・コンポーネント・スタイルの変化を伴わない |
| 代替証跡 | 検証コマンド群（Phase 4 の VC-01〜06 / Phase 6 の RC-01〜03）の実測値 |

> **UI/UX 変更なしのため Phase 11 スクリーンショット不要。**
> `outputs/phase-11/screenshots/` には PNG を置かない（NON_VISUAL）。空のままとし、`.gitkeep` も作成しない。

## 11.1 証跡の主ソース

スクリーンショットの代わりに、**検証コマンド群の実測値**を主証跡とする。

### Phase 4 由来 — 受入検証コマンド（VC）

| ID | コマンド | 期待 | 対応 AC |
|----|----------|------|---------|
| VC-01 | `gh issue view 524 --json body -q .body \| grep -c "Issue #407"` | `0` | AC-1 |
| VC-02 | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-reminder.yml"` | `0` | AC-2 |
| VC-03 | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-runbook.md"` | `0` | AC-2 |
| VC-04 | `gh issue view 524 --json body -q .body \| grep -c "2026-06-08 更新"` | `1` | AC-3 |
| VC-05 | `grep -cE "cf-token-rotation-reminder.yml\|cf-token-rotation-runbook.md" docs/30-workflows/issues/issue-524.md` | `0` | AC-4 |
| VC-06 | `gh issue view 1175 --json state -q .state` | `CLOSED` | 不変条件1 |

### Phase 6 由来 — 回帰 grep（RC）

| ID | コマンド | 期待 | 目的 |
|----|----------|------|------|
| RC-01 | `gh issue view 524 --json body -q .body \| grep -c "Issue #351"` | `1` 以上 | 残スコープ #351 保全 |
| RC-02 | `gh issue view 524 --json body -q .body \| grep -c "Issue #484"` | `1` 以上 | 残スコープ #484 保全 |
| RC-03 | `gh issue view 524 --json body -q .body \| grep -c "ubm-hyogo-ops"` | `1` 以上 | 通知先セクション保全 |

> VC/RC の正本定義は Phase 4 / Phase 6 仕様書（Lane A）にある。本フェーズはそれらを証跡メタとして集約する。

## 11.2 スクリーンショットを作らない理由（明文）

- 変更対象は GitHub issue 本文テキストと markdown ファイルのみで、視覚的レンダリング差分が存在しない。
- 整合の正否は「特定文字列の有無」で機械的に判定でき、画像より grep 結果の方が再現性が高く厳密。
- よって本タスクの証跡は VC/RC のコマンド結果（数値）で完備し、スクリーンショットは情報を追加しない。

## 11.3 実地操作と検証結果

| カテゴリ | 内容 | 状態 |
|----------|------|------|
| source-level PASS | VC-01〜06 / RC-01〜03 を実走し期待値どおり | ✅ PASS |
| 実地操作 | `gh issue edit 524` 実行・ミラー編集 | ✅ 完了 |
| 残る user-gate | commit / push / PR | ⏸ user-gated |

> 実測値の詳細は [manual-smoke-log.md](manual-smoke-log.md) と [manual-test-result.md](manual-test-result.md) に記録した。

## 完了条件（Phase 11）

- [x] NON_VISUAL 宣言（種別 / 非視覚的理由 / 代替証跡）を冒頭に記載した。
- [x] 「UI/UX変更なしのため Phase 11 スクリーンショット不要」を明記した。
- [x] 証跡の主ソース（VC-01〜06 / RC-01〜03）と実測値をテーブル化した。
- [x] スクリーンショットを作らない理由を明記した。
- [x] source-level PASS と残る user-gate（commit / PR）を別カテゴリで記録した。
- [x] `manual-test-result.md` を作成した（証跡メタ）。
