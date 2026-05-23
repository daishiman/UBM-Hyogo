# Implementation Guide

## Part 1: 中学生レベル

「タスク仕様書の compliance check」は、学校の宿題チェックリストに近いです。提出する宿題に名前、日付、本文、感想のような必須項目が全部書かれているかを、先生が機械的に確認します。

`verify-phase12-compliance` は、その先生のチェックリストを自動採点機にしたものです。PR を出したときに、タスク 1 つ分のフォルダに `phase12-task-spec-compliance-check.md` があるか、決められた 9 個の見出しがあるかを自動で確認します。

設計だけのタスクでは、実行結果のログがまだ無い場合があります。その場合でも、見出し自体は必須で、実行ログの中身だけを後から埋められる扱いにします。

| 用語 | 意味 |
| --- | --- |
| compliance check | ルール通りに書けているかの確認 |
| canonical heading | 決められた見出し |
| PR diff | 変更された箇所 |
| workflow root | タスク 1 つ分のフォルダ |
| exit code | 成功か失敗かを表す番号 |
| spec-only root | まだ実装していない、設計だけのタスクフォルダ |

タスク仕様書が品質基準を満たしているかを毎回手で確認するのは大変なので、PR で必ず同じ確認が走るようにします。

## Part 2: 技術者レベル

`scripts/verify-phase12-compliance.ts` は次の順で動作する。

1. `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` から `Required Sections` 9 項目を読む。
2. `git diff --name-status ${GITHUB_BASE_REF}...${GITHUB_HEAD_REF}` と untracked `docs/30-workflows/**` から変更された workflow root を列挙する。
3. 各 root の `outputs/phase-12/phase12-task-spec-compliance-check.md` の存在と canonical heading 9 項目を検査する。
4. 合格なら exit 0、不足なら exit 1、template drift なら exit 2。

主要型:

```ts
type WorkflowState =
  | "spec_created"
  | "implemented-local"
  | "implemented_local_runtime_pending"
  | "IMPLEMENTED_LOCAL_RUNTIME_PENDING"
  | "PASS_BOUNDARY_SYNCED_RUNTIME_PENDING"
  | "completed"
  | "unknown";

type WorkflowRoot = {
  rootPath: string;
  workflowState: WorkflowState;
  hasCompletedTasksAncestor: boolean;
};

type CanonicalHeading = {
  index: number;
  heading: string;
};

type ComplianceCheckResult =
  | { ok: true; rootPath: string }
  | {
      ok: false;
      rootPath: string;
      reason: "missing-file" | "missing-heading" | "parse-error";
      details: string;
    };
```

Public functions:

```ts
collectChangedWorkflowRoots(opts: {
  baseRef: string;
  headRef: string;
  repoRoot: string;
}): Promise<WorkflowRoot[]>

loadCanonicalHeadings(templatePath: string): CanonicalHeading[]

verifyComplianceFile(opts: {
  root: WorkflowRoot;
  canonicalHeadings: CanonicalHeading[];
  repoRoot: string;
}): ComplianceCheckResult
```

Settings and constants:

| Name | Value / default | Role |
| --- | --- | --- |
| `GITHUB_BASE_REF` | `origin/dev` | base side of PR diff |
| `GITHUB_HEAD_REF` | `HEAD` | head side of PR diff |
| `TEMPLATE_PATH` | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | canonical heading SSOT |
| `COMPLIANCE_CHECK_PATH` | `outputs/phase-12/phase12-task-spec-compliance-check.md` | required per-root output |
| Required section count | `9` | template drift gate |

Error and edge-case behavior:

| Case | Result |
| --- | --- |
| no changed workflow root | exit 0 with JSON `status=noop` after template parsing |
| missing compliance file | exit 1 with `reason=missing-file` |
| missing canonical heading | exit 1 with `reason=missing-heading` |
| unreadable compliance file | exit 1 with `reason=parse-error` |
| `Required Sections` missing or not exactly 1..9 | exit 2 (`Phase12TemplateDriftError`) |
| `docs/30-workflows/unassigned-task/**` changed | excluded from root collection |
| deleted old root in a move | skipped if no current `index.md` / `artifacts.json` root exists |
| `completed-tasks/**` changed | included only when changed and marked `hasCompletedTasksAncestor=true` |
| `workflow_state=spec_created` | runtime evidence body is optional, canonical headings remain required |

実装ファイル:

| Path | Role |
| --- | --- |
| `scripts/verify-phase12-compliance.ts` | CLI entrypoint |
| `scripts/lib/phase12-compliance/collect-changed-roots.ts` | changed workflow root collection |
| `scripts/lib/phase12-compliance/load-canonical-headings.ts` | skill template parser and drift gate |
| `scripts/lib/phase12-compliance/verify-compliance-file.ts` | per-root compliance verifier |
| `scripts/__tests__/verify-phase12-compliance.test.ts` | 10 focused tests for parser, verifier, and root collection |
| `.github/workflows/verify-phase12-compliance.yml` | PR gate |

CI workflow trigger paths include the workflow file itself, `package.json`, `docs/30-workflows/**`, the verifier script, library files, tests, fixtures, and the canonical template. The job runs `pnpm test:phase12-compliance` before `pnpm verify:phase12-compliance`.

Forward-safe rollback is workflow disablement or removing the package script and workflow in one reverting change.
