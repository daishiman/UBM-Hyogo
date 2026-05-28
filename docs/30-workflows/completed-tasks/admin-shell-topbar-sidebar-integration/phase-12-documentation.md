# Phase 12: ドキュメント更新

## 親 workflow `phase-12-documentation.md` への追記

- AppShell topbar 設計の **方針変更**: slot 経由から page-head 集約へ (#894/#895 の方針再整流の経緯を 3-5 行で明記)
- `AdminSidebar` プロトタイプ準拠仕様の確定 (3 group / active / badge / user-chip)
- 各 page の Breadcrumb 直貼り撤去責務は Task C にあること明示

## aiworkflow 6 surfaces 反映候補

- `task-workflow-active.md`: 「admin shell 整流化 (Task A)」エントリ追加
- `quick-reference.md`: AppShell 設計の DoR/DoD 1 行サマリ
- `resource-map.md`: 本 spec へのリンク追加
- `artifact-inventory.md`: 新規 component 5 件・spec 4 件を登録
- `SKILL-changelog.md`: 日付 + 「admin shell slot 廃止 / page-head 集約」記載
- `lessons-learned/` 候補:
  - L-ADMINSHELL-001 (slot 二重描画リスクと page-head 集約原則)
  - L-ADMINSHELL-002 (sidebar active 判定の prefix 誤一致回避)

## gate-metadata:validate / verify:phase12-compliance を pass する見出し構成

本 workflow は canonical 9 headings 相当 (Phase 1〜Phase 13) を全 phase ファイルに分割して保持する。`outputs/phase-12/phase12-task-spec-compliance-check.md` に Phase 11 evidence inventory と strict 7 実在確認を集約する。

## 関連既存 issue trace

- #894 (CLOSED): slot 経由 breadcrumb 統合 → 本 task で slot 廃止に再整流
- #895 (CLOSED): topbar actions client island → 本 task で page-head の actions slot に集約

## 反映 timing

- 本 task の実装 change set と **同一 wave** で aiworkflow surfaces を更新する (CLAUDE.md task-spec-creator skill の same-wave sync 原則)
- commit / push / PR は Phase 13 の user-gated operation とし、自動実行しない
