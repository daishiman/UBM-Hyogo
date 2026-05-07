# Phase 3: 設計（Classifier 抽象 / feature schema / evaluation / rollback）

## 目的

classifier 抽象化、feature schema、offline evaluation harness、rollback path の設計を確定する。

## 設計

### Classifier 抽象

```
ディレクトリ:
scripts/cf-audit-log/classifier/
  ├ types.ts        // Classifier interface + SeverityResult 型
  ├ threshold.ts    // 既存 severity-classifier.ts を wrap
  ├ ml.ts           // ML skeleton + threshold fallback
  └ index.ts        // getClassifier(env) factory
```

#### `Classifier` interface

```ts
export interface SeverityResult {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;          // 0.0 - 1.0
  classifierUsed: 'threshold' | 'ml';
  classifierVersion: string;   // semver-ish ('threshold@1.0.0', 'ml@v0.0.0-skeleton')
  reason: string;              // 判定根拠（既存 severity-classifier.ts 由来文字列を保持）
}

export interface Classifier {
  classify(input: ClassifierInput): SeverityResult | null; // null = NONE
}
```

#### `getClassifier(env: Env): Classifier`

- `env.CF_AUDIT_CLASSIFIER === 'ml'` → skeleton `MLClassifier`（常時 threshold fallback）
- それ以外（未指定 / 不正値）→ `ThresholdClassifier`

### Feature schema

```
scripts/cf-audit-log/features/
  ├ schema.ts       // TS 型 + JSON schema export
  └ extract.ts      // extractFeatures(event): RedactedFeatures
```

`RedactedFeatures`:

| field | 型 | 由来 / redaction |
| --- | --- | --- |
| `ipBucket` | string | IP の `/24` 部分のみ（`a.b.c.0`）。IPv6 は `/48` |
| `hourOfDay` | int (0-23) | `event.timestamp` から UTC で計算 |
| `dayOfWeek` | int (0-6) | UTC |
| `actionCategory` | enum | `auth` / `tokens` / `dns` / `workers` / `d1` / `kv` / `r2` / `other` |
| `statusClass` | enum | `2xx` / `3xx` / `4xx` / `5xx` |
| `actorRoleHash` | string | `sha256(SECRET + actor_email)` の先頭 16 hex |
| `userAgentCategory` | enum | `cli-wrangler` / `gh-actions` / `browser` / `unknown`（生 UA は捨てる） |
| `tokenIdPresent` | bool | Token id が存在したかの bool だけ。値は捨てる |

### Offline evaluation harness

```
scripts/cf-audit-log/evaluation/
  ├ offline-replay.ts        // dataset → classifier → metrics
  └ secret-leakage-grep.ts   // exported dataset / log の生 secret 検出
```

`offline-replay.ts` 出力 (JSON to stdout / `--out=<file>`):

```json
{
  "classifier": "threshold",
  "version": "threshold@1.0.0",
  "totalEvents": 1234,
  "labeledAnomalies": 45,
  "predictedAnomalies": 50,
  "truePositive": 40,
  "falsePositive": 10,
  "falseNegative": 5,
  "trueNegative": 1179,
  "precision": 0.80,
  "recall": 0.888,
  "fpRate": 0.0084,
  "fnRate": 0.111
}
```

### Rollback path

- env で `CF_AUDIT_CLASSIFIER=threshold` に戻す（即時、1 step）
- D1 カラム追加は不可逆 migration → DOWN SQL を migration ファイル内に併記し、rollback 時に手動 apply

## 出力

`outputs/phase-03/main.md` に以下を記述:

- 上記設計図の実体（interface / schema / 出力形式）
- 既存 `severity-classifier.ts` から `ThresholdClassifier` への mapping 表
- redaction 方針の根拠（secret leakage 防止）
- rollback 手順（env / D1 / workflow）

## 完了条件

- [ ] `Classifier` interface の最終形を確定
- [ ] `RedactedFeatures` の field を確定（追加・削除なし）
- [ ] offline replay の出力 JSON schema を確定
- [ ] rollback 手順を 3 step 以内で記述

## 参照資料

- `index.md`
- `phase-01.md` ・ `phase-02.md`

## 統合テスト連携

- Phase 9 で本設計の各 interface 実装を test 対象として登録

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 03-1 | この Phase の契約を確定する |
| 03-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
