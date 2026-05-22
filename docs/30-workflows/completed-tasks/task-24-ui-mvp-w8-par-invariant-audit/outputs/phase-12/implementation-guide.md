# Implementation Guide — task-24-ui-mvp-w8-par-invariant-audit

## Part 1: 中学生レベルの概念説明

このタスクは、学校の持ち物チェックに近い。遠足の前に「水筒を持ったか」「名札をつけたか」「お菓子の量は決まりどおりか」を全員分見るように、このプロジェクトでも 22 個の作業が 6 つの約束を守っているかを表で確認する。

なぜ必要かというと、1 人ずつ見ているだけでは全体の見落としが起きやすいから。横並びの表にすれば、どの作業がどの約束を守れているか、次に直すべき場所がすぐ分かる。

何をするかは単純で、決められた言葉やファイルを探し、結果を `COMPLIANT`、`VIOLATION`、`N/A` のどれかで記録する。見つけた問題は場所だけを書く。コードそのものは直さない。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| audit | 持ち物チェック |
| invariant | 必ず守る約束 |
| matrix | 横並びの確認表 |
| evidence | 確認した証拠 |
| read-only | 見るだけで直さない |

## Part 2: 技術者向け

### Scope

- Task IDs: `task-01` through `task-22`
- Invariants: `INV-1` through `INV-6`
- Output report: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`
- Evidence output: `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/`
- Code mutation: forbidden for existing `apps/` and `packages/` files

### Interface

```ts
type Invariant = "INV-1" | "INV-2" | "INV-3" | "INV-4" | "INV-5" | "INV-6";
type Cell = "COMPLIANT" | "VIOLATION" | "N/A";

interface Violation {
  task: string;
  invariant: Invariant;
  file: string;
  line: number;
  excerpt: string;
  reason: string;
}
```

### Command Contract

```bash
bash docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/audit-runner.sh \
  docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5
```

Expected files:

- `grep-evidence.txt`
- `matrix.tsv`
- `violations.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`

### Error Handling

- No matching files: write `N/A`.
- Grep zero hits: write `COMPLIANT`.
- Raw grep hits: keep them in evidence.
- Suppressed hits: record why they are excluded by heuristic.
- Actionable hits: write `VIOLATION` with file and line. The matrix is based on actionable violations, not raw hits.

### Heuristics applied (false-positive suppression)

- INV-1 / INV-3 spec scans skip lines whose enclosing markdown section header matches the forbidden-section regex (`非ゴール`, `禁止事項`, `やらない`, `対象外`, `Non-Goals`, `Out of Scope` etc.), and lines containing inline negation phrases (`禁止`, `しない`, `せず`, `伴わず`, `生やさない`, `生成しない`, `一切`, `なし` …).
- INV-5 ignores test files (`__tests__`, `*.spec.*`, `*.test.*`) and comment-only lines (`//`, `*`), and excludes function-name patterns (`set/get/require/extract/normalize/parse/validate/create/update/delete/fetch/load/build/render/use/is/has/to/map/ensure/check/with/on` + CapCase). Only object-property-shaped `xxxConsent` identifiers in production code are counted.
- INV-4 excludes `apps/web/src/lib/__tests__/boundary.spec.ts` which intentionally constructs a `D1Database` reference to assert that the boundary lint rejects it.
- INV-3 compares `apps/web/src/components/ui` against `primitives-allowed.txt`; `primitives-unexpected.txt` must be empty.
- The report uses stable numeric task order (`task-01` through `task-22`) so downstream task-27 can consume it without path-sort ambiguity.

### Execution result (2026-05-14)

- Matrix: 132 cells (22 × 6) filled. 0 `VIOLATION`, 95 `COMPLIANT`, 37 `N/A`.
- Aggregated repo-wide checks: all 6 `COMPLIANT` with 0 hits.
- `git diff apps/ packages/`: empty (read-only DoD satisfied).
- Generated artifacts:
  - `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/audit-runner.sh`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/grep-evidence.txt`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/matrix.tsv`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/violations.md`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/primitives-current.txt`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/primitives-allowed.txt`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/primitives-unexpected.txt`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-11/main.md`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-11/manual-smoke-log.md`
  - `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-11/link-checklist.md`
