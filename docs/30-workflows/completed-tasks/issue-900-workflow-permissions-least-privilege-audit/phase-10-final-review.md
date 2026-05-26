# Phase 10: 最終レビュー

## 10.1 不変条件最終チェック

- [ ] required status check の context 名（`audit-correlation-verify / verify`, `verify-design-tokens / verify-design-tokens`, `playwright-smoke / smoke (chromium)`, `playwright-smoke / visual (chromium, 4 screens)` 等）を変更していない
- [ ] `on:` トリガー・secret 参照・env を変更していない
- [ ] step のコマンド・順序を変更していない
- [ ] グループ B（`backend-ci.yml`, `playwright-visual-baseline-update.yml`, `web-cd.yml`, `d1-migration-verify.yml`, `playwright-visual-full.yml`）の既存 job-level 宣言を維持している
- [ ] `incident-runbook-slack-delivery.yml` を変更していない（既に top-level permissions あり）

## 10.2 完了条件チェックリスト

- [ ] backend-ci.yml に top-level permissions 追加
- [ ] d1-migration-verify.yml に top-level permissions 追加
- [ ] e2e-tests.yml に top-level permissions 追加
- [ ] lighthouse.yml に top-level permissions 追加
- [ ] playwright-smoke.yml に top-level permissions 追加
- [ ] playwright-visual-baseline-update.yml に top-level permissions 追加
- [ ] playwright-visual-full.yml に top-level permissions 追加
- [ ] validate-build.yml に top-level permissions 追加
- [ ] verify-design-tokens.yml に top-level permissions 追加
- [ ] verify-esbuild.yml に top-level permissions 追加
- [ ] verify-primitive-adoption.yml に top-level permissions 追加
- [ ] web-cd.yml に top-level permissions 追加
- [ ] `scripts/verify-workflow-top-level-permissions.sh` 追加（+chmod +x）
- [ ] `ci.yml` の actionlint step 直後に verify step 追加
- [ ] actionlint PASS（local もしくは CI）
- [ ] verify-workflow-top-level-permissions.sh PASS

## 10.3 Gate-B: 実装レビュー合格条件

すべての項目 ✅ 後にコミット可。
