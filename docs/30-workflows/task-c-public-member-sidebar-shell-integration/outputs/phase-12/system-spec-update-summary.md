# System Spec Update Summary — Task C

## 判定サマリ

Task C は **配線タスク**（layout async 化 + `SidebarShellServer` mount + route group 集約 + 旧 header 削除）であり、
**新規 public interface を追加しない**。よって aiworkflow-requirements 側の interface 追記（Step 2）は **N/A**。

shell の public interface（`SidebarShellServer` / `SidebarUserMenu` / `SidebarMobileTrigger`）は
依存 Task A/B/E が所有・定義するため、その spec 反映は A/B/E の責務であり Task C には属さない。

## Step 1-A 〜 1-C（system spec 同期の前段）

| Step | 内容 | 本タスクでの結果 |
| --- | --- | --- |
| 1-A 完了記録 | 仕様書 / LOGS / 必要 skill 更新を同一ターンで反映 | `implemented_local_evidence_captured` を記録。実コード・focused tests・typecheck・lint は local complete。pixel screenshot / staging visual baseline は Gate-C |
| 1-B 実装状況テーブル | `completed` / `spec_created` の判断 | `workflow_state: implemented_local_evidence_captured`。Phase 1-13 + apps/web 実装完備。runtime visual は Gate-C pending |
| 1-C 関連タスクテーブル | 参照 grep + 関連台帳再同期 | 親 `unified-sidebar-shell-public-and-admin` の Task A/B/E 依存・Task D（admin shell）境界を記録 |

## Step 2（interface 追加）

**N/A**。Task C は新規 public interface を持たない。layout 関数（`PublicLayout` / `MemberLayout`）は
Next.js 規約の default export であり、外部から消費される public interface ではない。

## ui-ux-navigation.md 更新判定

| 候補 | 内容 | 反映タイミング |
| --- | --- | --- |
| shell 統合 route 記載 | 公開 6 route + `/profile` が共通 `SidebarShell` を mount する旨の navigation 正本記載 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` / artifact inventory / indexes で本 workflow の実装状態として同期。専用 `ui-ux-navigation.md` は現リポジトリに存在しないため N/A |
| header → sidebar 移行 | `PublicHeader` / `MemberHeader` 廃止と sidebar 一本化の記述 | 同上。実装証跡は Phase 11 / compliance check に集約 |

> `references/ui-ux-navigation.md` は存在しないため直接追記対象にできない。代替正本として active workflow guide、
> artifact inventory、resource-map / quick-reference に実装済み状態を同期する。

## global skill sync（aiworkflow-requirements）

| 対象 | 本サイクルでの扱い |
| --- | --- |
| references/task-workflow-active.md | Task C を `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending` として登録済み |
| references/workflow-task-c-public-member-sidebar-shell-integration-artifact-inventory.md | 新規作成済み |
| indexes（resource-map / quick-reference） | Task C lookup 行を追加済み。`topic-map` / `keywords` は generator 管轄のため手編集なし |
| lessons-learned | route group 集約 / runtime pending 境界を `lessons-learned-task-c-public-member-sidebar-shell-integration-2026-05.md` へ昇格済み |
| task-specification-creator feedback | skeleton/topology drift lesson を `references/patterns-lessons-and-pitfalls.md` へ昇格済み |
