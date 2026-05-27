# Phase 4: I/O 契約

## 4.1 CLI シグネチャ

```
node --import tsx scripts/coverage-threshold-lint.ts [--json] [--ssot <path>] [--executor <path>] [--codecov <path>]
```

| 引数 | 必須 | 既定値 | 用途 |
| --- | --- | --- | --- |
| `--json` | no | off | 出力を JSON に切替（CI 集計用） |
| `--ssot` | no | `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | テスト fixture 切替用 |
| `--executor` | no | `scripts/coverage-guard.sh` | テスト fixture 切替用 |
| `--codecov` | no | `codecov.yml`（存在時のみ読む） | テスト fixture 切替用 |

## 4.2 Input contract

| Source | Path | 抽出方法 | 期待 type | optional |
| --- | --- | --- | --- | --- |
| `aiworkflow-requirements` | `--ssot` で指定（既定: 上記） | coverage 表 row anchor + 4 column extraction | `number` | no |
| `coverage-guard.sh` | `--executor` で指定（既定: 上記） | `^THRESHOLD=([0-9]+(?:\.[0-9]+)?)` の最初の hit | `number` | no |
| `codecov.yml` | `--codecov` で指定（既定: `codecov.yml`） | `target:` 行を行 anchor で抽出（`project.target` と `patch.target` 両方が一致することを要件とする） | `number` | **yes**（不在時は 2-source モード） |

## 4.3 Output contract（標準出力）

### 一致時（exit 0）

stdout 1 行:

```
coverage-threshold-lint: OK (sources=2, threshold=80)
```

`--json` 指定時:

```json
{ "ok": true, "sources": [{"name":"aiworkflow-requirements","path":".claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md","value":80},{"name":"coverage-guard.sh","path":"scripts/coverage-guard.sh","value":80}], "mismatches": [] }
```

### 不一致時（exit 1）

stderr に Markdown 風差分テーブル:

```
coverage-threshold-lint: DRIFT detected

| Source                    | Path                                                                                       | Value |
| ------------------------- | ------------------------------------------------------------------------------------------ | ----- |
| aiworkflow-requirements   | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md         | 80    |
| coverage-guard.sh         | scripts/coverage-guard.sh                                                                  | 70    |

Mismatches:
  - aiworkflow-requirements (80) != coverage-guard.sh (70)
```

### SSOT / executor / 任意 source parse 失敗時（exit 2）

stderr:

```
coverage-threshold-lint: SSOT parse failed
  source: aiworkflow-requirements
  path: .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md
  reason: coverage table row anchor not found
```

## 4.4 Exit code

| code | 意味 | 後続 |
| --- | --- | --- |
| 0 | 全 source 一致 | CI green |
| 1 | drift 検知 | CI fail / PR block |
| 2 | parse 失敗（SSOT / executor / 任意 source） | CI fail（drift と区別 / runbook で誘導） |

## 4.5 Programmatic API

```ts
export type ThresholdSourceName =
  | "aiworkflow-requirements"
  | "coverage-guard.sh"
  | "codecov.yml";

export type ThresholdSource = {
  name: ThresholdSourceName;
  path: string;
  value: number | null; // null = optional source absent
};

export type LintResult = {
  ok: boolean;
  sources: ThresholdSource[];
  mismatches: string[];
};

export type RunLintOptions = {
  ssotPath?: string;
  executorPath?: string;
  codecovPath?: string;
  cwd?: string;
};

export function runLint(opts?: RunLintOptions): LintResult;
```

vitest からは `runLint({ ssotPath, executorPath, codecovPath, cwd })` を呼び、戻り値を assert する。

## 4.6 Side effects

| 種別 | 有無 |
| --- | --- |
| ファイル書き込み | なし |
| 環境変数読み | なし（`process.cwd()` のみ） |
| ネットワーク | なし |
| プロセス分岐 | CLI 起点では `process.exit(code)` を呼ぶ。`runLint()` は exit しない（戻り値で返す） |

`runLint()` は pure function に近い構造とし、テスト容易性を担保する。
