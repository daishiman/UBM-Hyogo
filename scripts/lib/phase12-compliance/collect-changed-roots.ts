import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

import type { WorkflowRoot, WorkflowState } from "./types.ts";

const execFileAsync = promisify(execFile);
const WORKFLOW_PREFIX = "docs/30-workflows/";

function rootFromChangedFile(repoRoot: string, filePath: string, opts?: { deleted?: boolean }): string | null {
  if (!filePath.startsWith(WORKFLOW_PREFIX)) return null;
  const rest = filePath.slice(WORKFLOW_PREFIX.length);
  const segments = rest.split("/");
  const [first] = segments;
  if (!first) return null;
  if (first === "unassigned-task") return null;

  for (let length = segments.length - 1; length >= 1; length -= 1) {
    const candidate = `${WORKFLOW_PREFIX}${segments.slice(0, length).join("/")}`;
    if (existsSync(resolve(repoRoot, candidate, "index.md"))) {
      return candidate;
    }
  }

  for (let length = segments.length - 1; length >= 1; length -= 1) {
    const candidateSegments = segments.slice(0, length);
    if (candidateSegments.at(-1) === "outputs") continue;
    const candidate = `${WORKFLOW_PREFIX}${candidateSegments.join("/")}`;
    if (existsSync(resolve(repoRoot, candidate, "artifacts.json"))) {
      return candidate;
    }
  }

  if (opts?.deleted) return null;

  return `${WORKFLOW_PREFIX}${first}`;
}

function parseChangedFiles(nameStatusOutput: string): Array<{ path: string; deleted: boolean }> {
  return nameStatusOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\t+/))
    .flatMap(([status = "", firstPath = "", secondPath = ""]) => {
      if (status.startsWith("R") || status.startsWith("C")) {
        return secondPath ? [{ path: secondPath, deleted: false }] : [];
      }

      return firstPath ? [{ path: firstPath, deleted: status === "D" }] : [];
    });
}

function readWorkflowState(repoRoot: string, rootPath: string): WorkflowState {
  const artifactPath = resolve(repoRoot, rootPath, "artifacts.json");
  if (!existsSync(artifactPath)) return "unknown";

  try {
    const parsed = JSON.parse(readFileSync(artifactPath, "utf8")) as {
      workflow_state?: string;
      metadata?: { workflow_state?: string };
    };
    const state = parsed.workflow_state ?? parsed.metadata?.workflow_state ?? "unknown";
    return state as WorkflowState;
  } catch {
    return "unknown";
  }
}

export async function collectChangedWorkflowRoots(opts: {
  baseRef: string;
  headRef: string;
  repoRoot: string;
}): Promise<WorkflowRoot[]> {
  const { stdout } = await execFileAsync(
    "git",
    ["diff", "--name-status", `${opts.baseRef}...${opts.headRef}`],
    { cwd: opts.repoRoot, encoding: "utf8" },
  );
  const { stdout: untrackedStdout } = await execFileAsync(
    "git",
    ["ls-files", "--others", "--exclude-standard", "docs/30-workflows"],
    { cwd: opts.repoRoot, encoding: "utf8" },
  );

  const roots = new Set(
    [
      ...parseChangedFiles(stdout),
      ...untrackedStdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((path) => ({ path, deleted: false })),
    ]
      .map((changedFile) =>
        rootFromChangedFile(opts.repoRoot, changedFile.path, {
          deleted: changedFile.deleted,
        }),
      )
      .filter((root): root is string => root !== null),
  );

  return [...roots].sort().map((rootPath) => ({
    rootPath,
    workflowState: readWorkflowState(opts.repoRoot, rootPath),
    hasCompletedTasksAncestor: rootPath.startsWith(`${WORKFLOW_PREFIX}completed-tasks/`),
  }));
}
