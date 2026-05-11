# Implementation Guide — ML model artifact rotation (Issue #587)

## Part 1（中学生レベル）

### 例え話

- **artifact rotation** は「教科書を新しい版に交換するときに、古い版もすぐ手に取れる場所に残しておく作業」。新しい版に問題があったら、すぐ古い版に戻せるようにしておく。
- **candidate evaluation** は「新しい教科書をいきなり全クラスで使わず、まず 1 クラスだけで試す」。
- **canary** は「炭鉱で先に行ってもらうカナリア」。本番より先に candidate を試して、危険があれば早めに気付く。
- **rotation の rollback** は「新しい教科書で問題が出たら、古い版に 1 行で戻す」。机の位置（D1 列）はそのまま。
- **leakage grep** は「新しい教科書のコピーをするときに、住所や電話番号が紛れ込んでいないか毎回チェックする」。

### 用語セルフチェック

| 用語 | 中学生向け説明 |
| --- | --- |
| artifact | 学習結果を保存したファイル |
| candidate | 次に使う候補（まだ正式採用ではない） |
| promotion | 候補を本番に正式採用すること |
| rollback | 元に戻す手順 |
| precision/recall proxy | 「正解率」と「取りこぼし率」を簡単に近似した指標 |
| fallback | うまくいかない時の代わりの手段 |

### なぜ → 何をする

- なぜ: 次世代モデルに切替えると、誤検知が増えたり、見逃しが増えたりするかもしれない。突然全部切替えると影響が大きい。
- 何をする:
  1. 候補（candidate）を staging で 1 hour 分試す
  2. 結果を JSON にまとめる（精度・速度・漏洩チェック）
  3. OK なら本番（PROD）の参照値を 1 行書き換えて切替
  4. 危なくなったら、古い参照値に 1 行で戻す（D1 のデータ列はそのまま）

## Part 2（技術者レベル）

### Classifier interface

親 #515 由来の `Classifier` interface は **変更しない**。本タスクは `MLClassifier` skeleton に candidate path を渡す経路を整えるのみ。

### TypeScript 型

```ts
export type ArtifactOpRef = string;

export interface ArtifactPathRefs {
  prod: ArtifactOpRef;
  candidate: ArtifactOpRef;
  previous?: ArtifactOpRef;
}

export interface CanaryMetrics {
  precisionProxy: number;
  recallProxy: number;
  fallbackRate: number;
  p95LatencyMs: number;
  leakageHits: number;
}

export interface CanaryOutput {
  canaryRunId: string;
  candidatePathRef: ArtifactOpRef;
  baselinePathRef: ArtifactOpRef;
  candidateClassifierVersion: string;
  baselineClassifierVersion: string;
  replayWindowHours: number;
  totalEventsReplayed: number;
  candidate: CanaryMetrics;
  baseline: CanaryMetrics;
  verdict: 'candidate_pass' | 'candidate_fail_metrics' | 'candidate_fail_leakage' | 'candidate_fail_load';
}

export interface RotationGate {
  R1_replayPass: boolean;
  R2_latencyAndFallbackPass: boolean;
  R3_runbookApprovalPath: string;
}

export interface RotationEvidence {
  rotationId: string;
  phase: 'canary' | 'promotion' | 'rollback';
  canary: CanaryOutput;
  gate: RotationGate;
  decision: 'promotion_pr_pending' | 'promotion_merged' | 'rollback_pr_pending' | 'rollback_merged' | 'candidate_discarded';
  rollbackInstruction: string;
  rawDatasetIncluded: false;
}
```

### API シグネチャ

```ts
runArtifactCanary(opts: {
  candidate: ArtifactOpRef;
  baseline: ArtifactOpRef;
  windowHours?: number;
  out: string;
  exitOnLeakage?: boolean;
}): Promise<CanaryOutput>;

collectRotationEvidence(opts: {
  canaryOut: string;
  baselineOut?: string;
  result: string;
  rotationId?: string;
  phase?: 'canary' | 'promotion' | 'rollback';
}): Promise<RotationEvidence>;
```

### 設定可能パラメータ

| 名前 | 値 |
| --- | --- |
| `inputs.candidatePath`（workflow_dispatch） | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE` |
| `inputs.replayWindowHours` | default: `1` |
| canary fail 閾値 fallbackRate | `>= 0.05` で fail |
| canary fail 閾値 p95Latency | `> baseline * 1.5` で fail |
| canary fail 閾値 leakageHits | `> 0` で fail |
| canary fail 閾値 precision/recall | `< baseline` で fail |

### エラーハンドリング

- candidate load 失敗 → `MLClassifier` skeleton の threshold fallback（staging のみ）
- leakage grep positive → canary fail（exit 1）+ log redact
- metrics fail → promotion 不可。FU-03-C #548 へ差し戻し

### runtime path × evidence

| runtime path | evidence | 取得サイクル |
| --- | --- | --- |
| canary dry-run | `evidence/canary-dry-run.json` + `evidence/test.log` | 実装サイクル |
| leakage grep | `evidence/leakage-grep.log` | 実装サイクル |
| dataset grep | `evidence/dataset-grep.log` | 実装サイクル |
| promotion / rollback | `evidence/hourly-run-after-promotion.json` | Gate 後 |

### forward-safe rollback の 1 step

```
op item edit ubm-hyogo-env --vault Employee \
    CF_AUDIT_ML_MODEL_PATH_PROD=<previous の値>
# D1 列は削除しない
# hourly workflow の env (CF_AUDIT_CLASSIFIER) は変更しない
```

### 親タスク参照

`docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md` を canonical absolute path で参照。本タスクは「artifact rotation の 4 段（candidate / canary / promotion / rollback）」の差分のみを担う。

## 本サイクル実装結果（2026-05-10）

本サイクルでは implemented_local_runtime_pending として以下を実装し、本ワークツリーで実 evidence を取得した。production artifact promotion は依然として Gate-R0〜R3 + user approval 後の別サイクルに残す。

| 種別 | パス |
| --- | --- |
| 型定義 | `scripts/cf-audit-log/rotation/types.ts` |
| canary 本体 | `scripts/cf-audit-log/rotation/artifact-canary.ts` |
| evidence collector | `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts` |
| focused tests | `scripts/cf-audit-log/rotation/__tests__/artifact-canary.test.ts` (10 件) / `rotation-evidence-collector.test.ts` (9 件) — 合計 19 件 |
| canary workflow | `.github/workflows/cf-audit-log-artifact-canary.yml` (`workflow_dispatch` 起動 + op-ref validation + evidence upload) |
| runbook | `docs/30-workflows/runbooks/ml-model-artifact-rotation.md`（既存。今回更新は最小） |
| SSOT | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` / `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md` |

設計上の決定:

- runtime artifact load / replay / leakage scan を `runArtifactCanary` の `deps` 経由で注入する dependency-injected な構造とした。テストは fake で全 verdict 経路（pass / fail_load / fail_leakage / fail_metrics）を網羅する。
- error message に op reference 値が含まれた場合に `<redacted-op-ref>` に置換する `sanitizeError` を内蔵し、A6 / A7 で grep アサート済み。
- `--no-exit-on-leakage` は exit code のみを 0 にするフラグで、verdict は `candidate_fail_leakage` のまま JSON に保存される（promotion gate を素通りさせる用途には流用できない）。
- `op` ref 形式 (`op://<vault>/<item>/<field>`) を入口で validate（非 op-ref 入力は throw / workflow step も同等の case で reject）。

evidence:

| 評価 | パス | 結果 |
| --- | --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.log` | exit_code=0 |
| lint | `outputs/phase-11/evidence/lint.log` | exit_code=0 |
| focused tests | `outputs/phase-11/evidence/test.log` | 19 / 19 pass |
| canary dry-run | `outputs/phase-11/evidence/canary-dry-run.json` | local fixture replay / `candidate_pass` |
| rotation evidence | `outputs/phase-11/evidence/rotation-evidence.json` | R1/R2 true, R3 approval false, promotion blocked |
| leakage (AC-6) | `outputs/phase-11/evidence/leakage-grep.log` | resolved-value grep PASS |
| dataset (AC-11) | `outputs/phase-11/evidence/dataset-grep.log` | rotation tree / evidence dir / canary workflow いずれも PASS |
