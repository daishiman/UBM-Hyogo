# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 7 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

受入条件 AC-1〜AC-12 を検証手段・成果物・Phase にトレースする。


## 参照資料

- `index.md`
- `artifacts.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 入力

- index.md の AC 一覧
- Phase 4 成果物（テスト戦略）

## AC × 検証 × 成果物 マトリクス

| AC | 内容 | 検証手段 | 検証 Phase | 証跡成果物 |
| --- | --- | --- | --- | --- |
| AC-1 | backend-ci.yml の 4 箇所が `vars.X` に置換 | TC-S02 + TC-S06 | Phase 5 / 11 | manual-smoke-log.md, git diff |
| AC-2 | web-cd.yml の 2 箇所が `vars.X` に置換 | TC-S02 + TC-S06 | Phase 5 / 11 | manual-smoke-log.md, git diff |
| AC-3 | `secrets.CLOUDFLARE_ACCOUNT_ID` の参照 0 件 | TC-S01 | Phase 5 / 11 | manual-smoke-log.md |
| AC-4 | Variable 登録確認済み、Secret 未登録確認済み | TC-S05 | Phase 5（事前確認）/ 11 | manual-smoke-log.md |
| AC-5 | actionlint / yamllint エラーなし | TC-S03 + TC-S04 | Phase 5 / 11 | manual-smoke-log.md（ローカル未導入のため deferred） |
| AC-6 | backend-ci deploy-production green | TC-R01 + TC-R03 + TC-R04 | Phase 11（マージ後） | manual-smoke-log.md（gh run 出力） |
| AC-7 | web-cd deploy-production green | TC-R02 + TC-R03 + TC-R04 | Phase 11（マージ後） | manual-smoke-log.md（gh run 出力） |
| AC-8 | Phase 12 の 7 ファイル（main.md + 6 補助）が揃う | ファイル存在確認 | Phase 12 | outputs/phase-12/* |
| AC-9 | 不変条件 #5 を侵害しない | 設計レビュー | Phase 1 / 3 | phase-01.md / phase-03.md |
| AC-10 | Account ID Secret 化不要の根拠明記 | ドキュメント確認 | Phase 1 | phase-01.md（vars vs secret 判断根拠） |
| AC-11 | skill 検証 4 条件 PASS | レビュー判定 | Phase 1 / 3 / 10 / 12 | phase-10/main.md（CONDITIONAL GO 判定）, phase-12/system-spec-update-summary.md |
| AC-12 | aiworkflow-requirements 正本が Repository Variable に同期 | 正本仕様差分確認 | Phase 12 | system-spec-update-summary.md, documentation-changelog.md |

## 依存エッジ

| AC | 上流 Phase | 下流 Phase |
| --- | --- | --- |
| AC-1, AC-2 | Phase 2（置換マップ） | Phase 5（実行）、Phase 11（証跡） |
| AC-3 | - | Phase 5（grep）、Phase 11 |
| AC-4 | - | Phase 5（事前確認） |
| AC-5 | - | Phase 5、Phase 11 |
| AC-6, AC-7 | Phase 5 完了 + マージ | Phase 11（runtime 証跡） |
| AC-8 | Phase 1〜11 完了 | Phase 12 |
| AC-9, AC-10, AC-11 | - | Phase 1 / 3 / 10 / 12 |
| AC-12 | Phase 1 drift 確認 | Phase 12 |


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 全 AC が ID 付きで検証手段とマッピングされている
- [ ] 各 AC の証跡成果物が指定されている
- [ ] Runtime AC（AC-6, AC-7）はマージ後 Phase 11 で確認することが明記されている

## 成果物

- `outputs/phase-07/main.md`
