# Phase 7: scripts/coverage-merge.mjs 実装

## 変更対象

- `scripts/coverage-merge.mjs`（新規）
- `scripts/__tests__/coverage-merge.test.mjs`（新規, node --test）

## 仕様

### CLI

```bash
node scripts/coverage-merge.mjs \
  --inputs="apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json" \
  --output="apps/api/coverage"
```

### 入力

- `--inputs`: カンマ区切りの v8 `coverage-final.json` ファイルパス
- `--output`: 出力ディレクトリ（`coverage-final.json` と `coverage-summary.json` を書く）

### マージアルゴリズム

Vitest coverage reporter が出力する Istanbul 互換 JSON（`coverage-final.json`）を正本入力にする。V8 raw coverage ではない。

1. 各 input の JSON を読む（key = ファイルパス、value = Istanbul FileCoverage 互換 object）
2. 同一ファイルキーが両 input にある場合、`statementMap` / `fnMap` / `branchMap` は同一であることを前提に union
3. `s` / `f` / `b` の hit count を要素ごとに加算
4. `statementMap` 等の構造に差異がある場合は **WARN を出力して片側を採用**（同一 source の両 group 実行で構造が変わるのは v8 では稀）
5. merge 結果から `coverage-summary.json` を再算出（istanbul/v8 互換: lines/branches/functions/statements の total と pct）

### Exit code

- 0: 成功
- 1: input ファイル欠損 / JSON parse 失敗 / 構造致命的不整合
- 2: 引数不正

## test 仕様

`scripts/__tests__/coverage-merge.test.mjs`:

- fixture: `__fixtures__/coverage-a.json` + `coverage-b.json` を用意
- 期待: union 後の `s` / `f` / `b` が両者の和になる
- 期待: 片側のみに存在するファイルキーはそのまま含まれる
- 期待: summary の lines.pct が正しく再計算される

## 検証

```bash
mise exec -- node --test scripts/__tests__/coverage-merge.test.mjs
```

期待: exit 0、全 case PASS。

## 完了条件

- `scripts/coverage-merge.mjs` 実装
- fixture test 作成
- node --test PASS
