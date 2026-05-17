# Phase 6 — 実装

## 1. 実装対象

Phase 4 の「変更ファイル一覧」全 13 件のうち、コード本体（#1〜#11）を実装する。docs (#12) と本タスク outputs (#13) は Phase 8 以降で実施。

## 2. `scripts/lib/phase12-compliance/types.ts`（編集）

既存 `ComplianceCheckResult` の `reason` リテラルに `"missing-evidence"` を追加し、`Phase11EvidenceRow` interface を export する。

```ts
export type ComplianceCheckReason =
  | "missing-file"
  | "parse-error"
  | "missing-heading"
  | "missing-evidence";

export interface Phase11EvidenceRow {
  classification: string;
  evidencePath: string;
  status: "present" | "pending" | "n/a" | "unknown";
  rawStatus: string;
}
```

既存 `ComplianceCheckResult` の `reason` 型は `ComplianceCheckReason` に置換。`WorkflowRoot` 型は無変更。

## 3. `scripts/lib/phase12-compliance/parse-phase11-evidence.ts`（新規）

```ts
import type { Phase11EvidenceRow } from "./types.ts";

const HEADING_REGEX = /^##\s+(?:4\.\s+)?Phase 11 evidence file inventory\s*$/;
const TABLE_DIVIDER_REGEX = /^\s*\|[\s\-:|]+\|\s*$/;

function stripBackticks(value: string): string {
  return value.replace(/^`(.*)`$/, "$1").trim();
}

function normalizeStatus(raw: string): Phase11EvidenceRow["status"] {
  const lower = raw.trim().toLowerCase();
  if (lower === "present") return "present";
  if (lower === "pending") return "pending";
  if (lower === "n/a" || lower === "na") return "n/a";
  return "unknown";
}

export function parsePhase11EvidenceClaims(markdown: string): Phase11EvidenceRow[] {
  const lines = markdown.split("\n");
  let inSection = false;
  let inTable = false;
  let pastDivider = false;
  const rows: Phase11EvidenceRow[] = [];
  const seenPaths = new Set<string>();

  for (const rawLine of lines) {
    if (!inSection) {
      if (HEADING_REGEX.test(rawLine)) inSection = true;
      continue;
    }
    // 次の ## 見出しが出たら終了
    if (rawLine.startsWith("## ") && !HEADING_REGEX.test(rawLine)) break;

    const line = rawLine.trimEnd();
    if (line.startsWith("|")) {
      if (!inTable) {
        inTable = true;
        pastDivider = false;
        continue; // header 行 skip
      }
      if (!pastDivider) {
        if (TABLE_DIVIDER_REGEX.test(line)) {
          pastDivider = true;
        }
        continue;
      }
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length < 3) continue;
      const evidencePath = stripBackticks(cells[1]);
      if (!evidencePath || seenPaths.has(evidencePath)) continue;
      seenPaths.add(evidencePath);
      rows.push({
        classification: cells[0],
        evidencePath,
        status: normalizeStatus(cells[2]),
        rawStatus: cells[2],
      });
    } else if (inTable && line.trim() === "") {
      // 空行で table 終端
      break;
    }
  }

  return rows;
}
```

## 4. `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts`（新規）

```ts
import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import type { Phase11EvidenceRow } from "./types.ts";

export interface EvidenceExistenceCheckOptions {
  rows: Phase11EvidenceRow[];
  workflowRootAbsPath: string;
}

export interface EvidenceExistenceCheckResult {
  ok: boolean;
  missing: string[];
  invalidStatuses: string[];
}

export function verifyPhase11EvidenceExistence(
  opts: EvidenceExistenceCheckOptions,
): EvidenceExistenceCheckResult {
  const missing: string[] = [];
  const invalidStatuses: string[] = [];

  if (opts.rows.length === 0) {
    return { ok: false, missing, unknown };
  }

  for (const row of opts.rows) {
    if (row.status === "unknown") {
      unknown.push(`${row.evidencePath} (status=${row.rawStatus})`);
      continue;
    }
    if (row.status !== "present") continue;

    const relPath = row.evidencePath.replace(/^\.\//, "");
    if (isAbsolute(relPath)) {
      missing.push(`${relPath} (absolute path not allowed)`);
      continue;
    }
    const abs = resolve(opts.workflowRootAbsPath, relPath);
    if (!existsSync(abs)) {
      missing.push(relPath);
    }
  }

  return {
    ok: missing.length === 0 && unknown.length === 0,
    missing,
    unknown,
  };
}
```

## 5. `scripts/lib/phase12-compliance/verify-compliance-file.ts`（編集）

既存 `return { ok: true, rootPath: opts.root.rootPath };` の直前で以下を追加:

```ts
import { parsePhase11EvidenceClaims } from "./parse-phase11-evidence.ts";
import { verifyPhase11EvidenceExistence } from "./verify-phase11-evidence-existence.ts";

// ... 既存 heading 検査 PASS 後 ...

const evidenceRows = parsePhase11EvidenceClaims(markdown);
const evidenceResult = verifyPhase11EvidenceExistence({
  rows: evidenceRows,
  workflowRootAbsPath: resolve(opts.repoRoot, opts.root.rootPath),
});

if (!evidenceResult.ok) {
  const detailsParts: string[] = [];
  if (evidenceRows.length === 0) {
    detailsParts.push("phase-11 evidence inventory empty or missing");
  }
  if (evidenceResult.missing.length > 0) {
    detailsParts.push(`missing evidence: ${evidenceResult.missing.join(", ")}`);
  }
  if (evidenceResult.invalidStatuses.length > 0) {
    detailsParts.push(`invalid status: ${evidenceResult.invalidStatuses.join(", ")}`);
  }
  return {
    ok: false,
    rootPath: opts.root.rootPath,
    reason: "missing-evidence",
    details: detailsParts.join("; "),
  };
}
```

## 6. fixture: `pass/outputs/phase-12/phase12-task-spec-compliance-check.md`（編集）

既存 canonical heading を保ったまま、`## 4. Phase 11 evidence file inventory` の直下に以下を挿入:

```markdown
## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| NON_VISUAL manual evidence | `outputs/phase-11/manual-test-result.md` | present |
| NON_VISUAL smoke log | `outputs/phase-11/manual-smoke-log.md` | present |
| NON_VISUAL link checklist | `outputs/phase-11/link-checklist.md` | present |
```

## 7. fixture: `pass/outputs/phase-11/{manual-test-result,manual-smoke-log,link-checklist}.md`（新規）

各 1 行のダミー（例 `# manual test result (fixture)`）

## 8. fixture: `fail-missing-evidence/`（新規）

`artifacts.json` は `pass/artifacts.json` を流用して `workflow_id` を差し替え。`outputs/phase-12/phase12-task-spec-compliance-check.md` は canonical heading 全揃い + Phase 11 evidence section に `present` 宣言 3 件、しかし `outputs/phase-11/` は **作成しない**（実体不在で red 化）。

## 9. spec: `scripts/__tests__/verify-phase12-compliance.spec.ts`（編集）

`root("pass")` 既存 case を保ち、新規追加:

```ts
it("fails when phase-11 evidence is declared present but file is missing", () => {
  const result = verifyComplianceFile({
    root: root("fail-missing-evidence"),
    canonicalHeadings: loadCanonicalHeadings(TEMPLATE),
    repoRoot: resolve(__dirname, "..", ".."),
  });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.reason).toBe("missing-evidence");
    expect(result.details).toMatch(/missing evidence:/);
  }
});
```

`parsePhase11EvidenceClaims` / `verifyPhase11EvidenceExistence` の unit ケース TC-3〜TC-7 は `describe("parsePhase11EvidenceClaims")` / `describe("verifyPhase11EvidenceExistence")` で分離する。

## 10. 実装中に守るルール

- 既存 import 順序 / quote / semicolon は `pnpm lint` の設定に従う
- backwards-compat shim は追加しない
- `// 修正: ...` 等のコメントは禁止（CLAUDE.md "Don't explain WHAT"）
