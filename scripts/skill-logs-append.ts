#!/usr/bin/env tsx
// pnpm skill:logs:append — write a single fragment under a skill's ledger directory.

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

import {
  buildFragmentRelPath,
  isWithinPathByteLimit,
  isFragmentType,
  type FragmentType,
} from "./lib/fragment-path.js";
import {
  buildFragmentContent,
  type FrontMatter,
} from "./lib/front-matter.js";
import {
  CollisionError,
  retryOnCollision,
} from "./lib/retry-on-collision.js";
import { nowUtcCompact, nowUtcIso } from "./lib/timestamp.js";

export interface AppendFragmentOptions {
  skill: string;
  type: FragmentType;
  message?: string;
  body?: string;
  branch?: string;
  author?: string;
  now?: Date;
  // dependency-injection knobs (used by tests)
  rootDir?: string;
  generateNonce?: () => string;
}

export interface AppendFragmentResult {
  absPath: string;
  relPathFromSkillRoot: string;
  attempts: number;
}

export function defaultGenerateNonce(): string {
  return randomBytes(4).toString("hex");
}

function detectGitBranch(rootDir: string): string {
  try {
    const out = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return out || "unknown";
  } catch {
    return "unknown";
  }
}

function detectGitAuthor(rootDir: string): string {
  try {
    return (
      execSync("git config user.email", {
        cwd: rootDir,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim() || "claude-code"
    );
  } catch {
    return "claude-code";
  }
}

export async function appendFragment(
  options: AppendFragmentOptions,
): Promise<AppendFragmentResult> {
  if (!isFragmentType(options.type)) {
    throw new Error(`invalid --type: ${options.type}`);
  }
  const root = options.rootDir ?? process.cwd();
  const skillDir = resolve(root, ".claude", "skills", options.skill);
  if (!existsSync(skillDir)) {
    throw new Error(`skill directory not found: ${skillDir}`);
  }
  const branch = options.branch ?? detectGitBranch(root);
  const author = options.author ?? detectGitAuthor(root);
  const now = options.now ?? new Date();
  const tsCompact = nowUtcCompact(now);
  const tsIso = nowUtcIso(now);
  const genNonce = options.generateNonce ?? defaultGenerateNonce;

  const result = await retryOnCollision<{ abs: string; rel: string }>(
    async () => {
      const nonce = genNonce();
      const rel = buildFragmentRelPath({
        type: options.type,
        timestampCompact: tsCompact,
        branch,
        nonce,
      });
      const abs = resolve(skillDir, rel);
      if (!isWithinPathByteLimit(abs)) {
        throw new Error(`fragment path exceeds 240 byte limit: ${abs}`);
      }
      if (existsSync(abs)) return { ok: false };
      return { ok: true, value: { abs, rel } };
    },
  );

  const fm: FrontMatter = {
    timestamp: tsIso,
    branch,
    author,
    type: options.type,
  };
  const body = options.body ?? options.message ?? "";
  const content = buildFragmentContent(fm, body);

  mkdirSync(dirname(result.value.abs), { recursive: true });
  writeFileSync(result.value.abs, content, "utf8");

  return {
    absPath: result.value.abs,
    relPathFromSkillRoot: result.value.rel,
    attempts: result.attempts,
  };
}

interface ParsedArgs {
  skill?: string;
  type?: FragmentType;
  message?: string;
  bodyFile?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--skill" && next) {
      out.skill = next;
      i += 1;
    } else if (a === "--type" && next) {
      out.type = next as FragmentType;
      i += 1;
    } else if (a === "--message" && next) {
      out.message = next;
      i += 1;
    } else if (a === "--body-file" && next) {
      out.bodyFile = next;
      i += 1;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.skill || !args.type) {
    process.stderr.write(
      "usage: pnpm skill:logs:append --skill <name> --type <log|changelog|lessons-learned> [--message <text>] [--body-file <path>]\n",
    );
    process.exit(1);
  }
  if (!["log", "changelog", "lessons-learned"].includes(args.type)) {
    process.stderr.write(`invalid --type: ${args.type}\n`);
    process.exit(1);
  }
  const body = args.bodyFile
    ? readFileSync(args.bodyFile, "utf8")
    : args.message ?? "";
  try {
    const r = await appendFragment({
      skill: args.skill,
      type: args.type,
      body,
    });
    process.stdout.write(`${r.relPathFromSkillRoot}\n`);
  } catch (e) {
    if (e instanceof CollisionError) {
      process.stderr.write(`collision unresolved after ${e.attempts} attempts\n`);
      process.exit(1);
    }
    process.stderr.write(`${(e as Error).message}\n`);
    process.exit(1);
  }
}

const entry = process.argv[1] ?? "";
if (entry.endsWith("skill-logs-append.ts") || entry.endsWith("skill-logs-append.js")) {
  void main();
}
