# Phase 6: evidence 取得（Gate-A）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 6 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

Gate-A（90 日 continuity）判定のための monitor / watchdog run history を JSON array として取得する。

## 実行手順

1. Phase 3 の Gate-A コマンドを順に実行する
2. 各 JSON ファイルが array 形式であることを `jq 'type'` で確認する
3. 90 日 window 内の最古 run / 最新 run の `createdAt` を `jq` で抽出し log に記録
4. `success_count` / `failure_count` / `gap_2h_count` を集計する

## 集計スクリプト例

```bash
WINDOW=$(date -u -v-90d +%FT%TZ)  # macOS
# Linux: WINDOW=$(date -u -d '90 days ago' +%FT%TZ)

jq --arg w "$WINDOW" '
  map(select(.createdAt >= $w)) |
  {
    total: length,
    success: map(select(.conclusion=="success")) | length,
    failure: map(select(.conclusion=="failure")) | length,
    earliest: (min_by(.createdAt) | .createdAt),
    latest:   (max_by(.createdAt) | .createdAt)
  }
' docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/gh-run-list-cf-audit-log-monitor.json
```

## gap 検出

```bash
jq --arg w "$WINDOW" '
  map(select(.createdAt >= $w)) | sort_by(.createdAt) |
  [range(1; length) as $i | {
    prev: .[$i-1].createdAt,
    curr: .[$i].createdAt,
    gap_seconds: (((.[$i].createdAt | fromdateiso8601) - (.[$i-1].createdAt | fromdateiso8601)))
  }] | map(select(.gap_seconds > 7200))
' docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/gh-run-list-cf-audit-log-monitor.json
```

`gap_seconds > 7200`（2h）が 0 件であれば PASS 候補。

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` | monitor history（JSON array） |
| `outputs/phase-11/gh-run-list-watchdog.json` | watchdog lifecycle marker（JSON object; Issue #518 HOLD で workflow 削除済み） |
| `outputs/phase-11/gate-a-aggregation.md` | success / failure / gap 集計結果 |

## 完了条件

- [ ] 両 JSON が `jq 'type' == "array"` を満たす
- [ ] `gate-a-aggregation.md` に success/failure/gap が数値で記録されている
- [ ] failure / gap の根本原因が「別 issue 委譲」として明示されている（このタスクでは修正しない）

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-06.md`
