import { existsSync, statSync } from "node:fs";
import { isAbsolute, normalize, relative, resolve } from "node:path";

import { parsePhase11EvidenceClaims } from "./parse-phase11-evidence.ts";

export type Phase11EvidenceExistenceResult =
  | { ok: true }
  | {
      ok: false;
      missing: Array<{ classification: string; evidencePath: string }>;
      invalidStatuses: Array<{ classification: string; evidencePath: string; status: string }>;
    };

const VALID_STATUSES = new Set(["present", "pending", "n/a"]);

function resolveEvidencePath(repoRoot: string, workflowRoot: string, evidencePath: string): string | null {
  const cleaned = evidencePath.replace(/^\.\/+/, "");
  if (isAbsolute(cleaned)) return null;

  const normalized = normalize(cleaned);
  const root = resolve(repoRoot, workflowRoot);
  const resolved =
    normalized === workflowRoot || normalized.startsWith(`${workflowRoot}/`)
      ? resolve(repoRoot, normalized)
      : resolve(root, normalized);
  const rootRelative = relative(root, resolved);

  if (rootRelative === "" || (!rootRelative.startsWith("..") && !isAbsolute(rootRelative))) {
    return resolved;
  }

  return null;
}

export function verifyPhase11EvidenceExistence(opts: {
  markdown: string;
  repoRoot: string;
  workflowRoot: string;
}): Phase11EvidenceExistenceResult {
  const claims = parsePhase11EvidenceClaims(opts.markdown);
  const invalidStatuses = claims.filter((claim) => !VALID_STATUSES.has(claim.status)).map((claim) => ({
    classification: claim.classification,
    evidencePath: claim.evidencePath,
    status: claim.status,
  }));
  const missing = claims.length === 0 ? [{ classification: "Phase 11 evidence inventory", evidencePath: "<empty-or-missing-table>" }] : claims
    .filter((claim) => claim.status === "present")
    .filter((claim) => {
      const resolved = resolveEvidencePath(opts.repoRoot, opts.workflowRoot, claim.evidencePath);
      return (
        claim.evidencePath.length === 0 ||
        resolved === null ||
        !existsSync(resolved) ||
        !statSync(resolved).isFile()
      );
    })
    .map((claim) => ({
      classification: claim.classification,
      evidencePath: claim.evidencePath,
    }));

  return missing.length === 0 && invalidStatuses.length === 0
    ? { ok: true }
    : { ok: false, missing, invalidStatuses };
}
