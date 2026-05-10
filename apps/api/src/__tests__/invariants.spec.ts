// 08a Phase 5/6: 不変条件サマリ test
// 既存 test 群（normalize-response / extract-consent / boundary 等）で個別に
// 担保されている不変条件を、08a AC-5 用に集約 verify する責務のみを持つ。
// 重複テストにならないよう「集約点で 1 ケースだけ assert する」方針。
//
// 対象不変条件:
//   #1 schema を固定しすぎない（unknown は別経路で保持される）
//   #2 consent キーは publicConsent / rulesConsent のみ
//   #3 responseEmail は system field（response 本体に残らない）
//   #6 apps/web から D1 直接アクセス禁止（grep ベース）
//   #11 /me 配下に PUT/PATCH /me/profile を mount しない

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeResponse } from "../jobs/mappers/normalize-response";
import { asResponseId, asResponseEmail } from "../repository/_shared/brand";
import type { MemberResponse } from "@ubm-hyogo/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const API_SRC = join(__dirname, "..");
const REPO_ROOT = join(API_SRC, "../../..");
const WEB_SRC = join(REPO_ROOT, "apps/web/src");
const WEB_APP = join(REPO_ROOT, "apps/web/app");

const baseResponse = (over: Partial<MemberResponse> = {}): MemberResponse => ({
  responseId: asResponseId("r_001"),
  formId: "test-form-id",
  revisionId: "rev_1",
  schemaHash: "h",
  responseEmail: asResponseEmail("user@example.com"),
  submittedAt: "2026-04-26T00:00:00.000Z",
  editResponseUrl: null,
  answersByStableKey: {},
  rawAnswersByQuestionId: {},
  extraFields: {},
  unmappedQuestionIds: [],
  searchText: "",
  ...over,
});

describe("invariants（08a AC-5 集約 verify）", () => {
  it("#1: 未知の question_id は known でなく unknown に流れる（schema 固定しすぎない）", () => {
    const r = baseResponse({
      answersByStableKey: { fullName: "山田" },
      rawAnswersByQuestionId: { qX_unknown: "新しい設問" },
      unmappedQuestionIds: ["qX_unknown"],
    });
    const n = normalizeResponse(r);
    expect(n.known.has("fullName")).toBe(true);
    expect(n.unknown.has("qX_unknown")).toBe(true);
    // known と unknown は disjoint
    for (const k of n.known.keys()) {
      expect(n.unknown.has(k)).toBe(false);
    }
  });

  it("#3: responseEmail は known/unknown のいずれにも入らない（system field）", () => {
    const r = baseResponse({
      answersByStableKey: {
        fullName: "山田",
        responseEmail: "leak@example.com", // 偽装的に混入させても弾かれる
      },
    });
    const n = normalizeResponse(r);
    expect(n.known.has("responseEmail")).toBe(false);
    expect(n.unknown.has("responseEmail")).toBe(false);
  });

  it("#2: consent キーは publicConsent / rulesConsent の 2 種のみ（コード上の不変）", () => {
    // sheets-to-members の COLUMN_KEY_MAP に他 consent 名が混入していないことを
    // ファイル内容として確認する。schema 拡張時にここで気付ける。
    const src = readFileSync(
      join(API_SRC, "jobs/mappers/sheets-to-members.ts"),
      "utf8",
    );
    expect(src).toMatch(/publicConsent/);
    expect(src).toMatch(/rulesConsent/);
    // 旧 ruleConsent を新規導入していないこと（mapper の正規化先には登場しない）
    const lines = src.split("\n").filter((l) => /\bruleConsent\b/.test(l));
    expect(lines).toEqual([]);
  });

  it("#11: /me 配下に PUT または PATCH /me/profile route が存在しない", () => {
    const meIndex = readFileSync(join(API_SRC, "routes/me/index.ts"), "utf8");
    expect(meIndex).not.toMatch(/app\.put\(\s*["']\/profile/);
    expect(meIndex).not.toMatch(/app\.patch\(\s*["']\/profile/);
    // /me 直下も同様
    expect(meIndex).not.toMatch(/app\.put\(\s*["']\//);
    expect(meIndex).not.toMatch(/app\.patch\(\s*["']\//);
  });

  it("#6: apps/web 配下に D1Database / @ubm-hyogo/api/repository の直接 import が存在しない", () => {
    const FORBIDDEN = [
      /from\s+["']@cloudflare\/workers-types["']/,
      /from\s+["']@ubm-hyogo\/api\/repository/,
      /from\s+["'].*apps\/api\/src\/repository/,
    ];
    const violations: string[] = [];

    const walk = (dir: string) => {
      let entries: string[];
      try {
        entries = readdirSync(dir);
      } catch {
        return;
      }
      for (const name of entries) {
        if (name === "node_modules" || name === ".next") continue;
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) {
          walk(p);
        } else if (/\.(ts|tsx|mjs|js)$/.test(name)) {
          // boundary 検査自身を例外扱い（forbidden token を文字列として含む）
          if (p.includes("__tests__/boundary.test.ts")) continue;
          const content = readFileSync(p, "utf8");
          for (const re of FORBIDDEN) {
            if (re.test(content)) {
              violations.push(`${p} :: ${re}`);
            }
          }
        }
      }
    };
    walk(WEB_SRC);
    walk(WEB_APP);
    expect(violations).toEqual([]);
  });
});
