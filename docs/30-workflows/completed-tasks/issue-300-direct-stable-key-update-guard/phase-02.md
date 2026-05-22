[実装区分: 実装仕様書]

# Phase 2: 設計（検出パターン / 例外 / 失敗メッセージ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-02/main.md` |

## 目的

guard script の検出ロジック、例外許可範囲、失敗メッセージ、CLI インターフェース、依存層を確定する。

## 検出パターン設計

### Detector 1: SQL 文字列直更新

正規表現（コメント除去後ソースに対して適用）:

```
/UPDATE\s+(?:(?:"?[A-Za-z_][\w$]*"?|`[A-Za-z_][\w$]*`)\s*\.\s*)?(?:"schema_questions"|`schema_questions`|schema_questions)[\s\S]{0,400}?SET[\s\S]{0,160}?(?:"stable_key"|`stable_key`|\bstable_key\b)/i
```

- multiline / template literal で分断されても `UPDATE` から table 400 文字、`SET` から column 160 文字以内なら検出
- `schema_questions` / `"schema_questions"` / `` `schema_questions` `` と、単純な schema-qualified form を検出
- コメントは `stripComments()` で空白化し、文字列 / template literal は検査対象に残す

### Detector 2: drizzle / query-builder style

正規表現:

```
/\.update\(\s*schemaQuestions\s*\)[\s\S]{0,500}?\.set\(\s*\{[\s\S]{0,400}?\b(stable_key|stableKey)\b/
```

- chained `.update(...).set({ stable_key / stableKey })` を検出
- shape は drizzle ORM の典型呼び出しに合わせる

### Detector 3: 関数経由 mutation（補助検出 / warning 固定）

- `updateStableKey(` 呼び出しを警告検出
- これは false-positive を起こしやすいので **warning 固定**（`--strict` でも error にしない）として AC-3 補強

## 例外許可（EXCEPTION_GLOBS）

```
/migrations/
/__fixtures__/
/__tests__/
\.spec\.(ts|tsx|mjs|js)$
/node_modules/
/\.next/
/\.open-next/
/coverage/
/dist/
```

`scripts/__fixtures__/stable-key-update-lint/` 配下のテスト fixture は例外でカバーされる。

## 失敗メッセージ仕様

```
[stable-key-update-lint] <N> violation(s) detected (mode=error|warning)
[stable-key-update-lint] <N> error(s), <M> warning(s) detected (mode=error|warning)
  <path>:<line>:<col> [<severity>] <detectorId> "<matched snippet>"
    -> direct schema_questions.stable_key mutation is forbidden; write aliases through schema_aliases / POST /admin/schema/aliases.
```

## CLI インターフェース

| 引数 | 効果 |
| --- | --- |
| `--strict` | violation 1 件以上で exit 1 |
| `--json` | JSON 出力 |
| `--include <csv>` | 検査対象を限定（fixture テスト用） |
| `STABLE_KEY_UPDATE_LINT_MODE=error` | `--strict` 同等 |

## ファイル / 依存層

| 層 | パス | 役割 |
| --- | --- | --- |
| script | `scripts/lint-stable-key-update.mjs` | Node 24 / ESM / 依存なし |
| spec | `scripts/lint-stable-key-update.spec.ts` | vitest |
| fixture | `scripts/__fixtures__/stable-key-update-lint/*.ts` | 検査対象サンプル |
| CI | `.github/workflows/verify-stable-key-update.yml` | push / PR で実行 |
| hook | `lefthook.yml` pre-commit | strict mode（fail-fast） |
| script invoker | `package.json` scripts | `lint:stable-key-update[:strict]` |
| docs | `database-implementation-core.md` § Schema Alias Resolution Contract | guard 実装パス追記 |

## dependency matrix

| モジュール | owner | co-owner |
| --- | --- | --- |
| `scripts/lint-stable-key-update.mjs` | 本タスク | future repository/AST guard 強化（必要時のみ） |
| `lefthook.yml` | 本タスク | task-git-hooks-lefthook-and-post-merge |
| `package.json` `scripts.lint` chain | 本タスク | 既存 lint 系タスク全般 |

## 統合テスト連携

Phase 4 で representative violation / allowed fixture を `scripts/__fixtures__/stable-key-update-lint/` に置き、`--include` 経由で対象限定する spec を Phase 6 で実装。

## 成果物

- `outputs/phase-02/main.md`

## 完了条件

- [ ] Detector 1/2/3 の regex が確定
- [ ] EXCEPTION_GLOBS が確定
- [ ] 失敗メッセージ template が確定
- [ ] CLI 引数仕様が確定
- [ ] dependency matrix の owner / co-owner 列が埋まっている

## 次Phase

Phase 3（設計レビュー）
