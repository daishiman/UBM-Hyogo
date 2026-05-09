// Issue #560 regression test for scripts/patch-next-standalone-instrumentation.mjs.
// node --test runner. Fixture を一時 dir に組み立て、cwd を `apps/web` に擬似する。
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dirname, "..", "patch-next-standalone-instrumentation.mjs");

let tmpRoot;
let appsWebDir;

function setupFixture(opts = {}) {
  tmpRoot = mkdtempSync(join(tmpdir(), "patch-instr-"));
  appsWebDir = join(tmpRoot, "apps", "web");
  mkdirSync(appsWebDir, { recursive: true });
  const nextServer = join(appsWebDir, ".next", "server");
  mkdirSync(nextServer, { recursive: true });

  const traceFiles = opts.traceFiles ?? ["chunks/instrumentation-dep.js"];
  if (opts.includeInstrumentation !== false) {
    writeFileSync(
      join(nextServer, "instrumentation.js"),
      "export function register(){} // Sentry init\n",
    );
    writeFileSync(join(nextServer, "instrumentation.js.map"), "{}");
    writeFileSync(
      join(nextServer, "instrumentation.js.nft.json"),
      JSON.stringify({ version: 1, files: traceFiles }),
    );
    for (const f of traceFiles) {
      const target = join(nextServer, f);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, "// trace dep\n");
    }
  }
  return { tmpRoot, appsWebDir, nextServer };
}

function runScript(cwd, args = []) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    encoding: "utf8",
  });
}

beforeEach(() => {
  tmpRoot = undefined;
});

afterEach(() => {
  if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
});

test("TC-01: cwd guard fails outside apps/web", () => {
  const { tmpRoot: root } = setupFixture();
  const r = runScript(root);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /cwd_guard_failed/);
});

test("TC-02: missing input is skipped (webpack build path)", () => {
  setupFixture({ includeInstrumentation: false });
  const r = runScript(appsWebDir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /copy_skipped/);
  assert.match(r.stdout, /instrumentation_not_emitted/);
});

test("TC-03: happy path copies instrumentation to standalone", () => {
  setupFixture();
  const r = runScript(appsWebDir);
  assert.equal(r.status, 0, r.stderr);
  const target = join(
    appsWebDir,
    ".next/standalone/apps/web/.next/server/instrumentation.js",
  );
  const content = readFileSync(target, "utf8");
  assert.match(content, /register/);
  assert.match(content, /Sentry/);
  assert.match(r.stdout, /copy_done/);
});

test("TC-04: trace files[] are copied to standalone", () => {
  setupFixture({ traceFiles: ["chunks/instrumentation-dep.js", "chunks/extra.js"] });
  const r = runScript(appsWebDir);
  assert.equal(r.status, 0, r.stderr);
  for (const f of ["chunks/instrumentation-dep.js", "chunks/extra.js"]) {
    const target = join(
      appsWebDir,
      ".next/standalone/apps/web/.next/server",
      f,
    );
    assert.equal(readFileSync(target, "utf8"), "// trace dep\n");
  }
});

test("TC-05: overwrite stale standalone artifact", () => {
  setupFixture();
  const stale = join(
    appsWebDir,
    ".next/standalone/apps/web/.next/server/instrumentation.js",
  );
  mkdirSync(dirname(stale), { recursive: true });
  writeFileSync(stale, "// stale content without tokens\n");

  const r = runScript(appsWebDir);
  assert.equal(r.status, 0, r.stderr);
  const content = readFileSync(stale, "utf8");
  assert.doesNotMatch(content, /stale content/);
  assert.match(content, /Sentry/);
});

test("TC-06a: --verify-only fails when artifact missing", () => {
  setupFixture();
  const r = runScript(appsWebDir, ["--verify-only"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /verify_failed/);
  assert.match(
    r.stderr,
    /Sentry server instrumentation missing in standalone build artifact/,
  );
});

test("TC-06b: --verify-only fails when tokens absent", () => {
  setupFixture();
  const target = join(
    appsWebDir,
    ".next/standalone/apps/web/.next/server/instrumentation.js",
  );
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, "// no tokens here\n");
  const r = runScript(appsWebDir, ["--verify-only"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tokens_missing/);
  assert.match(
    r.stderr,
    /Sentry server instrumentation missing in standalone build artifact/,
  );
});

test("TC-06c: --verify-only succeeds after copy", () => {
  setupFixture();
  const copyRun = runScript(appsWebDir);
  assert.equal(copyRun.status, 0, copyRun.stderr);
  const r = runScript(appsWebDir, ["--verify-only"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /verify_ok/);
});

test("TC-07: malformed trace JSON causes structured failure", () => {
  const { nextServer } = setupFixture();
  writeFileSync(join(nextServer, "instrumentation.js.nft.json"), "{bad json");

  const r = runScript(appsWebDir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /trace_failed/);
  assert.match(r.stderr, /invalid_json/);
});
