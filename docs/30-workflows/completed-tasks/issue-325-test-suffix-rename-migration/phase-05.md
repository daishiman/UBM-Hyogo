# Phase 5: データモデル / fixed list 正規化 / config glob の AST 表現

## 目的

Phase 2 で凍結する 132 件の rename mapping を「データ構造として」確定し、Phase 4 の I/O 契約を TypeScript 型 / JSON Schema レベルで表現する。併せて vitest / package.json / lefthook / GitHub Actions の glob 設定を「AST 的」に表現し、移行前後の差分を擬似 diff として提示する。本タスクは新規ロジック実装を含まないため、ここでは「実装すべき型」ではなく「Phase 6 以降の rename / config 同期で機械的検証に使える正規化形」を定義する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| implementation_mode | refactor-rename-only |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |

## 1. RenameEntry / RenameManifest 型定義

```ts
/** 4 分類 suffix。unit のみ中間 suffix なし。 */
export type SuffixClass = "contract" | "authz" | "repository" | "unit";

/** 132 ファイル中の 1 件分の rename 指示。 */
export interface RenameEntry {
  /** repo root からの相対パス。例: "apps/api/src/routes/admin/attendance.test.ts" */
  oldPath: string;
  /** 同 dirname のまま basename のみ書き換えた新パス。
   *  例: "apps/api/src/routes/admin/attendance.contract.spec.ts" */
  newPath: string;
  /** Phase 2 fixed list で凍結された 4 分類のいずれか。 */
  suffixClass: SuffixClass;
  /** 分類根拠の 1 行 justification。例: "HTTP route under apps/api/src/routes/admin" */
  justification: string;
}

/** 132 件の rename manifest。順序は alphabetical (oldPath 昇順)。 */
export type RenameManifest = readonly RenameEntry[];
```

不変条件:

- `RenameManifest.length === 132`
- `dirname(oldPath) === dirname(newPath)`（rename は basename のみ）
- `oldPath` は `apps/api/src/` 直下に限定（`apps/web` / `packages` / `tests/e2e` / `scripts` を含めない）
- `oldPath.endsWith(".test.ts")` が常に真
- `newPath.endsWith(".spec.ts")` が常に真
- `Set(newPath).size === 132`（new path 重複禁止）
- 4 分類件数: contract=41 / authz=4 / repository=38 / unit=49（合計 132）
- justification は空文字列を許可しない（必ず分類根拠を 1 行書く）

## 2. fixed list 正規化ルール

Phase 2 で fixed list を凍結する際の **正規化アルゴリズム**を確定する。Phase 6 以降は本ルールに沿って機械生成された CSV を「凍結結果」として扱い、人間判断は分類エッジケース（後述）でのみ介入する。

### 2.1 stem 抽出

```ts
function extractStem(oldBasename: string): string {
  // "attendance.test.ts" → "attendance"
  // "attendance.contract.test.ts" → "attendance.contract"   ← 中間 suffix を温存
  // "rate-limit-magic-link.test.ts" → "rate-limit-magic-link"
  if (!oldBasename.endsWith(".test.ts")) throw new Error("not a test file");
  return oldBasename.slice(0, -".test.ts".length);
}
```

### 2.2 newPath 生成

```ts
function buildNewBasename(stem: string, cls: SuffixClass): string {
  switch (cls) {
    case "contract":   return `${stripTrailing(stem, "contract")}.contract.spec.ts`;
    case "authz":      return `${stripTrailing(stem, "authz")}.authz.spec.ts`;
    case "repository": return `${stripTrailing(stem, "repository")}.repository.spec.ts`;
    case "unit":       return `${stem}.spec.ts`;
  }
}

/** stem 末尾が既に `.<seg>` で終わっていれば 1 度だけ剥がす。重複付与防止。
 *  例: stripTrailing("attendance.contract", "contract") === "attendance" */
function stripTrailing(stem: string, seg: string): string {
  return stem.endsWith(`.${seg}`) ? stem.slice(0, -(seg.length + 1)) : stem;
}
```

> **既存中間 suffix の取り扱い**: `*.contract.test.ts` / `*.repository.test.ts` / `*.authz.test.ts` のように既に分類が basename に含まれているファイルは、`stripTrailing` で重複を解消したうえで suffix を付け直す。Phase 2 fixed list ではこの処理結果を pre-compute し、CSV 上で `oldPath, newPath` が常に一意になることを保証する。

### 2.3 分類判定（決定木）

`oldPath` から `suffixClass` を一意決定する優先順位:

1. **repository**: パスに `/repository/` を含む → `repository`
2. **authz**: 以下のいずれかにマッチ → `authz`
   - `apps/api/src/__tests__/authz-matrix.test.ts`
   - `apps/api/src/middleware/require-admin.test.ts`
   - `apps/api/src/middleware/me-session-resolver.test.ts`
   - `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts`
   - 除外: `apps/api/src/routes/auth/session-resolve.test.ts` は route handler contract として contract に分類する
3. **contract**: 以下のいずれか → `contract`
   - パスに `/routes/` を含む（ただし上記 authz 例外を除く）
   - パスに `/sync/` を含み basename に `-route` を含む
   - `apps/api/src/health-db.test.ts`
   - `apps/api/src/audit-correlation/__tests__/{contract,run-route}.test.ts`
4. **unit**: 上記いずれにも該当しない残り全件

優先順位は **上から評価して最初に true となった枝を採用**。authz は contract より strict 列挙のため、必ず先に判定する。

## 3. RenameMappingCSV schema（Phase 4 I/O 契約の正規化版）

`outputs/phase-11/rename-mapping.csv` のヘッダ + 1 行スキーマ:

```csv
old_path,new_path,suffix_class,justification
apps/api/src/routes/admin/attendance.test.ts,apps/api/src/routes/admin/attendance.contract.spec.ts,contract,"HTTP route under apps/api/src/routes/admin"
```

JSON Schema（CI 検証用・参考実装としてここに置く・実コード化は不要）:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RenameMappingRow",
  "type": "object",
  "required": ["old_path", "new_path", "suffix_class", "justification"],
  "additionalProperties": false,
  "properties": {
    "old_path":       { "type": "string", "pattern": "^apps/api/src/.+\\.test\\.ts$" },
    "new_path":       { "type": "string", "pattern": "^apps/api/src/.+\\.spec\\.ts$" },
    "suffix_class":   { "enum": ["contract", "authz", "repository", "unit"] },
    "justification":  { "type": "string", "minLength": 1 }
  }
}
```

CSV 全体に対する不変条件:

- 行数 = 132 + 1（ヘッダ）
- `old_path` 列に重複なし
- `new_path` 列に重複なし
- `suffix_class` 別件数 = `{contract:41, authz:4, repository:38, unit:49}`
- `dirname(old_path) === dirname(new_path)` を全行満たす

## 4. config glob の AST 表現

Phase 2 で抽出した既存 glob inventory と、Phase 3 で確定した移行戦略「`*.spec.ts` 単独へ収束」に基づき、各 config の **編集前後** を AST 的に提示する。Phase 6 はこの AST 差分を擬似 diff として実装する。

### 4.1 vitest.config.ts (root)

現状抽出（Phase 2 evidence で確定する値の想定形）:

```ts
test: {
  include: [
    "apps/**/src/**/*.test.{ts,tsx}",
    "apps/**/app/**/*.test.{ts,tsx}",
    "apps/**/migrations/**/*.test.ts",
    "packages/**/src/**/*.test.{ts,tsx}",
    "scripts/**/*.test.ts",
  ],
  coverage: {
    exclude: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      // ...
    ],
  },
}
```

移行後ターゲット（**`*.spec.ts` 単独**へ収束。`apps/web` / `packages` / `scripts` 配下は本タスク対象外のため、glob は `*.{test,spec}.ts` 両許容を一旦残し、本タスクで rename した `apps/api` 配下が `*.spec.ts` だけで拾える状態にする）:

```ts
test: {
  include: [
    "apps/api/**/src/**/*.spec.{ts,tsx}",       // ← apps/api 専用 line を spec.ts 単独に固定
    "apps/web/**/src/**/*.test.{ts,tsx}",       // ← scope out のため据え置き
    "apps/**/app/**/*.{test,spec}.{ts,tsx}",
    "apps/**/migrations/**/*.{test,spec}.ts",
    "packages/**/src/**/*.{test,spec}.{ts,tsx}",
    "scripts/**/*.{test,spec}.ts",
  ],
  coverage: {
    exclude: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      // ...（変更なし。両 suffix を exclude 対象として残す）
    ],
  },
}
```

不変条件:

- include 行数は変えてもよいが、`apps/api/**/src/**` を **唯一の `*.spec.ts` 単独行**として明示する
- coverage.exclude は `*.test.{ts,tsx}` と `*.spec.{ts,tsx}` を **両方**残す（apps/web / packages 側 rename が完了するまで両許容）
- `coverage.include` は変更しない（本タスクは内容差分ゼロ）

### 4.2 apps/api/package.json scripts

現状:

```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts apps/api"
  }
}
```

移行後: **glob 直書きがないため変更不要**。`apps/api` を引数に渡しているだけで、include 解決は root vitest.config.ts に委譲されている。Phase 7 でこの構造を再確認し、必要があれば 4.1 だけで完結する。

### 4.3 lefthook.yml

現状の `pre-commit` / `pre-push` には test path filter なし（`coverage-guard.sh --changed` が内部で git の changed 判定を行う）。

移行後: **glob 直書きがないため変更不要**。Phase 7 で `scripts/coverage-guard.sh` 側の glob を grep 確認し、`*.test.ts` を path フィルタしている箇所があれば `*.{test,spec}.ts` または `*.spec.ts` に追従する。

### 4.4 .github/workflows/

主要 workflow:

| workflow | 対応 |
| --- | --- |
| `ci.yml` / `pr-build-test.yml` / `backend-ci.yml` | `pnpm --filter @ubm-hyogo/api test` を呼ぶだけなら glob 直書きなし → 変更不要 |
| `verify-indexes.yml` | apps/api test 非対象 → 変更不要 |
| その他（`audit-correlation-verify.yml` 等） | step 内で `*.test.ts` を grep / path フィルタしている場合のみ追従。Phase 2 evidence で grep 結果を凍結 |

不変条件:

- workflow yaml に `*.test.ts` の **literal 文字列**が含まれていれば編集対象
- 含まれていなければ「変更不要」と Phase 11 evidence に明記

## 5. 擬似 diff（Phase 6 で実適用する編集の AST 表現）

```diff
--- vitest.config.ts (before)
+++ vitest.config.ts (after)
@@ test.include @@
-    "apps/**/src/**/*.test.{ts,tsx}",
+    "apps/api/**/src/**/*.spec.{ts,tsx}",
+    "apps/web/**/src/**/*.{test,spec}.{ts,tsx}",
     "apps/**/app/**/*.test.{ts,tsx}",
     "apps/**/migrations/**/*.test.ts",
     "packages/**/src/**/*.test.{ts,tsx}",
     "scripts/**/*.test.ts",
```

> apps/web / migrations / packages / scripts 行は **両許容 (`{test,spec}`)** に変えるか **据え置き**するかを Phase 7 で確定する。原則「scope out 範囲は触らない」に従い据え置き、`apps/api` 行のみ単独行として独立させる方針を初期案とする。

## 6. coverage exclude / include の不変条件

| 項目 | rename 前 | rename 後 | 差分 |
| --- | --- | --- | --- |
| `coverage.include` | `apps/**/src/**/*.{ts,tsx}` 等 | 同上 | 0（path pattern は src 全体のため suffix 影響なし） |
| `coverage.exclude` | `**/*.test.{ts,tsx}` + `**/*.spec.{ts,tsx}` | 同上 | 0（両許容を維持） |
| 閾値 | 既存値 | 既存値 | 0 |
| 件数（収集対象 src ファイル） | N | N | 0 |
| coverage 値（line/branch/func/stmt） | V | V | 0（rename は src 内容を変えないため） |

→ rename 前後で coverage delta = 0% を Phase 11 evidence に reporter 出力で記録する。

## 7. ADR ドキュメント schema

`outputs/phase-12/test-file-suffix-adr.md` の章立てを確定する:

```
# ADR-NNN: apps/api テストファイル suffix 規約

## ステータス
Accepted (2026-05-09)

## 背景
- 08a タスクで suffix 規約を導入したが、既存 132 ファイルが旧 *.test.ts のままであった
- suite 種別がファイル名から判別できず、レビュー時に test 種別を読み取るために本文を開く必要があった

## 規約
1. apps/api/src/**/*.spec.ts に 4 種 suffix を採用
2. <stem>.contract.spec.ts / <stem>.authz.spec.ts / <stem>.repository.spec.ts / <stem>.spec.ts (unit)
3. dirname は変更しない

## 4 分類定義と判定基準
- contract: HTTP route / OpenAPI 契約 / route ハンドラ統合
- authz: 認可境界 / セッション解決 / require-admin / rate-limit (auth 系)
- repository: D1 / KV アクセス層
- unit: それ以外（utils / services / use-cases / view-models / schemas / jobs / workflows / 純関数）

## 例外規定
- E2E (tests/e2e/) は対象外（既に *.spec.ts 命名）
- apps/web / packages 側は別タスクで段階移行
- 1 ファイルが複数 suite を持つ場合は contract > authz > repository > unit の優先順位で suffix を 1 つに決める

## 既存中間 suffix (例: *.contract.test.ts) の取り扱い
- 重複付与しないよう stripTrailing 正規化を適用
- *.contract.test.ts → *.contract.spec.ts に 1:1 変換

## 後続 task の正本化方針
- 新規 test 追加時は本 ADR の 4 分類に必ず従う
- レビュー時 reviewer は basename suffix で suite 種別を即時判定する
- apps/web / packages 側の rename は別 issue で本 ADR を引用して実施
```

## 完了条件チェック

- [ ] `RenameEntry` / `RenameManifest` 型定義 + 不変条件を確定
- [ ] fixed list 正規化アルゴリズム（stem 抽出 / newPath 生成 / 分類決定木）を確定
- [ ] RenameMappingCSV JSON Schema を確定
- [ ] 4 種 config の AST 表現 + 移行前後 + 擬似 diff を提示
- [ ] coverage exclude/include 不変条件（delta=0）を確定
- [ ] ADR ドキュメント schema（章立て）を確定

## 出力

- `phase-05.md`

## 参照資料

- `index.md`
- `phase-02.md`（fixed list 凍結）
- `phase-03.md`（glob 移行戦略）
- `phase-04.md`（I/O 契約）
- `vitest.config.ts`（root）
- `apps/api/package.json`
- `lefthook.yml`
- `.github/workflows/*.yml`

## 統合テスト連携

- Phase 9 では本データモデルに対する単体テストは追加しない（rename タスクのため）
- 代わりに Phase 11 で CSV / config diff を evidence として記録し、Phase 7 整合性検証で本 schema との一致を確認する

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 の成果物を上流契約として参照する。
