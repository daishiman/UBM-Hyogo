# Output Phase 7: AC trace matrix（確定）

## status

AC_MATRIX_CONFIRMED / NOT_EXECUTED

## taskType / 実装区分

[実装区分: ドキュメントのみ] / docs-only / spec_created / remaining-only。
runtime evidence は本ファイル時点で spec として確定。実 evidence は Phase 11 実行 wave で取得する。

## AC matrix

| AC ID | AC 説明 | evidence path | 検証コマンド | PASS 条件 | 取得 phase | approval gate |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | Sentry staging test event の受信が証跡化される | `outputs/phase-11/sentry-test-event-id.md` / `outputs/phase-11/sentry-secret-list-redacted.md` | (1) `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` で `SENTRY_DSN_API` が値非表示で出現 / (2) Sentry project Issues dashboard で event id を取得 | `secret list` 出力に `SENTRY_DSN_API` / `SENTRY_DSN_WEB` が値非表示で出現 + 60s 以内に Sentry に新規 event 出現 + event id（短縮 hex）と timestamp が evidence に記録（DSN URL は完全 redact） | Phase 11（実 evidence）／ Phase 4 Test ID T-01 / T-02 で spec 確定 | G-02（実行前）／ G-03（production 時） |
| AC-02 | Slack staging test alert の送信が証跡化される | `outputs/phase-11/slack-test-notification-evidence.md` / `outputs/phase-11/slack-secret-list-redacted.md` | (1) `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` で `SLACK_WEBHOOK_INCIDENT` が値非表示で出現 / (2) Slack `#ubm-incident` (staging) で delivered timestamp と permalink を確認 | `secret list` 出力に `SLACK_WEBHOOK_INCIDENT` が値非表示で出現 + Slack に test message delivered + permalink が redact 済み形式で evidence に記録（webhook URL は完全 redact） | Phase 11（実 evidence）／ Phase 4 Test ID T-03 / T-04 で spec 確定 | G-02（実行前）／ G-03（production 時） |
| AC-03 | secret 実値が repo / evidence / log / PR body に残らない | `outputs/phase-11/redaction-grep-result.md` | `rg -n 'SENTRY_DSN assignment containing an https DSN\|sentry\.io/[0-9]+/[0-9]+' .` / `rg -n 'hooks\.slack\.com\|SLACK_.*=.*https://' .` / `rg -n 'xox[bp]-' .` の 3 系統 | 3 系統すべて 0 件（grep result file に「全 0 件」を記録）+ `secret list` の `--with-values` 系フラグ未使用 | Phase 11（実 evidence）／ Phase 4 Test ID T-05 で spec 確定／ Phase 6 A-04 が異常系対応 | G-02 通過後・各 commit 候補前 mandatory |
| AC-04 | 失敗時 fallback / 保留判断が runbook 化される | `outputs/phase-06/main.md`（spec）／ Phase 11 実発生時の対応ログ | `outputs/phase-06/main.md` の異常系対応表（A-01〜A-06）と escalation tree が detection / recovery / rollback / 再 smoke 条件で網羅 | A-01〜A-06 すべての行に detection / recovery / rollback / 再 smoke / approval gate が記載 + Phase 2 §6.1〜§6.3 の rollback / rotation 手順への参照が明示 | Phase 6 で spec 確定済み（本ファイル時点で PASS） | A-04 / A-06 発生時のみ重大 approval |
| AC-05 | 09b release-runbook / incident-response-runbook の placeholder が更新され、09c の observability blocker が解除可能になる | `outputs/phase-12/runbook-diff.md` ／ 09c index 更新 PR 候補 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/` の canonical runbook 差分確認 | 「未登録」表記が「実 secret 登録済・値は 1Password 正本」に更新済み + 09c blocker reference が closed 候補としてマーク + grep 0 件 | Phase 12（runbook diff）／ Phase 11 後段（09c 連動） | G-04（runbook commit）／ G-05（PR） |

## runtime evidence と spec evidence の境界（明示）

| 区分 | 内容 | この時点での状態 |
| --- | --- | --- |
| spec evidence | Phase 4 Test ID 表 / Phase 5 runbook step / Phase 6 異常系対応表 / Phase 7 AC matrix | **本タスクで確定済み**（spec_created） |
| runtime evidence | Phase 11 で取得する `outputs/phase-11/*.md` 6 系統 / Phase 12 の runbook-diff | **未取得**。Phase 11 実行 wave で user approval（G-02 / G-03 / G-04）取得後に取得 |

## Phase 11 evidence と Phase 5 / 6 手順の対応関係

| Phase 11 evidence | 対応 Phase 5 step | 対応 Phase 6 異常系（失敗時） |
| --- | --- | --- |
| `outputs/phase-11/sentry-secret-list-redacted.md` | Step 1 / Step 2 / Step 6 | A-03 / A-06 |
| `outputs/phase-11/sentry-test-event-id.md` | Step 3 | A-01 |
| `outputs/phase-11/slack-secret-list-redacted.md` | Step 1 / Step 2 / Step 6 | A-03 / A-06 |
| `outputs/phase-11/slack-test-notification-evidence.md` | Step 4 | A-02 |
| `outputs/phase-11/redaction-grep-result.md` | Step 5 | A-04 |
| `outputs/phase-12/runbook-diff.md` | Step 7 | A-05 |

## coverage gap 確認（self-check）

| 観点 | 確認結果 |
| --- | --- |
| AC 5 件すべてが行に存在 | OK（AC-01〜AC-05） |
| 各行に evidence path / 検証コマンド / PASS 条件 / 取得 phase / approval gate が埋まる | OK |
| approval gate G-01〜G-05 が matrix 内で言及 | OK（G-01: Phase 1 で確定済 / G-02・G-03: AC-01〜AC-03 / G-04: AC-05 / G-05: AC-05） |
| evidence path 6 系統がすべて matrix に登場 | OK（Phase 1 evidence path 表と一致） |
| Phase 4 Test ID 7 件が AC × evidence と紐づく | OK（T-01〜T-05 が AC-01〜AC-03、T-06 が AC-04、T-07 が AC-02 dedupe を補強） |
| Phase 6 異常系 6 件が AC × evidence と紐づく | OK（A-01→AC-01、A-02→AC-02、A-03→AC-01/02、A-04→AC-03、A-05→AC-05、A-06→AC-01/02） |

coverage gap なし。

## notes

本 matrix は spec として固定。Phase 8〜10 は本 matrix を入力として進め、Phase 11 で実 evidence を取得し、Phase 12 で runbook diff を確定し、Phase 13 で PR 化する。
