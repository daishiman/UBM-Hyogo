# U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01-RECOVERY — D+7 snapshots 不足時の 2 周目 7 日観測

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手（条件付き起票） |
| 親 | `docs/30-workflows/issue-586-post-switch-7day-close-out/` |
| 祖父 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| 起票元 | `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-12/unassigned-task-detection.md` |
| 起票条件 | D+7 集計時に 168 hourly snapshots が揃わなかった場合 |
| 優先度 | MEDIUM |
| Wave | follow-up（条件付き recovery） |
| visualEvidence | NON_VISUAL |

## 1. なぜこのタスクが必要か（Why）

Issue #586 の `pass_runtime_synced` 昇格条件は 168 hourly snapshots（7 日 × 24 hour）が揃うことだが、GitHub Actions infrastructure 障害 / artifact retention 切れ / CF_AUDIT_CLASSIFIER 切替遅延などにより snapshots が欠損する可能性がある。欠損理由が production code 側起因の場合は再観測が必要だが、その場合の手順・evidence path・成功条件が現仕様には明文化されていない。本タスクでは欠損検知後の 2 周目 7 日観測サイクルを正式な recovery タスクとして起こす。

## 2. 何を達成するか（What）

- D+7 集計で `actualSnapshots < expectedSnapshots(168)` または `leakage-grep` が 1 hour でも positive 検出した場合、recovery 開始日を D'+0 として 168 hour 再観測を実行する
- 欠損理由を分類し、infrastructure 障害なら 1 周目データの欠損 hour を `outputs/phase-11/evidence/hourly-run-7day.md` に明記したまま昇格、production code 起因なら 2 周目を再収集して上書きする
- 2 周目 evidence を `outputs/phase-11/evidence/hourly-run-7day-recovery.md` に分離保存し、1 周目 baseline 比較を維持する

## 3. どのように実行するか（How）

1. `cf-audit-log-7day-summary.yml` の出力 JSON が `actualSnapshots: 168 / leakageHourlyClean: true` を満たさないことを検知
2. 欠損理由の分類を `outputs/phase-11/evidence/recovery-rootcause.md` に記録
3. infrastructure 起因なら昇格続行、production code 起因なら code 修正 PR を起こした上で D'+0 を再設定
4. `cf-audit-log-monitor.yml` を 168 hour 連続稼働させ、recovery 集計 workflow を起動
5. 2 周目 evidence で AC-6/AC-7/AC-8 を再充足し、SSOT 4 ファイルを `pass_runtime_synced` に昇格

## 4. 実行手順

1. snapshots 欠損 / leakage positive を検知する
2. 欠損 hour と root cause を分類記録
3. recovery 起点を確定（D'+0）
4. 168 hour 再観測の hourly run を回す
5. 集計 workflow を再起動し evidence を生成
6. SSOT 4 ファイル更新と issue-586 への参照リンクを追記

## 5. 完了条件チェックリスト

- [ ] `recovery-rootcause.md` に欠損 root cause 分類が記載されている
- [ ] 2 周目 168 hourly snapshots が揃っている
- [ ] 2 周目 leakage grep 7 日連続 clean
- [ ] `hourly-run-7day-recovery.md` / `hourly-run-7day-summary-recovery.json` が `outputs/phase-11/evidence/` に保存されている
- [ ] SSOT 4 ファイル（observability-monitoring / task-workflow-active / 親 #549 phase-13.md / 15-infrastructure-runbook）が `pass_runtime_synced` に昇格済み

## 6. 検証方法

- `post-switch-monitor.ts --aggregate --window 168 --recovery-mode` の出力 JSON を確認
- baseline（threshold 期 / 1 周目）との fallback rate / p95 latency / Issue 起票数を `issue-rate-comparison-recovery.md` で比較
- `gh run list --workflow cf-audit-log-monitor.yml` で 168 hour 連続成功を確認

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| recovery でも欠損が再発 | 3 周目は infrastructure team に escalation。本タスク内で再発時の打ち切り条件（最大 2 周）を明記 |
| 1 周目 / 2 周目混在による評価誤り | evidence path を `*-recovery.*` に分離し、aggregation script の `--recovery-mode` で混在排除 |
| recovery 中の追加 production code 変更 | recovery window 中は cf-audit-log 関連 code freeze（runbook で明記） |

## 8. 参照情報

- `docs/30-workflows/issue-586-post-switch-7day-close-out/index.md`
- `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-12/implementation-guide.md`
- `.github/workflows/cf-audit-log-monitor.yml`
- `.github/workflows/cf-audit-log-7day-summary.yml`
- `scripts/cf-audit-log/observation/post-switch-monitor.ts`

## 9. 苦戦箇所（将来の課題解決のための記録）

- 7 日 = 168 hour の snapshots を **artifact retention 内**で揃える必要があるため、retention-days を 8 以上に設定しないと D+7 サマリ起動時に過去 artifact が 404 になる。recovery 時も同じ罠を踏むため、`retention-days: 8` 以上を runbook で固定すること。
- `actions/download-artifact@v4` は same-run 限定。cross-run の artifact 取得は `gh api workflows/<id>/runs` + artifact zip download の二段経路が必須で、recovery でも同じ pattern を使う。
- 1 周目 / 2 周目 evidence の path 分離を最初に決めておかないと、aggregation script が混在 snapshots を集計し false PASS を生む。`*-recovery.*` suffix で分離する規約を本タスクで初出にする。
- production code 修正と recovery を同 PR にまとめると、修正前 hour が recovery snapshots に混入する。code PR merge 後に D'+0 を再リセットする運用を明文化すること。

## 10. 備考

Issue #586 は CLOSED のまま。本タスクは新規 Issue として起票し、PR 文脈は `Refs #549, Refs #586`。
