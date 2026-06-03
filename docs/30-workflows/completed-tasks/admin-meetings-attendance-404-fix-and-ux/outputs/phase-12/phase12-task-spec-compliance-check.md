**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12: phase12 task spec compliance check

canonical 9 headings (`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections) を逐語使用する。`verify-phase12-compliance` / pre-push `phase12-compliance-guard.sh` がこの見出しを SSOT として読む。

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-attendance-404-fix-and-ux` |
| workflow root | `docs/30-workflows/admin-meetings-attendance-404-fix-and-ux/` |
| branch | `docs/admin-meetings-attendance-404-and-ia-spec` |
| owner | `daishiman` |
| created_at | `2026-06-02` |
| workflow_state | `implemented_local_runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| issue | なし（`issue: null` / staging 実機エラー起点） |

## 1. Summary verdict

本 wave は admin `/admin/meetings` の「開催日追加 404」と「出席管理 UI/UX」を、apps/web 内で実装し focused Vitest を通した `implemented_local_runtime_pending` サイクルである。staging 実測・screenshot・commit/PR は user-gated。

- 目的: (A) admin API proxy（`apps/web/app/api/admin/[...path]/route.ts`）の transport を `server-fetch.ts` と同一の service binding（`getAuthEnv().API_SERVICE`）優先へ統一し、`POST /api/admin/meetings` の 404 を解消する。(B) 開催日カードに出席人数バッジ・出席者氏名・運用導線を追加し、出席管理を実用画面にする。
- スコープ: 1 サイクル完了可能（CONST_007）。INTERNAL_API_BASE_URL 実値修正 / 出席 CSV import UI 化は構造的別件としてスコープ外（`unassigned-task-detection.md`、formalize 0 件）。
- 真因: GET=service binding（最新 api 直結・成功）/ POST=HTTP（`INTERNAL_API_BASE_URL` 値依存で 404）という transport 非対称。コードベースで確定済み（Phase 3 §3.4）。

## 2. Changed-files classification

| class | files | 備考 |
|---|---|---|
| 実装 | `apps/web/app/api/admin/[...path]/route.ts`（A）, `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`（B1）, `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`（B2/B3）, `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx`（B1/B2/B4） + focused tests | implemented local |
| docs | 本 workflow root 配下 `index.md` / `artifacts.json` / `outputs/artifacts.json` / `outputs/phase-{1..13}/*`（Phase 11 local evidence + Phase 12 strict 7 + Phase 13 PR plan） | implemented_local_runtime_pending close-out |
| out-of-scope（不変） | `apps/api/**`（meetings.ts / attendance.ts / index.ts / D1 migrations） / `apps/web/src/lib/admin/api.ts`（attendance パス）/ `apps/web/src/lib/admin/server-fetch.ts`（参照元）/ `apps/web/src/lib/env.ts`（`getAuthEnv` 公開済み）/ Google Form schema / `/admin/dashboard/attendance` | `unassigned-task-detection.md` |

> 本ワークフローは docs と apps/web 実装を同一 wave で更新した。skill 本体定義の変更は不要と判断した。

## 3. `workflow_state` and phase status consistency

| 表記場所 | 値 | 一致 |
|---|---|---|
| `index.md` frontmatter | `implemented_local_runtime_pending` | ✅ |
| root / `outputs/artifacts.json` `status` / `metadata.workflow_state` / `metadata.taskType` / `metadata.visualEvidence` / `metadata.scope` | `implemented_local_runtime_pending` / present and current | ✅ |
| `outputs/phase-12/main.md` / `phase-12.md` mirror | `implemented_local_runtime_pending` / strict 7 present | ✅ |
| 本ファイル メタ情報 `workflow_state` | `implemented_local_runtime_pending` | ✅ |
| Phase 11 evidence Status 列 | focused Vitest PASS、screenshot 2 files = `pending`（user-gated staging・未取得） | ✅ |
| Gate-A/B/C | Gate-A passed（spec review）/ Gate-B passed（implementation）/ Gate-C pending（external ops） | ✅ |
| Phase 13 status | `pending_user_approval` | ✅ |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test plan (phase-11 spec) | outputs/phase-11/phase-11.md | present |
| focused Vitest | outputs/phase-11/evidence/focused-vitest.log | present |
| screenshot (after 404 fix) | outputs/phase-11/screenshots/admin-meetings-attendance-after-fix.png | pending |
| screenshot (attendance count badge) | outputs/phase-11/screenshots/admin-meetings-attendance-count-badge.png | pending |

> screenshot は staging 認証（admin cookie）必須のため user-gated であり、未取得（pending）。`screenshots/` ディレクトリと placeholder PNG は作成しない（PNG 0 件が正）。focused Vitest は 4 files / 15 tests PASS。

## 5. Phase 12 strict 7 file inventory

| # | path | status | lines / key_sections_present |
|---|------|--------|---|
| 1 | `outputs/phase-12/main.md` | present | Task 12-1〜12-6 サマリ（`phase-12.md` は mirror summary） |
| 2 | `outputs/phase-12/implementation-guide.md` | present | Part 1 / Part 2 / 視覚証跡 |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present (本ファイル) | canonical 9 headings |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | present | Step 1-A/1-B/1-C / Step 2 (N/A) |
| 5 | `outputs/phase-12/skill-feedback-report.md` | present | テンプレ/ワークフロー/ドキュメント |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | present | current 0 / baseline 4（構造的別件 2 + Phase 10 §10.6 discretionary 2・いずれも起票不要） |
| 7 | `outputs/phase-12/documentation-changelog.md` | present | workflow-local / global skill sync 別ブロック |

## 6. Skill/reference/system spec same-wave sync

| surface | path | 状態 | 同期内容 |
|---|---|---|---|
| task-workflow-active ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 反映済み | current fact（404 真因 = proxy transport 非対称 / 修正 = service binding 統一）を ledger 行に追記 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-meetings-attendance-404-fix-and-ux-artifact-inventory.md` | 反映済み | 専用 inventory ファイルを新設 |
| indexes（quick-reference / resource-map） | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` | 反映済み | current canonical set に当該 workflow を登録 |
| indexes（topic-map / keywords） | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` | 反映済み | `indexes:rebuild`（generate-index.js）で自動再生成 |
| SKILL-changelog | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | 反映済み | current fact を headline 同期 |
| LOGS | `docs/30-workflows/LOGS.md` | 反映済み | Latest Updates へ 1 行追記 |
| lessons-learned | （新規追加なし） | no-op | service-binding first / state 由来 attendance count は既存 practice で吸収可能。固有 lesson file は追加しない |
| task-specification-creator pattern | `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | no-op | 既存 transport mirror / identifier drift 防止 practice で十分。新規 rule は不要 |

> proxy transport 統一は内部実装変更で API contract 不変のため Step 2 N/A。global skill sync は current fact の登録に限定し、skill 本体定義の変更・新規 lesson file 追加は不要。references 本体（500行制約対象）の追加はないため index drift も SKILL.md 本体変更も発生しない。

## 7. Runtime or user-gated boundary

| 種別 | 項目 | 境界 |
|---|---|---|
| local 自動（本 wave） | Phase 1-13 spec 作成 / strict 7 outputs 作成 / focused Vitest / web typecheck / web lint / verify:phase12-compliance | 完了 |
| local 実装（本 wave） | route.ts transport 統一 + `_meetings/*` 改修 + focused tests | 完了 |
| user-gated | `git commit` / `git push` / `gh pr create --base dev` | user 承認後 |
| user-gated | staging deploy（`scripts/cf.sh deploy`）・staging での `POST /api/admin/meetings` 201 実測・screenshot 撮影 | user 承認後（実装完了後） |

## 8. Archive/delete stale-reference gate

本 wave で archive / delete 対象なし。stale 候補は次のとおり同一 wave で確認済み。

| 候補 | 種別 | 対処 |
|---|---|---|
| proxy `route.ts` 末尾の `fetch(target, init)`（HTTP only） | 更新済み | service binding 優先 / HTTP fallback / 500 の 3 分岐へ統合。既存 admin gate・header 中継・body 中継は不変 |
| `MeetingAttendanceDrawer.tsx` の出席者 `<span>{memberId}</span>` | 更新済み | candidates 由来の氏名表示 + memberId 補助表示へ |
| `MeetingTimeline.tsx` 開催日カード見出し（出席情報なし） | 更新済み | 出席人数バッジ + aria-label 導線を追加 |

> 本 wave は正本索引（quick-reference / resource-map / task-workflow-active）へ current fact を追記する。新規 lesson file は追加しない。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | workflow_state / index / root artifacts / output artifacts / phase-12 main / 本 compliance check が `implemented_local_runtime_pending` で一致。Phase 11 は focused Vitest PASS + runtime screenshot pending、Gate-A/B passed・Gate-C pending で整合 |
| 漏れなし | PASS | Phase 1-13 spec、apps/web 実装、focused Vitest、Phase 11 manual test plan（3 層評価 + canonical 名計画）、Phase 12 strict 7、Phase 13 PR plan、未タスク検出（formalize 0）を反映 |
| 整合性あり | PASS | metadata（workflow_state / taskType / visualEvidence / scope / implementation_files / gates）、canonical 9 headings、VISUAL_ON_EXECUTION boundary、実コード識別子（`adminServiceBinding` / `binding.fetch` / `isTestOrPlaywright` / `apiBase` / `getAttendanceCount`）が一致 |
| 依存関係整合 | PASS | apps/api / D1 / Google Form / `useAdminMutation` / `api.ts` / `server-fetch.ts` / `env.ts` は不変。実装・commit・push・PR・staging deploy・screenshot は user-gated boundary として分離 |

総合 verdict: **4 条件 PASS**。ローカル実装と focused tests は完了。commit / PR / staging deploy / screenshot は Phase 13 user-gated。

> 本ワークフローは未だ `completed-tasks/` 配下へ移動していない `implemented_local_runtime_pending` 状態のため、`verify-phase12-compliance` の ancestor 判定は非拘束。
