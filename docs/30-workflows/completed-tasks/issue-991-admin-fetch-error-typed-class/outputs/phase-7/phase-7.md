# Phase 7: カバレッジ確認 — AdminFetchError typed class

**[実装区分: 実装仕様書]**

> EMB-005-FB により小規模 NON_VISUAL では Phase 7 は軽量。FB-BEFORE-QUIT-002 準拠で
> 「全体カバレッジ %」ではなく **変更した関数 / ブロックに限定した局所カバレッジ**を目標とする。

## 1. 対象範囲（局所限定 / FB-BEFORE-QUIT-002）

カバレッジ目標の対象は本サイクルで変更・新規追加した次のブロックのみ。既存無関係コードの全体 % は対象外。

| # | 対象 | ファイル | 種別 |
| --- | --- | --- | --- |
| C-1 | `AdminFetchError` constructor（rawBody 分岐 / suffix / snippet スライス） | `apps/web/src/lib/admin/server-fetch.ts` | 新規 |
| C-2 | `isAdminFetchError`（3 分岐） | 同上 | 新規 |
| C-3 | `statusFromError`（構造化 / 正規表現 / null の 3 分岐） | `apps/web/src/lib/server-fetch/safe-fetch.ts` | 新規（抽出） |
| C-4 | `fetchAdmin` error path の throw 置換（rawBody read + `AdminFetchError` throw） | `apps/web/src/lib/admin/server-fetch.ts` | 修正 |

## 2. branch カバレッジ表（各 branch → 対応 TC）

### C-1: `AdminFetchError` constructor

| branch | 入力条件 | 対応 TC |
| --- | --- | --- |
| rawBody = null（responseBody 未指定） | `responseBody` 省略 | TC-AFE-07 / TC-AFE-12 |
| rawBody = null（responseBody: null 明示） | `responseBody: null` | TC-AFE-07 |
| rawBody = ""（空・falsy → suffix 抑止 / snippet="") | `responseBody: ""` | TC-AFE-08 |
| rawBody = 非空 ≤256（suffix そのまま） | `responseBody: "error code: 1042"` | TC-AFE-04 |
| rawBody = 非空 >256（message suffix を 256 で切る） | `"x".repeat(300)` | TC-AFE-05 |
| rawBody = 非空 >500（snippet を 500 で切る） | `"y".repeat(700)` | TC-AFE-06 |

### C-2: `isAdminFetchError`（3 分岐）

| branch | 入力 | 対応 TC |
| --- | --- | --- |
| `instanceof AdminFetchError` = true | `new AdminFetchError(...)` | TC-AFE-09 |
| `instanceof` false かつ `name === "AdminFetchError"` = true | name を付けた plain Error | TC-AFE-10 |
| いずれも false（通常 Error / 非 Error） | `new Error("boom")` / `"string"` / `null` | TC-AFE-11 |

### C-3: `statusFromError`（3 分岐）

| branch | 入力 | 対応 TC |
| --- | --- | --- |
| 構造化 status（整数）を採用 | `status: 404` を持つ Error | TC-SF-STATUS |
| 構造化 status が非整数 → 正規表現 fallback | `status: 3.14` / `NaN` | TC-SF-INT / TC-SF-INT2 |
| 構造化 status なし → 正規表現で抽出 / null | message-only Error（404 あり / なし） | TC-SF-FALLBACK（抽出成功）/ TC-SF-INT（message 数値なし → null → `_FAILED`） |

### C-4: `fetchAdmin` error path

| branch | 条件 | 対応 TC（既存回帰スペック） |
| --- | --- | --- |
| `res.text()` 成功 → rawBody 非空で throw | 404/500 + body | `server-fetch.binding.spec.ts:89/101`（byte-identical 回帰） |
| `res.text()` reject → rawBody=null で throw | text 例外 | TC-AFE-12（constructor 側で rawBody=null 経路を網羅。error path の null 受け渡しと同値） |
| 非prod 404 warn 分岐（不変） | status=404 / 非prod | 既存 spec で被覆（本サイクルで挙動変更なし） |

## 3. line / branch 100%（変更ブロックのみ）の根拠

- C-1 constructor: rawBody の `null / "" / 非空≤256 / 非空>256 / 非空>500` の全分岐に TC が 1 件以上対応（上表）。snippet と message suffix の独立スライスも TC-AFE-06 で両方 assert。→ line/branch 100%。
- C-2 guard: 3 分岐（instanceof / name / それ以外）に TC-AFE-09/10/11 が 1:1 対応。→ branch 100%。
- C-3 statusFromError: 3 分岐（構造化採用 / 非整数→fallback / message抽出・null）に TC-SF-STATUS / INT / INT2 / FALLBACK が対応。`Number.isInteger` の true/false 両側を踏む。→ branch 100%。
- C-4 error path: 成功時 byte-identical は既存 binding.spec で、reject 時の null 経路は TC-AFE-12 で被覆。404 warn は挙動不変のため既存被覆を流用。→ 変更行 line 100%。

> 全体プロジェクト % は計測対象外。`vitest run --coverage` を回す場合も評価は上記 4 ブロックの行/分岐に限定して読む（FB-BEFORE-QUIT-002）。

## 4. 計測コマンド（任意・局所読み）

```bash
mise exec -- pnpm exec vitest run --coverage \
  apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
# → server-fetch.ts の AdminFetchError/isAdminFetchError 行と safe-fetch.ts の statusFromError 行のみを確認する
```

## 完了条件（Phase 7）

- [x] 対象範囲を変更ブロック 4 件（C-1〜C-4）に限定明示（全体 % ではなく局所 / FB-BEFORE-QUIT-002）
- [x] constructor / isAdminFetchError / statusFromError / error path の各 branch を TC に 1:1 対応付け
- [x] 変更ブロックのみ line/branch 100% 目標の根拠を記述
- [x] 局所読みの計測コマンドを提示
