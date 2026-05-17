# Phase 9: 受入確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | local 受入確認 |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | completed |

## 目的

index.md で定義した Local AC-1〜AC-8 を実成果物に照らして 1 件ずつ検証する。Runtime AC は Phase 13 / post-merge user gate に残し、本 Phase で success と判定しない。

## AC 検証マトリクス

### AC-1: workflow yaml diff 最小性

- 期待: `git diff dev...HEAD -- .github/workflows/cf-audit-log-monitor.yml` が `environment: production` 行削除 1 行のみ
- 検証:
  ```bash
  git diff dev...HEAD -- .github/workflows/cf-audit-log-monitor.yml | wc -l
  # 期待: 4〜6 行（diff header + 1 行 deletion）
  git diff dev...HEAD -- .github/workflows/cf-audit-log-monitor.yml | grep '^-' | grep -v '^---'
  # 期待: `-    environment: production` のみ
  ```
- 判定: PASS / FAIL

### AC-2: secrets / vars 複製計画

- 期待: `outputs/phase-02/secret-migration-plan.md` に 5 secrets + 9 vars が列挙
- 検証: ファイルの存在 / 列挙数 / コマンド例 / user-gate 注記の有無
- 判定: PASS / FAIL

### AC-3: Phase 11 placeholder evidence completeness

- 期待: Phase 11 で要求した user-gated runtime evidence paths が物理配置され、`PENDING_USER_GATE` と明記されている
- 検証:
  ```bash
  test -f outputs/phase-11/inventory-before.md
  test -f outputs/phase-11/workflow-dispatch-dryrun.md
  test -f outputs/phase-11/workflow-dispatch-dryrun.json
  test -f outputs/phase-11/runtime-evidence/hourly-runs.json
  test -f outputs/phase-11/runtime-evidence/heartbeat-after.txt
  rg -n 'PENDING_USER_GATE' outputs/phase-11
  ```
- 判定: PASS / FAIL

### AC-4: runbook / ADR 追記

- 期待: `15-infrastructure-runbook.md` に read-only monitor environment separation セクションが存在
- 検証:
  ```bash
  grep -n '監視系 workflow と deploy 系 workflow の environment 分離原則' \
    docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
  ```
- 判定: PASS / FAIL

### AC-5: production env 側 secret 維持 / cleanup deferred

- 期待: 本タスク完了時点で production env 側の monitor 専用 secret を削除しない。cleanup は runtime stability 後の user-gated followup。
- 検証:
  ```bash
  gh secret list --repo daishiman/UBM-Hyogo --env production | grep -E 'CF_AUDIT_D1_TOKEN_PROD|CF_AUDIT_TOKEN_PROD|CF_AUDIT_WORKERS_AI_TOKEN|SLACK_WEBHOOK_INCIDENT|EMAIL_WEBHOOK_URL'
  ```
  期待: 5 件すべて表示される
- 加えて `outputs/phase-12/unassigned-task-detection.md` に「production env 側 secret 削除」followup が登録されていること
- 判定: PASS / FAIL

### AC-6: Phase 12 strict compliance

- 期待: `outputs/phase-12/` に 7 必須 output ファイルが存在し、`phase12-task-spec-compliance-check.md` が PASS 判定
- 検証:
  ```bash
  ls outputs/phase-12/
  # 期待: main.md, implementation-guide.md, system-spec-update-summary.md,
  #       documentation-changelog.md, unassigned-task-detection.md,
  #       skill-feedback-report.md, phase12-task-spec-compliance-check.md
  grep 'PASS' outputs/phase-12/phase12-task-spec-compliance-check.md
  ```
- 判定: PASS / FAIL

### AC-7: CLOSED Issue 状態同期方針

- 期待: `outputs/phase-12/unassigned-task-detection.md` に「CLOSED Issue #720 を fold-state sync で `consumed_via_issue_720_followup_spec` 状態にする」記述あり
- 検証: ファイル内 grep
- 判定: PASS / FAIL

### AC-8: same-wave skill / aiworkflow sync

- 期待: task-specification-creator と aiworkflow-requirements に Issue #720 の判断を反映
- 検証: skill changelog / aiworkflow resource-map / quick-reference / task-workflow-active の grep
- 判定: PASS / FAIL

## 受入確認サマリテーブル

| AC | 内容 | 判定 | 備考 |
| --- | --- | --- | --- |
| AC-1 | workflow yaml diff 最小性 | (PASS/FAIL) | |
| AC-2 | secret-migration-plan 完全性 | (PASS/FAIL) | |
| AC-3 | Phase 11 placeholder evidence completeness | PASS | runtime remains PENDING_USER_GATE |
| AC-4 | runbook 追記 | PASS | |
| AC-5 | production env secret cleanup deferred | PASS | |
| AC-6 | Phase 12 strict compliance | PASS | local readiness only |
| AC-7 | CLOSED Issue 状態同期 | PASS | |
| AC-8 | skill / aiworkflow sync | PASS | |

## 受入失敗時の差し戻し先

| 失敗 AC | 差し戻し先 Phase |
| --- | --- |
| AC-1 | Phase 06 |
| AC-2 | Phase 02 |
| AC-3 | Phase 11 |
| AC-4 | Phase 08 |
| AC-5 | Phase 02 / 08 |
| AC-6 | Phase 12 |
| AC-7 | Phase 12 |
| AC-8 | Phase 12 |

## 実行タスク

- [x] `outputs/phase-09/acceptance.md` を作成し、Local AC-1〜AC-8 の判定結果を記録
- [ ] FAIL があれば差し戻し先 Phase を明示

## 次 Phase

- 全 AC PASS の場合: Phase 10 (リファクタ)
- FAIL がある場合: 該当 Phase に差し戻し
