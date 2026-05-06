# Phase 11: 手動テスト / runtime evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | runtime_evidence_pending（実走後に `runtime_evidence_captured` へ昇格） |
| visualEvidence | NON_VISUAL |
| 依存 | Phase 8 e2e 完了 / Phase 9 quality gate green / Phase 10 review checklist green |

## 目的

本タスクは UI 差分なし・GitHub Actions / D1 / Cloudflare API という runtime コンポーネントの組み合わせのため、screenshot ではなく **構造化ログ + JSON GET 出力 + D1 query 結果** で runtime evidence を採取する。NON_VISUAL alternative evidence template に準拠する（参考: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`）。

## 状態語彙

| 状態 | 定義 |
| --- | --- |
| `runtime_evidence_pending` | evidence ファイル骨格は配置済、実走による値の埋め込み待ち |
| `runtime_evidence_captured` | 7 ファイルすべてに実走由来の値が記録され、secret leakage チェック済 |
| `synthetic_evidence_only` | fixture / 合成データのみで実 audit event 由来 evidence が無い状態（許容するが Phase 13 G3 等の昇格条件に注記） |

### PASS 区分

- **PASS** = 全 7 ファイルに `runtime_evidence_captured` 相当の値が入り、secret 転記 0 件
- **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING** = 構造的整合（ファイル配置・コマンド一致・SSOT 同期）は完了しているが、schedule 1 サイクル分の実走 evidence がまだ採取できていない状態（Phase 13 merge 後・最初の hourly run 完了で `PASS` に昇格）

## Evidence 必須 7 ファイル

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-11/workflow-run-success.json` | `gh run view <id> --json` の出力。schedule 1 サイクルが `success` で完了したことの runtime 証跡 |
| 2 | `outputs/phase-11/d1-row-count-after.txt` | `bash scripts/cf.sh d1 execute ... "SELECT COUNT(*) FROM cf_audit_log WHERE ingested_at_ms > (unixepoch() - 3600) * 1000"` の出力 |
| 3 | `outputs/phase-11/synthetic-high-event-issue.json` | `gh issue view <num> --json number,title,labels,body,createdAt,state` の出力（合成 HIGH event 注入で auto-create された Issue） |
| 4 | `outputs/phase-11/dedup-second-run.log` | 同一 fingerprint で 2 回目 trigger した workflow log の抜粋（`dedup: skip` 行 + Issue 数不変の確認） |
| 5 | `outputs/phase-11/watchdog-alert.json` | watchdog が主 workflow 停滞を検知して起票した alert Issue の `gh issue view --json` 出力 |
| 6 | `outputs/phase-11/token-scope-confirmation.txt` | 監視 Token 用 `bash scripts/cf.sh whoami`（or 等価呼び出し）の出力。scope に `Audit Logs:Read` のみが表示されることの記録 |
| 7 | `outputs/phase-11/baseline-7day-thresholds.json` | 7 日 baseline 学習で生成された閾値 artifact（`D1 cf_audit_baseline query output or baseline CLI --output artifact` のコピー or symlink） |

## 採取手順

```bash
# 1) schedule 実走 1 サイクルの success を確認
RUN_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --status success --limit 1 \
  --json databaseId --jq '.[0].databaseId')
gh run view "$RUN_ID" --json databaseId,status,conclusion,createdAt,jobs,workflowName \
  > outputs/phase-11/workflow-run-success.json

# 2) D1 row count
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS recent FROM cf_audit_log WHERE ingested_at_ms > (unixepoch() - 3600) * 1000" \
  > outputs/phase-11/d1-row-count-after.txt

# 3) 合成 HIGH event 由来の Issue
ISSUE_NUM=$(gh issue list --label "type:security,priority:high,bot:cf-audit-log-monitor" --json number --jq '.[0].number')
gh issue view "$ISSUE_NUM" --json number,title,labels,body,createdAt,state,url \
  > outputs/phase-11/synthetic-high-event-issue.json

# 4) De-duplication 証跡（2 回目 run の log 抜粋）
RUN2_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$RUN2_ID" --log 2>/dev/null \
  | grep -E "dedup|fingerprint|skip" \
  > outputs/phase-11/dedup-second-run.log

# 5) Watchdog alert
WD_ISSUE=$(gh issue list --label "bot:cf-audit-log-watchdog" \
  --json number --jq '.[0].number')
gh issue view "$WD_ISSUE" --json number,title,labels,body,createdAt,state,url \
  > outputs/phase-11/watchdog-alert.json

# 6) 監視 Token scope 確認（CF_AUDIT_TOKEN_PROD でラッパー認証）
bash scripts/cf.sh audit-log whoami \
  > outputs/phase-11/token-scope-confirmation.txt

# 7) baseline 閾値 artifact
bash scripts/cf.sh audit-log baseline --days 7 \
  --output outputs/phase-11/baseline-7day-thresholds.json
```

## DoD

- [ ] 7 ファイルすべて存在
- [ ] 各ファイル sanity check（空ではない / JSON valid / D1 結果が数値）
- [ ] secret value / token / OAuth credentials / 個人情報 が **どのファイルにも含まれていない** ことを目視 + grep で確認
  - 確認 grep（例）:
    ```bash
    grep -E "Bearer |API_TOKEN|sk-|ghp_|@gmail\\.com" outputs/phase-11/*.{json,txt,log} || echo "OK: no secret leak"
    ```
- [ ] `workflow-run-success.json` の `conclusion=success`
- [ ] `d1-row-count-after.txt` の数値が ≥ 1
- [ ] `synthetic-high-event-issue.json` の `labels` に `priority:high` / `type:security` を含む
- [ ] `dedup-second-run.log` に dedup スキップ行が 1 件以上
- [ ] `watchdog-alert.json` の `state` が `OPEN` または復旧後 `CLOSED`
- [ ] `token-scope-confirmation.txt` に `Audit Logs:Read` 文字列が含まれ、`Edit` / `Write` / `Workers Scripts` 等の deploy 系 scope が含まれない
- [ ] `baseline-7day-thresholds.json` が valid JSON で 7 日学習由来であることが内部メタで判別可能

## 「PASS_BOUNDARY_SYNCED_RUNTIME_PENDING」 vs 「PASS」 の区別

- **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING**: 構造的整合（仕様書 / Phase 12 docs / SSOT / rollback runbook）は完了し、`outputs/phase-11/` 直下に 7 ファイルの **placeholder（コマンド・期待形式の記述のみ）** が配置されている状態。Phase 13 merge 後に最初の hourly run + 合成 fixture 注入によって実値で上書きされ、`PASS` に昇格する。
- **PASS**: 7 ファイルすべてに実走由来の値が入り、secret leakage 0 件、DoD 全項目 check 済。

## 関連

- `outputs/phase-11/workflow-run-success.json`
- `outputs/phase-11/d1-row-count-after.txt`
- `outputs/phase-11/synthetic-high-event-issue.json`
- `outputs/phase-11/dedup-second-run.log`
- `outputs/phase-11/watchdog-alert.json`
- `outputs/phase-11/token-scope-confirmation.txt`
- `outputs/phase-11/baseline-7day-thresholds.json`
- 上流: `outputs/phase-8/`（e2e シナリオ）
- 参考: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`
