# テストフィクスチャ規約（`.fixture` 拡張子戦略）

skill-creator の vitest テスト（`scripts/__tests__/`）が使うフィクスチャ命名規約と、ヘルパー仕様。

## 背景

- `scripts/__tests__/fixtures/<case>/SKILL.md` をリポジトリにコミットすると、Codex CLI / Claude Code の skill discovery がフィクスチャを「実スキル」として誤認識し、`scripts/quick_validate.js` の対象としてもピックアップされる。
- フィクスチャは意図的に invalid な YAML や境界値（≥1024文字 description, 64文字 name 等）を含むため、リポジトリに `SKILL.md` のまま残すと永続的に warning/error を出す。
- ⇒ フィクスチャは `SKILL.md.fixture` 拡張子で配置し、テスト実行時のみ `SKILL.md` に展開する。

## 命名規約

| 種別 | パス | コミット対象 |
| --- | --- | --- |
| フィクスチャ正本 | `scripts/__tests__/fixtures/<case>/SKILL.md.fixture` | ✅ コミットする |
| 一時展開ファイル | `scripts/__tests__/fixtures/<case>/SKILL.md` | ❌ コミット禁止（`.gitignore` 推奨） |
| 補助ファイル（schemas / agents / references 配下） | 通常通り `*.md` / `*.json` | ✅ コミットする |

> ルール: フィクスチャディレクトリ直下の `SKILL.md` という名前のファイルを成果物に残さない。サブディレクトリの `references/foo.md` 等は問題ない。

## ヘルパー仕様（`scripts/__tests__/helpers/load-fixture.js`）

```js
import { loadFixture } from "./helpers/load-fixture.js";

const { dir, cleanup } = loadFixture("valid-skill");
try {
  // dir/SKILL.md がテスト中だけ存在する
  const result = quickValidate(dir);
  expect(result.errors).toHaveLength(0);
} finally {
  cleanup(); // dir/SKILL.md を削除し、リポジトリ状態を復元
}
```

API:

| 名前 | 型 | 説明 |
| --- | --- | --- |
| `loadFixture(name)` | `(name: string) => { dir: string, cleanup: () => void }` | `fixtures/<name>/SKILL.md.fixture` を `fixtures/<name>/SKILL.md` にコピーし、cleanup 関数を返す。`SKILL.md.fixture` が存在しない場合（`empty-skill-md` 等）も cleanup を返す |
| `dir` | `string` | フィクスチャディレクトリの絶対パス |
| `cleanup()` | `() => void` | 一時 `SKILL.md` を削除する。エラー時にも必ず呼ぶ（`try/finally` 推奨） |

## テスト記述パターン

```js
import { describe, it, expect, afterEach } from "vitest";
import { loadFixture } from "./helpers/load-fixture.js";

describe("quick_validate", () => {
  let cleanups = [];
  afterEach(() => {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  });

  it("detects long description", () => {
    const { dir, cleanup } = loadFixture("long-description");
    cleanups.push(cleanup);
    const result = quickValidate(dir);
    expect(result.errors).toContainEqual(expect.objectContaining({ rule: "R-04" }));
  });
});
```

## 新規フィクスチャ追加手順

1. `scripts/__tests__/fixtures/<new-case>/` を作成
2. `SKILL.md.fixture` をそこに配置（`SKILL.md` という名前にしない）
3. 必要に応じて `references/` / `agents/` / `schemas/` サブディレクトリを通常通り配置
4. テストで `loadFixture("<new-case>")` を呼び、必ず `cleanup()` する
5. `node scripts/quick_validate.js .claude/skills/skill-creator` を実行し、フィクスチャが skill discovery に拾われていないことを確認

## 既存フィクスチャ一覧

`scripts/__tests__/fixtures/` 配下の `<case>/SKILL.md.fixture` がフィクスチャ正本。invalid YAML / 境界値 / forbidden file 等を網羅。詳細は `codex_validation.test.js` / `quick_validate.test.js` のテストケース定義を参照。

## 変更履歴

| Version | Date | Changes |
| ------- | ---- | ------- |
| 1.0.0 | 2026-04-28 | 初版作成（`.fixture` 拡張子戦略の正本化、loadFixture ヘルパー仕様策定） |
