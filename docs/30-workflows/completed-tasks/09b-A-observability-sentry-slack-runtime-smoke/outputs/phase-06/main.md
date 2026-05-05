# Output Phase 6: 異常系検証（確定）

## status

ANOMALY_SPEC_CONFIRMED / NOT_EXECUTED

## taskType / 実装区分

[実装区分: ドキュメントのみ] / docs-only / spec_created / remaining-only。
本ファイルは spec として確定する異常系対応表であり、実 rollback / revoke / rotation は Phase 11 で発生時のみ user approval 取得後に実行する。

## 異常系対応表

| A-ID | 検知方法 | 即時対応 | rollback 手順 | 再 smoke 条件 | approval gate |
| --- | --- | --- | --- | --- | --- |
| A-01 | Step 3 後、Sentry project Issues に 60s 以内に event が現れない / event id を取得できない | DSN を 1Password と照合・project / env を再確認・5min 待機後再送 | Phase 2 §6.1 secret rollback（`cf.sh secret delete` → 1Password 旧 revision で再 put） | rollback 後に Step 3 を再実行し event id 取得を確認。改善しない場合は Sentry status page 確認後に manual log 確認に fallback | 不要（軽微） |
| A-02 | Step 4 後、Slack `#ubm-incident` に message 不着 / curl が 4xx 応答 | webhook 状態を Slack 管理画面で確認・401 / invalid_payload なら Phase 2 §6.3 webhook revoke | webhook revoke → 新規発行 → 1Password 更新 → `cf.sh secret put SLACK_WEBHOOK_INCIDENT` 再実行 | rollback 後に Step 4 を再実行し delivered timestamp 取得を確認 | revoke 実行に人間 approval 必要 |
| A-03 | `cf.sh secret put` が non-zero exit / Step 2 後 `secret list` に名前が出ない | API token 認証 / `op` CLI 認証 / vault 権限 / wrangler.toml の env 設定を順に切り分け | 認証修復後に再 put。複数 secret で再発時は Step 1 に戻り 1Password item 構成を再検証 | `secret list` に対象名が出現することで PASS | 不要（軽微） |
| A-04 | T-05 の 3 系統 grep のいずれかが hit | **即時**: 該当 file の該当行を redact、未 commit なら `git restore`、commit 済みなら新 commit で削除。DSN や webhook が漏れた場合は **即時** rotation / revoke を実行 | rotation / revoke 完了 + 1Password 更新 + secret 再 put | rotation / revoke 完了後に T-05 を再実行し全 0 件確認まで Step 6 進行禁止 | 重大: 人間による rotation / revoke + history 削除可否判断 |
| A-05 | Step 7 後 `rg -n '未登録\|TBD\|placeholder' docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` が hit | 該当箇所を Step 7 文言（実 secret 登録済み / 実値は 1Password 正本）に再更新 | 不要（再更新で前進） | 再 grep 0 件で PASS | 不要（軽微） |
| A-06 | production secret 登録後、受信先 project が staging になっている / 1Password 参照を `(staging)` のまま使った | **即時** production 側 secret delete → production 1Password 参照で再 put → Sentry / Slack 双方で受信先確認 | rollback 後に Step 6 を最初からやり直し。staging cross-contamination が残る場合は Sentry / Slack 側で該当 event を delete し event id を redact 化 | production 側で T-01〜T-05 が再 PASS | 重大: 人間による即時 secret delete + 影響範囲確認承認 |

## escalation tree

```
[失敗検知]
├── 軽微（self-recover 可）
│   ├── A-01: Sentry 受信失敗 → DSN/project 再確認 → secret rollback → Step 3 再実行
│   ├── A-03: secret put 失敗 → 認証修復 → 再 put
│   └── A-05: placeholder 残存 → 再更新 → 再 grep
│
├── 重大（human approval 必須）
│   ├── A-02: Slack 不着 → webhook revoke 判断は人間 → 再発行 → 再 put → Step 4 再実行
│   └── A-04: redact grep hit
│       ├── 値の種類確認（DSN / webhook / token）
│       ├── 該当行 redact + commit 履歴判断（人間 approval）
│       ├── 該当 secret の rotation / revoke（人間 approval）
│       └── T-05 再実行で 0 件確認まで Step 6 進行禁止
│
└── production cross-contamination（即時最高優先）
    └── A-06: 即時 production secret revoke → production 1Password 参照で再 put
            → Sentry / Slack 受信先確認 → 該当 event delete → Step 6 最初からやり直し
```

## alert fatigue 再確認（spec）

| 観点 | 規定 |
| --- | --- |
| T-04 連投抑止 | 1 回のみ。再送する場合も 1min 以上間隔 |
| T-07 dedupe dry-run | staging のみ / 最小 1 系統（`sync_jobs.failed`） |
| staging / production チャンネル分離 | Phase 2 通知 matrix で staging / production を分離している前提。同一チャンネル運用時は `[STAGING SMOKE]` prefix を強制 |
| Sentry / Slack 連投時の dedupe | Phase 2 §5 通知 matrix の dedupe window（15min / 30min / 60min）を遵守 |

## notes

実 rollback / revoke / rotation の実行は Phase 11 で異常検知時のみ。本ファイルは spec として A-ID 表と escalation tree を固定する。
