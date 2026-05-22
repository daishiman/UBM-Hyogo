# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か: 今の仕組みは、決められた合格ラインであやしい動きを見つける。これだけだと、あやしくないものを間違えて知らせたり、本当にあやしいものを見逃したりすることがある。

たとえば、給食の新メニューを出す前に、試食で味を確かめ、1週間アンケートを取るようなものです。いきなり全校に出すのではなく、まず安全に試し、問題があれば前のメニューに戻せるようにします。

何をするか: 新しい判定方法を本番に切り替える前に、試験結果、戻し方、1週間の見守り方を決める。本サイクルでは見守り用スクリプトを用意し、本番切替はまだ実行しない。

| 用語 | 日常語の言い換え |
| --- | --- |
| classifier | 判定する人 |
| threshold | 合格ライン |
| ML | データから合格ラインを学ぶ仕組み |
| rollback | 元に戻す手順 |
| fallback | うまくいかない時の代わりの手段 |
| artifact | 学んだ結果を保存したファイル |

### 今回作ったもの

| 作ったもの | 説明 |
| --- | --- |
| 手順書 | いつ新しい判定方法へ切り替えるかを決めた |
| 見守り表 | 1 週間で何を確認するかを決めた |
| 戻し方 | 危なくなった時に前の判定方法へ戻す方法を決めた |

## Part 2: 技術者レベル

### Current Contract

親 #515 の `Classifier` abstraction と D1 追加列を変更しない。production switch は env のみで行い、rollback でも D1 列を削除しない。

```ts
type ClassifierName = "threshold" | "ml";

interface PostSwitchMonitorOutput {
  hour: string;
  classifierUsed: ClassifierName;
  classifierVersion: string;
  totalEvents: number;
  issuesOpenedThisHour: number;
  fallbackRate: number;
  p95LatencyMs: number;
  leakageGrepResult: "clean" | "dirty";
}

interface FallbackRateAlertPayload {
  consecutiveHours: number;
  threshold: number;
  observations: PostSwitchMonitorOutput[];
}

interface MLClassifierLoadResult {
  classifierUsed: ClassifierName;
  modelPath?: string;
  fallbackReason?: string;
}
```

### Target Delta

- `CF_AUDIT_CLASSIFIER`: `threshold` または `ml`。Gate-A〜C 通過後のみ production で `ml`。
- `ML_MODEL_PATH`: `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD`。実値を docs / logs / PR body に残さない。
- `CF_AUDIT_FALLBACK_RATE_THRESHOLD`: `0.05`。
- `CF_AUDIT_FALLBACK_RATE_CONSECUTIVE_HOURS`: `3`。

### Runtime Path x Evidence

| runtime path | evidence | サイクル |
| --- | --- | --- |
| hourly classifier path | `outputs/phase-11/evidence/test.log` + `outputs/phase-11/evidence/hourly-run-7day.md` | 実装サイクル |
| model artifact load path | `outputs/phase-11/evidence/dry-run-ml.log` | 実装サイクル |
| leakage grep post-step path | `outputs/phase-11/evidence/grep-gate.log` | 実装サイクル |

### APIシグネチャ

```bash
pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts --aggregate --input <hourly-json-dir> --out <json>
pnpm tsx scripts/cf-audit-log/observation/fallback-rate-alert.ts --input <last-3-hours-json> --threshold 0.05
pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts <artifact-path-or-dir> --exit-on-detect
```

### 使用例

```bash
pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
  --input outputs/phase-11/evidence/hourly.jsonl \
  --out outputs/phase-11/evidence/fallback-rate-7day.json
```

### エラーハンドリング

- model artifact load failure: threshold fallback を発動し、`fallbackReason` を evidence に残す。
- fallback rate over: GitHub Issue を起票し、rollback PR 判断へ進む。
- leakage positive: hourly run を fail させ、Issue body 削除と token revoke を runbook へ接続する。

### エッジケース

- Gate-A が未通過の場合は `ml` に切り替えず threshold を継続する。
- `ML_MODEL_PATH` が未設定または読めない場合は threshold fallback とし、runtime PASS と扱わない。
- Issue #518 HOLD 中の manual-check-only 状態では、schedule 再有効化を本タスクに混ぜない。

### 設定項目と定数一覧

| name | value |
| --- | --- |
| `CF_AUDIT_CLASSIFIER` | `threshold` / `ml` |
| `ML_MODEL_PATH` | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` |
| `CF_AUDIT_FALLBACK_RATE_THRESHOLD` | `0.05` |
| `CF_AUDIT_FALLBACK_RATE_CONSECUTIVE_HOURS` | `3` |

### テスト構成

| test | evidence |
| --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.log` |
| lint | `outputs/phase-11/evidence/lint.log` |
| focused vitest | `outputs/phase-11/evidence/test.log` |
| leakage grep | `outputs/phase-11/evidence/grep-gate.log` |

### Post-switch Observation Checklist

- 168 hourly snapshots が存在する。
- fallback rate mean が 5% 以下。
- leakage grep が 7 日連続 clean。
- Issue 起票数が threshold baseline 比で許容範囲。
- over の場合は `CF_AUDIT_CLASSIFIER=threshold` へ戻す PR を作る。
