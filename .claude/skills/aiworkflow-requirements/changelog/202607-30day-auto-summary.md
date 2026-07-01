# post-release-dashboard 30d auto-summary (202607)

Refs #517, Refs #497, Refs #351

## 集計結果

- runs_total: 56
- schedule_runs_total: 56
- schedule_days_total: 56
- missing_schedule_gap_days: 0
- oldest_schedule_created_at: 2026-05-07T00:22:41Z
- conclusion 分布: {"failure":56}
- longest_failure_streak: 56
- failure_rate: 1

## 原因分類

- failure_cause_dist: {"workflow_failure_unclassified":56}
- failure_run_urls: ["https://github.com/daishiman/UBM-Hyogo/actions/runs/25468709707","https://github.com/daishiman/UBM-Hyogo/actions/runs/25529301447","https://github.com/daishiman/UBM-Hyogo/actions/runs/25585992040","https://github.com/daishiman/UBM-Hyogo/actions/runs/25615345770","https://github.com/daishiman/UBM-Hyogo/actions/runs/25643791264","https://github.com/daishiman/UBM-Hyogo/actions/runs/25705264641","https://github.com/daishiman/UBM-Hyogo/actions/runs/25770180865","https://github.com/daishiman/UBM-Hyogo/actions/runs/25834174226","https://github.com/daishiman/UBM-Hyogo/actions/runs/25893213828","https://github.com/daishiman/UBM-Hyogo/actions/runs/25947596708","https://github.com/daishiman/UBM-Hyogo/actions/runs/25976719238","https://github.com/daishiman/UBM-Hyogo/actions/runs/26006981893","https://github.com/daishiman/UBM-Hyogo/actions/runs/26068393967","https://github.com/daishiman/UBM-Hyogo/actions/runs/26133528053","https://github.com/daishiman/UBM-Hyogo/actions/runs/26197864680","https://github.com/daishiman/UBM-Hyogo/actions/runs/26260985712","https://github.com/daishiman/UBM-Hyogo/actions/runs/26318244493","https://github.com/daishiman/UBM-Hyogo/actions/runs/26347324697","https://github.com/daishiman/UBM-Hyogo/actions/runs/26376920560","https://github.com/daishiman/UBM-Hyogo/actions/runs/26425276431","https://github.com/daishiman/UBM-Hyogo/actions/runs/26483018223","https://github.com/daishiman/UBM-Hyogo/actions/runs/26546748047","https://github.com/daishiman/UBM-Hyogo/actions/runs/26610389040","https://github.com/daishiman/UBM-Hyogo/actions/runs/26669029842","https://github.com/daishiman/UBM-Hyogo/actions/runs/26698807497","https://github.com/daishiman/UBM-Hyogo/actions/runs/26728791281","https://github.com/daishiman/UBM-Hyogo/actions/runs/26790639379","https://github.com/daishiman/UBM-Hyogo/actions/runs/26856376365","https://github.com/daishiman/UBM-Hyogo/actions/runs/26922178986","https://github.com/daishiman/UBM-Hyogo/actions/runs/26987771802","https://github.com/daishiman/UBM-Hyogo/actions/runs/27047134770","https://github.com/daishiman/UBM-Hyogo/actions/runs/27077942484","https://github.com/daishiman/UBM-Hyogo/actions/runs/27109423458","https://github.com/daishiman/UBM-Hyogo/actions/runs/27175615933","https://github.com/daishiman/UBM-Hyogo/actions/runs/27244770411","https://github.com/daishiman/UBM-Hyogo/actions/runs/27315477432","https://github.com/daishiman/UBM-Hyogo/actions/runs/27386372626","https://github.com/daishiman/UBM-Hyogo/actions/runs/27450898411","https://github.com/daishiman/UBM-Hyogo/actions/runs/27483444294","https://github.com/daishiman/UBM-Hyogo/actions/runs/27517002051","https://github.com/daishiman/UBM-Hyogo/actions/runs/27585818301","https://github.com/daishiman/UBM-Hyogo/actions/runs/27657397340","https://github.com/daishiman/UBM-Hyogo/actions/runs/27728659019","https://github.com/daishiman/UBM-Hyogo/actions/runs/27797951848","https://github.com/daishiman/UBM-Hyogo/actions/runs/27854564580","https://github.com/daishiman/UBM-Hyogo/actions/runs/27888401455","https://github.com/daishiman/UBM-Hyogo/actions/runs/27922452213","https://github.com/daishiman/UBM-Hyogo/actions/runs/27993445725","https://github.com/daishiman/UBM-Hyogo/actions/runs/28066250820","https://github.com/daishiman/UBM-Hyogo/actions/runs/28138489218","https://github.com/daishiman/UBM-Hyogo/actions/runs/28209157814","https://github.com/daishiman/UBM-Hyogo/actions/runs/28272725941","https://github.com/daishiman/UBM-Hyogo/actions/runs/28306244219","https://github.com/daishiman/UBM-Hyogo/actions/runs/28341174300","https://github.com/daishiman/UBM-Hyogo/actions/runs/28411701712","https://github.com/daishiman/UBM-Hyogo/actions/runs/28484821243"]

workflow_failure_unclassified は GitHub Actions の run list から機械判定できる最小分類です。詳細原因は draft PR レビューで run URL を確認して追記します。

## retry/alert 追加検討

failure_rate が 10% 以上です。retry / alert 実装を別 issue で検討してください。
