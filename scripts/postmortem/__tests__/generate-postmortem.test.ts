import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureEvidencePathExists,
  generatePostmortem,
  loadTemplate,
  main,
  renderTemplate,
  validateInput,
  validateRollbackEvidencePath,
  type PostmortemInput,
} from "../generate-postmortem.js";

let root: string;
let evidenceDir: string;

const input: PostmortemInput = {
  release: "v0.1.0",
  commit: "deadbee",
  evidencePath: "docs/30-workflows/completed-tasks/09c/outputs/phase-11",
  rollbackEvidencePath: "outputs/incident/rollback.md",
  occurredAt: "2026-05-05T00:00:00Z",
  detectedAt: "2026-05-05T00:05:00Z",
  resolvedAt: "2026-05-05T00:20:00Z",
  severity: "sev2",
};

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "postmortem-"));
  evidenceDir = resolve(root, "phase-11");
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, "main.md"), "# evidence\n", "utf8");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("validateInput", () => {
  it("accepts required CLI fields and normalizes hyphenated names", () => {
    const result = validateInput({
      release: "v1.2.3",
      commit: "abcdef1",
      evidence: evidenceDir,
      "rollback-evidence": "rollback.md",
      "occurred-at": "2026-05-05T00:00:00Z",
    });
    expect(result).toEqual({
      ok: true,
      input: {
        release: "v1.2.3",
        commit: "abcdef1",
        evidencePath: evidenceDir,
        rollbackEvidencePath: "rollback.md",
        occurredAt: "2026-05-05T00:00:00Z",
      },
    });
  });

  it("rejects invalid release and commit values", () => {
    expect(validateInput({
      release: "1.2.3",
      commit: "abcdef1",
      evidence: evidenceDir,
      "rollback-evidence": "rollback.md",
      "occurred-at": "2026-05-05T00:00:00Z",
    })).toEqual({ ok: false, reason: "invalid release: 1.2.3" });

    expect(validateInput({
      release: "v1.2.3",
      commit: "zzzzzzz",
      evidence: evidenceDir,
      "rollback-evidence": "rollback.md",
      "occurred-at": "2026-05-05T00:00:00Z",
    })).toEqual({ ok: false, reason: "invalid commit: zzzzzzz" });
  });

  it("rejects missing evidence and invalid timestamps", () => {
    expect(validateInput({
      release: "v1.2.3",
      commit: "abcdef1",
      "rollback-evidence": "rollback.md",
      "occurred-at": "2026-05-05T00:00:00Z",
    })).toEqual({ ok: false, reason: "missing required field: evidence" });

    expect(validateInput({
      release: "v1.2.3",
      commit: "abcdef1",
      evidence: evidenceDir,
      "rollback-evidence": "rollback.md",
      "occurred-at": "2026-05-05",
    })).toEqual({ ok: false, reason: "invalid occurred-at: 2026-05-05" });
  });
});

describe("ensureEvidencePathExists", () => {
  it("requires an existing directory with main.md", () => {
    expect(ensureEvidencePathExists(evidenceDir)).toEqual({ ok: true });

    const missing = resolve(root, "missing");
    expect(ensureEvidencePathExists(missing)).toEqual({
      ok: false,
      reason: `evidence path not found: ${missing}`,
    });

    const emptyDir = resolve(root, "empty");
    mkdirSync(emptyDir);
    expect(ensureEvidencePathExists(emptyDir)).toEqual({
      ok: false,
      reason: `evidence main.md not found: ${resolve(emptyDir, "main.md")}`,
    });
  });
});

describe("validateRollbackEvidencePath", () => {
  it("requires a file and warns when it is empty", () => {
    const evidence = resolve(root, "rollback.md");
    writeFileSync(evidence, "rollback completed\n", "utf8");
    expect(validateRollbackEvidencePath(evidence)).toEqual({ ok: true });

    const empty = resolve(root, "empty-rollback.md");
    writeFileSync(empty, "", "utf8");
    expect(validateRollbackEvidencePath(empty)).toEqual({
      ok: true,
      warning: `warning: rollback-evidence is empty: ${empty}`,
    });

    expect(validateRollbackEvidencePath(resolve(root, "missing.md"))).toEqual({
      ok: false,
      reason: `rollback evidence not found: ${resolve(root, "missing.md")}`,
    });

    expect(validateRollbackEvidencePath(evidenceDir)).toEqual({
      ok: false,
      reason: `rollback evidence is not a file: ${evidenceDir}`,
    });
  });
});

describe("renderTemplate", () => {
  const template = [
    "# Postmortem: {{release}}",
    "## Header",
    "{{commit}} {{evidencePath}} {{rollbackEvidencePath}}",
    "## Timeline",
    "## Impact",
    "## Detection",
    "## Response",
    "## Root Cause",
    "## Prevention",
    "## Follow-up Issues",
    "{{detectedAt}} {{resolvedAt}} {{severity}}",
  ].join("\n");

  it("renders the fixed headings in order", () => {
    const out = renderTemplate(template, input);
    const headings = out.match(/^## .+$/gm);
    expect(headings).toEqual([
      "## Header",
      "## Timeline",
      "## Impact",
      "## Detection",
      "## Response",
      "## Root Cause",
      "## Prevention",
      "## Follow-up Issues",
    ]);
  });

  it("is deterministic for identical input and does not leak undefined", () => {
    const withoutOptional: PostmortemInput = {
      release: input.release,
      commit: input.commit,
      evidencePath: input.evidencePath,
      rollbackEvidencePath: input.rollbackEvidencePath,
      occurredAt: input.occurredAt,
    };
    const first = renderTemplate(template, withoutOptional);
    const second = renderTemplate(template, withoutOptional);
    expect(first).toBe(second);
    expect(first).not.toContain("undefined");
  });

  it("generatePostmortem is pure when the template string is supplied", () => {
    expect(generatePostmortem(input, template)).toBe(renderTemplate(template, input));
  });

  it("keeps generated output free of person-fault vocabulary", () => {
    const out = renderTemplate(template, input);
    expect(out).not.toMatch(/responsible|blame|fault|責任|誰が悪い/i);
  });
});

describe("real postmortem template", () => {
  it("keeps the shipped template headings and placeholders aligned with generated output", () => {
    const out = generatePostmortem(input, loadTemplate());
    const headings = out.match(/^## .+$/gm);
    expect(headings).toEqual([
      "## メタ情報",
      "## Timeline",
      "## Impact",
      "## Detection",
      "## Response",
      "## Root Cause",
      "## Prevention",
      "## Follow-up Issues",
    ]);
    expect(out).not.toContain("{{");
    expect(out).not.toMatch(/\b(owner|responsible|blame|fault)\b|責任|誰が悪い/i);
  });
});

describe("main", () => {
  function captureOutput() {
    let stdout = "";
    let stderr = "";
    const out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout += String(chunk);
      return true;
    });
    const err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr += String(chunk);
      return true;
    });
    return {
      get stdout() {
        return stdout;
      },
      get stderr() {
        return stderr;
      },
      restore() {
        out.mockRestore();
        err.mockRestore();
      },
    };
  }

  function validArgs(extra: string[] = []) {
    const rollback = resolve(root, "rollback.md");
    writeFileSync(rollback, "rollback completed\n", "utf8");
    return [
      "--release",
      "v1.2.3",
      "--commit",
      "abcdef1",
      "--evidence",
      evidenceDir,
      "--rollback-evidence",
      rollback,
      "--occurred-at",
      "2026-05-05T00:00:00Z",
      ...extra,
    ];
  }

  it("prints usage for help", async () => {
    const io = captureOutput();
    try {
      await expect(main(["--help"])).resolves.toBe(0);
      expect(io.stdout).toContain("usage: pnpm postmortem:generate");
      expect(io.stderr).toBe("");
    } finally {
      io.restore();
    }
  });

  it("prints validation errors and evidence errors to stderr", async () => {
    const io = captureOutput();
    try {
      await expect(main(["--release", "1.2.3"])).resolves.toBe(1);
      expect(io.stderr).toContain("invalid release: 1.2.3");
    } finally {
      io.restore();
    }

    const io2 = captureOutput();
    try {
      const rollback = resolve(root, "rollback.md");
      writeFileSync(rollback, "rollback completed\n", "utf8");
      await expect(main([
        "--release",
        "v1.2.3",
        "--commit",
        "abcdef1",
        "--evidence",
        resolve(root, "missing-evidence"),
        "--rollback-evidence",
        rollback,
        "--occurred-at",
        "2026-05-05T00:00:00Z",
      ])).resolves.toBe(1);
      expect(io2.stderr).toContain("evidence path not found");
    } finally {
      io2.restore();
    }
  });

  it("writes markdown to stdout or --out and warns for empty rollback evidence", async () => {
    const io = captureOutput();
    try {
      await expect(main(validArgs())).resolves.toBe(0);
      expect(io.stdout).toContain("# Postmortem: v1.2.3");
      expect(io.stderr).toBe("");
    } finally {
      io.restore();
    }

    const out = resolve(root, "postmortem.md");
    const io2 = captureOutput();
    try {
      await expect(main(validArgs(["--out", out]))).resolves.toBe(0);
      expect(existsSync(out)).toBe(true);
      expect(readFileSync(out, "utf8")).toContain("# Postmortem: v1.2.3");
      expect(io2.stdout).toBe("");
    } finally {
      io2.restore();
    }

    const emptyRollback = resolve(root, "empty-rollback.md");
    writeFileSync(emptyRollback, "", "utf8");
    const io3 = captureOutput();
    try {
      await expect(main([
        "--release",
        "v1.2.3",
        "--commit",
        "abcdef1",
        "--evidence",
        evidenceDir,
        "--rollback-evidence",
        emptyRollback,
        "--occurred-at",
        "2026-05-05T00:00:00Z",
      ])).resolves.toBe(0);
      expect(io3.stderr).toContain(`warning: rollback-evidence is empty: ${emptyRollback}`);
    } finally {
      io3.restore();
    }
  });
});
