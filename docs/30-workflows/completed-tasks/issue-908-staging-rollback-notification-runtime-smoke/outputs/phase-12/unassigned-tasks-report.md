# Unassigned Tasks Report — issue-908-staging-rollback-notification-runtime-smoke

## 検出結果

**未タスク: 0 件**

## 詳細

| Candidate | 判定 | 理由 |
| --- | --- | --- |
| production 環境 smoke | 対象外 | 親 AC-6 は staging で充足。production は別 release gate で判断（明示的 out-of-scope） |
| bulk rollback smoke | 別管理 | `serial-05-step-03-followup-006-schema-alias-bulk-rollback` で別管理 |
| 集計再実行 smoke | 別管理 | issue #836 |
| smoke helper の共通 `_lib/redact.sh` 切り出し | YAGNI | 現状 helper 1ファイルのみ。横展開時に対応 |
| smoke helper の vitest / bats spec 追加 | 不要 | `bash -n` + `--dry-run` + grep で実用十分。spec 言語複雑化のメリット小 |
| automated cron による smoke 定期実行 | 別管理 | user-gated 原則を破るため本タスクに含めない。`ut-17-followup-003` 確立後に検討可 |

## CONST_007 整合

本 cycle で先送りされた作業はない。上記 candidate はいずれも独立完了済み/別 issue/原則違反 のため本タスクスコープ外であり、未タスクとして起票しない。
