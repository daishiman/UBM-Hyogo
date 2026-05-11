# Phase 10: 実装後検証 / Definition of Done

## 目的

本タスク PR merge 後から D+7 close-out コミットまでに通過すべき Definition of Done を確定する。検証コマンド、不合格時の rollback 判定基準、rollback 実行コマンドを 1 ヶ所に集約し、Phase 11 evidence の保存契約と紐付ける。

## 前 Phase 依存

- Phase 8: CI gate / forward-safe rollback 検証スクリプト / governance
- Phase 9: 7 日 observation 運用手順 / alert 条件 / `pass_runtime_synced` 昇格判定

## 完了条件

- [ ] 全 DoD チェックリストを列挙し、各項目に検証コマンドを紐付ける
- [ ] post-switch 24h / 7 日の節目で実行する検証コマンドを確定する
- [ ] 不合格時の rollback 判定基準（fallback rate / leakage / hourly run / FN / latency）と実行コマンドを確定する
- [ ] D1 列が forward-safe に残置されていることを最終確認する手順を含める

## 10-1. DoD チェックリスト × 検証コマンド

| # | DoD | 検証コマンド |
| --- | --- | --- |
| 1 | workflow YAML PR merge 済 | `gh pr view <pr-number> --json mergedAt,baseRefName` |
| 2 | `vars.CF_AUDIT_CLASSIFIER` が `ml` で設定 | `gh variable list --env production`（マスク表示）|
| 3 | hourly run 1 回目で post-step 3 つすべて success | `gh run view <run-id> --json conclusion,jobs` |
| 4 | artifact `hourly-snapshot-<run_id>` が retention-days 8 で保存 | `gh api repos/.../actions/artifacts` |
| 5 | hourly run 24 件 / 168 件節目で leakage 0 件 | `outputs/phase-11/evidence/hourly-run-daily-check.md` |
| 6 | fallback rate alert 非発火（または発火していても期待通り） | `gh issue list --label "type:alert,cf-audit-log"` |
| 7 | 7day summary workflow が起票した evidence PR が merge 済 | `gh pr list --base dev --search "7-day evidence"` |
| 8 | `outputs/phase-11/evidence/hourly-run-7day-summary.json` の `actualSnapshots === 168` | `jq .actualSnapshots <file>` |
| 9 | `fallbackRateMean ≤ 0.05` | 同上 |
| 10 | `leakageHits === 0` | 同上 |
| 11 | `issuesOpenedTotal` が threshold 期 baseline の 1.5 倍以下 | `outputs/phase-11/evidence/issue-rate-comparison.md` |
| 12 | SSOT 4 ファイルの `pass_runtime_synced` 文言が D+7 で実反映 | `git log --oneline .claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| 13 | D1 列 forward-safe（`apps/api/migrations/` への diff 0） | `git diff dev...HEAD --stat apps/api/migrations/` |
| 14 | `pnpm typecheck` / `pnpm lint` 新規エラー 0 件 | `outputs/phase-11/evidence/typecheck.log` / `lint.log` |
| 15 | focused vitest pass | `outputs/phase-11/evidence/test.log` |

## 10-2. 節目検証

| 節目 | 必須確認 |
| --- | --- |
| D+0（merge 直後） | DoD 1〜3。hourly run の env / post-step が正常 |
| D+1 | DoD 4〜6 を 24h サンプルで満たす |
| D+3 | DoD 4〜6 を 72h サンプルで満たす |
| D+7 | DoD 7〜13 を完走 evidence で満たす |
| D+7 後 | DoD 12 の SSOT 反映 PR を別 PR で merge |

## 10-3. 不合格時の rollback 判定基準

| 観測値 | rollback 起動条件 | 実行コマンド |
| --- | --- | --- |
| fallback rate | > 5% が 3 hour 連続 | `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` |
| leakage hit | 1 hour で 1 件以上 | 即時 env 戻し + Issue 削除 + token revoke runbook |
| hourly run failure | 連続 3 回 fail（GitHub infra 起因除く） | revert PR + env 戻し |
| FN（既知 anomaly fixture が miss） | hourly canary が miss | env 戻し + FU-03-C #548 へ artifact 再選定 |
| p95 latency | baseline の 2 倍超 | 警告のみ。即時 rollback はしない |

## 10-4. D1 列 forward-safe 最終確認

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
git diff dev...HEAD --stat apps/api/migrations/
```

期待: 0016 が apply 済みのまま、新規 migration 0 / diff 0 行。

## 10-5. canonical evidence path（再掲）

- 本サイクル merge 時:
  - `outputs/phase-11/evidence/typecheck.log`
  - `outputs/phase-11/evidence/lint.log`
  - `outputs/phase-11/evidence/test.log`
  - `outputs/phase-11/evidence/build.log`
  - `outputs/phase-11/evidence/grep-gate.log`
- D+7 close-out 時:
  - `outputs/phase-11/evidence/hourly-run-7day.md`
  - `outputs/phase-11/evidence/hourly-run-7day-summary.json`
  - `outputs/phase-11/evidence/leakage-grep-7day.log`
  - `outputs/phase-11/evidence/issue-rate-comparison.md`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `phase-08.md`
- `phase-09.md`
- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-10.md`
