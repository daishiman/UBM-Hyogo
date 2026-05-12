# Phase 11: 手動 smoke test / evidence 取得

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 11 |
| 状態 | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

schema / validator / issue-549 instance の動的検証を実行し、本タスク自身の Phase 11 evidence を取得する。

> 本タスクは「Phase 11 canonical path schema」の導入タスク自体であるため、自タスクの Phase 11 evidence にも本 schema を適用する（dogfooding）。

## 自タスクの canonical-paths.json

ファイル: `docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json`

```json
{
  "schemaVersion": "1.0.0",
  "taskId": "issue-590-phase11-canonical-evidence-paths",
  "workflowDir": "docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths",
  "evidence": [
    {
      "id": "typecheck",
      "kind": "typecheck",
      "path": "outputs/phase-11/evidence/typecheck.log",
      "command": "pnpm typecheck",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true
    },
    {
      "id": "lint",
      "kind": "lint",
      "path": "outputs/phase-11/evidence/lint.log",
      "command": "pnpm lint",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true
    },
    {
      "id": "schema-validation",
      "kind": "test",
      "path": "outputs/phase-11/evidence/schema-validation.log",
      "command": "node .claude/skills/task-specification-creator/scripts/validate-schema.js --schema schemas/phase11-evidence-canonical-paths.schema.json --data docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true
    },
    {
      "id": "validator-test",
      "kind": "test",
      "path": "outputs/phase-11/evidence/validator-test.log",
      "command": "node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true
    },
    {
      "id": "phase11-paths",
      "kind": "grep-gate",
      "path": "outputs/phase-11/evidence/phase11-paths.log",
      "command": "pnpm validate:phase11-paths docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json --check-existence",
      "acquiredBy": "implementation_cycle",
      "requiredForCloseout": true
    }
  ]
}
```

## smoke 手順

### Step 1: 自 instance を validator で検証

```bash
mise exec -- node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js \
  docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json
# => exit 0 期待
```

### Step 2: 親 issue-549 instance も同 validator で検証

```bash
mise exec -- node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json
# => exit 0 期待
```

### Step 3: `--check-existence` での自 instance 検証

```bash
mise exec -- node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js \
  docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json \
  --check-existence
# => exit 0 期待
```

### Step 4: validator 単体テスト

```bash
mise exec -- node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs
# => 全件 pass
```

## 証跡保存

- `outputs/phase-11/main.md`: Phase 11 サマリー（実行日時 / コマンド / 判定）
- `outputs/phase-11/canonical-paths.json`: 上記 JSON
- `outputs/phase-11/evidence/typecheck.log` / `lint.log` / `schema-validation.log` 等: 実行ログ

## NON_VISUAL 宣言

`visualEvidence: NON_VISUAL`。スクリーンショット不要。validator stdout / test 結果が証跡。

## 完了条件

- [x] 自タスク用 canonical-paths.json が定義されている
- [x] smoke 手順 Step 1〜4 が記載されている
- [x] 証跡保存先が指定されている
- [x] NON_VISUAL 宣言が明記されている

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/canonical-paths.json`
- `outputs/phase-11/evidence/*.log`

## 参照資料

- `phase-02.md`（schema） / `phase-05.md`（実装）
