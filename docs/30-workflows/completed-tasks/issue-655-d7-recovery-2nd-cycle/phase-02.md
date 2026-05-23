# Phase 2 — 設計 (`--recovery-mode` 仕様 / evidence path 規約)

## 目的

`post-switch-monitor.ts` への `--recovery-mode` 拡張 と evidence path 分離規約を確定する。

## 設計内容

### CLI 仕様 (`scripts/cf-audit-log/observation/post-switch-monitor.ts`)

```
post-switch-monitor.ts --aggregate
  --window 168
  --recovery-mode                  # NEW: recovery 集計に切替
  --since <ISO8601>                # NEW: recovery 起点 D'+0 を明示
  --input <download-dir>           # recovery では ./hourly-snapshots-recovery
  --out <path>
  --expected-snapshots 168
  --require-non-skeleton
```

挙動:
- `--recovery-mode` true のとき: `--input` 既定値を `./hourly-snapshots-recovery`、`--out` 既定値を `outputs/phase-11/evidence/hourly-run-7day-summary-recovery.json` に切替。`--since` 必須化（未指定なら exit 2）。
- `--recovery-mode` false (既定): 従来挙動（親 #586 互換）。

### evidence path 分離規約

| 種別 | 1 周目 (親 #586) | 2 周目 (本タスク) |
| --- | --- | --- |
| run URL 一覧 | `hourly-run-7day.md` | `hourly-run-7day-recovery.md` |
| 集計 JSON | `hourly-run-7day-summary.json` | `hourly-run-7day-summary-recovery.json` |
| leakage log | `leakage-grep-7day.log` | `leakage-grep-7day-recovery.log` |
| daily check | `hourly-run-daily-check.md` | `hourly-run-daily-check-recovery.md` |
| issue rate 比較 | `issue-rate-comparison.md` | `issue-rate-comparison-recovery.md` |

### `.github/workflows/cf-audit-log-7day-summary.yml` 設計

```yaml
on:
  workflow_dispatch:
    inputs:
      recovery_mode:
        description: "Run as recovery (2nd cycle) aggregation"
        type: boolean
        default: false
      since:
        description: "Recovery D'+0 ISO8601 UTC (required when recovery_mode=true)"
        type: string
        default: ""
```

jobs.aggregate ステップで `recovery_mode == 'true'` のとき `--recovery-mode --since "${{ inputs.since }}"` を `post-switch-monitor.ts` に渡す。

### PR 切り分け

- **PR-A**: scripts / workflow YAML / runbook / focused test を含む (今サイクル完成)
- **PR-B**: D'+7 完走後の evidence + SSOT 4 ファイル更新のみ (時間経過後)

## 完了条件

- [ ] CLI 仕様が確定し phase-05 で実装可能な粒度になっている
- [ ] evidence path 規約が表形式で確定
- [ ] PR-A / PR-B のスコープが分離されている
