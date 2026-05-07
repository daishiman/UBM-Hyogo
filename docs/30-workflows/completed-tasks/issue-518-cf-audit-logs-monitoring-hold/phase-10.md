# Phase 10: 統合検証（dry-run 起動）

`[実装区分: 実装仕様書]`

判定根拠: `workflow_dispatch` の `dry_run=true` 動作で Issue 起票が skip されることを runtime で確認する必要がある。コード変更の挙動検証。

---

## 目的

merge 前または dev branch で `workflow_dispatch` を発火し、`dry_run=true` 既定で analyze ステップが Issue 起票を skip することを確認する。

## 前提

Phase 5 / 6 の YAML 変更が本ブランチに commit されていること。GitHub Actions 上で本ブランチを参照して `workflow_dispatch` 起動できること（または PR 作成後 dev/main で再実施）。

## 検証手順

```bash
# 本ブランチを push してから（Phase 13 の前段でも可）
gh workflow run cf-audit-log-monitor.yml \
  --ref spec/issue-518-cf-audit-logs-monitoring-hold \
  -f dry_run=true

# run 確認
gh run list --workflow=cf-audit-log-monitor.yml --limit=3 \
  | tee outputs/phase-10/run-list.log
gh run view <RUN_ID> --log \
  | tee outputs/phase-10/run-view.log
```

## 期待結果

| 観点 | 期待 |
| --- | --- |
| run 発火 | `event=workflow_dispatch` で 1 件発火 |
| `dry_run` 入力 | `true`（明示入力。既定値 true は Phase 9 の静的確認で証明） |
| analyze ステップ | `--dry-run` フラグ付きで `analyze.ts` が実行される |
| Issue 起票 | 発生しない（dry-run のため） |
| heartbeat 更新 | success 時に `CF_AUDIT_LAST_SUCCESS_AT` が更新される（既存挙動。本タスク責務外で許容） |
| schedule 起源 run | 同期間内に schedule 起源の run が 0 件（Phase 11 で別途確認） |

## 関数 / シグネチャ

該当なし。

## 入出力 / 副作用

- 副作用: 1 回の手動 workflow run（無料枠の minor 消費）
- 副作用: `CF_AUDIT_LAST_SUCCESS_AT` Variable の値更新（許容）

## テスト方針

runtime 1 回限りの dry-run 検証。`outputs/phase-10/*.log` が evidence。

## ローカル実行・検証コマンド（再掲）

```bash
gh workflow run cf-audit-log-monitor.yml --ref spec/issue-518-cf-audit-logs-monitoring-hold -f dry_run=true
gh run list --workflow=cf-audit-log-monitor.yml --limit=3
gh issue list --label cf-audit --state open --limit 5    # 本 run 起源の新規 Issue が無いこと
```

## DoD

- 1 回の dry-run が `success` で完了
- 同 run 起源で新規 Issue が起票されていない
- `outputs/phase-10/run-view.log` に dry-run 実行ログが残る
