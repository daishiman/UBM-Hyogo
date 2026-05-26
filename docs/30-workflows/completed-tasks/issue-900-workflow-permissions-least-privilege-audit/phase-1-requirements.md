# Phase 1: 要件定義

## 1.1 背景

親タスク `ci-green-recovery-smoke-coverage-shard` で `ci.yml` の checkout exit 128 を root-cause した結果、「top-level `permissions:` を宣言していない workflow は default token 権限縮退時に checkout-credential 失敗を起こしうる」構造的弱点が判明した。`ci.yml:15-16` のみ hardening 済みで、他 12 件は同じ弱点を残している。

## 1.2 要求

- 対象 12 workflow に top-level `permissions:` を追加する。
- 各 workflow のジョブが実際に必要とする最小権限のみ宣言する。
- job-level に既存の `permissions:` が宣言されている workflow（`backend-ci.yml`, `playwright-visual-baseline-update.yml`, `web-cd.yml`, `d1-migration-verify.yml`, `playwright-visual-full.yml`）は top-level を最小値（通常 `contents: read`）とし、job-level 宣言が write 権限を必要に応じて上書きする構造を維持する。
- `incident-runbook-slack-delivery.yml` は既に top-level permissions (`:37`) を持つため対象外。

## 1.3 不変条件

- required status check の context 名（job 名・job key）は不変。具体的には `audit-correlation-verify / verify`、`verify-design-tokens / verify-design-tokens`、`playwright-smoke / smoke (chromium)`、`playwright-smoke / visual (chromium, 4 screens)` 等を一切リネームしない。
- workflow の `on:` トリガー、secret 参照、env を変更しない。
- workflow のロジック（step 順序・コマンド）を変更しない。

## 1.4 対象ファイル一覧（12 件）

| # | path | 既存 job-level permissions | 想定 top-level |
|---|------|----------------------------|----------------|
| 1 | .github/workflows/backend-ci.yml | `:19-21`, `:85-87` (`deployments: write` 等) | `contents: read` |
| 2 | .github/workflows/d1-migration-verify.yml | `:15-` あり | `contents: read` |
| 3 | .github/workflows/e2e-tests.yml | なし | `contents: read` |
| 4 | .github/workflows/lighthouse.yml | なし | `contents: read` |
| 5 | .github/workflows/playwright-smoke.yml | なし | `contents: read` |
| 6 | .github/workflows/playwright-visual-baseline-update.yml | `:15-` (`contents: write` / `pull-requests: write`、git push を伴う) | `contents: read` |
| 7 | .github/workflows/playwright-visual-full.yml | `:15-` あり | `contents: read` |
| 8 | .github/workflows/validate-build.yml | なし | `contents: read` |
| 9 | .github/workflows/verify-design-tokens.yml | なし | `contents: read` |
| 10 | .github/workflows/verify-esbuild.yml | なし | `contents: read` |
| 11 | .github/workflows/verify-primitive-adoption.yml | なし | `contents: read` |
| 12 | .github/workflows/web-cd.yml | `:19-`, `:69-`, `:161-` あり | `contents: read` |

## 1.5 完了条件

- 12 workflow すべてに top-level `permissions:` が宣言されている。
- actionlint 1.7.7 が全 workflow に対し PASS する。
- required context 名の diff が無い。
