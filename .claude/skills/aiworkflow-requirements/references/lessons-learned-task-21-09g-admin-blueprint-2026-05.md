# Lessons Learned: task-21 W2 par 09g Admin Screen Blueprints

## L-T21-001: 旧 draft が現行 API contract と乖離する場合は再生成が低コスト

09g の 1779 行 prototype draft は stale API 名（`/admin/dashboard/attendance` 系のみ、`/admin/tags/queue/:queueId/resolve` などの current surface 不在）と HEX literal を含んでいた。差分 patch ではなく `references/api-endpoints.md` admin contract を正本に再生成する方が整合確認コストが低い。再生成時は §2..§9 の API 表を current surface に揃え、視覚値 literal を OKLch token 名に置換する。

## L-T21-002: docs-only / NON_VISUAL タスクでも root `index.md` / `artifacts.json` / `outputs/artifacts.json` の full mirror が必須

artifacts.json を lightweight marker で済ませると、Phase 12 の compliance 自己申告 PASS と実測 `cmp -s` が乖離する事故が起きやすい。`task-specification-creator/references/phase-12-documentation-guide.md` の root/output artifacts parity ルールに従い full mirror を維持し、`cmp_exit=0` を Phase 12 evidence として記録する。

## L-T21-003: canonical workflow root の削除検出は task scope 外でも同サイクルで復元する

aiworkflow-requirements の current index / active guide が参照中の canonical root が削除された状態で merge されると、resource-map / quick-reference の参照解決が壊れる。今回 `docs/30-workflows/issue-372-attendance-pagination/` と `docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/` の 2 件を同サイクルで復元した。Canonical Root Existence Gate は task scope 外でも fail させる方針を維持する。

## L-T21-004: 旧 draft が存在する spec 再生成では grep gate を先行実行する

stale API 名・HEX literal・前 prototype 由来の section 構造が残存しないことを保証するため、Phase 05 構造との grep gate（`scripts/verify-09g-screen-blueprints-admin.sh` 相当）を Phase 06 以前に先行実行する。後段で発見すると差分が大きくなる。

## L-T21-005: AdminSidebar の既存 route と新規 blueprint 対象 route の境界を §1.2 / §99 で明示する

09g は task-21 で 8 routes（`/admin/dashboard`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit`）を blueprint 化したが、AdminSidebar には task-15/16/17 で追加される `/admin/dashboard/attendance` 系 既存 route も並ぶ。consuming task の入力外であることを §1.2 sidebar 表 と §99.3 不採用ノートで明示しないと、task-15/16/17 が 09g を anchor にして既存導線を再生成しようとする事故が起きる。
