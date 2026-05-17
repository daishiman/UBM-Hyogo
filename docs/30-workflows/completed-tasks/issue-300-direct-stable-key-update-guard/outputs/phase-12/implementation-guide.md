[実装区分: 実装仕様書]

# Implementation Guide — direct stable_key update guard

## Part 1: 中学生レベル（概念説明）

### `schema_questions.stable_key` の直接書き換え禁止ガードとは何か

#### 日常生活での例え

学校の名簿で「席番号」と「名前」を 1 対 1 で固定して使うとします。
名簿の「席番号」を、後から先生が手書きで上書きしてしまうと、
昨日まで席番号 5 番だった田中さんが、今日は別の人になってしまい、
過去の出席記録と整合が取れなくなります。

たとえば、保健室から「席番号 5 番の生徒の体温記録を見せて」と頼まれたとき、
書き換えが行われていると「いつ時点の席番号 5 番か」が分からなくなって困ります。

このタスクで作るガード（仕組み）は、その「席番号の直接書き換え」を
コードに混入させないための **見張り役** です。
書き換えたい場合は専用の「別名表」（`schema_aliases`）に書く決まりにします。

#### この機能でできること

| 機能 | 説明 | 例 |
|------|------|-----|
| SQL の UPDATE 文を検出 | `UPDATE schema_questions SET stable_key` を含む文を見つける | `db.prepare("UPDATE schema_questions SET stable_key = ?")` |
| ORM の builder を検出 | `.update(schemaQuestions).set({ stableKey })` を見つける | drizzle スタイル |
| 例外を許す | migrations やテストデータは見逃す | `migrations/0001_init.sql` |
| エラー表示 | どこを直すべきかメッセージで教える | 「`schema_aliases` に書いてください」 |

#### 専門用語セルフチェック

| 用語 | 説明 |
|------|------|
| 正規表現 | 文字列パターンを表す書き方 |
| EXCEPTION_GLOBS | 例外として無視するファイルの場所リスト |
| guard script | CI で間違いを検出して止めるスクリプト |
| pre-commit hook | git commit する直前に自動実行される検査 |
| `schema_aliases` | stableKey の別名解決を記録する専用テーブル |

---

## Part 2: 開発者・技術者レベル

### Current contract

- `schema_questions.stable_key` の alias 解決は `schema_aliases` テーブル経由
- 不変条件 #14: schema 変更の人手解決は `/admin/schema` 系 workflow へ集約
- 既存 `scripts/lint-stablekey-literal.mjs` は「stableKey 文字列リテラル直書き」を検出（**本タスクとは責務が異なる**）

### Target delta

| 項目 | Before | After |
| --- | --- | --- |
| guard script | なし | `scripts/lint-stable-key-update.mjs`（Detector 1/2/3） |
| CI workflow | なし | `.github/workflows/verify-stable-key-update.yml` |
| lefthook pre-commit | `block-test-suffix` ほか | `block-stable-key-update` 追加 |
| `package.json` `lint` chain | `lint-stablekey-literal` まで | `lint-stable-key-update --strict` 直列追加 |
| `package.json` scripts | — | `lint:stable-key-update` / `lint:stable-key-update:strict` 追加 |
| dead code | `updateStableKey()` 残存 | 削除（lines 153-172） |
| docs | — | `database-implementation-core.md` § Schema Alias Resolution Contract に Static guard セクション |

### 型 / シグネチャ / 入出力

```ts
type Severity = "error" | "warning";
type Violation = {
  file: string;          // repoRoot からの posix 相対パス
  detector: "sql-direct-update" | "builder-direct-update" | "function-direct-update";
  line: number;
  col: number;
  snippet: string;       // 最大 80 文字の matched snippet
  severity: Severity;
};
```

- 入力: `scripts/lint-stable-key-update.mjs --strict|--json|--include <csv>`
- 出力（text mode）: 1 violation あたり 2 行（path:line:col / 重大度 / detector / snippet / 誘導文）
- 出力（json mode）: `{ mode, scanned, violations: Violation[] }`
- 副作用: stdout 出力のみ。`--strict` + error 1 件以上で `process.exit(1)`

### Detector 詳細

| ID | regex | severity | 目的 |
| --- | --- | --- | --- |
| sql-direct-update | schema-qualified / quoted `UPDATE schema_questions ... SET stable_key` representative regex | error | multiline SQL / template literal を含む直接 UPDATE 検出 |
| builder-direct-update | `/\.update\(\s*schemaQuestions\s*\)[\s\S]{0,500}?\.set\(\s*\{[\s\S]{0,400}?\b(stable_key\|stableKey)\b/` | error | drizzle 等の builder 呼び出し |
| function-direct-update | `/\bupdateStableKey\s*\(/` | warning | 関数呼び出し名による mutation hint（false positive 余地のため warning 固定） |

### EXCEPTION_GLOBS

`migrations/` / `__fixtures__/` / `__tests__/` / `*.spec.{ts,tsx,mjs,js}` / `node_modules` / `.next` / `.open-next` / `coverage` / `dist` / `docs` / guard script 自身

### 失敗メッセージ template

```
[stable-key-update-lint] <N> error(s), <M> warning(s) detected (mode=error)
  <path>:<line>:<col> [error] sql-direct-update "<snippet>"
    -> direct schema_questions.stable_key mutation is forbidden; write aliases through schema_aliases / POST /admin/schema/aliases.
```

### エラー / エッジケース

- comment 内の `UPDATE schema_questions SET stable_key` → `stripComments` で空白化されて検出されない（意図通り）
- `UPDATE schema_aliases SET stable_key` → schema_aliases は対象外（テーブル名一致条件で除外）
- `.update(schemaAliases).set({ stable_key })` → builder regex は `schemaQuestions` 限定マッチで除外
- multiline で 400 / 160 文字の lookahead を超えて離れた `UPDATE` / `SET stable_key` → 検出漏れあり（future AST guard は要件化せず、必要になった時点で別タスク化）

### 設定可能パラメータ / 定数

- 環境変数: `STABLE_KEY_UPDATE_LINT_MODE=error` で `--strict` 相当
- CLI flag: `--strict` / `--json` / `--include <csv>`
- SCAN_ROOTS 定数: `["apps", "packages", "scripts"]`

### 使用例

```bash
# 全 scan（warning mode / exit 0 想定）
mise exec -- node scripts/lint-stable-key-update.mjs

# CI / pre-commit 用（exit 1 期待）
mise exec -- node scripts/lint-stable-key-update.mjs --strict

# 単一ファイル検査（fixture テスト用）
mise exec -- node scripts/lint-stable-key-update.mjs --include scripts/__fixtures__/stable-key-update-lint/violation-sql-update.ts --json
```

### Consumer Contract & IPC Compatibility

該当なし（IPC 変更なし）。
