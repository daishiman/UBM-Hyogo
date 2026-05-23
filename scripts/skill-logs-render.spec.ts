import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { appendFragment } from "./skill-logs-append.js";
import { renderSkillLogs } from "./skill-logs-render.js";

let root: string;
const SKILL = "test-skill";

function skillRoot(): string {
  return resolve(root, ".claude", "skills", SKILL);
}

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "a2-render-"));
  mkdirSync(skillRoot(), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

async function seed(
  branch: string,
  iso: string,
  nonce: string,
  type: "log" | "changelog" | "lessons-learned" = "log",
): Promise<void> {
  await appendFragment({
    skill: SKILL,
    type,
    branch,
    author: "a@b",
    body: `entry from ${branch}`,
    now: new Date(iso),
    rootDir: root,
    generateNonce: () => nonce,
  });
}

describe("renderSkillLogs", () => {
  it("C-4: empty fragments → header only, exit 0", async () => {
    const r = await renderSkillLogs({ skill: SKILL, rootDir: root });
    expect(r.errors).toEqual([]);
    expect(r.fragmentCount).toBe(0);
    expect(r.output).toContain(`# Skill Logs: ${SKILL}`);
  });

  it("C-5/C-6: descending timestamp order", async () => {
    await seed("main", "2026-04-01T00:00:00Z", "00000001");
    await seed("main", "2026-04-03T00:00:00Z", "00000002");
    await seed("main", "2026-04-02T00:00:00Z", "00000003");
    const r = await renderSkillLogs({ skill: SKILL, rootDir: root });
    expect(r.fragmentCount).toBe(3);
    const idxApr03 = r.output.indexOf("2026-04-03");
    const idxApr02 = r.output.indexOf("2026-04-02");
    const idxApr01 = r.output.indexOf("2026-04-01");
    expect(idxApr03).toBeLessThan(idxApr02);
    expect(idxApr02).toBeLessThan(idxApr01);
  });

  it("C-7: front-matter timestamp missing → error reported", async () => {
    const dir = resolve(skillRoot(), "LOGS");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      resolve(dir, "20260428-100000-main-00000001.md"),
      "---\nbranch: main\nauthor: a@b\ntype: log\n---\nbody\n",
      "utf8",
    );
    const r = await renderSkillLogs({ skill: SKILL, rootDir: root });
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0]).toMatch(/missing required front matter key/);
  });

  it("C-8: invalid YAML → error", async () => {
    const dir = resolve(skillRoot(), "LOGS");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      resolve(dir, "20260428-100000-main-00000002.md"),
      "no front matter at all\n",
      "utf8",
    );
    const r = await renderSkillLogs({ skill: SKILL, rootDir: root });
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("C-9/F-9: --out pointing at LOGS.md → exit code 2", async () => {
    await seed("main", "2026-04-01T00:00:00Z", "00000001");
    await expect(
      renderSkillLogs({
        skill: SKILL,
        rootDir: root,
        out: resolve(skillRoot(), "LOGS.md"),
      }),
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it("F-10: --out pointing at SKILL-changelog.md → exit code 2", async () => {
    await expect(
      renderSkillLogs({
        skill: SKILL,
        rootDir: root,
        out: resolve(skillRoot(), "SKILL-changelog.md"),
      }),
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it("C-12: --since filters older fragments", async () => {
    await seed("main", "2026-01-01T00:00:00Z", "00000001");
    await seed("main", "2026-04-01T00:00:00Z", "00000002");
    const r = await renderSkillLogs({
      skill: SKILL,
      rootDir: root,
      since: "2026-03-01T00:00:00Z",
    });
    expect(r.fragmentCount).toBe(1);
    expect(r.output).toContain("2026-04-01");
    expect(r.output).not.toContain("2026-01-01");
  });

  it("F-11: invalid --since throws", async () => {
    await expect(
      renderSkillLogs({ skill: SKILL, rootDir: root, since: "not-a-date" }),
    ).rejects.toThrow(/invalid --since/);
  });

  it("C-10/C-11: --include-legacy applies 30-day window", async () => {
    await seed("main", "2026-04-01T00:00:00Z", "00000001");
    const dir = resolve(skillRoot(), "LOGS");
    mkdirSync(dir, { recursive: true });
    // recent legacy
    writeFileSync(
      resolve(dir, "_legacy.md"),
      "# legacy\n2026-04-20T00:00:00Z entry\n",
      "utf8",
    );
    const r = await renderSkillLogs({
      skill: SKILL,
      rootDir: root,
      includeLegacy: true,
      now: new Date("2026-04-28T00:00:00Z"),
    });
    expect(r.legacyIncluded).toBe(1);
    expect(r.output).toContain("## Legacy");

    // outside window
    const r2 = await renderSkillLogs({
      skill: SKILL,
      rootDir: root,
      includeLegacy: true,
      now: new Date("2026-12-31T00:00:00Z"),
    });
    expect(r2.legacyIncluded).toBe(0);
  });
});
