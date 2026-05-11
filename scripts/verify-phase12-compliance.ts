import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { collectChangedWorkflowRoots } from "./lib/phase12-compliance/collect-changed-roots.ts";
import {
  loadCanonicalHeadings,
  Phase12TemplateDriftError,
} from "./lib/phase12-compliance/load-canonical-headings.ts";
import { verifyComplianceFile } from "./lib/phase12-compliance/verify-compliance-file.ts";

const TEMPLATE_PATH =
  ".claude/skills/task-specification-creator/references/phase12-compliance-check-template.md";

export async function main(): Promise<number> {
  const repoRoot = process.cwd();
  const baseRef = process.env.GITHUB_BASE_REF ?? "origin/dev";
  const headRef = process.env.GITHUB_HEAD_REF ?? "HEAD";
  const canonicalHeadings = loadCanonicalHeadings(resolve(repoRoot, TEMPLATE_PATH));
  const roots = await collectChangedWorkflowRoots({ baseRef, headRef, repoRoot });

  if (roots.length === 0) {
    console.log(
      JSON.stringify(
        {
          status: "noop",
          reason: "no workflow root changed",
          template: TEMPLATE_PATH,
          canonicalHeadingCount: canonicalHeadings.length,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  const results = roots.map((root) =>
    verifyComplianceFile({ root, canonicalHeadings, repoRoot }),
  );
  const failures = results.filter((result) => !result.ok);

  console.log(
    JSON.stringify(
      {
        status: failures.length === 0 ? "pass" : "fail",
        template: TEMPLATE_PATH,
        roots,
        results,
      },
      null,
      2,
    ),
  );

  return failures.length === 0 ? 0 : 1;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
    .then((code) => {
      process.exit(code);
    })
    .catch((error: unknown) => {
      const code = error instanceof Phase12TemplateDriftError ? error.exitCode : 2;
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(code);
    });
}
