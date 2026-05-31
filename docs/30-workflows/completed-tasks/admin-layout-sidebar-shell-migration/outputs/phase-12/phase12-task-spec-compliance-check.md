# Phase 12 Task Spec Compliance Check — admin-layout-sidebar-shell-migration

> 本ファイルは task-specification-creator skill の canonical 9 headings（逐語）に従う。
> 番号・見出しテキストを変更すると CI gate `verify-phase12-compliance` が fail する。
> 現状は **implemented_local_runtime_pending**（2026-05-29 実装完了・ローカル全 green。staging 視覚 capture と commit/push/PR が user-gated）。

## 1. Summary verdict

`PASS (implemented_local_runtime_pending)` — Task A/B/D + Task E 最小を一括実装（ユーザー承認・CONST_009）。
`apps/web/src/components/shell/**`・`apps/web/src/lib/admin/schema-diff-count.ts`・`apps/web/app/(admin)/layout.tsx` 移行・
旧 `AdminSidebar` 系 6 ファイル削除を完了。ローカル検証（typecheck / lint / web Vitest / AC-2 grep gate）は全 green。
staging 視覚ベースライン（Phase 11 screenshot）と commit / push / PR のみ Gate-C の user-gated execution に残す。

## 2. Changed-files classification

| Classification | File | 状態 |
| --- | --- | --- |
| impl (added) | `apps/web/src/components/shell/`（15 component + 6 spec） | created |
| impl (added) | `apps/web/src/lib/admin/schema-diff-count.ts` / `schema-diff-count.spec.ts` | created |
| impl (edit) | `apps/web/app/(admin)/layout.tsx`（SidebarShellServer 委譲） | modified |
| impl (edit) | `apps/web/app/(admin)/layout.spec.tsx`（TC-01/02/03/07/08） | modified |
| impl (edit) | `apps/web/src/styles/tokens.css`（shell トークン 6 件） | modified |
| impl (delete) | `apps/web/src/components/layout/AdminSidebar*.tsx` 系 6 ファイル | deleted |
| spec (new) | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/index.md` / `artifacts.json` / `phase-{1..13}.md` | created |
| spec (new) | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/artifacts.json` / `outputs/phase-12/*.md` / `outputs/implementation-summary.md` | created |
| spec sync | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` / `references/task-workflow-active.md` / artifact inventory | updated |

実コード差分は本 wave で発生済み（git diff で確認可能）。

## 3. `workflow_state` and phase status consistency

- `index.md` frontmatter `workflow_state: implemented_local_runtime_pending` / `artifacts.json` `workflow_state: implemented_local_runtime_pending` 一致。
- `outputs/artifacts.json` は root と parity（同一内容）。
- phase status: phase 1-10/12 = `completed`、phase 11 = `local_evidence_done_visual_capture_user_gated`、phase 13 = `pending`。
- gates（`metadata.gates`）: Gate-A `passed` / Gate-B `passed`（local evidence）/ Gate-C `pending`（commit/push/PR）。
- 矛盾なし: implementation 完了主張（`outputs/implementation-summary.md`）と全 ledger の state が一致。以前存在した「spec_created なのにコード実装済み」の drift は本レビューで解消。

## 4. Phase 11 evidence file inventory

VISUAL タスク。自動検証（layout/shell spec）でロジック回帰を担保済み。実 screenshot は staging deploy + 認証 admin session が必要で user-gated。

| Classification | Path | Status |
| --- | --- | --- |
| manual test / visual evidence plan | outputs/phase-11/manual-test.md | present |
| auto-verified DOM/contract/a11y 回帰（spec で担保・1299 web vitest passed） | app/(admin)/layout.spec.tsx | n/a |
| staging screenshot（9 admin routes + forbidden redirect・staging 必須） | outputs/phase-11/admin-shell-9routes.png | pending |

> auto-verified 行は spec 担保のため Phase 11 evidence file としては n/a（実ファイルは spec 側）。
> staging screenshot は取得後（Gate-C 周辺）に PNG を workflow root 配下へ配置し、implementation-guide.md から参照する。

## 5. Phase 12 strict 7 file inventory

| # | strict 7 file | Path | 状態 |
| --- | --- | --- | --- |
| 1 | main | outputs/phase-12/main.md | present |
| 2 | implementation-guide | outputs/phase-12/implementation-guide.md | present |
| 3 | system-spec-update-summary | outputs/phase-12/system-spec-update-summary.md | present |
| 4 | documentation-changelog | outputs/phase-12/documentation-changelog.md | present |
| 5 | unassigned-task-detection | outputs/phase-12/unassigned-task-detection.md | present |
| 6 | skill-feedback-report | outputs/phase-12/skill-feedback-report.md | present |
| 7 | compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | present（本ファイル） |

strict 7 は物理配置済みで、本レビューで全ファイルを implemented 状態へ整合させた。

## 6. Skill/reference/system spec same-wave sync

- ドメイン仕様（API/D1/IPC/auth mechanism）は非影響のため `docs/00-getting-started-manual/specs/*.md` の契約変更は **N/A**。`/admin/schema/diff` 呼び出しは既存挙動の移設。
- aiworkflow-requirements の到達性 same-wave sync 済み（implemented 状態へ更新）: `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` / `references/workflow-admin-layout-sidebar-shell-migration-artifact-inventory.md`。
- task-specification-creator skill feedback は `skill-feedback-report.md` に集約。スキル本体変更は no-op。

## 7. Runtime or user-gated boundary

| boundary | 内容 | gate |
| --- | --- | --- |
| 実装 | Task A/B/D/E 一括実装・ローカル全 green | Gate-B passed（local evidence） |
| local capture | 9 admin routes の screenshot + forbidden redirect（staging 必須） | Gate-B 視覚部分（user-gated） |
| commit/push/PR | PR base `dev` | Gate-C（user-gated・CONST_001） |

## 8. Archive/delete stale-reference gate

- 本 root は **`docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/` へ移動済み**（2026-05-29・ユーザー承認のもと Gate-C 前倒し移動）。当初は commit/push/PR 後（Gate-C）の移動を計画していたが、Phase-12 strict 7 完了・ローカル全 green を根拠にユーザー承認のうえ前倒しした。残りの staging 視覚ベースライン・commit/push/PR は引き続き user-gated（Gate-C）。
- 移動に伴い、移動前パス（`docs/30-workflows/` 直下）を参照していた内部 self-ref（index frontmatter `canonical_workflow` / phase / outputs / root+outputs artifacts.json の `evidence_path`）および外部 stale-reference（aiworkflow-requirements の indexes / references / LOGS / changelog / lessons-learned + unassigned-task spec）を `completed-tasks/` 配下へ一括補修済み（残存 0・二重化 0・gate-metadata evidence_path ERROR 0）。
- 実装 wave で削除した `apps/web/src/components/layout/AdminSidebar*.tsx` 系 6 ファイルは **コード**。削除完了 gate `git grep -l "components/layout/AdminSidebar"` = **0 hit** で検証済み。
- stale-reference hit: 本レビューで `spec_created` / planned-target 系の stale 記述（index / artifacts / strict 7 / skill ledger）を implemented 状態へ補修済み。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented_local_runtime_pending` が index / root+output artifacts / strict 7 / skill ledger で一致。implementation complete 主張と state が整合 |
| 漏れなし | PASS | Phase 1-13 + index + root/output artifacts + strict 7 + aiworkflow ledger + collapse-persistence follow-up を記録 |
| 整合性あり | PASS | 実コード（`session.isAdmin` / `activePath`+`mobileTriggerSlot` props / `loadSchemaDiffCount`）と doc 記述を一致。placeholder（x-pathname / getSchemaDiffCount / `session.user.isAdmin`）排除 |
| 依存関係整合 | PASS | Task A/B/E を resolved-in-this-wave として記録。残作業（staging visual / commit / push / PR）を user-gated として明示 |
