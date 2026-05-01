// 06b S-01〜S-04: ソースコード静的検査。
// fs.readdir 再帰 + readFile で対象ディレクトリの全ファイルを走査し、
// 禁止語が現れないことを確認する（execSync 不要）。

import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = resolve(__dirname, "../../");

const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  ".open-next",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
  ".wrangler",
]);

interface CollectOptions {
  readonly extFilter?: (file: string) => boolean;
}

const walk = async (
  dir: string,
  opts: CollectOptions = {},
): Promise<string[]> => {
  let out: string[] = [];
  let entries: Dirent<string>[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIRS.has(ent.name)) continue;
      out = out.concat(await walk(full, opts));
    } else if (ent.isFile()) {
      const dot = ent.name.lastIndexOf(".");
      const ext = dot >= 0 ? ent.name.slice(dot) : "";
      if (!SOURCE_EXTS.has(ext)) continue;
      if (opts.extFilter && !opts.extFilter(ent.name)) continue;
      out.push(full);
    }
  }
  return out;
};

// 行コメント (// ...) と単一行内の block comment を除去した行を返す。
// 多行 block comment やテンプレ文字列内コメント疑似は対象外（最低限のヒューリスティック）。
const stripLineComment = (line: string): string => {
  let out = line;
  // /* ... */ をその行内で除去
  out = out.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, "");
  // 文字列内 // を素朴に守るため、最初の // をそのまま除去（厳密な lexer ではないが
  // ソースに `"//xxx"` リテラルが必要なケースは検出側で別途扱う）
  const idx = out.indexOf("//");
  if (idx >= 0) out = out.slice(0, idx);
  return out;
};

const findMatches = async (
  files: string[],
  needle: string,
  options: { stripComments?: boolean } = {},
): Promise<{ file: string; line: number; text: string }[]> => {
  const hits: { file: string; line: number; text: string }[] = [];
  for (const f of files) {
    const content = await readFile(f, "utf8");
    if (!content.includes(needle)) continue;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const target = options.stripComments ? stripLineComment(lines[i]) : lines[i];
      if (target.includes(needle)) {
        hits.push({ file: f, line: i + 1, text: lines[i] });
      }
    }
  }
  return hits;
};

const findAnyMatches = async (
  files: string[],
  patterns: RegExp[],
): Promise<{ file: string; line: number; text: string }[]> => {
  const hits: { file: string; line: number; text: string }[] = [];
  for (const f of files) {
    const content = await readFile(f, "utf8");
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (patterns.some((p) => p.test(line))) {
        hits.push({ file: f, line: i + 1, text: line });
      }
    }
  }
  return hits;
};

const isSelfTestFile = (file: string): boolean =>
  file.endsWith("static-invariants.test.ts");

describe("static invariants / 06b", () => {
  it("S-01: app/profile 配下に 'questionId' が出現しない", async () => {
    const files = await walk(join(WEB_ROOT, "app/profile"));
    const hits = await findMatches(files, "questionId", {
      stripComments: true,
    });
    expect(
      hits,
      `questionId が profile 配下に存在: ${JSON.stringify(hits, null, 2)}`,
    ).toHaveLength(0);
  });

  it("S-02: app/login と app/profile に 'localStorage' が出現しない", async () => {
    const files = [
      ...(await walk(join(WEB_ROOT, "app/login"))),
      ...(await walk(join(WEB_ROOT, "app/profile"))),
    ];
    const hits = await findMatches(files, "localStorage", {
      stripComments: true,
    });
    expect(
      hits,
      `localStorage 使用: ${JSON.stringify(hits, null, 2)}`,
    ).toHaveLength(0);
  });

  it("S-03: apps/web 全体に '/no-access' リテラルが現れない", async () => {
    // eslint.config.mjs は禁止語自体を検出ルールとして文字列リテラルで含むため除外。
    // 本テストファイルも検出語をリテラルで持つため除外。
    const files = (await walk(WEB_ROOT)).filter(
      (f) => !isSelfTestFile(f) && !f.endsWith("eslint.config.mjs"),
    );
    const hits = await findMatches(files, "/no-access", {
      stripComments: true,
    });
    expect(
      hits,
      `/no-access リテラル使用: ${JSON.stringify(hits, null, 2)}`,
    ).toHaveLength(0);
  });

  it("S-04: app/profile 配下に <form/<input/<textarea/submit button が現れない", async () => {
    const files = await walk(join(WEB_ROOT, "app/profile"));
    const hits = await findAnyMatches(files, [
      /<form\b/,
      /<input\b/,
      /<textarea\b/,
      /<button\b[^>]*\btype=["']submit["']/,
      /type=["']submit["'][^>]*>\s*[^<]*<\/button>/,
    ]);
    expect(
      hits,
      `編集 form/submit 要素が profile 配下に存在: ${JSON.stringify(hits, null, 2)}`,
    ).toHaveLength(0);
  });
});
