import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { findArtifacts, validateFile, isPathSafe, pickGates, main } from "../validate";

let tmp: string;

const validPassed = {
  metadata: {
    gates: [
      {
        gate_id: "Gate-A",
        status: "passed",
        passed_at: "2026-05-10T00:00:00Z",
        evidence_path: "evidence/a.md",
        approver: "daishiman",
      },
    ],
  },
};

const validPending = {
  metadata: {
    gates: [
      {
        gate_id: "Gate-B",
        status: "pending",
        passed_at: null,
        evidence_path: "evidence/b.md",
        approver: "daishiman",
      },
    ],
  },
};

async function writeFixture(rel: string, content: unknown): Promise<string> {
  const full = path.join(tmp, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(content, null, 2), "utf8");
  return full;
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "gate-metadata-walk-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("validate.ts CLI behaviour", () => {
  it("TC-13: gates absent → WARN + skip", async () => {
    const file = await writeFixture("docs/30-workflows/wf-a/artifacts.json", { metadata: {} });
    const findings = await validateFile(file, { repoRoot: tmp });
    expect(findings).toHaveLength(1);
    expect(findings[0].level).toBe("WARN");
  });

  it("gates absent on changed artifacts → ERROR", async () => {
    const file = await writeFixture("docs/30-workflows/wf-a-changed/artifacts.json", {
      metadata: {},
    });
    const findings = await validateFile(file, { repoRoot: tmp, requireGates: true });
    expect(findings).toHaveLength(1);
    expect(findings[0].level).toBe("ERROR");
  });

  it("TC-14: gates is string (not array) → ERROR", async () => {
    const file = await writeFixture("docs/30-workflows/wf-b/artifacts.json", {
      metadata: { gates: "oops" },
    });
    const findings = await validateFile(file, { repoRoot: tmp });
    expect(findings.some((f) => f.level === "ERROR")).toBe(true);
  });

  it("TC-15: status=passed evidence_path missing → ERROR", async () => {
    const file = await writeFixture("docs/30-workflows/wf-c/artifacts.json", validPassed);
    const findings = await validateFile(file, { repoRoot: tmp });
    expect(findings.some((f) => f.level === "ERROR" && /not found/.test(f.message))).toBe(true);
  });

  it("TC-16: status=passed evidence exists → OK", async () => {
    await writeFixture("evidence/a.md", { ok: true });
    const evPath = path.join(tmp, "evidence/a.md");
    await fs.writeFile(evPath, "ok", "utf8");
    const file = await writeFixture("docs/30-workflows/wf-d/artifacts.json", validPassed);
    const findings = await validateFile(file, { repoRoot: tmp });
    expect(findings.some((f) => f.level === "OK")).toBe(true);
    expect(findings.every((f) => f.level !== "ERROR")).toBe(true);
  });

  it("TC-17: status=pending evidence missing → no ERROR", async () => {
    const file = await writeFixture("docs/30-workflows/wf-e/artifacts.json", validPending);
    const findings = await validateFile(file, { repoRoot: tmp });
    expect(findings.every((f) => f.level !== "ERROR")).toBe(true);
  });

  it("TC-18: path traversal evidence_path → ERROR", async () => {
    const file = await writeFixture("docs/30-workflows/wf-f/artifacts.json", {
      metadata: {
        gates: [
          {
            gate_id: "Gate-X",
            status: "passed",
            passed_at: "2026-05-10T00:00:00Z",
            evidence_path: "../../../etc/passwd",
            approver: "daishiman",
          },
        ],
      },
    });
    const findings = await validateFile(file, { repoRoot: tmp });
    expect(findings.some((f) => f.level === "ERROR" && /schema: 0.evidence_path/.test(f.message))).toBe(
      true,
    );
  });

  it("rejects path traversal even when status is pending", async () => {
    const file = await writeFixture("docs/30-workflows/wf-pending-traversal/artifacts.json", {
      metadata: {
        gates: [
          {
            gate_id: "Gate-X",
            status: "pending",
            passed_at: null,
            evidence_path: "../../../etc/passwd",
            approver: "daishiman",
          },
        ],
      },
    });
    const findings = await validateFile(file, { repoRoot: tmp });
    expect(findings.some((f) => f.level === "ERROR" && /schema: 0.evidence_path/.test(f.message))).toBe(
      true,
    );
  });

  it("TC-19: walk finds multiple artifacts.json", async () => {
    await writeFixture("docs/30-workflows/wf-g/artifacts.json", validPending);
    await writeFixture("docs/30-workflows/wf-g/outputs/artifacts.json", validPending);
    const files = await findArtifacts({ cwd: tmp });
    expect(files.length).toBe(2);
  });

  it("TC-20: main() stdout has summary line", async () => {
    await writeFixture("docs/30-workflows/wf-h/artifacts.json", validPending);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: unknown) => {
      logs.push(String(msg));
    };
    try {
      const code = await main({ cwd: tmp });
      expect(code).toBe(0);
    } finally {
      console.log = orig;
    }
    expect(logs.some((l) => /^OK: \d+ WARN: \d+ ERROR: \d+/.test(l))).toBe(true);
  });

  it("isPathSafe rejects absolute paths", () => {
    expect(isPathSafe("/etc/passwd", tmp)).toBe(false);
    expect(isPathSafe("rel/ok.md", tmp)).toBe(true);
  });

  it("pickGates returns undefined for non-object input", () => {
    expect(pickGates(null)).toBeUndefined();
    expect(pickGates({ metadata: {} })).toBeUndefined();
    expect(pickGates({ metadata: { gates: [] } })).toEqual([]);
  });
});
