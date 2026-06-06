import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const scriptPath = join(repoRoot, "scripts/verify-no-localhost-bake.sh");

async function run(root: string) {
  try {
    const result = await execFileAsync("bash", [scriptPath, "--src-only", "--root", root]);
    return { code: 0, stderr: result.stderr };
  } catch (error) {
    const err = error as { code?: number; stderr?: string };
    return { code: err.code ?? 1, stderr: err.stderr ?? "" };
  }
}

describe("verify-no-localhost-bake.sh", () => {
  it("fails on unallowlisted localhost API endpoint", async () => {
    const root = await mkdtemp(join(tmpdir(), "localhost-bake-dirty-"));
    const dir = join(root, "apps/web/src/lib");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "bad.ts"), 'export const u = "http://127.0.0.1:8787/me";\n');
    const result = await run(root);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("localhost bake detected");
  });

  it("allows local fallback with explicit allowlist comment", async () => {
    const root = await mkdtemp(join(tmpdir(), "localhost-bake-allow-"));
    const dir = join(root, "apps/web/src/lib");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "ok.ts"),
      '// localhost-allow:local-fallback\nexport const u = "http://localhost:8787";\n',
    );
    const result = await run(root);
    expect(result.code).toBe(0);
  });
});
