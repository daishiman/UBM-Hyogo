# Phase 12 タスク仕様準拠チェック

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

canonical 9 見出し（`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections）を逐語使用する。`verify-phase12-compliance` / pre-push `phase12-compliance-guard.sh` がこの見出しを SSOT として読む。

## メタ情報

| key | value |
|---|---|
| タスクID | `issue-1043-identity-conflicts-row-fade-animation` |
| タスク名 | optimistic row 消失に fade animation を追加 (FU-AIDC-007) |
| workflow | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/` |
| branch | `docs/issue-1043-identity-conflicts-row-fade-animation-spec` |
| owner | `daishiman` |
| 実施日 | `2026-06-02` |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| issue | `#1043`（調査時点 `OPEN`） |
| 判定 | **PASS** |

## 1. Summary verdict

本 wave は Issue #1043（FU-AIDC-007）の Phase 1-13 実装仕様書を作成する `implemented_local_evidence_captured` タスクである。`IdentityConflictRow.tsx` の exiting 相追加、focused Vitest、local Playwright、Phase 11 screenshot 3 PNG 取得は完了。commit・push・PR・Issue mutation は user-gated。

- 目的: merge 二段階 confirm 完了直後の row 消失を「即時 `return null`」から「短い fade / collapse による退場（exiting 相）→ DOM 除去（removed 相）」へ置き換える設計を実装可能粒度で固定。
- スコープ: 単一 component の state 機構追加 + Tailwind transition utility + test であり 1 サイクル完了可能（CONST_007）。dismiss 側 fade / hook 汎化 / API 変更は明示スコープ外。
- 設計核心: 新規 `isExiting`（exiting 相）+ `exitTimerRef`（fallback timer）、`finalizeRemoval`（`transitionend`/timeout 二重化）、rollback で全経路 timer clear、reduced-motion 3 重保証。既存 `optimisticMerged`（removed 相）/ `stage`（dialog 制御）は維持。
- 判定: canonical 7 成果物全 present、identifier drift なし、新規未タスク 0 件で **PASS**。

### 受け入れ条件 mapping（補足）

| AC | 内容（要約） | spec 対応 | 状態 |
| --- | --- | --- | --- |
| AC-1 | merge 実行直後に row が exiting 相（fade out 開始） | `onMerge` で `setIsExiting(true)`（Phase 2 §2.1 / impl-guide） | implemented_local_evidence_captured（実装済み） |
| AC-2 | fade 完了後 row が DOM 除去（removed 相） | `finalizeRemoval` → `optimisticMerged=true` → `return null` | implemented_local_evidence_captured |
| AC-3 | server error で exiting キャンセル + row 復元 + inline error | `.catch` で `clearTimeout` + `isExiting=false`、`mergeError` surface | implemented_local_evidence_captured |
| AC-4 | success で row 消えたまま | `optimisticMerged` 維持 + 既存 `router.refresh()` | implemented_local_evidence_captured |
| AC-5 | reduced-motion で抑制（ほぼ即時消失） | globals.css + Tailwind `motion-reduce` + timeout fallback の 3 重保証 | implemented_local_evidence_captured |
| AC-6 | dismiss 不変 | dismiss に exiting / fade を適用しない | implemented_local_evidence_captured |
| AC-7〜AC-11 | Vitest / typecheck / lint / e2e / screenshot | focused Vitest 13/13 PASS、web typecheck PASS、web lint PASS、local Playwright desktop 8/8 PASS、Phase 11 screenshots 3 PNG captured |

## 2. Changed-files classification

| class | files | 備考 |
|---|---|---|
| 実装（本 WF で編集済み） | `apps/web/src/components/admin/IdentityConflictRow.tsx`, `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`, `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | exiting 相 + timer + transitionend handler + 条件付き fade class / focused Vitest / e2e |
| docs（本 wave で作成） | 本 workflow root 配下 `index.md` / `artifacts.json` / `outputs/artifacts.json` / `outputs/phase-{1..13}/*` / Phase 12 strict 7 | implemented_local_evidence_captured close-out |
| out-of-scope（不変） | merge endpoint / D1 schema / `page.tsx`（Server Component） / `useAdminMutation` hook / `globals.css` / `tokens.css` / dismiss 側挙動 | 不変条件 #1 / #2 / #10 |

### 不変条件 compliance（補足）

| 不変条件 | 判定 | 根拠 |
|---|---|---|
| #1 既存 API のみ | PASS | merge endpoint / trigger payload 不変 |
| #2 OKLch トークン正本（HEX 直書き禁止） | PASS | Tailwind 汎用 transition utility のみ。HEX / inline style / 新規 token / keyframes なし |
| #5 D1 直接アクセス禁止 | PASS | component-local state のみ。D1 binding 参照なし |
| #9 admin form は FormField / primitive 経由 | PASS | 既存 `Button` / `Textarea` / `Badge` 流用。新規 `<input>` なし |
| #10 admin mutation は `@/features/admin/hooks` 経由 | PASS | `useAdminMutation` 流用。legacy `@/lib/useAdminMutation` 不使用 |

## 3. `workflow_state` and phase status consistency

| source | 値 | 一致 |
|---|---|---|
| `index.md` front-matter `workflow_state` | `implemented_local_evidence_captured` | ✅ |
| `artifacts.json` `status` / `metadata.workflow_state` | `implemented_local_evidence_captured` | ✅ |
| `outputs/artifacts.json` | `implemented_local_evidence_captured`（root と byte-identical） | ✅ |
| `outputs/phase-12/main.md` | `implemented_local_evidence_captured` | ✅ |
| 本 compliance check | `implemented_local_evidence_captured` | ✅ |

- phase status: phase-1〜12 = `completed`（spec）、phase-13 = `pending_user_approval`。`artifacts.json` の `phases` と `index.md` の Phase 一覧が一致。
- Gate: Gate-A=passed / Gate-B=passed / Gate-C=pending が `artifacts.json` `metadata.gates` と §7 で一致。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| ui sanity visual review | outputs/phase-11/ui-sanity-visual-review.md | present |
| screenshot plan | outputs/phase-11/screenshot-plan.json | present |
| capture metadata | outputs/phase-11/phase11-capture-metadata.json | present |
| screenshot (exiting fade) | outputs/phase-11/screenshots/identity-conflict-row-exiting-fade.png | present |
| screenshot (removed stable) | outputs/phase-11/screenshots/identity-conflict-row-removed-stable.png | present |
| screenshot (rollback restored) | outputs/phase-11/screenshots/identity-conflict-row-rollback-restored.png | present |

> screenshot 3 点は local admin identity conflicts fixture で取得済み。spec / plan / metadata 類も implemented_local_evidence_captured で `present`。

## 5. Phase 12 strict 7 file inventory

| # | file | Status |
|---|---|---|
| 1 | outputs/phase-12/main.md | present |
| 2 | outputs/phase-12/implementation-guide.md | present |
| 3 | outputs/phase-12/system-spec-update-summary.md | present |
| 4 | outputs/phase-12/documentation-changelog.md | present |
| 5 | outputs/phase-12/unassigned-task-detection.md | present |
| 6 | outputs/phase-12/skill-feedback-report.md | present |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | present（本ファイル） |

- implementation-guide.md は Part 1（中学生レベル・例え話）+ Part 2（型 / 定数 / ハンドラ擬似コード / 相遷移 / CSS / reduced-motion / jsdom 制約 / エラー / エッジケース / 設定値）+ 視覚証跡を含む。
- identifier drift 確認: `isExiting` / `exitTimerRef` / `finalizeRemoval` / `onMerge` / `optimisticMerged` が Phase 2 §2.1 設計と implementation-guide で一致。

## 6. Skill/reference/system spec same-wave sync

| 対象 | 判定 | 根拠 |
|---|---|---|
| aiworkflow-requirements system spec（Step 2） | N/A | 新規公開 interface / 型 / 定数 / API 変更なし（component-local state のみ）。`system-spec-update-summary.md` で N/A を記録 |
| task-specification-creator / aiworkflow-requirements LOGS.md・SKILL.md | implemented_local_evidence_captured のため本 WF では skill 同期不要 | 本タスクは workflow 成果物と実コード・focused test の同一 cycle 実装。skill 改善 lessons は本サイクルで aiworkflow-requirements inventory へ反映（`skill-feedback-report.md` に記録） |
| workflow-local docs | 同 wave 同期済み | `index.md` / `artifacts.json` / `outputs/artifacts.json` / phase spec / Phase 12 strict 7 を同一 wave で作成 |
| indexes（topic-map / keywords） | 別 skill 管理・本 WF 非対象 | `docs/30-workflows` は aiworkflow-requirements indexes の対象外 |

## 7. Runtime or user-gated boundary

| 項目 | 種別 | 境界 |
|---|---|---|
| `IdentityConflictRow.tsx` 編集（exiting 相追加） | local 実装 | 完了 |
| focused Vitest 更新・実行 | local テスト | 完了 |
| Playwright e2e spec 更新・実走 | local テスト | desktop 8/8 PASS |
| Phase 11 screenshot 3 枚の取得 | visual evidence | captured（local fixture） |
| `pnpm typecheck` / `pnpm --filter web lint` | local 検証 | focused Vitest 13/13 PASS、web typecheck PASS、web lint PASS |
| `git commit` / `git push` / `gh pr create --base dev` | external ops | user-gated |
| GitHub Issue #1043 の状態変更 | external ops | user-gated（reopen / close しない） |

> 本 WF は local implementation、focused Vitest、local Playwright、Phase 11 screenshots まで完了。commit・push・PR・Issue mutation は user-gated。

## 8. Archive/delete stale-reference gate

| 項目 | 判定 | 根拠 |
|---|---|---|
| 完了タスク dir の `completed-tasks/` 移動 | N/A | 本 WF は implemented_local_evidence_captured の新規作成。close-out 移動は実装完了後の別 wave |
| stale 参照の削除 / 書換 | なし | 既存 workflow / skill ファイルを削除・改名していない |
| 親 #988 成果物の越境編集 | 不実施（意図的） | `completed-tasks/issue-988-.../outputs/phase-11/` の screenshot / metadata は編集しない。意味 drift は #1043 側 `phase11-capture-metadata.json` の注記で解決（MINOR-2） |
| 発見元 unassigned spec | 温存 | `docs/30-workflows/unassigned-task/admin-identity-conflicts-followup-005-row-fade-animation.md` は実装完了後の close-out で co-locate 判断 |

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | workflow_state（`index.md` / root artifacts / output artifacts / phase-12 main / 本 compliance check）が `implemented_local_evidence_captured` で一致。Gate-A=passed / Gate-B=passed / Gate-C=pending（外部操作）で一致 |
| 漏れなし | PASS | Phase 1-13 spec、Phase 12 canonical 7 outputs、AC-1〜AC-11 mapping、設計核心識別子、Phase 11 canonical screenshot 名を反映 |
| 整合性あり | PASS | identifier（`isExiting` / `exitTimerRef` / `finalizeRemoval` / `onMerge`）が phase-2 spec と impl-guide で一致。canonical 9 見出し逐語、§4 evidence inventory の `present` 区別、root/outputs artifacts byte-identical parity |
| 依存関係整合 | PASS | merge endpoint / D1 / `page.tsx` / `useAdminMutation` / `globals.css` / `tokens.css` は不変。commit・push・PR・Issue mutation は user-gated boundary として分離 |

総合 verdict: **4 条件 PASS**。local 実装、focused Vitest、local Playwright、Phase 11 screenshot 3 PNG は完了。PR・Issue mutation は Phase 13 user-gated。
