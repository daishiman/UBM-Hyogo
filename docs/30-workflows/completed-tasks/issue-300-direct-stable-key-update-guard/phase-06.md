[実装区分: 実装仕様書]

# Phase 6: spec / fixture 実装 + coverage gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-06/main.md` |

## 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `scripts/lint-stable-key-update.spec.ts` | new | vitest spec |
| `scripts/__fixtures__/stable-key-update-lint/violation-sql-update.ts` | new | TC-01 fixture |
| `scripts/__fixtures__/stable-key-update-lint/violation-drizzle-update.ts` | new | TC-02 fixture |
| `scripts/__fixtures__/stable-key-update-lint/violation-multiline-sql.ts` | new | TC-03 fixture |
| `scripts/__fixtures__/stable-key-update-lint/violation-camelcase-set.ts` | new | TC-04 fixture |
| `scripts/__fixtures__/stable-key-update-lint/allowed-read.ts` | new | TC-05 fixture |
| `scripts/__fixtures__/stable-key-update-lint/allowed-alias-update.ts` | new | TC-06 fixture |

## spec 構造（疑似コード）

```ts
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SCRIPT = join(__dirname, "lint-stable-key-update.mjs");
const FIX = (name: string) =>
  join(__dirname, "__fixtures__", "stable-key-update-lint", name);

function run(args: string[]): { exitCode: number; stdout: string } {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], { encoding: "utf8" });
    return { exitCode: 0, stdout };
  } catch (e: any) {
    return { exitCode: e.status ?? 1, stdout: e.stdout?.toString() ?? "" };
  }
}

describe("lint-stable-key-update", () => {
  it("TC-01: SQL UPDATE schema_questions SET stable_key を検出", () => {
    const { stdout } = run(["--include", FIX("violation-sql-update.ts"), "--json"]);
    const r = JSON.parse(stdout);
    expect(r.violations.some((v: any) => v.detector === "sql-direct-update")).toBe(true);
  });

  it("TC-02: drizzle .update(schemaQuestions).set({stableKey}) を検出", () => {
    const { stdout } = run(["--include", FIX("violation-drizzle-update.ts"), "--json"]);
    const r = JSON.parse(stdout);
    expect(r.violations.some((v: any) => v.detector === "builder-update")).toBe(true);
  });

  it("TC-03: multiline SQL を検出", () => { /* ... */ });
  it("TC-04: stableKey camelCase set を検出", () => { /* ... */ });
  it("TC-05: SELECT only は通過", () => { /* expect 0 violations */ });
  it("TC-06: schema_aliases への UPDATE は通過", () => { /* expect 0 violations */ });

  it("TC-09: --strict + violation で exit 1", () => {
    const { exitCode } = run(["--strict", "--include", FIX("violation-sql-update.ts")]);
    expect(exitCode).toBe(1);
  });

  it("TC-10: warning mode (default) は exit 0", () => {
    const { exitCode } = run(["--include", FIX("violation-sql-update.ts")]);
    expect(exitCode).toBe(0);
  });

  it("TC-11: 失敗メッセージに schema_aliases と /admin/schema/aliases を含む", () => {
    const { stdout } = run(["--include", FIX("violation-sql-update.ts")]);
    expect(stdout).toMatch(/schema_aliases/);
    expect(stdout).toMatch(/\/admin\/schema\/aliases/);
  });

  it("TC-12: --json は parse 可能", () => {
    const { stdout } = run(["--include", FIX("violation-sql-update.ts"), "--json"]);
    expect(() => JSON.parse(stdout)).not.toThrow();
  });
});
```

## fixture 仕様（例）

### `violation-sql-update.ts`

```ts
// Intentionally a violation. DO NOT IMPORT.
export const sql = "UPDATE schema_questions SET stable_key = ? WHERE question_id = ?";
```

### `violation-drizzle-update.ts`

```ts
declare const db: any;
declare const schemaQuestions: any;
export async function bad() {
  await db.update(schemaQuestions).set({ stableKey: "x" });
}
```

### `violation-multiline-sql.ts`

```ts
export const sql = `
  UPDATE schema_questions
     SET stable_key = ?
   WHERE question_id = ?
`;
```

### `violation-camelcase-set.ts`

```ts
declare const db: any;
declare const schemaQuestions: any;
declare const stableKey: string;
export async function bad() {
  await db.update(schemaQuestions).set({ stableKey });
}
```

### `allowed-read.ts`

```ts
export const sql = "SELECT stable_key FROM schema_questions WHERE question_id = ?";
```

### `allowed-alias-update.ts`

```ts
// schema_aliases への更新は本 guard の対象外
export const sql = "UPDATE schema_aliases SET stable_key = ? WHERE question_id = ?";
```

## coverage gate

- `mise exec -- pnpm test -- scripts/lint-stable-key-update.spec.ts` を実行
- `bash scripts/coverage-guard.sh --no-run` boundary evidence を Phase 11 に保存
- workspace standard tier（Lines/Functions/Statements/Branches >= 80%）に整合

## DoD

- [ ] vitest 12 ケース全 PASS
- [ ] coverage-guard exit 0
- [ ] fixture が `scripts/__fixtures__/stable-key-update-lint/` 配下に物理配置済（EXCEPTION で通常 scan 除外）

## 次Phase

Phase 7（CI workflow / lefthook / package.json 統合）
