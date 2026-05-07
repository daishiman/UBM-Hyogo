# Phase 11: runtime evidence（schedule 停止確認）

`[実装区分: 実装仕様書]`

判定根拠: schedule 削除の真の効果は merge 後の hourly tick で発火しないことで証明する必要があり、runtime 観測が必須。

---

## 目的

main merge 後に hourly tick（`0 * * * *`）が発火しないことを `gh run list` で確認し、AC-10 を満たす runtime evidence を取得する。

## 前提

Phase 13 で PR が merge 済み（または dev で同等観測可）。merge 完了から少なくとも 1 時間後に観測する。本 Phase は post-merge runtime observation であり、PR 作成前のブロッキング gate ではない。PR 時点の状態語彙は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とする。

## 検証手順

```bash
# merge 完了時刻を記録
date -u +%Y-%m-%dT%H:%M:%SZ > outputs/phase-11/merge-time.txt

# 1 時間後（次の hourly tick を跨いだ後）に実行
gh run list --workflow=cf-audit-log-monitor.yml --limit=100 \
  --json databaseId,event,createdAt,conclusion,headBranch,displayTitle \
  > outputs/phase-11/run-list-post-merge.json

# merge 後 main schedule 起源の run だけを抽出
MERGE_TIME=$(cat outputs/phase-11/merge-time.txt)
jq --arg merge_time "$MERGE_TIME" \
  '[.[] | select(.event == "schedule" and .headBranch == "main" and .createdAt >= $merge_time)]' \
  outputs/phase-11/run-list-post-merge.json \
  > outputs/phase-11/schedule-runs.json

# watchdog YAML が GitHub 上から消えていることを API 確認
gh api repos/daishiman/UBM-Hyogo/contents/.github/workflows/cf-audit-log-monitor-watchdog.yml \
  > outputs/phase-11/watchdog-api-response.json 2>&1 || true
# → 期待: 404（HTTP 404 を含む）
```

## 期待結果

| 観点 | 期待 |
| --- | --- |
| merge 後 1 時間以降の `event=schedule` run | 0 件 |
| `event=workflow_dispatch` run | Phase 10 の 1 件のみ（または 0） |
| watchdog YAML API | 404 |
| watchdog の `event=schedule` run | 0 件 |

```bash
gh run list --workflow=cf-audit-log-monitor-watchdog.yml --limit=5 \
  > outputs/phase-11/watchdog-run-list.txt 2>&1 || true
# 期待: workflow not found エラー
```

## evidence 一覧

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/merge-time.txt` | merge 完了 UTC 時刻 |
| `outputs/phase-11/run-list-post-merge.json` | merge 後の run 一覧 |
| `outputs/phase-11/schedule-runs.json` | schedule 起源 run の抽出結果（空配列期待） |
| `outputs/phase-11/watchdog-api-response.json` | watchdog YAML 削除確認 |
| `outputs/phase-11/watchdog-run-list.txt` | watchdog workflow 未存在確認 |

## 関数 / シグネチャ

該当なし。

## 入出力 / 副作用

なし（read-only API 呼び出し）。

## テスト方針

runtime 観測のみ。

## DoD

- AC-10: merge 後 1 時間で schedule 起源 run が 0 件
- watchdog YAML が GitHub 上から消えている（API 404）
- evidence 5 ファイルが `outputs/phase-11/` に保存
- 状態語彙: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（observation 完了後 `completed`）
