# Workflow Artifact Inventory: issue-1063-shell-collapse-cookie-secure-attribute

## Workflow Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1063-shell-collapse-cookie-secure-attribute/` | present |
| root metadata | `docs/30-workflows/completed-tasks/issue-1063-shell-collapse-cookie-secure-attribute/artifacts.json` | present |
| output metadata | `docs/30-workflows/completed-tasks/issue-1063-shell-collapse-cookie-secure-attribute/outputs/artifacts.json` | present |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-1063-shell-collapse-cookie-secure-attribute/outputs/phase-11/manual-test-result.md` | focused Vitest PASS, browser smoke user-gated |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1063-shell-collapse-cookie-secure-attribute/outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Implementation Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| cookie serializer | `apps/web/src/components/shell/shell-collapse-cookie.ts` | `Secure` HTTPS/runtime branch added |
| focused test | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` | 10 tests PASS |

## System Boundary

| Boundary | Status |
| --- | --- |
| API / D1 / Google Form schema | unchanged |
| Auth / session | unchanged |
| CSS / design tokens | unchanged |
| Issue #1063 | CLOSED maintained; PR wording must use `Refs #1063` |
| External operations | commit, push, PR, staging DevTools smoke are user-gated |

## Lessons Learned

| Lessons | Path |
| --- | --- |
| L-I1063-001..004 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-1063-shell-collapse-cookie-secure-attribute-2026-06.md` |

- L-I1063-001: CLOSED issue の再スコープは reopen せず `index.md` frontmatter (`issue_state` / `issue_state_note`) で表明する。
- L-I1063-002: runtime 依存の純粋関数は optional 引数の既定値に runtime 判定を置き「本番無改修・テスト決定論的」を両立する。
- L-I1063-003: CLOSED issue の現存判定は全ローカルブランチ `git show <branch>:<path> | grep` で機械的に行う。
- L-I1063-004: `Secure` / `HttpOnly` は read 値に現れないため serializer 文字列を検証する（NON_VISUAL）。
