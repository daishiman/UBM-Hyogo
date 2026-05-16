# Artifact Inventory: Issue #623 Vitest Spec Suffix Convergence

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-623-vitest-spec-suffix-convergence/` |
| state | `implementation_completed / implementation / NON_VISUAL / Phase 11 evidence partial (AC-7 runtime-pending due to ENOSPC) / Phase 12 strict 7 files present / Phase 13 pending_user_approval` |
| predecessor | Issue #325（`docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/`）/ UT-issue-325-followup-003（scope-out 棚卸しから昇格） |
| parent workflow | none（Issue #325 系譜の直接 follow-up） |
| target | `apps/web/**` + `packages/**` + `.claude/skills/**` + `apps/api/migrations/seed/**` 全 159 ファイル `*.test.{ts,tsx}` → `*.spec.{ts,tsx}`（git mv R100） |
| config convergence | root `vitest.config.ts` の `test.include` を `**/*.spec.{ts,tsx}` 単一に収斂、`coverage.exclude` から `**/*.test.{ts,tsx}` 削除。apps/api / apps/web / packages 配下に個別 `vitest.config.*` なし（root 集約方式）。 |
| local gate | `scripts/hooks/block-test-suffix.sh`（実行権限付与済み）、`lefthook.yml` `pre-commit.commands.block-test-suffix` |
| CI gate | `.github/workflows/verify-test-suffix.yml`（push / PR で main / dev branch gate） |
| invariant docs | `CLAUDE.md` §重要な不変条件 第8項「新規 test ファイルは `*.spec.{ts,tsx}` のみ」を追記 |
| ADR | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` 末尾に「二段階対応終了 2026-05-12」追記 |
| Phase 11 evidence | `outputs/phase-11/main.md`（AC-1..AC-6 captured、AC-7 parity は ENOSPC により runtime-pending として CI 側に委譲） |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |

## Invariants

- 新規 test ファイルの suffix は `*.spec.{ts,tsx}` のみ。`*.test.{ts,tsx}` は lefthook `block-test-suffix` と GitHub Actions `verify-test-suffix` が reject する（二重 gate）。
- `vitest.config.ts` の `test.include` に `*.test.{ts,tsx}` パターンを再追加しない（縮退状態の維持）。
- vitest config は root 集約方式を維持し、apps/api / apps/web / packages 配下に個別 `vitest.config.*` を新設しない。
- ADR `test-file-suffix-adr.md` は二段階対応終了済みの状態を current として記録する。
- Phase 11 AC-7 の runtime parity 取得は CI 側 `vitest` workflow + `verify-test-suffix` で gate する設計判断。実装完了 (`implementation_completed`) を否定しない。

## Scope Out

- 既存 vitest スイートの assertion / fixture / coverage threshold の変更（rename + config 縮退のみ）。
- 新規 test の追加・既存 test のロジック修正。
- `*.spec.{ts,tsx}` 内の responsibility suffix（contract/authz/repository/unit）見直し（Issue #325 完了状態を踏襲）。

## Lessons / Genealogy

- 系譜: Issue #325（apps/api 132 ファイル先行 rename / 2026-05-09）→ Issue #623（apps/web + packages + .claude/skills を含む全体収斂 / 2026-05-12、followup-003 由来）。
- lessons-learned: `lessons-learned-issue-623-vitest-spec-suffix-convergence-2026-05.md`（L-623-001..004）
- legacy register: `legacy-ordinal-family-register.md` の 2026-05-12 NOTE を参照（issue-NNN namespace は ordinal family 外のため Current Alias Overrides 行は追加しない）。
