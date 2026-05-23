import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { normalizeHeading } from "./load-canonical-headings.ts";
import type { CanonicalHeading, ComplianceCheckResult, WorkflowRoot } from "./types.ts";
import { verifyPhase11EvidenceExistence } from "./verify-phase11-evidence-existence.ts";

const COMPLIANCE_CHECK_PATH = "outputs/phase-12/phase12-task-spec-compliance-check.md";

function extractHeadings(markdown: string): Set<string> {
  return new Set(
    markdown
      .split("\n")
      .map((line) => line.match(/^#{1,6}\s+(.+?)\s*$/)?.[1])
      .filter((heading): heading is string => heading !== undefined)
      .map((heading) => heading.replace(/^\d+\.\s+/, ""))
      .map(normalizeHeading),
  );
}

export function verifyComplianceFile(opts: {
  root: WorkflowRoot;
  canonicalHeadings: CanonicalHeading[];
  repoRoot: string;
}): ComplianceCheckResult {
  const compliancePath = resolve(opts.repoRoot, opts.root.rootPath, COMPLIANCE_CHECK_PATH);
  if (!existsSync(compliancePath)) {
    return {
      ok: false,
      rootPath: opts.root.rootPath,
      reason: "missing-file",
      details: `${COMPLIANCE_CHECK_PATH} not found`,
    };
  }

  let markdown: string;
  try {
    markdown = readFileSync(compliancePath, "utf8");
  } catch (error) {
    return {
      ok: false,
      rootPath: opts.root.rootPath,
      reason: "parse-error",
      details: error instanceof Error ? error.message : String(error),
    };
  }

  const actualHeadings = extractHeadings(markdown);
  const missing = opts.canonicalHeadings.filter(
    (canonical) => !actualHeadings.has(canonical.heading),
  );

  if (missing.length > 0) {
    return {
      ok: false,
      rootPath: opts.root.rootPath,
      reason: "missing-heading",
      details: `missing canonical heading(s): ${missing
        .map((heading) => `${heading.index}. ${heading.heading}`)
        .join(", ")}`,
    };
  }

  const evidenceResult = verifyPhase11EvidenceExistence({
    markdown,
    repoRoot: opts.repoRoot,
    workflowRoot: opts.root.rootPath,
  });
  if (!evidenceResult.ok) {
    const details = [
      ...evidenceResult.missing.map(
        (evidence) => `${evidence.evidencePath} (${evidence.classification})`,
      ),
      ...evidenceResult.invalidStatuses.map(
        (evidence) =>
          `${evidence.evidencePath || "<empty-path>"} (${evidence.classification}; invalid status=${evidence.status || "<empty>"})`,
      ),
    ];
    return {
      ok: false,
      rootPath: opts.root.rootPath,
      reason: "missing-evidence",
      details: `missing or invalid Phase 11 evidence file claim(s): ${details.join(", ")}`,
    };
  }

  return { ok: true, rootPath: opts.root.rootPath };
}
