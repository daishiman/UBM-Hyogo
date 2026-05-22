import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../../../..");
const scriptPath = resolve(scriptDir, "..", "validate-phase11-canonical-evidence-paths.js");
const tempDirs = [];

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "phase11-paths-"));
  tempDirs.push(dir);
  return dir;
}

function writeJson(filePath, payload) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

function writeFile(filePath, content = "") {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

function validManifest(workflowDir) {
  return {
    schemaVersion: "1.0.0",
    taskId: "fixture-workflow",
    workflowDir,
    evidence: [
      {
        id: "typecheck",
        kind: "typecheck",
        path: "outputs/phase-11/evidence/typecheck.log",
        command: "pnpm typecheck",
        acquiredBy: "implementation_cycle",
        requiredForCloseout: true,
      },
      {
        id: "runtime-7day",
        kind: "runtime-observation",
        path: "outputs/phase-11/evidence/hourly-run-7day.md",
        command: "gh run list",
        acquiredBy: "post_merge",
      },
    ],
  };
}

function runValidator(args) {
  return spawnSync("node", [scriptPath, "--json", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

test("valid manifest passes schema validation", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  writeJson(manifestPath, validManifest("docs/30-workflows/fixture-workflow"));

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(payload.errors.length, 0);
  assert.equal(payload.existenceErrors.length, 0);
});

test("schema violation exits 1", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  const manifest = validManifest("docs/30-workflows/fixture-workflow");
  delete manifest.evidence[0].command;
  writeJson(manifestPath, manifest);

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.ok(payload.errors.some((message) => message.includes("command is required")));
});

test("kind enum violation exits 1", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  const manifest = validManifest("docs/30-workflows/fixture-workflow");
  manifest.evidence[0].kind = "screenshot";
  writeJson(manifestPath, manifest);

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.ok(payload.errors.some((message) => message.includes("kind must be one of")));
});

test("duplicate id exits 1", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  const manifest = validManifest("docs/30-workflows/fixture-workflow");
  manifest.evidence[1].id = "typecheck";
  writeJson(manifestPath, manifest);

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.ok(payload.errors.some((message) => message.includes("duplicate evidence id")));
});

test("additional properties exit 1", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  const manifest = validManifest("docs/30-workflows/fixture-workflow");
  manifest.unexpected = true;
  manifest.evidence[0].extra = "not allowed";
  writeJson(manifestPath, manifest);

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.ok(payload.errors.some((message) => message.includes("unexpected root key")));
  assert.ok(payload.errors.some((message) => message.includes("extra is not allowed")));
});

test("path traversal exits 1", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  const manifest = validManifest("docs/30-workflows/fixture-workflow");
  manifest.evidence[0].path = "outputs/phase-11/evidence/../typecheck.log";
  writeJson(manifestPath, manifest);

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.ok(payload.errors.some((message) => message.includes("safe workflow-relative")));
});

test("workflowDir traversal exits 1", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  const manifest = validManifest("docs/30-workflows/../outside");
  writeJson(manifestPath, manifest);

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.ok(payload.errors.some((message) => message.includes("safe docs/30-workflows")));
});

test("missing workflow argument exits 3", () => {
  const result = runValidator(["--workflow"]);

  assert.equal(result.status, 3);
  assert.match(result.stderr, /--workflow requires a workflow directory/);
});

test("optional field type violations exit 1", () => {
  const root = makeTempDir();
  const manifestPath = join(root, "canonical-paths.json");
  const manifest = validManifest("docs/30-workflows/fixture-workflow");
  manifest.evidence[0].requiredForCloseout = "yes";
  manifest.evidence[1].notes = 123;
  writeJson(manifestPath, manifest);

  const result = runValidator([manifestPath]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.ok(payload.errors.some((message) => message.includes("requiredForCloseout")));
  assert.ok(payload.errors.some((message) => message.includes("notes must be a string")));
});

test("check-existence exits 2 when reserved file is missing", () => {
  const root = makeTempDir();
  const workflowDir = "docs/30-workflows/fixture-phase11-paths";
  const manifestPath = resolve(repoRoot, workflowDir, "outputs/phase-11/canonical-paths.json");
  writeJson(manifestPath, validManifest(workflowDir));

  const result = runValidator([manifestPath, "--check-existence"]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 2);
  assert.ok(payload.existenceErrors.some((message) => message.includes("typecheck.log")));
  rmSync(resolve(repoRoot, workflowDir), { recursive: true, force: true });
});

test("check-existence passes when files exist", () => {
  const workflowDir = "docs/30-workflows/fixture-phase11-paths-ok";
  const manifestPath = resolve(repoRoot, workflowDir, "outputs/phase-11/canonical-paths.json");
  writeJson(manifestPath, validManifest(workflowDir));
  writeFile(resolve(repoRoot, workflowDir, "outputs/phase-11/evidence/typecheck.log"), "ok");
  writeFile(resolve(repoRoot, workflowDir, "outputs/phase-11/evidence/hourly-run-7day.md"), "ok");

  const result = runValidator([manifestPath, "--check-existence"]);
  const payload = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(payload.existenceErrors.length, 0);
  rmSync(resolve(repoRoot, workflowDir), { recursive: true, force: true });
});

test.after(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});
