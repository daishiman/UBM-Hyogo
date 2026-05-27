# Phase 3: モジュール俯瞰 / 設計方針 / 代替案比較

## 3.1 モジュール構成

```
scripts/
├── coverage-threshold-lint.ts          (new)  CLI entry
└── __tests__/
    └── coverage-threshold-lint.spec.ts (new)  vitest fixtures

.github/workflows/
└── coverage-threshold-lint.yml         (new)  CI gate

package.json                            (edit) lint:coverage-threshold script
```

`coverage-threshold-lint.ts` は単一ファイルで完結する。export を 1 つ（`runLint(opts): LintResult`）持ち、CLI と spec の両方から呼び出される。

## 3.2 設計方針

| 観点 | 方針 |
| --- | --- |
| 依存 | 標準ライブラリのみ（`node:fs` / `node:path` / `node:process`）。`js-yaml` 等は追加しない |
| codecov.yml の YAML パース | `target:` 行を行 anchor の正規表現 `^\s*target:\s*([0-9]+(?:\.[0-9]+)?)\s*%?\s*$` で抽出する minimal pure-text parser |
| aiworkflow-requirements パース | coverage 表の行 anchor `\|\s*(apps/web\|apps/api\|packages/shared)\s*\|` を起点に、`\|\s*([0-9]+)\s*\|` 4 列を抽出 |
| coverage-guard.sh パース | `^THRESHOLD=([0-9]+)` の 1 行抽出 |
| dynamic source | `codecov.yml` の存在判定で 2 source / 3 source モードを切替 |
| 出力フォーマット | 差分時 stderr に Markdown 風テーブル / 一致時 stdout に 1 行 / `--json` で機械可読 JSON |
| exit code | 0=OK / 1=drift / 2=SSOT パース失敗または引数不正 |

## 3.3 代替案比較

| 案 | 採用 | 理由 |
| --- | --- | --- |
| A: `js-yaml` を追加して codecov.yml を本格パース | × | 依存追加のコスト > メリット。target 値抽出は 1 行 regex で十分 |
| B: aiworkflow-requirements に YAML frontmatter を追加して機械可読化 | × | 正本側の構造変更は別タスクのスコープ。lint 側で吸収する方が変更面が小さい |
| C: `scripts/coverage-guard.sh` の中に lint ロジックを統合 | × | shell より TS の方が unit test しやすい。責務分離も明確 |
| D: pre-commit hook で実行 | × | lint はファイル差分に依存せず常に同じ判定。CI で十分 |
| E: 独立 workflow `.github/workflows/coverage-threshold-lint.yml` を作る | ○ | 既存 `ci.yml` への追記より責務が明確で rerun しやすい |
| F: `ci.yml` の既存 job に step として追記 | × | rerun 単位が大きくなる。failure 時の責任範囲も曖昧 |

## 3.4 dynamic source モード設計

| codecov.yml | sources | 期待動作 |
| --- | --- | --- |
| 不在 | 2（aiworkflow-requirements / coverage-guard.sh） | 2 値一致時 exit 0、不一致時 exit 1 |
| 存在 | 3（上記 + codecov.yml の `project.target` / `patch.target`） | 3 値一致時 exit 0、不一致時 exit 1 |
| 存在だが parse 失敗 | 2 + error log | exit 2（drift と区別） |
| aiworkflow-requirements が parse 失敗 | n/a | exit 2（SSOT 不能 / drift と区別） |

## 3.5 苦戦想定と回避策

| 苦戦 | 回避策 |
| --- | --- |
| 正本 Markdown 表組みの列順 / 行 anchor 変更で正規表現が壊れる | 正本側の coverage 表に列順固定の HTML コメント `<!-- coverage-table-anchor -->` 等は導入しない（スコープ外）。代わりに lint 側で 4 列を read し全て同値であることを assertion、SSOT パース失敗時は exit 2 で fail-fast し drift と区別する |
| codecov.yml の `target` 表記揺れ（`80` / `80%` / `'80'`） | regex で `[0-9]+(?:\.[0-9]+)?\s*%?` を許容、文字列正規化後に number 比較 |
| float / int の比較 | 全 source を `Number()` に正規化して `===` 比較 |
| `THRESHOLD=80.0` のような小数表記 | regex `^THRESHOLD=([0-9]+(?:\.[0-9]+)?)` で許容 |

## 3.6 fail-fast 戦略

| 局面 | 動作 |
| --- | --- |
| aiworkflow-requirements が読めない / coverage 表が無い | exit 2、stderr に「SSOT parse failed」 |
| coverage-guard.sh の `THRESHOLD=` が無い | exit 2、stderr に「executor parse failed」 |
| codecov.yml が parse できないが存在する | exit 2、stderr に「optional source parse failed」（drift と区別） |
| 全 source 取得成功 / 値不一致 | exit 1、stderr に差分テーブル |
| 全 source 取得成功 / 値一致 | exit 0、stdout に OK 行 |
