# Issue #586 post-switch 7 day close-out

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/586（CLOSED 維持。PR 文脈は `Refs #586`） |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/549（CLOSED 維持。参照は `Refs #549`） |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| current upstream state | `implemented-local` / `implementation_status=PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| expected final state | `completed`（7 日 runtime evidence と Phase 13 close-out 完了後） |

## 1. なぜこのタスクが必要か（Why）

Issue #549 の production switch は local implementation と Gate contract まで完了しているが、現状態は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` であり runtime PASS ではない。`CF_AUDIT_CLASSIFIER=ml` の production switch 後、7 日分の hourly evidence が揃うまで root workflow を `completed` に昇格してはいけない。

Issue #586 は GitHub 上では CLOSED だが、これは issue 管理上の close であり runtime 完了を意味しない。本仕様書では Issue を reopen せず、7 日観測完走後の SSOT close-out だけを扱う。

## 2. 何を達成するか（What）

production switch merge 後の 168 hourly snapshots、fallback rate、p95 latency、Issue 起票数 baseline 比較、leakage grep 7 日連続 clean を揃え、親 workflow と aiworkflow-requirements SSOT を `completed` へ昇格できる状態にする。

## 3. どのように実行するか（How）

`docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/evidence/hourly-run-7day.md` に run URL と observation JSON を集約し、同じ evidence を根拠に親 workflow / observability-monitoring / task-workflow-active を同期する。実値 secret、raw Issue body、raw feature dataset は保存しない。

## 4. 実行手順

### 開始条件（全 PASS まで Phase 11 close-out に進まない）

1. Gate-0: 90 日 baseline 条件、または同等の例外承認 evidence が存在する。
2. Gate-A: FU-03-C offline replay で ML が threshold より precision / recall 改善を示している。
3. Gate-B: fallback rate と Issue body redaction が許容範囲である。
4. Gate-C: rollback runbook approval / governance evidence がある。
5. Issue #518 HOLD が解除済み、または `manual-check-only` 観測で 168 snapshot 相当として数えるルールが親 #549 evidence に明記済みである。
6. production switch merge SHA と `CF_AUDIT_CLASSIFIER=ml` 有効化時刻が記録済みである。

### 実行

1. `.github/workflows/cf-audit-log-monitor.yml` の hourly run を 7 日分収集し、168 snapshots の run URL / conclusion / observation JSON path を記録する。
2. fallback rate、p95 latency、Issue 起票数 baseline 比較、leakage grep result を日次で確認する。
3. fallback rate > 5% が 3 hour 連続、leakage grep positive、または Issue 起票数が baseline を超過した場合は `completed` に進まず rollback 判定へ分岐する。
4. 7 日終端サマリを `outputs/phase-11/evidence/hourly-run-7day.md` に作成する。
5. `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json` と関連 SSOT を `completed` へ更新する。
6. Phase 12 strict 7 files のうち、runtime close-out に必要な compliance check / documentation changelog / system spec update summary を更新する。

## 5. 完了条件チェックリスト

- [ ] 168 hourly snapshots が存在し、各 snapshot に run URL / conclusion / observation JSON path がある。
- [ ] fallback rate が親 #549 の閾値（5% / 3 hour 連続 alert）に照らして PASS または rollback 判断済み。
- [ ] p95 latency が baseline 比で許容範囲として記録済み。
- [ ] Issue 起票数が threshold baseline 比較で許容範囲として記録済み。
- [ ] leakage grep が 7 日連続 clean。
- [ ] rollback 条件（fallback > 5% x 3h / leakage dirty / baseline 超過）に該当しない。該当する場合は `completed` に進まず rollback PR 方針を記録済み。
- [ ] 親 workflow と SSOT が `completed` に更新可能な証跡を持つ。
- [ ] GitHub Issue #586 / #549 は CLOSED 維持で、PR 文脈は `Refs #586` / `Refs #549` のみ。

## 6. 検証方法

### 単体検証

```bash
rg -n "completed|hourly-run-7day|Issue #586|Refs #586" \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch \
  .claude/skills/aiworkflow-requirements/references/observability-monitoring.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
```

期待: runtime close-out evidence path、Issue #586 参照、`completed` 昇格根拠が矛盾なく見つかる。

失敗時: 親 #549 の `outputs/phase-12/system-spec-update-summary.md` と `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` の Issue #549 節を読み、状態語彙が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のままなのか、close-out 後の `completed` に更新済みなのかを切り分ける。

### 統合検証

```bash
test -f docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/evidence/hourly-run-7day.md
rg -n "168|leakage grep|fallback rate|p95|baseline" \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/evidence/hourly-run-7day.md
```

期待: 7 日観測の数量証跡と4指標が同一 evidence に集約されている。

失敗時: Issue #518 HOLD / manual-check-only の扱いと production switch merge SHA の有無を確認し、開始条件を満たしていない場合は本タスクを close-out しない。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| false green | runtime PASS を 168 snapshots 後に限定 |
| GitHub Issue CLOSED を runtime 完了と誤読 | メタ情報に CLOSED 維持と runtime 未完了境界を明記 |
| 親 workflow path drift | 親参照を `completed-tasks/issue-549-cf-audit-ml-production-switch/` に固定 |
| secret / raw Issue body leakage | evidence は redacted summary と run URL に限定し、leakage grep clean を完了条件化 |
| #518 HOLD 中に hourly 自動観測を前提化 | HOLD 解除または manual-check-only 換算ルールを開始条件にする |
| rollback 条件該当時の false PASS | `completed` へ進まず rollback PR 方針を Phase 11 evidence に記録 |

## 8. スコープ

### 含む

- 7 日分の production hourly observation evidence 収集と close-out summary 作成。
- 親 #549 workflow / artifacts / aiworkflow-requirements SSOT の `completed` 昇格。
- Issue #586 / #549 を CLOSED のまま `Refs` 参照で扱う PR 境界の記録。

### 含まない

- production switch merge 自体（親 #549 の Gate 後 runtime cycle で実施済みであることが前提）。
- Issue #518 HOLD 解除または manual-check-only 観測ルール策定そのもの（開始条件として参照する）。
- model artifact rotation（`u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md`）。
- fallback alert channel extension（`u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md`）。
- canonical evidence path schema の新設（`u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md`）。

## 9. 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/evidence/hourly-run-7day.md`
- 症状: local implementation PASS と production runtime PASS を混同すると、7 日観測未完走でも `completed` と記録できてしまう。
- 参照: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/phase12-task-spec-compliance-check.md`

## 10. 参照情報

- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 11. 備考

Issue #586 / #549 は CLOSED 維持。runtime close-out PR では `Closes` を使わず、`Refs #586` / `Refs #549` のみを使う。
