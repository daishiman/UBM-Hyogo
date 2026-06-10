# Phase 11 Discovered Issues — admin-sidebar-collapse-layout-fix

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-08

本ファイルは Phase 11 の発見事項を記録する。本タスクは implemented_local_evidence_captured であり、実 screenshot は取得済み。
現時点の発見は実コード Read・設計レビュー・local fixture screenshot に基づく。`outputs/phase-12/unassigned-task-detection.md` と整合させる。

## current（本サイクルで未対応の新規問題 = 0 件）

| ソース | 確認項目 | 結果 |
| --- | --- | --- |
| 仕様策定（実コード Read） | 主訴（collapsed はみ出し・中央軸不一致）以外の新規 UI 問題 | 0 件。主訴は AC-1..AC-6 で本サイクル完結 |
| Phase 3/10 レビュー | MINOR 判定の指摘事項 | 0 件（MINOR なし明示） |
| 撮影計画策定 | スコープ外の発見事項 | 0 件（local fixture screenshot で確認済み。staging visual は user-gated） |

> current 0 件は「0 件にするためのこじつけ」ではなく、Phase 1/3/10 で MINOR なし・単一関心スコープ完結が確定済みの結果である。

## baseline（記録のみ・本サイクルでは起票しない）= 1 件

### OOS-1: collapsed 時の hover tooltip overflow clip

| 項目 | 内容 |
| --- | --- |
| 内容 | collapsed 時の hover tooltip（`ubm-shell-tooltip` は aside の右外に `position:absolute` で出る）が `[data-shell="sidebar"]{overflow:hidden}`（`globals.css:1986`）でクリップされうる問題 |
| 別関心の理由 | 主訴（はみ出し・中央揃え）とは因果が別。これを解くには collapsed 時の aside overflow 戦略変更（`overflow-x: visible` 化 or tooltip の `position: fixed` 化）が必要で、`height:100dvh` sticky レイアウトと全 viewport の縦スクロール挙動に影響するため独立検証を要する |
| 起票しない理由 | 「分量が多い」等の先送りではなく、overflow 戦略変更が `height:100dvh` sticky と相互作用する **回帰リスクの分離**（CONST_007 例外: 技術的破綻リスク + 実施場所明記） |
| 実機確認（実施場所） | Phase 11 TC-11-3（`sidebar-collapsed-user-menu-open.png`）の実機目視で collapsed 時の tooltip clip 有無を判定する。clip が確認され改善判断になった場合のみ、後続で別タスク化を検討する |
| 関連観察 | `SidebarShell.tsx:102` の `<aside>` className に `overflow-visible` ユーティリティが付与されている一方、`globals.css:1986` の `[data-shell="sidebar"]{overflow:hidden}` rule が存在し、CSS rule と Tailwind class の優先順位を実描画で確定する必要がある（documentation-changelog.md D-2 / skill-feedback SF-2 と同一観察） |
| ステータス | baseline（未起票）。本サイクルでは記録のみ |

## unassigned-task-detection.md との整合

| 項目 | discovered-issues.md（本ファイル） | unassigned-task-detection.md |
| --- | --- | --- |
| current 件数 | 0 件 | 0 件 |
| baseline 件数 | 1 件（OOS-1） | 1 件（OOS-1） |
| OOS-1 の扱い | baseline・実機確認待ち・起票しない | baseline・実機確認待ち・起票しない |

両ファイルは current 0 件 / baseline 1 件（OOS-1）で一致する。
