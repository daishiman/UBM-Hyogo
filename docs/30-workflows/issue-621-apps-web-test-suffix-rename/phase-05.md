# Phase 5: データモデル / fixed list 正規化 / config glob の AST 表現

## 目的

Phase 2 で凍結する 70 件の rename mapping を「データ構造として」確定し、Phase 4 の I/O 契約を TypeScript 型 / JSON Schema レベルで表現する。併せて `apps/web/package.json:19` / root `vitest.config.ts` / `lefthook.yml` / `.github/workflows/*.yml` の glob 設定を「AST 的」に表現し、移行前後の差分を擬似 diff として提示する。本タスクは新規ロジック実装を含まないため、ここでは「実装すべき型」ではなく「Phase 6 以降の rename / config 同期で機械的検証に使える正規化形」を定義する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. RenameEntry / RenameManifest 型定義

```ts
/** apps/web 専用 5 分類 suffix。lib-unit のみ中間 suffix なし。 */
export type AppsWebSuffixClass = "component" | "runtime" | "lib-unit";

/** 70 ファイル中の 1 件分の rename 指示。 */
export interface AppsWebRenameEntry {
  /** repo root からの相対パス。例:
   *  "apps/web/src/__tests__/tokens.test.ts"
   *  "apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx" */
  oldPath: string;
  /** 同 dirname のまま basename のみ書き換えた新パス。例:
   *  "apps/web/src/__tests__/tokens.runtime.spec.ts"
   *  "apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx" */
  newPath: string;
  /** Phase 2 fixed list で凍結された 5 分類のいずれか。 */
  suffixClass: AppsWebSuffixClass;
  /** 分類根拠の 1 行 justification。例: "React component test under apps/web/src/components" */
  justification: string;
}

/** 70 件の rename manifest。順序は alphabetical (oldPath 昇順)。 */
export type AppsWebRenameManifest = readonly AppsWebRenameEntry[];
```

### 不変条件

- `AppsWebRenameManifest.length === 70`
- `dirname(oldPath) === dirname(newPath)`（rename は basename のみ）
- `oldPath` は `apps/web/src/` 直下に限定（`apps/api` / `packages` / `tests/e2e` / `scripts` を含めない）
- `oldPath.endsWith(".test.ts") || oldPath.endsWith(".test.tsx")` が常に真
- `newPath.endsWith(".spec.ts") || newPath.endsWith(".spec.tsx")` が常に真
- 拡張子保持: `oldPath` が `.tsx` なら `newPath` も `.tsx`
- `Set(newPath).size === 70`（new path 重複禁止）
- 5 分類件数: component=36 / route=4 / page=1 / runtime=5 / lib-unit=24（合計 70・Phase 2 凍結値）
- justification は空文字列を許可しない
- 各分類の path 述語:
  - `suffixClass === "component"` → `oldPath.endsWith(".test.tsx")` かつ `newPath.endsWith(".component.spec.tsx")`
  - `suffixClass === "runtime"` → `oldPath` が `apps/web/src/__tests__/{build-output,instrumentation,instrumentation-client,static-invariants,tokens}.test.ts` のいずれか かつ `newPath.endsWith(".runtime.spec.ts")`
  - `suffixClass === "lib-unit"` → 上記以外 かつ `newPath.endsWith(".spec.ts")` （中間修飾子なし）

## 2. CSV ↔ TypeScript 相互変換契約

### CSV → RenameEntry

```ts
function parseRenameRow(row: string): AppsWebRenameEntry {
  const [oldPath, newPath, suffixClass, justification] = row.split(",");
  return {
    oldPath: oldPath.trim(),
    newPath: newPath.trim(),
    suffixClass: suffixClass.trim() as AppsWebSuffixClass,
    justification: justification.trim(),
  };
}
```

### 検証 predicate（仕様）

```ts
function isValidEntry(e: AppsWebRenameEntry): boolean {
  if (!e.oldPath.startsWith("apps/web/src/")) return false;
  if (!(e.oldPath.endsWith(".test.ts") || e.oldPath.endsWith(".test.tsx"))) return false;
  if (!(e.newPath.endsWith(".spec.ts") || e.newPath.endsWith(".spec.tsx"))) return false;
  if (dirname(e.oldPath) !== dirname(e.newPath)) return false;
  if (e.justification === "") return false;
  if (e.oldPath.endsWith(".tsx") !== e.newPath.endsWith(".tsx")) return false;
  // 分類別述語
  switch (e.suffixClass) {
    case "component":
      return e.oldPath.endsWith(".test.tsx") && e.newPath.endsWith(".component.spec.tsx");
    case "runtime":
      return /apps\/web\/src\/__tests__\/(build-output|instrumentation|instrumentation-client|static-invariants|tokens)\.test\.ts$/.test(e.oldPath)
        && e.newPath.endsWith(".runtime.spec.ts");
    case "lib-unit":
      return e.oldPath.endsWith(".test.ts") && e.newPath.endsWith(".spec.ts")
        && !e.newPath.endsWith(".runtime.spec.ts");
  }
}
```

## 3. config glob の AST 表現と擬似 diff

### 3.1 `apps/web/package.json:19` の `verify-design-tokens` script

#### Before

```json
{
  "scripts": {
    "verify-design-tokens": "vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.test.ts"
  }
}
```

#### After

```json
{
  "scripts": {
    "verify-design-tokens": "vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.runtime.spec.ts"
  }
}
```

#### 擬似 diff

```diff
-    "verify-design-tokens": "vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.test.ts"
+    "verify-design-tokens": "vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.runtime.spec.ts"
```

変更行数: 1 行のみ。

### 3.2 root `vitest.config.ts`

#### Before / After

`test.include` は既に `apps/**/src/**/*.{test,spec}.{ts,tsx}` で両許容のため **変更なし**。`coverage.exclude` も既に `**/*.spec.{ts,tsx}` を含むため変更なし。

擬似 diff: 空。

### 3.3 `lefthook.yml`

#### Before / After

`.test.` 直接参照ゼロ（事前 grep 確認）のため **変更なし**。擬似 diff: 空。

### 3.4 `.github/workflows/ci.yml:159` 周辺

#### Before（コメント）

```yaml
# job that includes apps/web build-output.test.ts validation
```

#### After

```yaml
# job that includes apps/web build-output.runtime.spec.ts validation
```

擬似 diff: コメント 1 行のみ追従。

### 3.5 その他 workflow

`.github/workflows/*.yml` 全体に対して `rg -n "apps/web.*\.test\."` を実行し、ヒットがあれば追従、なければ変更なし。事前調査では ci.yml のコメント以外ヒットなし。

## 4. evidence データモデル

### 4.1 `find-count-{before,after}.txt`

```
test=<integer> spec=<integer>
```

| ファイル | 期待値 |
| --- | --- |
| `find-count-before.txt` | `test=70 spec=17` |
| `find-count-after.txt` | `test=0 spec=87` |

### 4.2 `test-count-{before,after}.txt`

```
 Test Files  <integer> passed (<integer>)
      Tests  <integer> passed (<integer>)
```

before / after で完全一致（`diff` exit 0）が合格。

### 4.3 `git-rename-summary.log`

```
 rename apps/web/src/<old-path> => <new-path> (100%)
 ... × 70 行
```

`git log -1 --diff-filter=R --summary <commit-1-sha>` の出力。`R100`（類似度 100%）のみで `R<100`（変更を伴う rename）が無いことが合格。

## 5. AST 不変条件サマリ

| 不変条件 | 確認方法 |
| --- | --- |
| `RenameManifest.length === 70` | `wc -l outputs/phase-11/rename-mapping.csv` = 71（ヘッダ+70） |
| `Set(newPath).size === 70` | `awk -F, 'NR>1 {print $2}' rename-mapping.csv \| sort \| uniq -d` 出力 0 行 |
| 拡張子保持 | `awk -F, 'NR>1 { ... }' で oldPath/newPath 拡張子一致 check` |
| dirname 同一 | 同上 |
| 分類別述語 | §2 検証 predicate を適用 |
| package.json 1 行のみ変更 | `git diff <commit-2-sha>~..<commit-2-sha> -- apps/web/package.json \| grep '^[+-]' \| wc -l` ≤ 6（diff context 含む） |

## 完了条件チェック

- [ ] `AppsWebRenameEntry` / `AppsWebRenameManifest` 型が定義されている
- [ ] 不変条件 8 項目（length / dirname / 拡張子 / Set unique / 件数 / justification / 分類別 path 述語 / 拡張子保持）が列挙されている
- [ ] CSV → RenameEntry 変換契約が記述されている
- [ ] `apps/web/package.json:19` の擬似 diff が記述されている
- [ ] `vitest.config.ts` / `lefthook.yml` / `.github/workflows` の変更要否が判定されている
- [ ] evidence データモデル 5 種（find-count / test-count / git-rename-summary）の形式が定義されている
