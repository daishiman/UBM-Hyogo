# Phase 5: データモデル / artifact path schema / evidence JSON schema

## 目的

rotation で扱う 3 種類のデータモデル（artifact path / canary evidence / rotation evidence）を確定する。D1 schema は親 #515 の forward-safe 列を継承するのみで、本タスクで変更しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. artifact path schema（op 参照）

| op item | field | 用途 | 本タスクでの操作 |
| --- | --- | --- | --- |
| `Employee/ubm-hyogo-env` | `CF_AUDIT_ML_MODEL_PATH_PROD` | 現行 production artifact path | 参照のみ。値は変更しない |
| `Employee/ubm-hyogo-env` | `CF_AUDIT_ML_MODEL_PATH_CANDIDATE` | candidate artifact path（rotation 時のみ） | 新設（spec のみ。実エントリ追加は別サイクル） |
| `Employee/ubm-hyogo-env` | `CF_AUDIT_ML_MODEL_PATH_PREVIOUS` | 1 つ前の production artifact path（rollback 用） | 新設（任意。promotion 時に `..._PROD` の旧値を保存） |

artifact path 値の形式は内部実装依存（R2 URL / Workers AI binding 名 / 内部 GUID）。本仕様書では **形式を固定しない**。op 参照値は文字列としてのみ扱い、実値はメモリ上にしか展開しない。

### TypeScript 型

```ts
// scripts/cf-audit-log/rotation/types.ts（新規）
export type ArtifactOpRef = string; // 形式: "op://<vault>/<item>/<field>"

export interface ArtifactPathRefs {
  prod: ArtifactOpRef;       // op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD
  candidate: ArtifactOpRef;  // op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE
  previous?: ArtifactOpRef;  // op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PREVIOUS
}
```

## 2. canary evidence schema（`canary-out.json`）

```ts
export interface CanaryMetrics {
  precisionProxy: number;   // 0..1
  recallProxy: number;      // 0..1
  fallbackRate: number;     // 0..1
  p95LatencyMs: number;     // > 0
  leakageHits: number;      // 0..N（>0 なら canary fail）
}

export interface CanaryOutput {
  canaryRunId: string;                    // ISO timestamp + short hash
  candidatePathRef: ArtifactOpRef;        // op:// 参照（実値ではない）
  baselinePathRef: ArtifactOpRef;
  candidateClassifierVersion: string;     // ml@vX.Y.Z（model 自身が報告）
  baselineClassifierVersion: string;
  replayWindowHours: number;              // default: 1
  totalEventsReplayed: number;
  candidate: CanaryMetrics;
  baseline: CanaryMetrics;
  verdict: 'candidate_pass' | 'candidate_fail_metrics' | 'candidate_fail_leakage' | 'candidate_fail_load';
}
```

必須 field（AC-3）: `precisionProxy` / `recallProxy` / `fallbackRate` / `p95LatencyMs` / `leakageHits`

## 3. rotation evidence schema（`rotation-evidence.json`）

```ts
export interface RotationGate {
  R1_replayPass: boolean;
  R2_latencyAndFallbackPass: boolean;
  R3_runbookApprovalPath: string;  // canonical path to runbook
}

export interface RotationEvidence {
  rotationId: string;                       // rot-YYYY-MM-DD-NNN
  phase: 'canary' | 'promotion' | 'rollback';
  canary: CanaryOutput;
  gate: RotationGate;
  decision: 'promotion_pr_pending' | 'promotion_merged' | 'rollback_pr_pending' | 'rollback_merged' | 'candidate_discarded';
  rollbackInstruction: string;              // "..._PROD を直前 path に戻す PR 1 行"
  rawDatasetIncluded: false;                // 常に false（grep gate で検証）
}
```

`rawDatasetIncluded` field は型レベルで `false` 固定とし、grep gate で違反を検出する設計とする。

## 4. D1 schema 継承（変更なし）

| 列 | 型 | 由来 | 本タスクでの扱い |
| --- | --- | --- | --- |
| `classifier_used` | TEXT | #515 で追加 | 参照のみ |
| `classifier_version` | TEXT | #515 で追加 | rotation 時に値変化（`ml@v1.0.0` → `ml@v1.1.0` 等）。schema 変更なし |
| `confidence` | REAL | #515 で追加 | 参照のみ |

forward-safe 不変条件: rollback でも上記 3 列は **削除しない**。candidate / baseline / previous artifact のいずれが使用中でも `classifier_version` で識別できる。

## 5. ファイルレイアウト

```
scripts/cf-audit-log/rotation/
  ├ types.ts                              ← 新規（上記型定義）
  ├ artifact-canary.ts                    ← 新規
  ├ rotation-evidence-collector.ts        ← 新規
  └ __tests__/
      ├ artifact-canary.test.ts           ← 新規
      └ rotation-evidence-collector.test.ts ← 新規

.github/workflows/
  └ cf-audit-log-artifact-canary.yml      ← 新規

docs/30-workflows/runbooks/
  └ ml-model-artifact-rotation.md         ← 新規

outputs/phase-11/evidence/
  ├ canary-dry-run.json                   ← 実装サイクルで取得
  ├ rotation-evidence.json                ← 実装サイクルで取得
  ├ leakage-grep.log                      ← 実装サイクルで取得
  └ dataset-grep.log                      ← 実装サイクルで取得
```

## 完了条件

- [ ] `ArtifactPathRefs` / `CanaryOutput` / `RotationEvidence` 型を確定
- [ ] op item 3 種（PROD / CANDIDATE / PREVIOUS）の用途を確定
- [ ] D1 schema は変更しない方針を再確認
- [ ] `outputs/phase-11/evidence/` 配下の予約 path を確定

## 参照資料

- `index.md`
- `phase-03.md`
- `apps/api/migrations/0016_cf_audit_log_classification.sql`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 統合テスト連携

- Phase 9 で `CanaryOutput` / `RotationEvidence` の schema validation test を計画。zod schema を採用するか純 TypeScript 型かは Phase 6 の handoff で確定。

## 出力

- `outputs/phase-05/main.md`（型定義要約 + op item 表 + ファイルレイアウト）

## Next Phase

- [Phase 6](phase-06.md): 実装サイクル handoff
