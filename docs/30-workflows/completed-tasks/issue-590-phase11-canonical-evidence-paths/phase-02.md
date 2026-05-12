# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 2 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## 変更対象ファイル

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json` | 新規 | JSON Schema 2020-12 正本 |
| `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js` | 新規 | CLI validator |
| `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs` | 新規 | validator テスト |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json` | 新規 | issue-549 適用 instance（実 JSON） |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md` | 編集 | 末尾に schema 参照リンク追加 |
| `package.json`（root） | 編集 | `validate:phase11-paths` script 追加 |

## Schema 設計

### 構造（JSON Schema 2020-12）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "phase11-evidence-canonical-paths.schema.json",
  "title": "Phase 11 Evidence Canonical Paths",
  "type": "object",
  "additionalProperties": false,
  "required": ["taskId", "workflowDir", "evidence"],
  "properties": {
    "taskId": { "type": "string", "minLength": 1 },
    "workflowDir": {
      "type": "string",
      "pattern": "^docs/30-workflows/.+[^/]$"
    },
    "schemaVersion": {
      "type": "string",
      "pattern": "^1\\.0\\.0$"
    },
    "evidence": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "kind", "path", "command", "acquiredBy"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9._-]*$" },
          "kind": {
            "type": "string",
            "enum": ["typecheck", "lint", "test", "build", "grep-gate", "runtime-observation"]
          },
          "path": {
            "type": "string",
            "pattern": "^(?!.*\\.\\.)outputs/phase-11/(?:evidence/)?[A-Za-z0-9._/-]+\\.(?:log|txt|md|json|csv)$"
          },
          "command": { "type": "string", "minLength": 1 },
          "acquiredBy": {
            "type": "string",
            "enum": ["spec_created", "implementation_cycle", "post_merge"]
          },
          "requiredForCloseout": { "type": "boolean" },
          "notes": { "type": "string" }
        }
      }
    }
  }
}
```

### 補足ルール（validator 側で実装）

- `evidence[].id` の uniqueness は schema の `uniqueItems` 単独では強制困難なため、validator 側で `id` 抽出して Set サイズ比較し検出する。
- `path` の実体存在チェックは `--check-existence` 時のみ実行し、`workflowDir` を base にして `path.resolve` で解決する。
- `visualEvidence` / `knownFailure` は manifest schema の対象外。画面要否は workflow metadata で管理し、既知 failure の扱いは各 evidence log / Phase 12 compliance で説明する。

## Validator 設計

### CLI 仕様

```
node validate-phase11-canonical-evidence-paths.js [files...] [--check-existence] [--json]
node validate-phase11-canonical-evidence-paths.js --workflow <workflow-dir> [--check-existence]
```

| オプション | 役割 |
| --- | --- |
| 位置引数 | 検証対象 JSON ファイル（複数可、glob は呼び出し側 shell で展開） |
| `--check-existence` | 各 `evidence[].path` の実体ファイル存在を検査（`workflowDir` 基準） |
| `--workflow` | workflow directory から `outputs/phase-11/canonical-paths.json` を解決 |
| `--json` | machine-readable report を stdout に出力 |

### 内部処理フロー

1. 引数 parse（位置引数 / `--workflow` / 既定 glob のいずれかで対象を解決）
2. schema ファイルを読み込み、root/evidence keys、required、enum、pattern を検証 contract として使用する
3. 各 jsonPath について:
   a. 読み込み + JSON.parse（失敗時は exit 1）
   b. local validator で必須 key / enum / path 形式を検証（失敗時は exit 1、エラー詳細を stderr に出力）
   c. `evidence[].id` 重複検出（失敗時は exit 1）
   d. optional field 型（`requiredForCloseout` boolean / `notes` string）を検証
   e. `--check-existence` 時、`fs.existsSync(path.resolve(repoRoot, json.workflowDir, item.path))` を全 evidence に対して実行（不存在ありなら exit 2）
4. 全件 OK で exit 0、stdout に件数サマリー出力

### exit code 規約

| code | 意味 |
| --- | --- |
| 0 | 全件 OK |
| 1 | schema 違反 / 重複 id / JSON parse 失敗 |
| 2 | path 不存在（`--check-existence` 時のみ） |
| 3 | CLI 引数不正 |

## issue-549 適用 instance（参考データ）

`docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json` は親 phase-11.md の表をそのまま JSON 化する。例:

```json
{
  "schemaVersion": "1.0.0",
  "taskId": "issue-549-cf-audit-ml-production-switch",
  "workflowDir": "docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch",
  "evidence": [
    {
      "id": "typecheck",
      "kind": "typecheck",
      "path": "outputs/phase-11/evidence/typecheck.log",
      "command": "mise exec -- pnpm typecheck | tee outputs/phase-11/evidence/typecheck.log",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true,
      "notes": "@sentry/* missing dependency による既知 failure。Issue #549 由来エラー 0 件確認"
    },
    {
      "id": "lint",
      "kind": "lint",
      "path": "outputs/phase-11/evidence/lint.log",
      "command": "mise exec -- pnpm lint | tee outputs/phase-11/evidence/lint.log",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true
    },
    {
      "id": "focused-tests",
      "kind": "test",
      "path": "outputs/phase-11/evidence/test.log",
      "command": "mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__ scripts/cf-audit-log/__tests__/evaluation.test.ts --reporter=verbose | tee outputs/phase-11/evidence/test.log",
      "acquiredBy": "implementation_cycle"
    },
    {
      "id": "build",
      "kind": "build",
      "path": "outputs/phase-11/evidence/build.log",
      "command": "mise exec -- pnpm build | tee outputs/phase-11/evidence/build.log",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": false
    },
    {
      "id": "grep-gate",
      "kind": "grep-gate",
      "path": "outputs/phase-11/evidence/grep-gate.log",
      "command": "mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts outputs/phase-11/evidence/ --exit-on-detect",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true
    },
    {
      "id": "hourly-run-7day",
      "kind": "runtime-observation",
      "path": "outputs/phase-11/evidence/hourly-run-7day.md",
      "command": "(production env switch 後 7 日 hourly run URL を集約)",
      "acquiredBy": "post_merge"
    }
    ,
    {
      "id": "fallback-rate-7day",
      "kind": "runtime-observation",
      "path": "outputs/phase-11/evidence/fallback-rate-7day.json",
      "command": "scripts/cf-audit-log/observation/post-switch-monitor.ts",
      "acquiredBy": "post_merge",
      "requiredForCloseout": false
    },
    {
      "id": "p95-latency-7day",
      "kind": "runtime-observation",
      "path": "outputs/phase-11/evidence/p95-latency-7day.json",
      "command": "scripts/cf-audit-log/observation/post-switch-monitor.ts",
      "acquiredBy": "post_merge",
      "requiredForCloseout": false
    },
    {
      "id": "issue-rate-comparison",
      "kind": "runtime-observation",
      "path": "outputs/phase-11/evidence/issue-rate-comparison.md",
      "command": "scripts/cf-audit-log/observation/post-switch-monitor.ts",
      "acquiredBy": "post_merge",
      "requiredForCloseout": false
    }
  ]
}
```

## 完了条件

- [x] schema 構造（JSON Schema 2020-12）が記載されている
- [x] validator CLI 仕様（オプション / 引数 / exit code）が記載されている
- [x] 変更対象ファイル一覧が網羅されている
- [x] issue-549 適用 instance の例が記載されている

## 成果物

- `outputs/phase-02/main.md`

## 参照資料

- `phase-01.md`（要件）
- `.claude/skills/task-specification-creator/schemas/phase-spec.json`（schema 規約）
- `.claude/skills/task-specification-creator/scripts/validate-schema.js`（validator 実装規約）
