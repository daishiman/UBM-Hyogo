# Phase 11: 手動テスト / evidence inventory

[実装区分: 実装仕様書]

## NON_VISUAL 宣言

- **タスク種別**: backend bugfix + CI infrastructure（UI/UX 変更なし）
- **非視覚的理由**: 変更対象は middleware / env loader / CI workflow / shell script のみ。レンダリング画面の差分は発生しない
- **代替証跡**: Phase 7 ローカルテスト log + Phase 8 staging curl + backend-ci runtime smoke green log

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
|---|---|---|
| source-level API focused test | outputs/phase-07/test.log | present |
| source-level API typecheck | outputs/phase-07/api-typecheck.log | present |
| source-level smoke shell test | outputs/phase-07/smoke-test.log | present |
| source-level cf.sh guard test | outputs/phase-07/cfsh-secret-put.log | present |
| source-level workspace typecheck diagnostic | outputs/phase-07/typecheck.log | present |
| source-level full lint | outputs/phase-07/lint.log | pending |
| runtime staging smoke (admin-*/me-*) | outputs/phase-11/evidence/staging-runtime-smoke.log | present |
| runtime staging smoke summary JSON | outputs/phase-11/evidence/staging-runtime-smoke-summary.json | present |
| runtime production curl | outputs/phase-08/curl-production-admin-members.txt | pending |
| runtime backend-ci rerun | outputs/phase-08/backend-ci-smoke-green.txt | pending |
| approval | outputs/phase-08/user-approval-deploy.txt | pending |

## 2. 環境ブロッカーと source-level PASS の分離

[WEEKGRD-01] に従い、ローカル PASS と環境起因の問題（例: 1Password CLI 未認証 / staging bearer expired）を別カテゴリで記録する。

## 3. 主証跡ソース（NON_VISUAL）

- 主ソース: `outputs/phase-11/evidence/staging-runtime-smoke.log` + `staging-runtime-smoke-summary.json`（staging で admin-list / admin-detail / admin-attendance / me-root / me-profile / me-attendance がすべて HTTP 200 を返し、AUTH_SECRET binding 復旧を runtime PASS で確認）
- スクリーンショット不要理由: UI 変更なし、API レイヤの response code + body shape で検証可能

## 4. Phase 11 DoD

- `present` evidence path に実ファイルが存在
- `pending` evidence は user-gated runtime evidence として明示
- NON_VISUAL 宣言が冒頭に明記
- ローカル PASS と runtime PASS が分離記録
