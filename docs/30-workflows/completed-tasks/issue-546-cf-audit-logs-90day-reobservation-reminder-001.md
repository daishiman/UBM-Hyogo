# Issue #546 Cloudflare Audit Logs 90 Day Re-observation Reminder - タスク指示書

## メタ情報

```yaml
issue_number: 581
task_id: issue-546-cf-audit-logs-90day-reobservation-reminder-001
task_name: Issue #546 Cloudflare Audit Logs 90 Day Re-observation Reminder
category: 改善
target_feature: Cloudflare Audit Logs monitoring baseline
priority: 低
scale: 小規模
status: promoted_to_canonical_pointer
source_phase: docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-08
dependencies: []
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-546-cf-audit-logs-90day-reobservation-reminder-001` |
| タスク名 | Issue #546 Cloudflare Audit Logs 90 Day Re-observation Reminder |
| 分類 | 改善 |
| 対象機能 | Cloudflare Audit Logs monitoring baseline |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | promoted_to_canonical_pointer |
| 発見元 | `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-08 |
| source issue | Issue #546 (CLOSED; use `Refs #546` only) |
| taskType | docs-only / runtime observation |
| visualEvidence | NON_VISUAL |
| earliest execution date | 2026-08-05, only if successful hourly runs begin on 2026-05-08 |
| canonical workflow | `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/` |

---

## 1. なぜこのタスクが必要か（Why）

> 2026-05-09 追記: 本 reminder は Issue #581 の正式 workflow package `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/` に昇格済み。今後の Phase 1-13 実行、Phase 11/12 evidence、closed issue handling は canonical workflow を正本とし、この unassigned task は source reminder / pointer として保持する。

### 1.1 背景

Issue #546 の 2026-05-08 observation cycle は Gate-A FAIL、Gate-B/C pending で `observation_continue` となった。monitor / watchdog evidence は 2026-05-06 から 2026-05-07 までの各 32 failure runs に限られ、D1 read-only query は `no such table: cf_audit_log` を返した。

### 1.2 問題点・課題

90 日分の successful hourly runtime evidence は未来のデータであり、2026-05-08 の同一サイクルでは取得できない。Issue #546 は CLOSED のため、再観測タイミングを workflow 内の記述だけに残すと、後続の運用確認から漏れるリスクがある。

### 1.3 放置した場合の影響

Cloudflare Audit Logs 監視の Gate-A/B/C が未判定のままになり、threshold 継続、baseline 再調整、ML comparison のいずれに進むべきかを決められない。D1 readiness 欠測や false positive rate 欠測を PASS と誤認すると、production ML switch の前提を誤る。

---

## 2. 何を達成するか（What）

### 2.1 目的

Issue #546 の次回 90 日再観測を、成功実行履歴・D1 readiness・false positive rate・tuning cost の fresh evidence に基づいて再判定する。

### 2.2 最終ゴール

後続 workflow の `outputs/phase-11/` と `outputs/phase-12/` に fresh evidence と Gate-A/B/C 判定を保存し、`threshold_continue`、`baseline_recalibration`、`ml_comparison_ready`、`observation_continue` のいずれかを明確に記録する。

### 2.3 スコープ

#### 含むもの

- `cf-audit-log-monitor.yml` / watchdog の 90 日 successful hourly window を paginated API で再集計する。
- `cf_audit_log` / `cf_audit_baseline` の D1 readiness と baseline thresholds を再取得する。
- `cf-audit` alert issues と false-positive labels を再照合する。
- monthly tuning minutes log を owner-authored evidence として確認する。
- Gate-A/B/C を再判定し、threshold 継続 / baseline 再調整 / ML comparison のいずれかへ進むかを決める。

#### 含まないもの

- production D1 migration apply、Cloudflare secret 登録、workflow dispatch、Issue #546 reopen/close、commit、push、PR 作成。
- ML model training / production ML switch 本体。
- D1 `cf_audit_log` table 不在をこのタスク内で修正すること。既存の runtime readiness 系タスクへ委譲する。

### 2.4 成果物

- 後続 workflow の `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json`
- 後続 workflow の `outputs/phase-11/gh-run-list-watchdog.json`
- 後続 workflow の `outputs/phase-11/d1-cf-audit-90day-summary.json`
- 後続 workflow の `outputs/phase-11/baseline-90day-thresholds.json`
- 後続 workflow の `outputs/phase-11/gate-decision.md`
- 後続 workflow の `outputs/phase-12/system-spec-update-summary.md`
- 後続 workflow の `outputs/phase-12/unassigned-task-detection.md`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 2026-08-05 以降であること。ただし successful hourly runs が 2026-05-08 に開始していない場合は、実際の successful window 開始日から 90 日後に延期する。
- GitHub CLI が `daishiman/UBM-Hyogo` の Actions / Issues を読めること。
- Cloudflare / D1 の read-only query を実行できる運用認証があること。

### 3.2 依存タスク

- Source workflow: `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/`
- Source evidence: `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gate-decision.md`
- Runtime readiness の blocker が解消していない場合は、Gate-B を pending のまま維持する。

### 3.3 必要な知識

- GitHub Actions run API の pagination と JSON array 正規化。
- D1 `cf_audit_log` / `cf_audit_baseline` の read-only aggregate query。
- `PENDING_RUNTIME_EVIDENCE` と Gate-A/B/C の境界語彙。

### 3.4 推奨アプローチ

最初に Gate-A の run history を `gh api --paginate ... | jq -s '.'` で JSON array として保存する。次に D1 readiness と baseline thresholds を read-only で取得し、最後に alert issue labels と tuning-cost log を照合する。D1 が未整備の場合は、alert 0 件を FPR PASS と扱わず Gate-B pending に固定する。

---

## 4. 実行手順

### Phase構成

1. Phase 1: 再観測開始条件確認
2. Phase 2: Gate-A runtime history 取得
3. Phase 3: Gate-B / Gate-C evidence 取得
4. Phase 4: Gate 判定と正本同期

### Phase 1: 再観測開始条件確認

#### 目的

90 日 successful hourly window が実際に成立しているかを確認する。

#### 手順

1. `cf-audit-log-monitor.yml` の最初の successful run 日を確認する。
2. 90 日 window の開始日・終了日を明記する。
3. 2026-05-08 cycle の Gate-A FAIL / Gate-B-C pending を source evidence として参照する。

#### 成果物

- 再観測 window 定義メモ。

#### 完了条件

- 90 日 window が成立していない場合は `observation_continue` として終了できる。

### Phase 2: Gate-A runtime history 取得

#### 目的

monitor / watchdog が 90 日以上継続稼働しているかを確認する。

#### 手順

1. `gh api --paginate` で monitor workflow runs を取得する。
2. watchdog workflow runs を取得する。
3. 2h 超 heartbeat gap と failed run の有無を集計する。

#### 成果物

- `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json`
- `outputs/phase-11/gh-run-list-watchdog.json`

#### 完了条件

- JSON Lines ではなく JSON array として保存されている。

### Phase 3: Gate-B / Gate-C evidence 取得

#### 目的

false positive rate と tuning cost の判定材料を揃える。

#### 手順

1. D1 `cf_audit_log` / `cf_audit_baseline` を read-only query で集計する。
2. `cf-audit` alert issues と false-positive labels を照合する。
3. monthly tuning minutes log を集計する。

#### 成果物

- `outputs/phase-11/d1-cf-audit-90day-summary.json`
- `outputs/phase-11/baseline-90day-thresholds.json`
- `outputs/phase-11/tuning-cost-summary.md`

#### 完了条件

- D1 readiness 欠測時は Gate-B pending として記録されている。

### Phase 4: Gate 判定と正本同期

#### 目的

Gate-A/B/C の結果を正本仕様と後続未タスクへ反映する。

#### 手順

1. `outputs/phase-11/gate-decision.md` に判定を記録する。
2. `outputs/phase-12/system-spec-update-summary.md` に同期対象を記録する。
3. Gate-B FAIL または Gate-C PASS の場合のみ、baseline recalibration / ML comparison の未タスクを追加する。

#### 成果物

- `outputs/phase-11/gate-decision.md`
- `outputs/phase-12/system-spec-update-summary.md`
- 条件付き後続未タスク。

#### 完了条件

- Issue #546 は CLOSED のまま、PR / commit text は `Refs #546` のみを使う方針が記録されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] Gate-A の 90 日 successful hourly window が fresh evidence で判定されている。
- [ ] Gate-B の FPR が D1 readiness / baseline thresholds / alert issue labels の 3 点に基づいて判定されている。
- [ ] Gate-C の monthly tuning minutes が owner-authored evidence に基づいて判定されている。

### 品質要件

- [ ] `gh api --paginate ... | jq -s '.'` で JSON array 形式の evidence が保存されている。
- [ ] D1 query は read-only `SELECT` のみで、production mutation を含まない。
- [ ] D1 unreadiness の alert 0 件を FPR PASS と誤判定していない。

### ドキュメント要件

- [ ] `outputs/phase-11/gate-decision.md` に Gate-A/B/C と decision が記録されている。
- [ ] `outputs/phase-12/system-spec-update-summary.md` に aiworkflow-requirements 同期対象が記録されている。
- [ ] 条件付き未タスクの要否が `outputs/phase-12/unassigned-task-detection.md` に記録されている。

---

## 6. 検証方法

### テストケース

- Gate-A: 90 日 hourly run history の success / failure / gap 判定。
- Gate-B: D1 readiness 欠測時の `PENDING_RUNTIME_EVIDENCE` 固定。
- Gate-C: monthly tuning minutes が 240 分以上かどうかの判定。

### 検証手順

```bash
gh api --paginate \
  repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs \
  --jq '.workflow_runs[] | {databaseId:.id,status,conclusion,createdAt:.created_at,updatedAt:.updated_at,headSha:.head_sha,event,url:.html_url}' \
  | jq -s '.'

bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json \
  --command "SELECT COUNT(*) AS total FROM cf_audit_log WHERE occurred_at_ms >= unixepoch('now','-90 days') * 1000;"
```

期待: GitHub evidence は JSON array、D1 evidence は read-only query result または redacted `PENDING_RUNTIME_EVIDENCE` marker として保存される。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| CLOSED Issue #546 のため再観測が忘れられる | 中 | 中 | Issue #581 workflow package を canonical reminder とし、本 unassigned task は source reminder / pointer として task-workflow-active の Issue #546 行から参照する |
| JSON Lines を `.json` として保存し後続 parser が壊れる | 中 | 中 | paginated output は `jq -s '.'` で JSON array に正規化する |
| D1 unreadiness の alert 0 件を FPR PASS と誤判定する | 高 | 中 | D1 summary / baseline thresholds / alert issue evidence の 3 点が揃うまで Gate-B を pending にする |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gate-decision.md`
- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md`

### 参考資料

- GitHub Actions workflow runs API
- Cloudflare D1 read-only query runbook: `scripts/cf.sh d1 execute`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | 90 日 window は未来の runtime evidence であり、2026-05-08 の同一サイクル内では満たせなかった |
| 原因 | Issue #546 は closed だが、monitor / watchdog evidence は 2026-05-06 から 2026-05-07 までの失敗 run しかなく、D1 `cf_audit_log` も production で未確認だった |
| 対応 | Gate-A FAIL / Gate-B-C pending として `observation_continue` を記録し、本 reminder task を未タスク化した |
| 再発防止 | `gh api --paginate ... | jq -s '.'`、D1 readiness、baseline thresholds、alert issue labels の 3 点を揃えるまで Gate-B を PASS にしない |
| 参照 | `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-12/phase12-task-spec-compliance-check.md` |

### レビュー指摘の原文（該当する場合）

該当なし。Phase 12 の Gate-A FAIL / Gate-B-C pending 判定から formalize した。

### 補足事項

Phase 13 の commit / PR はユーザー承認ゲートであり、本タスクの作成時点では実行しない。
