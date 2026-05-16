# Phase 1: 要件定義（実行結果）

## 真の論点

GitHub Environment `staging-runtime-smoke` の必須 secret が未登録のため `runtime-smoke-staging.yml` が常時 fail し、error メッセージが指す runbook path も stale になっていた。

## 現状調査 evidence（2026-05-15）

| 項目 | 結果 |
|------|------|
| `staging-runtime-smoke` Environment | 存在（id=15114442155） |
| 同 Environment secrets 数 | **0 件**（user 操作待ち） |
| 必須 secret（smoke 本体 early-fail） | `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` |
| 追加 secret（failure post step） | `SLACK_WEBHOOK_INCIDENT` |
| 失敗ジョブ | `.github/workflows/runtime-smoke-staging.yml` lines 35-48 |
| 既存 runbook | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`（実在） |

## 変更ファイル inventory（実行結果）

| パス | 種別 | 状態 |
|------|------|------|
| `.github/workflows/runtime-smoke-staging.yml` | 編集 | 完了（runbook path を current 位置に同期） |
| `.github/workflows/{ci,incident-runbook-slack-delivery,pr-build-test,pr-target-safety-gate,verify-indexes,verify-test-suffix}.yml` | 編集 | 完了（guard が検出した stale path を current に同期） |
| `scripts/ci/verify-workflow-doc-refs.sh` | 新規 | 完了 |
| `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | 新規 | 完了 |
| `.github/workflows/verify-workflow-doc-refs.yml` | 新規 | 完了 |

## NON_VISUAL 宣言

CI / 運用設定変更のみ。Phase 11 screenshot 不要。代替証跡として guard 実行ログ + actionlint / shellcheck ログを使用。

## 完了確認

- 変更ファイル inventory が確定
- secret 0 件 evidence を記録（user 操作待ち）
