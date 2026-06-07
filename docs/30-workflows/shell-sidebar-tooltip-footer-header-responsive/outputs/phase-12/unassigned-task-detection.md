---
phase: 12
phase_name: ドキュメント同期 / unassigned-task-detection
task: shell-sidebar-tooltip-footer-header-responsive
状態: implemented_local_evidence_captured
作成日: 2026-06-03
parent_workflow: null
---

# 未タスク検出（unassigned-task-detection）

> 0 件でも本ファイルは出力必須。current（本サイクルで切り出すべき未タスク）と baseline（将来候補・本サイクル外の構造境界）を分離して記録する。

## 1. current（本サイクルで切り出す未タスク）

**検出 0 件。**

本タスク（3 レーン: collapsed ツールチップ / 公開フッター sticky / mobile-bar sticky）は 1 サイクル / 1 PR で完結する（CONST_007）。Phase 1-3 の AC（A1-A6 / B1-B3 / C1-C3）はすべて本タスク scope 内で検証手段が定義済みで、実装中に scope を超える想定外作業（I-1..I-8 抵触）は設計上発生しない。よって current の未タスク切り出しは不要。

## 2. baseline（非起票の責務境界）

以下は **分量を理由とした先送りではなく**、責務スコープが本タスク（shell 固有 chrome の collapsed tooltip + sticky 表示）と独立しているための構造境界である（Phase 1 §1.6 / Phase 3 D-7）。CONST_008 に照らし、今回の目的達成に必要な欠落ではないため、未タスク化・Issue 化しない。

| # | 境界 | 由来 | 未タスク化しない理由 |
|---|------|------|--------------------|
| B-1 | 汎用 Tooltip primitive の `apps/web/src/components/ui/` 化 | §1.6 スコープ外 | 本タスクは shell 固有 chrome に閉じる（I-3）。今 primitive 化すると未使用 API を増やすため改善ではない |
| B-2 | フッター sticky の会員 / 管理レイアウトへの適用 | §1.6 スコープ外 | 会員レイアウトは現状フッター無し、管理レイアウトは sidebar footer（直近 C1 で sticky 済み）。本タスクは公開フッターのみが対象で、他面への適用要求は存在しない |
| B-3 | ツールチップのモバイル（タッチ）hover 対応 | §1.6 スコープ外 | collapsed サイドバーは `md+`（desktop/tablet）のみ存在し、`< md` は drawer 表示で常にラベル可視。タッチ hover は構造的に対象外（対象 viewport が存在しない） |

### Phase 10 MINOR 指摘の取り扱い

本タスクは `implemented_local_evidence_captured` 段階であり、Phase 10（最終レビュー）の scope 境界は実コードへ反映済み。設計レビュー（Phase 3）時点で識別済みの verify 項目（jsdom で sticky 不可・`<details>` への wrap 不適・祖先 overflow 確認・token typo 確認）は、いずれも本タスク scope 内で消化済みまたは staging visual user gate の検証項目として記録済みであり、別タスク化対象ではない。

## 3. 関連タスク差分確認

| 関連タスク | 差分確認 | 結論 |
|-----------|----------|------|
| 直近コミット `41292e38a`（C1-C4: sidebar footer 固定 / collapse はみ出し / account popover / main footer sticky） | 本タスクはその上に積む。public-footer の `margin-top: auto` は C4 由来で、本タスクが `position: sticky` を加算 | 重複なし（C4 は配置、本タスクは固定。別関心） |
| `unified-sidebar-shell-task-e-mobile-drawer-responsive`（mobile drawer / responsive） | drawer（z-40）の z-index 階層と本タスクの tooltip(30)/mobile-bar(30)/footer(20) を整合させる | 重複なし（drawer は本タスク非接触。z-index 階層のみ整合参照） |
| `SidebarUserMenu` / collapse cookie 系（Task E / issue-1024 系） | user menu の `<summary>` には tooltip を wrap せず内部バブル配置（D-3）。collapse cookie / drawer 挙動は不変 | 重複なし（既存挙動 unchanged・加算のみ） |

> 上記関連タスクとの間に scope 重複・回帰リスクは検出されず。本タスクは既存実装への加算（ツールチップ追加 / sticky 付与）で、既存 query・既存挙動を壊さない設計（Phase 3 §3.3 リスク緩和）。

## 4. 結論

- current 未タスク: **0 件**（新規 Issue 起票不要）。
- baseline 非起票境界: 3 件（B-1/B-2/B-3・責務独立の構造境界・先送りではない）。
- 関連タスク差分: 重複・回帰なし。
