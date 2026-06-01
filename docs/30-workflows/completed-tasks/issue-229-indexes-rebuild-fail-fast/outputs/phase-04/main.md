# Phase 4 成果物: テスト戦略（TDD Red）

## 前提

CLI 実行ガード（`import.meta.url` 判定）+ 純粋関数 export 化が TC-01〜TC-06 の前提。これが無いと import で `main()` が走り本物の index を書き換える（TC-06 の検証対象）。

## テスト配置・隔離

| 項目 | 値 |
| --- | --- |
| ファイル | `scripts/__tests__/generate-index-fail-fast.spec.ts`（`.spec.ts` のみ・root vitest glob） |
| import | `../../.claude/skills/aiworkflow-requirements/scripts/generate-index.js` の named export |
| 隔離 | `os.tmpdir()` + `mkdtempSync`、`afterEach` で `rmSync` |
| 失敗注入 | `vi.spyOn(fsp, "writeFile" / "rename" / "readFile")` を reject |

## TC 一覧（RED）

| TC | 対象 AC | 対象関数 | 期待値 | 失敗注入 |
| --- | --- | --- | --- | --- |
| TC-01 | AC-2 | `writeFileAtomic` | tmp→rename で本ファイルに書き、`.tmp` を残さない | なし（happy） |
| TC-02 | AC-2/AC-1 | `writeAllIndexesAtomic` | 途中失敗で本ファイル群不変・tmp 0 | writeFile を 2 回目で reject |
| TC-03 | AC-3 | `writeAllIndexesAtomic` | Error.message が `[generate-index] aiworkflow-requirements / <index> (<step>) 失敗: ...` | spy reject + format assert |
| TC-04 | AC-5 | `extractHeadings` | ENOENT は `[]` で継続 | 不在パス or readFile ENOENT reject |
| TC-05 | AC-5/AC-1 | `extractHeadings` | EACCES 等は context 付き throw | readFile EACCES reject |
| TC-06 | AC-7/AC-1 | CLI ガード | import で `main()` の書き込み副作用が走らない | import のみ・書き込み spy 0 確認 |
| TC-07 | AC-4 | CLI 経路全体 | `git diff --quiet -- indexes` exit 0（byte-identical） | なし（回帰） |

## describe/it 構造案

```ts
describe("generate-index fail-fast", () => {
  describe("writeFileAtomic", () => { it("TC-01: tmp→rename / .tmp 残さない", ...); });
  describe("writeAllIndexesAtomic", () => {
    it("TC-02: 途中失敗で本ファイル不変・tmp 0", ...);
    it("TC-03: decisive log format", ...);
  });
  describe("extractHeadings", () => {
    it("TC-04: ENOENT 空継続", ...);
    it("TC-05: その他 throw", ...);
  });
  describe("CLI 実行ガード", () => { it("TC-06: import 副作用 0", ...); });
  describe("byte-identical 回帰", () => { it("TC-07: drift 0", ...); });
});
```

## カバレッジ目標（仕様レベル）

- AC-1: TC-02 / TC-03 / TC-05 / TC-06 の throw 伝播
- AC-2: TC-01 + TC-02
- AC-3: TC-03 の format 逐語 assert
- AC-5: TC-04（ENOENT）+ TC-05（その他）の両分岐
- AC-7: TC-06 + TC-01〜TC-05 の存在
- AC-4: TC-07 の `git diff --quiet`

## 委譲境界

実 spec.ts の作成・実走は今回の実装サイクル（Phase 5 / Phase 11）に委ねる。本 Phase は仕様化のみ。
