// scripts/__tests__/coverage-merge.test.mjs — node --test fixture test
// 仕様: docs/30-workflows/issue-617-ci-test-time-reduction-split/phase-07.md

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import url from "node:url";

import { mergeCoverage } from "../coverage-merge.mjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const fixtureA = path.join(__dirname, "__fixtures__/coverage-a.json");
const fixtureB = path.join(__dirname, "__fixtures__/coverage-b.json");

let tmpDir;

describe("coverage-merge.mjs", () => {
  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cov-merge-"));
  });

  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("s / f / b hit counts are summed where both inputs share a file", async () => {
    const { finalPath, summary } = await mergeCoverage({
      inputs: `${fixtureA},${fixtureB}`,
      output: tmpDir,
    });
    const merged = JSON.parse(await fs.readFile(finalPath, "utf8"));
    const foo = merged["src/foo.ts"];
    assert.equal(foo.s["0"], 1 + 2);
    assert.equal(foo.s["1"], 0 + 4);
    assert.equal(foo.f["0"], 1 + 3);
    assert.deepEqual(foo.b["0"], [1 + 0, 0 + 2]);
    assert.ok(summary.total.statements.pct >= 0);
  });

  it("files only in one input are preserved as-is", async () => {
    const { finalPath } = await mergeCoverage({
      inputs: `${fixtureA},${fixtureB}`,
      output: tmpDir,
    });
    const merged = JSON.parse(await fs.readFile(finalPath, "utf8"));
    assert.ok(merged["src/only-a.ts"], "only-a should remain");
    assert.ok(merged["src/only-b.ts"], "only-b should remain");
    assert.equal(merged["src/only-a.ts"].s["0"], 3);
    assert.equal(merged["src/only-b.ts"].s["0"], 7);
  });

  it("coverage-summary.json totals are recomputed from merged counts", async () => {
    const { summaryPath, summary } = await mergeCoverage({
      inputs: `${fixtureA},${fixtureB}`,
      output: tmpDir,
    });
    const onDisk = JSON.parse(await fs.readFile(summaryPath, "utf8"));
    assert.equal(onDisk.total.statements.pct, summary.total.statements.pct);
    // 3 files × statements per file -> total statements > 0
    assert.ok(onDisk.total.statements.total >= 4);
    // foo.s[0] and foo.s[1] both > 0 after merge → both statements covered
    // plus only-a, only-b each have s[0] > 0 → all 4 statements covered
    assert.equal(onDisk.total.statements.pct, 100);
    // foo.b[0] = [1, 2] → both branches covered (covered=2/2=100%)
    assert.equal(onDisk.total.branches.pct, 100);
  });
});
