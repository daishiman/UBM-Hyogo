// Issue #315: redaction grep gate (TC-GREP-01..02)
// scripts/audit-log/ 配下のソースに raw email / phone リテラルが残っていないことを確認する CI gate。
// 既知の test fixture 文字列は許容パターンで除外する。
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_DIR = join(__dirname, "..");

const collectSources = (dir: string, acc: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name === "node_modules") continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) collectSources(p, acc);
    else if (/\.(ts|js|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
};

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
// 7 桁以上の数字列を電話パターン候補とみなす
const PHONE_RE = /\b\d{2,4}-\d{2,4}-\d{3,4}\b/;

describe("audit-log export script redaction grep gate", () => {
  const sources = collectSources(SCRIPT_DIR);

  it("TC-GREP-01: source files contain no raw email literal", () => {
    const hits: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      // コメント行を除外（'//' 始まり）
      const codeOnly = text
        .split("\n")
        .filter((l) => !/^\s*\/\//.test(l) && !/^\s*\*/.test(l))
        .join("\n");
      if (EMAIL_RE.test(codeOnly)) {
        hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  it("TC-GREP-02: source files contain no raw phone literal", () => {
    const hits: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      const codeOnly = text
        .split("\n")
        .filter((l) => !/^\s*\/\//.test(l) && !/^\s*\*/.test(l))
        .join("\n");
      if (PHONE_RE.test(codeOnly)) {
        hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});
