# Phase 12: phase12 task spec compliance check

**[実装区分: 実装 / 状態: implemented_local_evidence_captured]**

canonical 9 headings (`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections) を逐語使用する。`verify-phase12-compliance` / pre-push `phase12-compliance-guard.sh` がこの見出しを SSOT として読む。

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-identity-conflicts-prototype-alignment-and-404-fix` |
| workflow root | `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/` |
| branch | `feat/admin-identity-conflicts-prototype-alignment` |
| owner | `daishiman` |
| created_at | `2026-05-27` |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |

## 1. Summary verdict

本 wave で web UI alignment の実コード変更と local verification を完了。staging runtime / visual screenshot / commit-push-PR は user-gated として残す。

- 目的 (A): `/admin/identity-conflicts` を他 admin route と同等の `AdminPageHeader` + primitive 構造に整合
- 目的 (B): staging `ADMIN_FETCH_404` を H1〜H5 仮説検証で切り分け修復
- スコープ: 1 PR 同梱 (CONST_007)。未タスク 7 候補は `unassigned-task-detection.md` で採否済

## 2. Changed-files classification

| class | files | 備考 |
|---|---|---|
| A (UI整合) | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`（編集）, `apps/web/src/components/admin/IdentityConflictRow.tsx`（primitive 整合 + matched 表示維持） | Phase 4 §3 |
| B (404 修復) | `apps/web/src/lib/admin/safe-server-fetch.ts`（`ADMIN_FETCH_404` の `admin_fetch_404` warn 追加）+ `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts`（warn 発火検証追加）。staging H1-H5 の外部復旧操作は Phase 13 user-gated | Phase 4 §4 |
| docs/skill | 本 workflow root 配下 22 ファイル + `docs/30-workflows/LOGS.md` + aiworkflow-requirements 5 surface (task-workflow-active / quick-reference / resource-map / artifact-inventory / changelog) | Phase 12 documentation-changelog |
| out-of-scope | API endpoint 追加 / D1 schema 変更 / admin auth 変更 / deploy pipeline 改修 / merge audit UI | unassigned-task-detection |

## 3. `workflow_state` and phase status consistency

| 表記場所 | 値 | 一致 |
|---|---|---|
| `index.md` frontmatter | `implemented_local_evidence_captured` | ✅ |
| root `artifacts.json` `status` | `implemented_local_evidence_captured` | ✅ |
| `outputs/artifacts.json` `status` | `implemented_local_evidence_captured` | ✅ |
| root/output artifacts parity | identical workflow metadata | ✅ |
| `outputs/phase-12/main.md` 現状 | `implemented_local_evidence_captured` | ✅ |
| 本ファイル メタ情報 `workflow_state` | `implemented_local_evidence_captured` | ✅ |
| Phase 11 evidence Status 列 | local non-visual evidence は present、local screenshots / staging は pending または user-gated | ✅ |
| Gate-A/B/C | 全 `pending` (spec 段階の正常値) | ✅ |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| local validation summary | outputs/phase-11/evidence/local-validation-summary.txt | present |
| typecheck log | outputs/phase-11/evidence/typecheck.txt | present |
| lint log | outputs/phase-11/evidence/lint.txt | present |
| no-inline-style log | outputs/phase-11/evidence/no-inline-style.txt | n/a |
| web test log | outputs/phase-11/evidence/test-web-identity-conflict-row.txt | present |
| api contract spec log | outputs/phase-11/evidence/contract-spec.txt | present |
| build log | outputs/phase-11/evidence/build.log | pending |
| PII grep log | outputs/phase-11/evidence/pii-grep.txt | present |
| D1 grep log | outputs/phase-11/evidence/d1-grep.txt | present |
| legacy hook grep log | outputs/phase-11/evidence/legacy-hook-grep.txt | present |
| safe-server-fetch warn vitest log | outputs/phase-11/evidence/safe-server-fetch-warn.txt | present |
| screenshot (empty desktop) | outputs/phase-11/screenshots/identity-conflicts-empty-desktop.png | pending |
| screenshot (empty mobile) | outputs/phase-11/screenshots/identity-conflicts-empty-mobile.png | pending |
| screenshot (list desktop) | outputs/phase-11/screenshots/identity-conflicts-list-desktop.png | pending |
| screenshot (list tablet) | outputs/phase-11/screenshots/identity-conflicts-list-tablet.png | pending |
| screenshot (merge confirm 1) | outputs/phase-11/screenshots/identity-conflicts-merge-confirm-1.png | pending |
| screenshot (merge confirm 2) | outputs/phase-11/screenshots/identity-conflicts-merge-confirm-2.png | pending |
| screenshot (dismiss modal) | outputs/phase-11/screenshots/identity-conflicts-dismiss-modal.png | pending |
| screenshot (error 500) | outputs/phase-11/screenshots/identity-conflicts-error-500.png | pending |
| staging curl evidence | outputs/phase-11/evidence/staging-curl.txt | pending |

## 5. Phase 12 strict 7 file inventory

| # | path | status |
|---|------|--------|
| 1 | `outputs/phase-12/main.md` | present |
| 2 | `outputs/phase-12/implementation-guide.md` | present |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present (本ファイル) |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 5 | `outputs/phase-12/skill-feedback-report.md` | present |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | present |
| 7 | `outputs/phase-12/documentation-changelog.md` | present |

## 6. Skill/reference/system spec same-wave sync

| surface | path | 同期内容 |
|---|---|---|
| aiworkflow-requirements (active) | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow を active section に追加済 |
| aiworkflow-requirements (index) | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | identity-conflicts UI alignment entry 追加済 |
| aiworkflow-requirements (index) | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | identity-conflicts route surface ref 追加済 |
| aiworkflow-requirements (inv) | `.claude/skills/aiworkflow-requirements/references/workflow-admin-identity-conflicts-prototype-alignment-and-404-fix-artifact-inventory.md` | 本 workflow inventory 追加済 |
| aiworkflow-requirements (log) | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | dated entry 追加済 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | L-AIDC-001..N を末尾に汎化反映（実装後） |
| system spec | `.claude/skills/aiworkflow-requirements/references/` 配下 admin / identity spec | 影響なし (詳細は `system-spec-update-summary.md`) |

generated `topic-map.md` / `keywords.json` の全面再生成は差分肥大化を避け、本 wave では手動導線 5 点に限定した。

## 7. Runtime or user-gated boundary

| 種別 | 項目 | 境界 |
|---|---|---|
| local 実行 | typecheck / lint / web vitest / api contract spec / build / playwright admin spec / `verify-pr-ready.sh` | local 自動 (Claude 実行可、build/verify は Phase 13) |
| local 実行 | Phase 11 screenshot 8 枚 (existing visual-full pipeline 流用) | local 自動 (pending) |
| user-gated | staging deploy (`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`) | user 承認後 |
| user-gated | staging curl 200/302 smoke + Sentry `admin_fetch_404` 0 件確認 | user 実行 |
| user-gated | visual baseline 3 枚の commit (regenerate 後の bot push + 空コミット retrigger) | user 承認 |
| user-gated | `git commit` / `git push` / `gh pr create --base dev` | user 承認 |
| user-gated | D1 migration apply (`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`) — H3 hit 時のみ | user 実行 |
| user-gated | required check 追加 (もし新規 job がある場合) | user 実行 |

## 8. Archive/delete stale-reference gate

spec 段階で archive / delete 対象なし。下記は実装 wave で発生し得る stale 候補:

| 候補 | 種別 | 対処 |
|---|---|---|
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/full-visual-admin-identity-conflicts-*-linux.png` (3 枚) | regenerate | `--update-snapshots` 後の差分を baseline 更新 commit に含める |
| 旧 Tailwind 直書き class (`max-w-5xl`, `divide-y divide-zinc-200` 等) | 削除 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` から削除し token / primitive 経由へ |
| 旧 `<header>` markup の `text-2xl font-semibold tracking-tight` | 削除 | `AdminPageHeader` 化に伴い消滅 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` の Tailwind class selector | 更新 | role / text 主体 selector へ |

`pnpm indexes:rebuild` idempotent (drift 0) を `verify-pr-ready.sh` で確認する。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS / local | workflow_state / Phase 12 main / root artifacts / output artifacts / 本 compliance check が `implemented_local_evidence_captured` で一致。B 系は API/proxy 不変更 + staging user-gated に統一 |
| 漏れなし | PASS / local | 実コード差分、Phase 12 strict 7、root/output artifacts parity、aiworkflow 同期 5 点、local typecheck/Vitest evidence を反映 |
| 整合性あり | PASS / local | canonical 9 headings 順序 + evidence inventory 表構造 (Classification / Path / Status) + Phase 別表 が SSOT 準拠 |
| 依存関係整合 | PASS / local | API/proxy/D1/auth は不変更。staging deploy/env/curl/visual/commit-push-PR は user-gated boundary として分離 |

総合 verdict: **local 4 条件 PASS**。staging runtime / visual evidence は Phase 13 user-gated。
