# Phase 3: 設計（candidate evaluation / canary workflow / rollback / evidence schema）

## 目的

candidate evaluation のフロー、canary workflow の起動方式、forward-safe rollback の手順、canary evidence JSON schema を確定する。Phase 4-13 の入力となる設計図を提供する。

## 設計

### 1. rotation 全体フロー

```
[次世代 ML model 投入]
  │
  ├─ Step 1: candidate path を op に登録
  │     op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE
  │
  ├─ Step 2: canary 起動（手動）
  │     gh workflow run cf-audit-log-artifact-canary.yml \
  │         -f candidatePath="op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE"
  │
  ├─ Step 3: artifact-canary.ts が staging で
  │     1. candidate を load
  │     2. offline replay (1 hour 分 event)
  │     3. leakage grep（log / 出力）
  │     4. evidence JSON 出力
  │
  ├─ Step 4: rotation-evidence-collector.ts が
  │     canary 結果 + baseline を 1 JSON に集約
  │
  ├─ Step 5: Gate-R1〜R3 通過判定（人手）
  │     ├─ OK → promotion PR（..._PROD op 参照値書き換え）
  │     └─ NG → candidate 破棄
  │
  └─ Step 6: promotion 後 hourly run
        ├─ 異常なし → rotation 完了
        └─ 異常検知 → rollback PR（..._PROD を 1 つ前の path に戻す）
```

本サイクルでは **Step 2-4 の scripts / workflow と runbook** を整備する。Step 5-6 の実 promotion / rollback は別サイクル。

### 2. canary workflow（新規）

`.github/workflows/cf-audit-log-artifact-canary.yml`

```
name: cf-audit-log-artifact-canary
on:
  workflow_dispatch:
    inputs:
      candidatePath:
        description: 'op:// reference for candidate artifact (CF_AUDIT_ML_MODEL_PATH_CANDIDATE)'
        required: true
      replayWindowHours:
        description: 'Replay window in hours'
        required: false
        default: '1'
jobs:
  canary:
    runs-on: ubuntu-latest
    env:
      CF_AUDIT_CLASSIFIER: ml
      ML_MODEL_PATH: ${{ inputs.candidatePath }}
    steps:
      1. checkout
      2. mise + pnpm install
      3. bash scripts/cf.sh whoami（auth verify）
      4. node scripts/cf-audit-log/rotation/artifact-canary.ts \
            --candidate "$ML_MODEL_PATH" \
            --baseline "$ML_MODEL_PATH_BASELINE" \
            --window "${{ inputs.replayWindowHours }}" \
            --out canary-out.json
      5. node scripts/cf-audit-log/rotation/rotation-evidence-collector.ts \
            --canary-out canary-out.json \
            --result rotation-evidence.json
      6. upload artifact: rotation-evidence.json
```

production hourly workflow（`cf-audit-log-monitor.yml`）は本タスクで **編集しない**。canary は分離する。

### 3. `artifact-canary.ts` 設計

```
artifact-canary.ts
  CLI:
    --candidate <op-ref>   (required)  candidate artifact の op 参照
    --baseline <op-ref>    (required)  比較対象（現行 ..._PROD）
    --window <hours>       (optional)  offline replay window（default: 1）
    --out <path>           (required)  evidence JSON 出力先
    --exit-on-leakage      (default: true)
  処理:
    1. op run --env-file 経由で candidate / baseline path を解決（実値はメモリ上のみ）
    2. ML classifier skeleton で candidate を staging に load
    3. staging の event log を offline replay（1 hour 分）
    4. precision/recall proxy / fallback rate / p95 latency を集計
    5. secret-leakage-grep.ts を流用して log / 出力を grep
    6. leakage hits > 0 なら exit 1
    7. evidence JSON を --out に書き出す
  禁止:
    - candidate path 実値をログ出力する
    - raw feature dataset を出力ファイルに含める
    - wrangler を直接呼び出す（bash scripts/cf.sh 経由のみ）
```

### 4. evidence JSON schema

`canary-out.json`（`artifact-canary.ts` 出力）:

```json
{
  "canaryRunId": "2026-05-12T14:00:00Z-abc123",
  "candidatePathRef": "op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE",
  "baselinePathRef": "op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD",
  "candidateClassifierVersion": "ml@v1.1.0",
  "baselineClassifierVersion": "ml@v1.0.0",
  "replayWindowHours": 1,
  "totalEventsReplayed": 1234,
  "candidate": {
    "precisionProxy": 0.91,
    "recallProxy": 0.87,
    "fallbackRate": 0.012,
    "p95LatencyMs": 152,
    "leakageHits": 0
  },
  "baseline": {
    "precisionProxy": 0.88,
    "recallProxy": 0.85,
    "fallbackRate": 0.014,
    "p95LatencyMs": 145,
    "leakageHits": 0
  },
  "verdict": "candidate_pass"
}
```

`rotation-evidence.json`（`rotation-evidence-collector.ts` 出力）:

```json
{
  "rotationId": "rot-2026-05-12-001",
  "phase": "canary",
  "canary": { /* canary-out.json の内容 */ },
  "gate": {
    "R1_replayPass": true,
    "R2_latencyAndFallbackPass": true,
    "R3_runbookApprovalPath": "docs/30-workflows/runbooks/ml-model-artifact-rotation.md"
  },
  "decision": "promotion_pr_pending",
  "rollbackInstruction": "..._PROD を直前 path に戻す PR 1 行"
}
```

### 5. forward-safe rollback

```
rollback runbook（rotation 用 1 step）:
  1. promotion PR を revert（または ..._PROD op 参照値を 1 つ前の path に戻す PR を作成）
     - candidate path は ..._CANDIDATE のまま残置（次回 rotation 用）
     - D1 列 classifier_version は削除しない（forward-safe）
     - hourly run の env (CF_AUDIT_CLASSIFIER) は変更しない（ml 維持）
  fail-safe:
    - candidate load 失敗時は ML classifier skeleton の threshold fallback が発動（#515 既存）
    - fallback rate > 5% を 3 hour 連続で観測（#549 既存 alert） → rollback トリガ
```

破壊的 DOWN SQL は **本タスクでは作成しない**。親 #515 の migration は forward-safe であり、`classifier_version` 列を残すことが rollback の前提。

### 6. raw feature dataset 不混入の grep gate

```
grep gate（CI / 開発時手動実行）:
  rg -n '(feature|dataset|train|sample).*\.(csv|parquet|jsonl)' \
      scripts/cf-audit-log/rotation/ \
      .github/workflows/cf-audit-log-artifact-canary.yml \
      docs/30-workflows/runbooks/ml-model-artifact-rotation.md
  期待: hits = 0（仕様書記述で言及される箇所は記述のみで実 dataset path を含まない）
  evidence: outputs/phase-11/evidence/dataset-grep.log
```

## 出力

`outputs/phase-03/main.md` に以下を記述:

- 上記設計図の実体（workflow YAML 差分 / canary CLI / evidence JSON schema / rollback 1 step）
- `MLClassifier` への candidate path の渡し方（env / op-run / 実体ロード経路の繋ぎ）
- canary の集計ロジック（offline replay → precision/recall proxy → fallback rate → p95 latency → leakage grep）
- forward-safe rollback の根拠（D1 列残置 / `..._PROD` 1 行戻し）

## 完了条件

- [ ] canary workflow YAML の差分を確定
- [ ] `artifact-canary.ts` の CLI / 出力 JSON schema を確定
- [ ] `rotation-evidence-collector.ts` の集約 JSON schema を確定
- [ ] forward-safe rollback の 1 step を確定（`..._PROD` 戻し / D1 列残置 / candidate 残置）
- [ ] raw feature dataset 不混入の grep gate を確定

## 参照資料

- `index.md`
- `phase-01.md` ・ `phase-02.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- Phase 9 で本設計の各 module（artifact-canary / rotation-evidence-collector / leakage grep 流用）を test 対象として登録

## サブタスク分解（後続 Phase 4-13 への入力）

| ID | サブタスク | 変更対象ファイル | 受入条件 |
| --- | --- | --- | --- |
| T-01 | candidate evaluation 準備（op 参照新設 / staging 動作確認） | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` / op vault | `..._CANDIDATE` op 参照が登録され、`bash scripts/cf.sh whoami` 成功 |
| T-02 | canary workflow 新規作成 | `.github/workflows/cf-audit-log-artifact-canary.yml` | `workflow_dispatch` で起動可能 / `inputs.candidatePath` を受け取れる |
| T-03 | artifact-canary.ts 実装 + focused test | `scripts/cf-audit-log/rotation/artifact-canary.ts` / `__tests__/artifact-canary.test.ts` | offline replay + leakage grep / evidence JSON 出力 / focused test pass |
| T-04 | rotation-evidence-collector.ts 実装 + focused test | `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts` / `__tests__/rotation-evidence-collector.test.ts` | canary + baseline 集約 / focused test pass |
| T-05 | rotation runbook 整備 | `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` / `15-infrastructure-runbook.md` | 4 段（candidate / canary / promotion / rollback）が 1 ページ |
| T-06 | Phase 12 evidence + SSOT sync | `outputs/phase-12/*` / observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook | strict 7 file / SSOT 3 ファイル更新 |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。
- 次世代 artifact の実 promotion は Gate-R0〜R3 通過後の実装サイクルに限定する。

## 依存Phase参照

Phase 1 / Phase 2 の成果物を上流契約として参照する。後続 Phase 4-13 の入力となる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## Next Phase

- [Phase 4](phase-04.md): 環境準備 / 前提条件確認
