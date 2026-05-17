# Phase 4: テスト計画

## メタ情報

- phase: 4 / test-plan
- prev: phase-3-design-review
- next: phase-5-implementation

## 目的

workflow rename と legacy 名 regression gate を CI で恒久的に検証するためのテスト追加計画を確定する。

## 追加するテスト

### TC-1: legacy secret 名再投入の regression gate

| 項目 | 内容 |
|------|------|
| ファイル | `scripts/__tests__/workflow-env-scope.test.sh`（既存ファイルに section 追加） |
| 検証対象 | `.github/workflows/web-cd.yml`、`.github/workflows/backend-ci.yml` |
| 検証内容 | `backend-ci.yml` の D1 / Workers deploy step に `secrets.CLOUDFLARE_API_TOKEN` の無修飾参照が出現したら fail |
| 許可 pattern | `secrets.CF_TOKEN_D1_(STAGING\|PRODUCTION)`、`secrets.CF_TOKEN_WORKERS_(STAGING\|PRODUCTION)`、`web-cd.yml` の environment-scoped `secrets.CLOUDFLARE_API_TOKEN`、`secrets.CLOUDFLARE_API_TOKEN_STAGING`（d1-migration-verify scope）、`secrets.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`、`secrets.CF_AUDIT_*_TOKEN_*` |
| 期待 | backend rename 後の workflow YAML で pass。backend を legacy 名へ戻すと fail |

### TC-2: 新 secret が deploy step env で確実に注入されること

| 項目 | 内容 |
|------|------|
| ファイル | `scripts/__tests__/workflow-env-scope.test.sh`（既存検証の拡張） |
| 検証内容 | backend-ci の step 名ごとに `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` が exact match している |
| 期待 | staging D1 / staging Workers / production D1 / production Workers が各 1 件ずつ exact match |

### TC-3: rotation reminder grep の互換性確認

| 項目 | 内容 |
|------|------|
| ファイル | `scripts/check-cf-rotation-reminder.sh`（既存。修正不要であることの確認） |
| 検証内容 | rename 後も grep pattern が新 secret 名を捕捉する |
| 期待 | reminder 対象に新 secret 名が含まれる |

## 実行コマンド

```bash
# 既存 test に拡張ケースを追加した後
bash scripts/__tests__/workflow-env-scope.test.sh
bash scripts/__tests__/cf-token-arg.test.sh
bash scripts/__tests__/redaction-check.test.sh

# rotation reminder（dry-run）
bash scripts/check-cf-rotation-reminder.sh --dry-run || true
```

## カバレッジ AC

本タスクは CI/CD workflow rename + bash gate のため、application code coverage 計測は適用外（index.md `coverage_ac: 適用外` 参照）。代わりに以下を完了条件とする:

- `scripts/__tests__/workflow-env-scope.test.sh` exit 0
- `scripts/__tests__/cf-token-arg.test.sh` exit 0（既存 test の regression 検証）
- `bash scripts/coverage-guard.sh` は workflow YAML 変更のみのため skip 条件に該当（changed-mode 内 merge 検知パターン）

## 成果物

- `outputs/phase-4/test-cases.md`
- `outputs/phase-4/test-execution-plan.md`

## 完了条件

- [ ] TC-1〜TC-3 が `outputs/phase-4/test-cases.md` に明文化
- [ ] 実行コマンドが Phase 6 で再現可能

## タスク100%実行確認【必須】

- [ ] 成果物 2 ファイル作成

## 次Phase

phase-5-implementation.md
