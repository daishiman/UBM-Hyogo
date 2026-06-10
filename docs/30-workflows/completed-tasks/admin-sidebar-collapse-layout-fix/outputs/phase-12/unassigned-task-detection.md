# 未タスク検出レポート — admin-sidebar-collapse-layout-fix

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-08

検出件数: **current = 0 件** / **baseline = 1 件**（OOS-1 tooltip overflow clip。本サイクルでは起票しない）。

本タスクは単一関心（collapsed/expanded サイドバーレイアウト整合）で 1 実装サイクル完結であり、current（本サイクルで対応すべき未対応）は 0 件である。
0 件でも本レポートは出力必須のため、検出ソースと baseline を分離して記録する。

## current（本サイクルで検出した未対応 = 0 件）

| ソース | 確認項目 | 結果 |
| --- | --- | --- |
| 元タスク仕様書 | 「スコープ外」として明示された項目で current 対応が必要なもの | 0 件。AC-1..AC-9 はすべて本サイクル（apps/web shell className 修正 + テスト）で完結 |
| Phase 3/10 レビュー | MINOR 判定の指摘事項 | 0 件（Phase 3 レビューで MINOR なし明示。Phase 10 MINOR 追跡テーブルも 0 件） |
| Phase 11 手動テスト | スコープ外の発見事項・改善提案 | 0 件（local fixture screenshot 3 件取得済み。staging 認証済み visual は user-gated） |
| コードコメント | TODO/FIXME/HACK/XXX | 0 件（実コード Read で新規 TODO/FIXME/HACK/XXX 導入予定なし。className 分岐のみ） |
| `describe.skip` ブロック | 旧 testid/要素名の残存参照 | 0 件（既存 data 属性 `data-shell-block` / `data-collapsed` / `data-active` は不変。skip 残存なし） |

> current 0 件は「0 件にしないためのこじつけ」ではなく、Phase 1/Phase 3/Phase 10 で MINOR なし・スコープ完結が確定済みの結果である。
> 任意候補（例: tooltip 自動視覚回帰の Playwright 化）は責務が異なるため current には昇格させない。

## baseline（今サイクルでは起票しない・記録のみ）

### OOS-1: collapsed 時の hover tooltip overflow clip

| 項目 | 内容 |
| --- | --- |
| 検出元 | `_shared-context.md` §7 スコープ境界、Phase 1 スコープ境界、Phase 3 設計判断 |
| 内容 | collapsed 時の hover tooltip（`ubm-shell-tooltip` は aside の右外に `position:absolute` で出る）が `[data-shell="sidebar"]{overflow:hidden}`（`globals.css:1986`）でクリップされうる問題 |
| 起票しない理由 | これを解くには collapsed 時の aside overflow 戦略変更（`overflow-x: visible` 化 or tooltip の `position: fixed` 化）が必要で、`height:100dvh` sticky レイアウトと全 viewport の縦スクロール挙動に影響するため独立検証を要する。主訴（はみ出し・中央揃え）とは因果が別の別関心であり、「分量が多い」等の先送りではなく overflow 戦略変更が `height:100dvh` sticky と相互作用する **回帰リスクの分離**（CONST_007 例外: 技術的破綻リスク + 実施場所明記） |
| 実施場所（明記） | Phase 11 TC-11-3 で collapsed user-menu open 時の tooltip clip 有無を実機確認する。clip が確認され改善判断になった場合のみ、後続で別タスク（`unassigned-task-specs/` 配置 or Issue 化）を検討する |
| 現状ステータス | baseline（未起票）。本サイクルでは記録のみ |

## 関連タスク差分確認

| 確認 | 結果 |
| --- | --- |
| 親タスク / 依存タスク | `artifacts.json.metadata.depends_on` は空（独立タスク）。`related_issue` なし（staging 観察起点） |
| 既存 active workflow との重複 | sidebar shell の collapsed レイアウト是正は本タスク固有。`unified-sidebar-shell` 系（過去）とは collapse トグルの className 分岐パターンを踏襲する関係のみで、対象 AC は重複しない |
| 別タスク分離 spec | 0 件（`unassigned-task-specs/` への配置なし。1 サイクル完結） |

## 検証方法

```bash
# strict 7 と Phase 11 evidence の実体存在
test -f docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/outputs/phase-12/unassigned-task-detection.md && echo OK
test -f docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/outputs/phase-11/screenshot-inventory.json && echo OK
# 別タスク分離 spec が 0 件であること（unassigned-task-specs/ ディレクトリ不在 or 空）
ls docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/unassigned-task-specs/ 2>/dev/null || echo "no split task (current 0)"
```

## スコープ（含む/含まない）

- 含む: current 未タスク 0 件の検出記録、baseline（OOS-1）の記録・起票しない理由・実施場所。
- 含まない: OOS-1 の実装・別タスク化・Issue 採番（Phase 11 実機確認後の判断 + user-gated）。
