# Implementation Guide

## Part 1: 中学生レベルの説明

なぜ必要かというと、同じものに違う名前を付けると、あとで集計や確認をするときに間違いが起きやすいからです。

### 今回作ったもの

学校で配るプリントには、みんなが同じ名前の欄を使うための決まりがあります。たとえば、出席番号を書く欄を人によって「番号」「No」「生徒ID」と好きに書くと、先生が集計するときに困ります。

何をするかというと、フォームの項目名を表す決まった言葉を、決められた場所だけに書くための見張り役を用意します。今は「勝手に書かないでね」というお願いに近い状態なので、後続の実装では自動チェックで間違いを見つけられるようにします。

| 専門用語 | 日常語への言い換え |
| --- | --- |
| stableKey | フォーム項目の変わらない名前 |
| lint | コードの自動見回り |
| allow-list | 書いてよい場所の一覧 |
| CI | みんな共通の自動テスト |
| enforcement | お願いではなく仕組みで守ること |

## Part 2: 技術者向け

Current contract:

- 03a AC-7 は stableKey literal の直書き禁止を要求している。
- 本 workflow はその lint/static-check enforcement の仕様書であり、実装本体は後続 implementation wave に委譲する。

Target delta:

- Add an ESLint custom rule or equivalent static check.
- Allow literals only in source-of-truth modules and explicit exception globs.
- Keep inline suppression baseline at 0.
- Capture NON_VISUAL evidence in Phase 11.

Edge cases:

- Dynamic runtime string composition remains out of scope and is tracked as a follow-up.
- The final `fully enforced` status is only claimed after error-mode CI evidence exists.

### TypeScript 型定義

```ts
type StableKeyLintMode = "warning" | "error";

interface StableKeyLintConfig {
  allowList: string[];
  exceptionGlobs: string[];
  mode: StableKeyLintMode;
}
```

### CLIシグネチャ

```bash
mise exec -- pnpm lint
mise exec -- pnpm typecheck
```

### 使用例

```ts
const stableKeyLintConfig: StableKeyLintConfig = {
  allowList: [
    "packages/shared/src/zod/field.ts",
    "packages/integrations/google/src/forms/mapper.ts",
  ],
  exceptionGlobs: ["**/*.test.ts", "**/__fixtures__/**", "docs/**"],
  mode: "warning",
};
```

### エラーハンドリング

- allow-list file が存在しない場合は fail-fast し、設定 drift として扱う。
- intentional violation で lint が失敗しない場合は rule 実装 bug として Phase 7 へ差し戻す。
- evidence に secret hygiene grep hit がある場合は evidence を再生成する。

### エッジケース

- static template literal は検出対象に含める。
- dynamic runtime string composition は静的 lint の範囲外として未タスク化する。
- docs / fixtures / tests は例外 glob で監査可能にし、inline suppression は 0 件を維持する。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| primary allow-list | `packages/shared/src/zod/field.ts` |
| secondary allow-list | `packages/integrations/google/src/forms/mapper.ts` |
| initial mode | `warning` |
| final mode | `error` |
| visualEvidence | `NON_VISUAL` |

### テスト構成

| 層 | 内容 |
| --- | --- |
| L1 | RuleTester unit tests |
| L2 | fixture snapshot tests |
| L3 | monorepo lint clean PASS |
| L4 | intentional violation FAIL |

## 実装状態 (2026-05-01)

Status: `enforced_dry_run` (warning mode)

ESLint 依存が monorepo 未導入のため、既存 `scripts/lint-boundaries.mjs` パターンに合わせた standalone Node script 実装を採択した。Phase 3 で評価した代替 3 案（ESLint custom rule / ts-morph / runtime guard）のうち、現リポ実態に合致する「軽量 static check script」変種で MVP enforcement を達成する。ESLint 基盤導入後に同等ルールへの昇格は loss-less に可能。

### 実装ファイル

| パス | 役割 |
| --- | --- |
| `scripts/lint-stablekey-literal.mjs` | rule 実装本体（allow-list, exception glob, --strict, --json） |
| `scripts/lint-stablekey-literal.test.ts` | vitest unit test (7 cases — Phase 4 test matrix を満たす) |
| `scripts/__fixtures__/stablekey-literal-lint/violation.ts` | Phase 6 違反 fixture |
| `scripts/__fixtures__/stablekey-literal-lint/allowed.ts` | Phase 6 許可 fixture |
| `scripts/__fixtures__/stablekey-literal-lint/edge.ts` | Phase 6 エッジ fixture |
| `package.json` | `lint` script に rule を組み込み + `lint:stablekey` / `lint:stablekey:strict` 追加 |

### 実測値

- stableKey 数: 31（field.ts から動的抽出、count gate あり）
- allow-list: 2 modules（spec 通り）
- 既存コード違反数: 147 件（apps/api 配下中心の legacy literal — `enforced` 昇格前の baseline）
- 単体テスト: 7/7 PASS
- typecheck: 全 workspace clean
- warning モード: lint chain exit 0（CI block しない）
- strict モード: 違反検出時 exit 1（fail 動作確認済）

### enforced 昇格条件

1. apps/api/* の legacy literal を supply module 経由 import に refactor
2. CI workflow で `--strict` を default に切替
3. 03a workflow AC-7 を「fully enforced」に更新
