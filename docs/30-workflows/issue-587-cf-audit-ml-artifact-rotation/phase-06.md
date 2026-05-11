# Phase 6: 実装サイクル handoff（関数シグネチャ / PR diff contract）

## 目的

実装サイクルで Phase 3-5 の設計を実装するための関数シグネチャ・PR diff contract・実装順序を確定する。本サイクルでは spec のみ整備し、実装 PR は Gate-R0 通過後の別サイクルで作成する（CONST_007 例外条件 1）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. 関数シグネチャ contract

### `artifact-canary.ts`

```ts
// scripts/cf-audit-log/rotation/artifact-canary.ts
import type { ArtifactOpRef, CanaryOutput, CanaryMetrics } from './types';

export interface ArtifactCanaryOptions {
  candidate: ArtifactOpRef;
  baseline: ArtifactOpRef;
  windowHours?: number;           // default: 1
  out: string;                    // 出力 JSON path
  exitOnLeakage?: boolean;        // default: true
}

export async function runArtifactCanary(opts: ArtifactCanaryOptions): Promise<CanaryOutput>;

// CLI entrypoint:
//   node artifact-canary.ts --candidate <op-ref> --baseline <op-ref> [--window N] --out <path> [--no-exit-on-leakage]
//   exit code: 0 = pass, 1 = leakage / load fail / metrics fail
```

### `rotation-evidence-collector.ts`

```ts
// scripts/cf-audit-log/rotation/rotation-evidence-collector.ts
import type { CanaryOutput, RotationEvidence, RotationGate } from './types';

export interface CollectorOptions {
  canaryOut: string;              // canary-out.json path
  baselineOut?: string;           // baseline 別実行の場合
  result: string;                 // 出力 rotation-evidence.json path
  rotationId?: string;            // 省略時は ISO timestamp ベース
  phase?: 'canary' | 'promotion' | 'rollback'; // default: 'canary'
}

export async function collectRotationEvidence(opts: CollectorOptions): Promise<RotationEvidence>;

// CLI entrypoint:
//   node rotation-evidence-collector.ts --canary-out <path> [--baseline-out <path>] --result <path>
```

### Gate 判定ロジック（collector 内部）

```ts
function evaluateGates(canary: CanaryOutput): RotationGate {
  const candidate = canary.candidate;
  const baseline = canary.baseline;
  return {
    R1_replayPass:
      candidate.precisionProxy >= baseline.precisionProxy &&
      candidate.recallProxy >= baseline.recallProxy,
    R2_latencyAndFallbackPass:
      candidate.fallbackRate < 0.05 &&
      candidate.p95LatencyMs <= baseline.p95LatencyMs * 1.5,
    R3_runbookApprovalPath: 'docs/30-workflows/runbooks/ml-model-artifact-rotation.md',
  };
}
```

R3 は path の存在確認のみ（人手承認が前提）。collector が自動で承認状態を判定することはしない。

## 2. PR diff contract

本サイクル（spec_created）の PR diff:

| ファイル | 種別 | 行数目安 |
| --- | --- | --- |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/index.md` | 新規 | 200+ |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/phase-{01..13}.md` | 新規 | 各 80-250 |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-12/*.md` | 新規 (7 ファイル) | 各 30-100 |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-{11,13}/.gitkeep` | 新規 | 0 |

実装サイクル（Gate-R0 通過後）の PR diff:

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/cf-audit-log/rotation/types.ts` | 新規 | 型定義 |
| `scripts/cf-audit-log/rotation/artifact-canary.ts` | 新規 | canary 本体 |
| `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts` | 新規 | evidence collector |
| `scripts/cf-audit-log/rotation/__tests__/*.test.ts` | 新規 | focused test |
| `.github/workflows/cf-audit-log-artifact-canary.yml` | 新規 | canary workflow |
| `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` | 新規 | rotation runbook |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | rotation セクション追記 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | rotation telemetry / evidence schema |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | `..._CANDIDATE` op 参照新設 |

## 3. 実装順序（実装サイクル）

```
Step 1: types.ts（型定義のみ。test 不要）
Step 2: rotation-evidence-collector.ts + 単体 test（純粋関数のため先行可能）
Step 3: artifact-canary.ts skeleton（mock load 経路で focused test）
Step 4: artifact-canary.ts 実装（実 load + leakage grep 流用）
Step 5: cf-audit-log-artifact-canary.yml（workflow_dispatch + secrets 参照）
Step 6: runbook 本体 + 15-infrastructure-runbook 追記
Step 7: SSOT 3 ファイル更新（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）
Step 8: typecheck / lint / focused test 実行 evidence 取得
```

## 4. PR diff 不変条件

- `apps/api` / `apps/web` / D1 migration ファイルは **編集しない**
- `wrangler` 直接呼出は **0 件**（`bash scripts/cf.sh` 経由のみ）
- candidate path 実値は diff に含めない（op 参照のみ）
- raw feature dataset を含めない（dataset-grep gate で検証）
- 親 #549 の `cf-audit-log-monitor.yml` / `post-switch-monitor.ts` / `fallback-rate-alert.ts` を編集しない

## 5. handoff チェックリスト（実装サイクル開始時に確認）

- [ ] Gate-R0-1〜R0-5（Phase 4）すべて pass
- [ ] worktree 作成: `bash scripts/new-worktree.sh feat/issue-587-cf-audit-ml-artifact-rotation`
- [ ] `mise exec -- pnpm install` 成功
- [ ] `bash scripts/cf.sh whoami` 成功
- [ ] `op signin` 完了
- [ ] Phase 5 の型定義をそのままコピー
- [ ] Phase 9 のテスト計画を確認

## 完了条件

- [ ] 関数シグネチャ 2 種（`runArtifactCanary` / `collectRotationEvidence`）を確定
- [ ] PR diff contract（spec_created cycle / 実装 cycle）を確定
- [ ] 実装順序 8 step を確定
- [ ] PR diff 不変条件 5 項目を確定

## 参照資料

- `index.md`
- `phase-03.md` ・ `phase-05.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-06.md`

## 統合テスト連携

- Phase 9 で本 handoff の関数シグネチャに対する focused test を計画。

## 出力

- `outputs/phase-06/main.md`（関数シグネチャ + PR diff contract + 実装順序）

## Next Phase

- [Phase 7](phase-07.md): 整合性検証
