# Skill Feedback Report — Issue #1016 Task E: Mobile drawer responsive

改善点がなくても出力必須。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。

## テンプレート改善

- **先行未消費 state の実装分類**: 親 workflow（Task A）で `useSidebarState` に `drawerOpen` / `setDrawerOpen` が先行実装されたが消費先（Trigger / Drawer）が無い「宙ぶらりん state」を、後続 Task E で消費先実装として閉じた。`task-specification-creator/lessons-learned/sidebar-mobile-drawer-responsive.md` に、先行 state / prop の消費先が実装可能な場合は spec-only close しない rule として昇格済み。
- **VISUAL × status 更新の二段階表記**: VISUAL タスクで spec_created 段階のとき screenshot は `pending` 表記、local capture 後は local screenshot `present` / staging visual `pending` と分けると、Phase 11 evidence の誠実性が安定する（本タスクで遵守）。

## ワークフロー改善

- **MINOR の current / baseline 分離の明文化**: Phase 3 MINOR を Phase 12 unassigned-task-detection で判定する際、「本サイクル内で解消（baseline）」と「横展開のため別レーン（current 未タスク化候補）」を分離するルールを workflow テンプレに固定すると、解消済みの指摘を誤って未タスク化する drift を防げる。本タスクでは M-1/M-2/M-3 を全て baseline 解消として分離した。
- **spec-only 前提の撤回**: 本 automation-30 サイクルで実コード差分が入ったため、global skill（aiworkflow-requirements / task-spec-creator）反映を同一 wave で実施した。`spec_created` 誠実性より Implementation Target Physical Existence Gate を優先する。

## ドキュメント改善

- **識別子の逐語引用ルールの可視化**: implementation-guide の Part 2 で型定義・data 属性・breakpoint・storage key を phase-02-design.md から逐語引用する（手書き drift 禁止 / FB-W1-02b-3）方針を、guide テンプレ冒頭に注記しておくと、識別子 drift（`shell-drawer` id と `aria-controls` の不一致等）を構造的に防げる。

## 総括

致命的な改善要求（implementation target があるのに no-code close-out）は本サイクルで修正済み。残る Gate-C（staging visual / commit / push / PR）は user-gated として分離した。
