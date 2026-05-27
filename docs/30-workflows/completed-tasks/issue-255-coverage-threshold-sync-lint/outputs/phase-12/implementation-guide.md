# Implementation Guide

## Part 1: 中学生レベル

### なぜ必要か

このプロジェクトでは、テストがどれくらいの範囲をチェックしているか（カバレッジ）を「80%以上」と決めています。この「80」という数字が、実は最大で3つの別々のファイルに書かれています。

たとえば、同じ電話番号を3冊のノートに自分の手で書き写すと、必ずどこかのノートで1桁だけ書き間違えてしまいます。誰も気づかないまま、ノートAだけ古い番号、ノートBだけ新しい番号、という状態になります。今回のカバレッジの数字もまったく同じで、人間が3か所を手で揃え続けるとそのうちズレます。

ズレたまま気づかないと、片方のチェックは「合格」と言っているのに、別のチェックは「不合格」と言う、という矛盾が起きます。これを避けるために「3つのファイルから数字を機械が読み取って、全部一致しているか自動で照らし合わせる」スクリプトを用意します。

### 何をしたか

「3つのファイルを読んで、書いてある『80』をひとつずつ取り出して、全部一致していたらOK、ズレていたら止める」という小さなチェック係を作ります。Codecov というツール用のファイル（`codecov.yml`）はまだこのプロジェクトに無いので、無いときは2つだけ、出てきたら3つで自動的に比べてくれるようにします。

### 今回作ったもの

| 名前 | 役割 | たとえると |
| --- | --- | --- |
| `scripts/coverage-threshold-lint.ts` | 数字を3か所から読んで照らし合わせる本体 | ノートの照合係 |
| `scripts/__tests__/coverage-threshold-lint.spec.ts` | 「ズレてないとき」「ズレてるとき」両方の練習問題 | 照合係の試験官 |
| `.github/workflows/coverage-threshold-lint.yml` | PRごとに自動で照合係を動かす仕掛け | 提出物を自動でチェックする先生 |
| `package.json` の `lint:coverage-threshold` | みんなが同じコマンドで照合係を呼べる入り口 | チャイム |

### 用語の言い換え

| 用語 | 日常語での言い換え |
| --- | --- |
| coverage（カバレッジ） | テストでチェックできた範囲 |
| threshold（しきい値） | 「ここまで届いていないと合格にしない」の基準値 |
| drift（ドリフト） | 同じ数字のはずがいつの間にかズレている状態 |
| SSOT | 一番正しい正本（ここでは aiworkflow-requirements） |
| CI | 提出のたびに動く自動チェック |
| exit 1 | プログラムが「不合格」で終わるという合図 |
| lint | 機械による細かい間違い探し |

## Part 2: 技術者レベル

`scripts/coverage-threshold-lint.ts` は最大 3 つの source から coverage threshold を読み比較する node CLI。`codecov.yml` 不在時は 2 source モード、存在時は 3 source モードへ動的拡張する。drift と SSOT parse failure を exit code で明確に区別する（drift=1 / parse failure=2）。

### Contract

| Item | Before | After |
| --- | --- | --- |
| coverage threshold drift 検知 | 不在（手動レビュー依存） | `scripts/coverage-threshold-lint.ts` が CI で fail/pass |
| CI workflow | `coverage-threshold-lint` 未配線 | 独立 workflow `.github/workflows/coverage-threshold-lint.yml` |
| local lint コマンド | 不在 | `pnpm lint:coverage-threshold` |
| codecov.yml の扱い | 未配置 / drift 検知なし | 不在時 2-source、存在時 3-source 動的拡張 |

### CLIシグネチャ

```bash
node --import tsx scripts/coverage-threshold-lint.ts [--json] [--ssot <path>] [--executor <path>] [--codecov <path>]
```

`pnpm lint:coverage-threshold` 経由で呼ぶ。Programmatic には `runLint(opts: Partial<Options>): LintResult` を export する。

### 使用例

```bash
# 通常実行（exit 0 / OK 行 stdout）
mise exec -- pnpm lint:coverage-threshold

# JSON 出力（CI 集計用。stdout は JSON のみ）
mise exec -- pnpm lint:coverage-threshold --json | jq '.ok'

# root 切替（別 checkout / fixture root を検証する場合）
node --import tsx scripts/coverage-threshold-lint.ts --root /path/to/repo
```

```ts
// vitest からの呼び出し
import { runLint } from "../coverage-threshold-lint";

const r = runLint({
  ssotPath: "scripts/__tests__/fixtures/coverage-threshold-lint/quality-requirements-match.md",
  executorPath: "scripts/__tests__/fixtures/coverage-threshold-lint/coverage-guard-80.sh",
  rootDir: process.cwd(),
});
expect(r.ok).toBe(true);
```

### 型定義

```ts
export type ThresholdSourceKind = "ssot" | "executor" | "codecov";

export type ThresholdSource = {
  kind: ThresholdSourceKind;
  path: string;
  threshold: number;
};

export type LintResult =
  | { ok: true; threshold: number; sources: ThresholdSource[] }
  | { ok: false; errorKind: "drift"; threshold: number; sources: ThresholdSource[]; mismatches: ThresholdSource[] }
  | { ok: false; errorKind: "parse"; message: string; sources: ThresholdSource[] };
```

### エラーハンドリング

| Case | Handling |
| --- | --- |
| aiworkflow-requirements 表行 anchor が見つからない | exit 2 / stderr `SSOT parse failed` |
| coverage-guard.sh の `THRESHOLD=` 行が無い | exit 2 / stderr `executor parse failed` |
| codecov.yml が parse 不能（存在するが target: 行 0 件 / 内部不一致） | exit 2 / stderr `codecov.yml parse failed`（drift と区別） |
| 全 source 値不一致 | exit 1 / stderr `DRIFT detected` + diff table + mismatch lines |
| 全 source 値一致 | exit 0 / stdout `coverage-threshold-lint: OK (sources=<N>, threshold=<value>)` |
| 引数不正 | exit 2 / stderr `unknown arg: ...` |
| ファイル ENOENT（SSOT / executor） | exit 2 / `errorKind=parse` と `message` に詰めて返す |

### エッジケース

| Case | 対応 |
| --- | --- |
| 表組み whitespace 揺れ `\| 80 \|` vs `\|80\|` | 正規表現で `\s*` を許容 |
| 改行種別 `\r\n` vs `\n` | 行 split は `/\r?\n/` で処理 |
| `THRESHOLD=80 # comment` | `^THRESHOLD=([0-9]+(?:\.[0-9]+)?)` で数値部のみ抽出 |
| `target: '80'` / `target: 80.00%` | float 許容、`Number()` 経由で `80 === 80.00` |
| `codecov.yml` の `threshold: 1%` | Codecov の許容誤差であり coverage gate 閾値ではないため無視し、`target:` のみ抽出 |
| `apps/web` / `apps/api` / `packages/shared` の coverage 行内 12 セル中 1 つだけ食い違う | exit 2（SSOT internal mismatch）。drift ではなく正本破綻として扱う |
| 同一 `target:` が複数現れて値が一致しない（codecov.yml） | exit 2（codecov internal mismatch） |
| optional source 不在 | 2-source モードで継続 |
| branch filter miss（CI） | main / dev 以外の branch target では workflow 未発火 |

### 設定項目と定数一覧

| Name | Value | 由来 |
| --- | --- | --- |
| `DEFAULT_SSOT` | `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | aiworkflow-requirements skill 正本 |
| `DEFAULT_EXECUTOR` | `scripts/coverage-guard.sh` | 既存 coverage gate の実行設定 |
| `DEFAULT_CODECOV` | `codecov.yml` | repo root（任意 source） |
| `TARGET_ROWS` | `apps/` または `packages/` で始まる coverage 表行 | quality-requirements-advanced.md の表行 anchor |
| `EXIT_OK` | `0` | 全 source 一致 |
| `EXIT_DRIFT` | `1` | drift 検知 |
| `EXIT_PARSE` | `2` | SSOT/executor/optional source parse 失敗 / 引数不正 |
| `THRESHOLD_PATTERN` | `/^THRESHOLD=([0-9]+(?:\.[0-9]+)?)/m` | coverage-guard.sh の抽出正規表現 |
| `TABLE_CELL_PATTERN` | `/\|\s*([0-9]+(?:\.[0-9]+)?)\s*\|/g` | 表組みセルの抽出 |
| `CODECOV_TARGET_PATTERN` | `/^\s*target:\s*['"]?([0-9]+(?:\.[0-9]+)?)['"]?\s*%?\s*$/mg` | codecov.yml target 抽出 |

### テスト構成

| Fixture | 内容 | 期待 |
| --- | --- | --- |
| F-1 | match.md + guard-80.sh + (no codecov) | `ok=true`, sources.length=2 |
| F-2 | match.md + guard-70.sh | `ok=false`, mismatches に `coverage-guard.sh (70)` |
| F-3 | match.md + guard-80.sh + codecov-80.yml | `ok=true`, sources.length=3 |
| F-4 | broken.md + guard-80.sh | `errorKind=parse` |
| F-5 | match.md + guard-80.sh + codecov-70.yml | `ok=false`, codecov drift |
| F-6 | match.md + guard-80.sh + codecov-broken.yml | `errorKind=parse` |
| F-7 | match.md + guard-80.sh + codecov-80.yml + `threshold: 1%` | `ok=true`, Codecov tolerance is ignored |
| F-8 | CLI `--json` | stdout is parseable JSON only |

vitest runner: 既存 repo root の vitest config を継承。spec ファイルは `scripts/__tests__/coverage-threshold-lint.spec.ts`（CLAUDE.md 不変条件 #8 で `.spec.ts` 必須）。`runLint(opts)` を呼び戻り値の `ok` / `sources` / `mismatches` / `errorKind` を assert する純粋関数テストに加え、CLI `--json` は child process で stdout 契約を検証する。

### Evidence References

| Evidence | Path | Status |
| --- | --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.log` | not captured（focused lint/test evidence を優先） |
| vitest | `outputs/phase-11/evidence/vitest.log` | n/a |
| lint | `outputs/phase-11/evidence/lint.log` | n/a |
| drift dry-run | `outputs/phase-11/evidence/drift-dry-run.log` | n/a |
| CI job | `outputs/phase-11/evidence/ci-coverage-threshold-lint.log` | n/a |
| screenshot | N/A | `visualEvidence=NON_VISUAL` |
