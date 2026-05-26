# Phase 12: phase12-task-spec-compliance-check

[実装区分: 実装仕様書]

> CI gate `verify-phase12-compliance` 用 canonical 成果物。本 root は `workflow_state=implemented_local_evidence_captured`（実装・local evidence 取得済み、commit / push / PR は user-gated）。

## Summary verdict

| Item | Verdict | Evidence |
| --- | --- | --- |
| Overall | `implemented_local_evidence_captured` | issue #903 を current code に最適化して実装。`/profile` を `(member)` route group 配下へ移し、EV-13/EV-16 scrape 対象を本タスク内で成立させた |
| taskType | `implementation` | `artifacts.json.metadata.taskType` |
| visualEvidence | `VISUAL` | 1280x800 member-shell.png + DOM scrape |
| workflow_state | `implemented_local_evidence_captured` | phase-01..13 + outputs/phase-12 + outputs/phase-11 evidence を同期 |
| implementation_mode | `code_change_plus_evidence` | profile move + scrape spec 追加 + evidence 取得 + 親台帳更新 |
| phase 13 | `pending_user_approval` | commit / push / PR は user-gated（base=dev） |

## Changed-files classification

| Path | Classification | Status |
| --- | --- | --- |
| `docs/30-workflows/issue-903-.../index.md` | workflow root spec | `implemented_local_evidence_captured` |
| `docs/30-workflows/issue-903-.../artifacts.json` | root metadata ledger | `implemented_local_evidence_captured` |
| `docs/30-workflows/issue-903-.../phase-01..13-*.md` | phase specifications | `implemented_local_evidence_captured` |
| `docs/30-workflows/issue-903-.../outputs/phase-12/*.md` | Phase 12 strict 7 file inventory | `implemented_local_evidence_captured` |
| `apps/web/app/(member)/profile/**` | route group relocation | implemented |
| `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts` | scrape spec | implemented / 1 passed |
| `docs/30-workflows/.../parallel-03-appshell-layouts/phase-11-evidence-inventory.md` | 親台帳 EV-13/EV-16 更新 | implemented |

## `workflow_state` and phase status consistency

| Check | Verdict | Evidence |
| --- | --- | --- |
| root/output parity | `implemented_local_evidence_captured` | root `artifacts.json` と Phase 12 outputs を同期 |
| Phase 1-10 | `implemented_local_evidence_captured` | 実装対象・gate・DoD・検証コマンドを記述し実行済み |
| Phase 11 | `implemented_local_evidence_captured` | evidence inventory の実取得行を `present` 化 |
| Phase 12 | `implemented_local_evidence_captured` | strict 7 file inventory を生成・更新済み |
| Phase 13 | `pending_user_approval` | commit/push/PR は user 承認後のみ |
| PASS wording | `implemented_local_evidence_captured` | bare `PASS` を使わず state suffix を付与 |

## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| typecheck log | outputs/phase-11/typecheck.log | present |
| lint log | outputs/phase-11/lint.log | present |
| profile unit log | outputs/phase-11/profile-unit.log | present |
| playwright scrape log | outputs/phase-11/playwright-member-scrape.log | present |
| DOM scrape (member) | outputs/phase-11/dom-scrape-member.txt | present |
| screenshot (member) | outputs/phase-11/screenshots/member-shell.png | present |
| parent ledger diff | outputs/phase-11/parent-ledger-ev13-ev16-diff.txt | present |
| verify-pr-ready log | outputs/phase-11/verify-pr-ready.log | n/a |

## Phase 12 strict 7 file inventory

| Required file | Status |
| --- | --- |
| `outputs/phase-12/main.md` | `implemented_local_evidence_captured` |
| `outputs/phase-12/implementation-guide.md` | `implemented_local_evidence_captured` |
| `outputs/phase-12/system-spec-update-summary.md` | `implemented_local_evidence_captured` |
| `outputs/phase-12/documentation-changelog.md` | `implemented_local_evidence_captured` |
| `outputs/phase-12/unassigned-task-detection.md` | `implemented_local_evidence_captured` |
| `outputs/phase-12/skill-feedback-report.md` | `implemented_local_evidence_captured` |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | `implemented_local_evidence_captured` — 本ファイル |

## Skill/reference/system spec same-wave sync

| Target | Status | Evidence |
| --- | --- | --- |
| `task-specification-creator` | no-op | 既存ルールで本タスクは充足 |
| `aiworkflow-requirements` indexes | synced | task-workflow-active / quick-reference / resource-map / artifact inventory / changelog / LOGS を同 wave 更新 |
| 親 `parallel-03-appshell-layouts/phase-11-evidence-inventory.md` | implemented | EV-13=present / EV-16=present + 委譲注記更新 |

## Runtime or user-gated boundary

| Boundary | Status | Evidence |
| --- | --- | --- |
| profile move 実行 | `implemented` | `apps/web/app/(member)/profile/page.tsx` exists |
| Playwright scrape 実行 | `implemented_local_evidence_captured` | `playwright-member-scrape.log` 1 passed |
| commit / push / PR | `pending_user_approval` | CONST_002 / base=dev |
| issue #903 | `OPEN (will close on PR merge)` | PR で `Closes #903` |
| D1 / production mutation | `none` | mock API 経由 scrape のみ |

## Archive/delete stale-reference gate

| Check | Verdict | Evidence |
| --- | --- | --- |
| deleted root | `n/a` | 本タスクは新規 root 追加のみ |
| stale reference | `n/a` | 親 workflow は live。台帳更新のみ |
| profile move 旧 path 参照 | fixed | `static-invariants.runtime.spec.ts` の `app/profile` path を `app/(member)/profile` に更新（Phase 5 Step 3） |

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| C1 単一責務 | `implemented_local_evidence_captured` | member runtime evidence 取得 + 必要最小の profile route 移動に限定 |
| C2 整合性 | `implemented_local_evidence_captured` | 親 parallel-03 台帳 / followup-002 R-07 / CLAUDE.md 4 不変条件と整合 |
| C3 可検証性 | `implemented_local_evidence_captured` | Phase 6/7/10 で gate コマンドとテストケースを明示 |
| C4 トレーサビリティ | `implemented_local_evidence_captured` | issue #903 / followup-002 / serial-05 / serial-07 / UT-DSF-07 (#829) への参照を Phase 1-13 に分散記載 |
