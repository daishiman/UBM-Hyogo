# workflow-issue-264-cron-schedule-free-tier-guard Artifact Inventory

| Item | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/` | present |
| implementation guard | `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` | present |
| root artifacts | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/artifacts.json` | present |
| output artifacts mirror | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/outputs/artifacts.json` | present |
| phase 1-13 specs | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/phase-01.md` ... `phase-13.md` | present |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/outputs/phase-11/focused-vitest-local.txt` | present |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/outputs/phase-12/` | present |
| canonical deployment spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | synced |
| quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | synced |
| resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | synced |
| active workflow ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | synced |
| dated changelog | `.claude/skills/aiworkflow-requirements/changelog/20260531-issue-264-cron-schedule-free-tier-guard.md` | present |
| skill log | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | synced |
| lessons learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-264-cron-schedule-free-tier-guard-2026-05.md` | present |

## Evidence

- Focused Vitest: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` -> 1 file / 16 tests PASS.
- Package-script regression: `mise exec -- pnpm --filter @ubm-hyogo/api test -- wrangler-cron-schedule` -> apps/api 76 files / 481 tests PASS.
- Runtime deploy, optional staging cron tail, commit, push, PR, and Issue mutation remain user-gated.

## Lessons Learned

苦戦点は `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-264-cron-schedule-free-tier-guard-2026-05.md`（L-I264-001..008）に記録。

- L-I264-001: section header の部分文字列衝突。`"[triggers]"` は `"[env.staging.triggers]"` の suffix → 素朴 `indexOf` 禁止、`^\[name\]$` 行アンカー正規表現で一意化。
- L-I264-002: `match.index === 0`（先頭 section）を falsy 判定で absent 扱いしない。存在は `== null`、offset は `?? 0`。
- L-I264-003: section 名の `[` `]` `.` は RegExp メタ文字 → `normalizeSectionHeader` + `escapeRegExp` の二段正規化。
- L-I264-004: コメント除去 → 値抽出の順序固定（commented-out legacy cron を拾わない）。
- L-I264-005: 複数行 cron 配列は `[^\]]*` で改行込みキャプチャ（dotAll 不要）。
- L-I264-006: section body は次 `^\s*\[` 見出しまでに上界を切り、次 section の crons を誤読しない。
- L-I264-007: CLOSED/obsolete issue は陳腐化 AC（supersede 記録のみ）と本質課題（guard 化）を分離。再 open 不要。
- L-I264-008: 予算/上限/一致 invariant は文書化に加え実行可能 guard で enforcement 化（CONST_004・zero-dep）。
- 注意（参照実装 drift）: Phase 12 implementation-guide 初稿の参照 `extractCrons` は素朴 `indexOf` + `split(",")` 版で、shipped 実装（アンカー正規表現 + `matchAll`）と乖離。正本は shipped 実装。流用時は L-I264-001/003/005 を参照。
