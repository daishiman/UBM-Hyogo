#!/usr/bin/env node

/**
 * スキル使用記録スクリプト
 *
 * 18-skills.md §7.3 に準拠したフィードバック記録を行います。
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, "..");

const EXIT_SUCCESS = 0;
const EXIT_ARGS_ERROR = 2;

function escapeBranch(branch) {
  const escaped = branch
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (escaped || "unknown").slice(0, 64);
}

function compactTimestamp(now) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

function writeLogFragment(body, timestamp) {
  const branch = escapeBranch(process.env.GIT_BRANCH || process.env.BRANCH || "unknown");
  const author = process.env.GIT_AUTHOR_EMAIL || process.env.USER || "claude-code";
  const dir = join(SKILL_DIR, "LOGS");
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 4; i += 1) {
    const nonce = randomBytes(4).toString("hex");
    const file = join(dir, `${compactTimestamp(new Date(timestamp))}-${branch}-${nonce}.md`);
    if (existsSync(file)) continue;
    const content = `---\ntimestamp: ${timestamp.replace(/\.\d{3}Z$/, "Z")}\nbranch: ${branch}\nauthor: ${author}\ntype: log\n---\n${body.trimEnd()}\n`;
    writeFileSync(file, content, "utf-8");
    return;
  }
  throw new Error("fragment path collision unresolved after 4 attempts");
}

function showHelp() {
  console.log(`
Usage: node log_usage.js [options]

Options:
  --result <success|failure>  実行結果（必須）
  --phase <name>              実行したPhase名（任意）
  --agent <name>              実行したエージェント名（任意）
  --notes <text>              追加のフィードバックメモ（任意）
  -h, --help                  このヘルプを表示
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    showHelp();
    process.exit(EXIT_SUCCESS);
  }

  const getArg = (name) => {
    const index = args.indexOf(name);
    return index !== -1 && args[index + 1] ? args[index + 1] : null;
  };

  const result = getArg("--result");
  const phase = getArg("--phase") || "unknown";
  const agent = getArg("--agent") || "unknown";
  const notes = getArg("--notes") || "";

  if (!result || !["success", "failure"].includes(result)) {
    console.error("Error: --result は success または failure を指定してください");
    process.exit(EXIT_ARGS_ERROR);
  }

  const timestamp = new Date().toISOString();
  const logEntry = `
## [${timestamp}]
- Agent: ${agent}
- Phase: ${phase}
- Result: ${result}
- Notes: ${notes || "なし"}
---
`;

  try {
    writeLogFragment(logEntry, timestamp);
    console.log(`✓ フィードバックを記録しました: ${result}`);
  } catch (err) {
    console.error(`Error: fragment ログの作成に失敗しました: ${err.message}`);
    process.exit(1);
  }

  process.exit(EXIT_SUCCESS);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
