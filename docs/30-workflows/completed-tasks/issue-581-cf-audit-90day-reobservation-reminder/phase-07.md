# Phase 7: evidence 取得（Gate-B / Gate-C）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 7 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

Gate-B（FPR ≤ 5%）と Gate-C（tuning cost ≥ 4h/月）判定のための evidence を取得する。

## Gate-B 実行手順

1. cf-audit alert issue を `gh api --paginate` で取得（Phase 3 コマンド）
2. D1 `cf_audit_log` 90 日集計を read-only `SELECT` で取得
3. baseline thresholds を read-only `SELECT` で取得
4. `false_positive_rate` を以下で計算:

```bash
TOTAL=$(jq 'length' outputs/phase-11/gh-issues-cf-audit.json)
FP=$(jq '[.[] | select(.labels | index("false-positive"))] | length' outputs/phase-11/gh-issues-cf-audit.json)
echo "FPR=$(echo "scale=4; $FP / $TOTAL" | bc)"
```

5. D1 unreadiness の場合は `PENDING_RUNTIME_EVIDENCE` marker を `d1-cf-audit-90day-summary.json` に記録（CONST 不変条件 5）

## Gate-C 実行手順

1. `cf-audit-tuning` ラベル issue / comment から owner-authored monthly minutes を抽出
2. owner = `daishiman` 限定で集計
3. `tuning-cost-summary.md` に月別 minutes table を記録

```markdown
| 月 | minutes | source |
| --- | --- | --- |
| 2026-08 | 240 | issue #XXX comment |
| 2026-09 | 180 | issue #YYY |
...
```

owner-authored evidence が 1 件も無い場合は `PENDING_RUNTIME_EVIDENCE` 固定。

## D1 readiness 判定詳細

| 結果 | 取り扱い |
| --- | --- |
| `error: no such table: cf_audit_log` | Gate-B PENDING、`observation_continue` |
| `total_events: 0` 表存在 | Gate-B 判定可、`false_positive_rate = 0` も成立し得る |
| 正常結果 | Gate-B 判定可 |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/gh-issues-cf-audit.json` | alert issue evidence |
| `outputs/phase-11/d1-cf-audit-90day-summary.json` | D1 集計または `PENDING_RUNTIME_EVIDENCE` |
| `outputs/phase-11/baseline-90day-thresholds.json` | baseline thresholds または `PENDING_RUNTIME_EVIDENCE` |
| `outputs/phase-11/tuning-cost-summary.md` | 月別 minutes table |
| `outputs/phase-11/tuning-cost-issues.json` | source issue evidence |

## 完了条件

- [ ] Gate-B 全 evidence が取得済（`PENDING_RUNTIME_EVIDENCE` でも可）
- [ ] Gate-C 全 evidence が取得済（`PENDING_RUNTIME_EVIDENCE` でも可）
- [ ] D1 unreadiness 時の判定取り扱いがドキュメントに残っている

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-07.md`
