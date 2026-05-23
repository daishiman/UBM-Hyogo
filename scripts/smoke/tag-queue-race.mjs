#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_TIMEOUT_MS = 10_000;

function usage() {
  return [
    "Usage:",
    "  node scripts/smoke/tag-queue-race.mjs --env staging --queue-id <id> --base-url <url> --session-cookie <cookie> --tag-codes <csv>",
    "  node scripts/smoke/tag-queue-race.mjs --dry-run --env staging --queue-id <id> --base-url <url> --session-cookie <cookie> --tag-codes <csv>",
    "  node scripts/smoke/tag-queue-race.mjs --analyze-only --input <results.json> [--side-effect-input <side-effects.json>]",
  ].join("\n");
}

function parseArgs(argv) {
  const opts = {
    action: "confirmed",
    concurrency: DEFAULT_CONCURRENCY,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${key} requires a value`);
      }
      i += 1;
      return value;
    };

    switch (key) {
      case "--env":
        opts.env = next();
        break;
      case "--queue-id":
        opts.queueId = next();
        break;
      case "--concurrency":
        opts.concurrency = Number(next());
        break;
      case "--base-url":
        opts.baseUrl = next();
        break;
      case "--session-cookie":
        opts.sessionCookie = next();
        break;
      case "--action":
        opts.action = next();
        break;
      case "--tag-codes":
        opts.tagCodes = next()
          .split(",")
          .map((code) => code.trim())
          .filter(Boolean);
        break;
      case "--reason":
        opts.reason = next();
        break;
      case "--out":
        opts.out = next();
        break;
      case "--input":
        opts.input = next();
        break;
      case "--side-effect-input":
        opts.sideEffectInput = next();
        break;
      case "--timeout-ms":
        opts.timeoutMs = Number(next());
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--analyze-only":
        opts.analyzeOnly = true;
        break;
      default:
        throw new Error(`unknown argument: ${key}`);
    }
  }

  return validateOptions(opts);
}

function validateOptions(opts) {
  if (opts.analyzeOnly) {
    if (!opts.input) {
      throw new Error("--input is required with --analyze-only");
    }
    return opts;
  }

  if (opts.env !== "staging" && opts.env !== "local") {
    throw new Error("--env must be staging or local");
  }
  if (!opts.queueId) {
    throw new Error("--queue-id is required");
  }
  if (!Number.isInteger(opts.concurrency) || opts.concurrency < 2) {
    throw new Error("--concurrency must be an integer >= 2");
  }
  if (!opts.baseUrl) {
    throw new Error("--base-url is required");
  }
  if (!opts.sessionCookie) {
    throw new Error("--session-cookie is required");
  }
  if (opts.action !== "confirmed" && opts.action !== "rejected") {
    throw new Error("--action must be confirmed or rejected");
  }
  if (opts.action === "confirmed" && (!opts.tagCodes || opts.tagCodes.length === 0)) {
    throw new Error("--tag-codes is required when --action confirmed");
  }
  if (opts.action === "rejected" && !opts.reason) {
    throw new Error("--reason is required when --action rejected");
  }
  if (!Number.isInteger(opts.timeoutMs) || opts.timeoutMs < 1_000) {
    throw new Error("--timeout-ms must be an integer >= 1000");
  }
  if (!opts.out) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    opts.out = `docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/outputs/phase-11/${ts}/result.json`;
  }
  return opts;
}

function buildPayload(opts) {
  if (opts.action === "rejected") {
    return { action: "rejected", reason: opts.reason };
  }
  return { action: "confirmed", tagCodes: opts.tagCodes };
}

function isObject(value) {
  return typeof value === "object" && value !== null;
}

function analyzeSideEffects(sideEffects) {
  if (!sideEffects) {
    return {
      checked: false,
      verdict: "not_checked",
      reason: "--side-effect-input was not provided",
    };
  }

  const expected = isObject(sideEffects.expected) ? sideEffects.expected : {};
  const actual = isObject(sideEffects.actual) ? sideEffects.actual : sideEffects;
  const expectedMemberTagsDelta = Number(expected.memberTagsDelta);
  const expectedAuditLogDelta = Number(expected.auditLogDelta);
  const expectedQueueStatus = expected.queueStatus;
  const actualMemberTagsDelta = Number(actual.memberTagsDelta);
  const actualAuditLogDelta = Number(actual.auditLogDelta);
  const actualQueueStatus = actual.queueStatus;

  const missing =
    !Number.isFinite(expectedMemberTagsDelta) ||
    !Number.isFinite(expectedAuditLogDelta) ||
    typeof expectedQueueStatus !== "string" ||
    !Number.isFinite(actualMemberTagsDelta) ||
    !Number.isFinite(actualAuditLogDelta) ||
    typeof actualQueueStatus !== "string";

  if (missing) {
    return {
      checked: true,
      verdict: "fail",
      reason:
        "--side-effect-input must include expected/actual memberTagsDelta, auditLogDelta, and queueStatus",
    };
  }

  const pass =
    actualMemberTagsDelta === expectedMemberTagsDelta &&
    actualAuditLogDelta === expectedAuditLogDelta &&
    actualQueueStatus === expectedQueueStatus;

  return {
    checked: true,
    verdict: pass ? "pass" : "fail",
    reason: pass
      ? "D1 side effects matched expected deltas and final queue status"
      : `expected memberTagsDelta=${expectedMemberTagsDelta}, auditLogDelta=${expectedAuditLogDelta}, queueStatus=${expectedQueueStatus}; got memberTagsDelta=${actualMemberTagsDelta}, auditLogDelta=${actualAuditLogDelta}, queueStatus=${actualQueueStatus}`,
    expected: {
      memberTagsDelta: expectedMemberTagsDelta,
      auditLogDelta: expectedAuditLogDelta,
      queueStatus: expectedQueueStatus,
    },
    actual: {
      memberTagsDelta: actualMemberTagsDelta,
      auditLogDelta: actualAuditLogDelta,
      queueStatus: actualQueueStatus,
    },
  };
}

function analyzeResults(results, sideEffects) {
  let successes = 0;
  let raceLosts = 0;
  let others = 0;
  let networkErrors = 0;

  for (const result of results) {
    const body = isObject(result.body) ? result.body : {};
    if (result.status === 200 && body.ok === true) {
      successes += 1;
    } else if (result.status === 409 && body.error === "race_lost") {
      raceLosts += 1;
    } else {
      others += 1;
      if (result.status === 0) {
        networkErrors += 1;
      }
    }
  }

  const httpPass = successes === 1 && raceLosts >= 1 && others === 0;
  const sideEffectAnalysis = analyzeSideEffects(sideEffects);
  const sideEffectPass =
    sideEffectAnalysis.verdict === "not_checked" || sideEffectAnalysis.verdict === "pass";
  const pass = httpPass && sideEffectPass;
  const verdict = pass ? "pass" : "fail";
  const reason = !httpPass
    ? `expected successes=1, raceLosts>=1, others=0; got successes=${successes}, raceLosts=${raceLosts}, others=${others}`
    : sideEffectAnalysis.verdict === "fail"
      ? sideEffectAnalysis.reason
      : "exactly one resolve won and all losers returned race_lost";

  return {
    successes,
    raceLosts,
    others,
    networkErrors,
    total: results.length,
    verdict,
    reason,
    sideEffects: sideEffectAnalysis,
  };
}

function safeOptions(opts) {
  const { sessionCookie: _sessionCookie, ...rest } = opts;
  return {
    ...rest,
    hasSessionCookie: Boolean(opts.sessionCookie),
    sessionCookie: opts.sessionCookie ? "***" : undefined,
  };
}

async function runConcurrentResolve(opts, fetchImpl = fetch) {
  const url = `${opts.baseUrl.replace(/\/+$/, "")}/admin/tags/queue/${encodeURIComponent(opts.queueId)}/resolve`;
  const payload = buildPayload(opts);
  const tasks = Array.from({ length: opts.concurrency }, (_, index) => async () => {
    const startedAt = new Date().toISOString();
    const t0 = performance.now();
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: opts.sessionCookie,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(opts.timeoutMs),
      });
      const body = await response.json().catch(() => ({}));
      return {
        index,
        status: response.status,
        body,
        latencyMs: Math.round(performance.now() - t0),
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        index,
        status: 0,
        body: { error: "network", message: String(error?.message ?? error) },
        latencyMs: Math.round(performance.now() - t0),
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    }
  });

  return Promise.all(tasks.map((task) => task()));
}

async function writeEvidence(opts, results, analysis) {
  const outPath = resolve(opts.out);
  const evidence = {
    generatedAt: new Date().toISOString(),
    options: safeOptions(opts),
    analysis,
    results,
  };
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
  return outPath;
}

async function readJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function readOptionalJson(path) {
  if (!path) {
    return undefined;
  }
  return readJson(path);
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (error) {
    console.error(String(error?.message ?? error));
    console.error(usage());
    process.exit(2);
  }

  if (opts.analyzeOnly) {
    const input = await readJson(opts.input);
    const results = Array.isArray(input) ? input : input.results;
    if (!Array.isArray(results)) {
      console.error("--input must be a result array or an object with results[]");
      process.exit(2);
    }
    const sideEffects = await readOptionalJson(opts.sideEffectInput);
    const analysis = analyzeResults(results, sideEffects);
    console.log(JSON.stringify(analysis));
    process.exit(analysis.verdict === "pass" ? 0 : 1);
  }

  if (opts.dryRun) {
    console.log(JSON.stringify(safeOptions(opts)));
    process.exit(0);
  }

  const results = await runConcurrentResolve(opts);
  const sideEffects = await readOptionalJson(opts.sideEffectInput);
  const analysis = analyzeResults(results, sideEffects);
  const outPath = await writeEvidence(opts, results, analysis);
  console.log(JSON.stringify({ verdict: analysis.verdict, out: outPath, analysis }));

  if (analysis.networkErrors === results.length) {
    process.exit(2);
  }
  process.exit(analysis.verdict === "pass" ? 0 : 1);
}

main().catch((error) => {
  console.error(String(error?.stack ?? error));
  process.exit(2);
});
