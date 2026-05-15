import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { collectChangedWorkflowRoots } from "../lib/phase12-compliance/collect-changed-roots.ts";
import {
  loadCanonicalHeadings,
  Phase12TemplateDriftError,
} from "../lib/phase12-compliance/load-canonical-headings.ts";
import { verifyComplianceFile } from "../lib/phase12-compliance/verify-compliance-file.ts";
import type { WorkflowRoot } from "../lib/phase12-compliance/types.ts";

const FIXTURE_ROOT = resolve(__dirname, "fixtures", "phase12-compliance");
const TEMPLATE = resolve(
  __dirname,
  "..",
  "..",
  ".claude",
  "skills",
  "task-specification-creator",
  "references",
  "phase12-compliance-check-template.md",
);

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(resolve(tmpdir(), "phase12-compliance-"));
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function root(name: string): WorkflowRoot {
  return {
    rootPath: resolve(FIXTURE_ROOT, name),
    workflowState: "spec_created",
    hasCompletedTasksAncestor: false,
  };
}

function writeWorkflowRoot(repoRoot: string, rootPath: string, state = "spec_created"): void {
  const fullRoot = resolve(repoRoot, rootPath);
  mkdirSync(fullRoot, { recursive: true });
  writeFileSync(resolve(fullRoot, "index.md"), `# ${rootPath}\n`, "utf8");
  writeFileSync(
    resolve(fullRoot, "artifacts.json"),
    JSON.stringify({ workflow_state: state }, null, 2),
    "utf8",
  );
}

function git(repoRoot: string, args: string[]): void {
  execFileSync("git", args, { cwd: repoRoot, stdio: "ignore" });
}

describe("phase-12 compliance verification", () => {
  it("passes when the compliance file contains all canonical headings", () => {
    const result = verifyComplianceFile({
      root: root("pass"),
      canonicalHeadings: loadCanonicalHeadings(TEMPLATE),
      repoRoot: "/",
    });

    expect(result).toEqual({ ok: true, rootPath: root("pass").rootPath });
  });

  it("fails when phase12-task-spec-compliance-check.md is missing", () => {
    const result = verifyComplianceFile({
      root: root("fail-missing-file"),
      canonicalHeadings: loadCanonicalHeadings(TEMPLATE),
      repoRoot: "/",
    });

    expect(result).toMatchObject({ ok: false, reason: "missing-file" });
  });

  it("fails when a canonical heading is missing", () => {
    const result = verifyComplianceFile({
      root: root("fail-missing-heading"),
      canonicalHeadings: loadCanonicalHeadings(TEMPLATE),
      repoRoot: "/",
    });

    expect(result).toMatchObject({ ok: false, reason: "missing-heading" });
    if (!result.ok) {
      expect(result.details).toContain("Four-condition verdict");
    }
  });

  it("detects template drift when Required Sections are not exactly 1..9", () => {
    const templatePath = resolve(tmpRoot, "short-template.md");
    writeFileSync(
      templatePath,
      ["# Template", "", "## Required Sections", "", "1. Summary verdict"].join("\n"),
      "utf8",
    );

    expect(() => loadCanonicalHeadings(templatePath)).toThrow(Phase12TemplateDriftError);
  });

  it("allows spec_created roots without runtime evidence details when headings exist", () => {
    const result = verifyComplianceFile({
      root: root("pass"),
      canonicalHeadings: loadCanonicalHeadings(TEMPLATE),
      repoRoot: "/",
    });

    expect(result.ok).toBe(true);
  });

  it("parses exactly nine canonical headings from the skill reference", () => {
    const headings = loadCanonicalHeadings(TEMPLATE);

    expect(headings).toHaveLength(9);
    expect(headings.map((heading) => heading.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("collects changed workflow roots from tracked PR diff files", async () => {
    git(tmpRoot, ["init", "-b", "main"]);
    git(tmpRoot, ["config", "user.email", "test@example.com"]);
    git(tmpRoot, ["config", "user.name", "Test User"]);
    writeWorkflowRoot(tmpRoot, "docs/30-workflows/current-root");
    git(tmpRoot, ["add", "."]);
    git(tmpRoot, ["commit", "-m", "baseline"]);
    git(tmpRoot, ["checkout", "-b", "feature"]);
    writeFileSync(
      resolve(tmpRoot, "docs/30-workflows/current-root/phase-01.md"),
      "# Phase 1\n",
      "utf8",
    );
    git(tmpRoot, ["add", "."]);
    git(tmpRoot, ["commit", "-m", "change workflow root"]);

    const roots = await collectChangedWorkflowRoots({
      baseRef: "main",
      headRef: "HEAD",
      repoRoot: tmpRoot,
    });

    expect(roots).toEqual([
      {
        rootPath: "docs/30-workflows/current-root",
        workflowState: "spec_created",
        hasCompletedTasksAncestor: false,
      },
    ]);
  });

  it("collects untracked workflow roots and excludes unassigned-task files", async () => {
    git(tmpRoot, ["init", "-b", "main"]);
    git(tmpRoot, ["config", "user.email", "test@example.com"]);
    git(tmpRoot, ["config", "user.name", "Test User"]);
    writeFileSync(resolve(tmpRoot, "README.md"), "# baseline\n", "utf8");
    git(tmpRoot, ["add", "."]);
    git(tmpRoot, ["commit", "-m", "baseline"]);
    writeWorkflowRoot(tmpRoot, "docs/30-workflows/new-root", "implemented_local_runtime_pending");
    mkdirSync(resolve(tmpRoot, "docs/30-workflows/unassigned-task"), { recursive: true });
    writeFileSync(
      resolve(tmpRoot, "docs/30-workflows/unassigned-task/task-example.md"),
      "# unassigned\n",
      "utf8",
    );

    const roots = await collectChangedWorkflowRoots({
      baseRef: "HEAD",
      headRef: "HEAD",
      repoRoot: tmpRoot,
    });

    expect(roots).toEqual([
      {
        rootPath: "docs/30-workflows/new-root",
        workflowState: "implemented_local_runtime_pending",
        hasCompletedTasksAncestor: false,
      },
    ]);
  });

  it("excludes runbooks/* changes from workflow roots", async () => {
    git(tmpRoot, ["init", "-b", "main"]);
    git(tmpRoot, ["config", "user.email", "test@example.com"]);
    git(tmpRoot, ["config", "user.name", "Test User"]);
    writeFileSync(resolve(tmpRoot, "README.md"), "# baseline\n", "utf8");
    git(tmpRoot, ["add", "."]);
    git(tmpRoot, ["commit", "-m", "baseline"]);
    mkdirSync(resolve(tmpRoot, "docs/30-workflows/runbooks"), { recursive: true });
    writeFileSync(
      resolve(tmpRoot, "docs/30-workflows/runbooks/example-runbook.md"),
      "# runbook\n",
      "utf8",
    );

    const roots = await collectChangedWorkflowRoots({
      baseRef: "HEAD",
      headRef: "HEAD",
      repoRoot: tmpRoot,
    });

    expect(roots).toEqual([]);
  });

  it("marks changed completed-tasks descendants without scanning unchanged history", async () => {
    git(tmpRoot, ["init", "-b", "main"]);
    git(tmpRoot, ["config", "user.email", "test@example.com"]);
    git(tmpRoot, ["config", "user.name", "Test User"]);
    writeWorkflowRoot(tmpRoot, "docs/30-workflows/completed-tasks/history-root", "completed");
    git(tmpRoot, ["add", "."]);
    git(tmpRoot, ["commit", "-m", "baseline"]);
    git(tmpRoot, ["checkout", "-b", "feature"]);
    writeFileSync(
      resolve(tmpRoot, "docs/30-workflows/completed-tasks/history-root/phase-12.md"),
      "# Phase 12\n",
      "utf8",
    );
    git(tmpRoot, ["add", "."]);
    git(tmpRoot, ["commit", "-m", "touch completed root"]);

    const roots = await collectChangedWorkflowRoots({
      baseRef: "main",
      headRef: "HEAD",
      repoRoot: tmpRoot,
    });

    expect(roots).toEqual([
      {
        rootPath: "docs/30-workflows/completed-tasks/history-root",
        workflowState: "completed",
        hasCompletedTasksAncestor: true,
      },
    ]);
  });

  it("ignores deleted old workflow roots when a moved root exists in the same diff", async () => {
    git(tmpRoot, ["init", "-b", "main"]);
    git(tmpRoot, ["config", "user.email", "test@example.com"]);
    git(tmpRoot, ["config", "user.name", "Test User"]);
    writeWorkflowRoot(tmpRoot, "docs/30-workflows/old-root", "spec_created");
    git(tmpRoot, ["add", "."]);
    git(tmpRoot, ["commit", "-m", "baseline"]);
    git(tmpRoot, ["checkout", "-b", "feature"]);
    git(tmpRoot, ["mv", "docs/30-workflows/old-root", "docs/30-workflows/new-root"]);
    git(tmpRoot, ["commit", "-m", "move workflow root"]);

    const roots = await collectChangedWorkflowRoots({
      baseRef: "main",
      headRef: "HEAD",
      repoRoot: tmpRoot,
    });

    expect(roots).toEqual([
      {
        rootPath: "docs/30-workflows/new-root",
        workflowState: "spec_created",
        hasCompletedTasksAncestor: false,
      },
    ]);
  });
});
