# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-23 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

Phase 10 の GO 判定を受け、PR 作成前の最終手動確認として、実際の GitHub 設定（UI / gh CLI）が期待値通りになっているかをスモークテストで検証する。
全シナリオ PASS の場合のみ Phase 12 に進む。NG 時は問題の種類に応じて適切な Phase に差し戻す。

## 真の論点

1. **設定の実態確認**: ドキュメント上の仕様と GitHub リポジトリの実設定が一致しているか
2. **UI/CLI 両面での検証**: GitHub Settings UI と `gh` CLI の双方で確認することで、設定漏れや表示上の誤りを防ぐ
3. **NG 時の即時差し戻し**: smoke test は合否を記録するだけでなく、NG の場合に正しい差し戻し先 Phase を特定できること
4. **証跡の保存**: smoke test の実測値を `outputs/phase-11/manual-smoke-log.md` に記録し、Phase 12 / 13 の根拠とする

## 依存関係・責務境界

- **上流**: Phase 10 の GO 判定（`outputs/phase-10/main.md`）が出ていること
- **下流**: Phase 12 へ smoke test PASS の証跡を渡す
- **境界**: 設定の修正はこの Phase のスコープ外。NG を検出した場合は記録して差し戻す

## 実行タスク

### ステップ 1: 前提確認

Phase 10 の GO 判定が `outputs/phase-10/main.md` に記録されていることを確認する。未記録の場合は Phase 10 に差し戻す。

### ステップ 2: smoke test シナリオの実行

以下の 6 シナリオを順番に実行し、実測値と期待値を記録する。

#### smoke test シナリオ一覧

| テスト # | シナリオ | 手順 | 期待結果 |
| --- | --- | --- | --- |
| ST-1 | main branch protection 確認 | GitHub > Settings > Branches > main（または gh CLI） | reviewer 2 名・force push OFF |
| ST-2 | dev branch protection 確認 | GitHub > Settings > Branches > dev（または gh CLI） | reviewer 1 名・force push OFF |
| ST-3 | production environment 確認 | GitHub > Settings > Environments > production | main only・reviewer 2 名 |
| ST-4 | staging environment 確認 | GitHub > Settings > Environments > staging | dev only・自動（reviewer なし） |
| ST-5 | PR template 確認 | `.github/pull_request_template.md` の内容確認 | true issue / dependency / 4条件の欄あり |
| ST-6 | CODEOWNERS 確認 | `.github/CODEOWNERS` の内容確認 | @daishiman が設定されており task 責務と衝突なし |

#### gh CLI コマンド例

```bash
# ST-1: main branch protection - reviewer 数確認
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '.required_pull_request_reviews.required_approving_review_count'
# 期待値: 2

# ST-1: main branch protection - force push 禁止確認
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '.allow_force_pushes.enabled'
# 期待値: false

# ST-2: dev branch protection - reviewer 数確認
gh api repos/{owner}/{repo}/branches/dev/protection \
  --jq '.required_pull_request_reviews.required_approving_review_count'
# 期待値: 1

# ST-2: dev branch protection - force push 禁止確認
gh api repos/{owner}/{repo}/branches/dev/protection \
  --jq '.allow_force_pushes.enabled'
# 期待値: false

# ST-3, ST-4: environments 一覧確認
gh api repos/{owner}/{repo}/environments \
  --jq '.environments[] | {name: .name, deployment_branch_policy: .deployment_branch_policy}'

# default_branch 確認（参考）
gh api repos/{owner}/{repo} --jq '.default_branch'
# 期待値: main
```

### ステップ 3: smoke test 結果の記録

各シナリオの PASS / FAIL と実測値を以下のテンプレートに記録し、`outputs/phase-11/manual-smoke-log.md` に保存する。

#### smoke test 結果記録テンプレート

| テスト # | シナリオ | 期待結果 | 実測値 | 判定 | 備考 |
| --- | --- | --- | --- | --- | --- |
| ST-1 | main branch protection | reviewer 2 名・force push OFF | （実行時に記録） | TBD | |
| ST-2 | dev branch protection | reviewer 1 名・force push OFF | （実行時に記録） | TBD | |
| ST-3 | production environment | main only・reviewer 2 名 | （実行時に記録） | TBD | |
| ST-4 | staging environment | dev only・自動 | （実行時に記録） | TBD | |
| ST-5 | PR template | true issue / dependency / 4条件欄あり | （実行時に記録） | TBD | |
| ST-6 | CODEOWNERS | @daishiman 設定・衝突なし | （実行時に記録） | TBD | |

### ステップ 4: NG 時の対処フロー実行

いずれかのシナリオが FAIL の場合、以下の逆引き表に従い差し戻し先 Phase を特定して記録する。

### ステップ 5: 成果物の作成・更新

`outputs/phase-11/main.md`（smoke test 総合結果）と `outputs/phase-11/manual-smoke-log.md`（詳細ログ）を作成する。
全 ST PASS の場合は Phase 12 進行可と記録する。

## NG 時の対処フロー（逆引き表）

| 問題の種類 | 具体例 | 差し戻し先 |
| --- | --- | --- |
| branch protection の設定 drift | reviewer 数が違う・force push が有効になっている | Phase 5（セットアップ実行）または Phase 8（DRY 化） |
| environment の設定 drift | production に dev からのデプロイが許可されている | Phase 5（セットアップ実行）または Phase 8（DRY 化） |
| source-of-truth との矛盾 | runbook の手順が実設定と異なる | Phase 2（設計）または Phase 3（設計レビュー） |
| PR template に欄が不足 | 4条件欄がない・true issue 欄がない | Phase 5（セットアップ実行） |
| CODEOWNERS の設定ミス | @daishiman が未設定・01b / 01c と衝突がある | Phase 4（事前検証）または Phase 5（セットアップ実行） |
| output path の drift | downstream task が参照できる path がない | Phase 5（セットアップ実行）または Phase 8（DRY 化） |
| secrets 実値の混入 | CODEOWNERS や template に実値が書かれている | Phase 9（品質保証） |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping の正本（期待値の根拠） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | PR は承認後のみ |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-10/main.md` | GO 判定の確認 |
| 参考 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md` | GitHub 設定適用 runbook（期待値の参考） |
| 参考 | GitHub Repository Settings | branch protection / environments の実設定確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を本 Phase の前提として使用。GO でない場合は実行しない |
| Phase 7 | AC トレースマトリクスを smoke test シナリオの期待値根拠として使用 |
| Phase 12 | 全 ST PASS の証跡（outputs/phase-11/manual-smoke-log.md）を close-out 判断に使用 |
| Phase 13 | PR 作成の直前確認として、本 Phase の PASS を要求 |

## 多角的チェック観点

- **価値性**: 実際の GitHub 設定が reviewer 不在・force push 許容リスクを封じていることを、UI/CLI で直接目視確認する
- **実現性**: smoke test は GitHub UI と `gh` CLI のみで実施可能。追加ツール・費用不要
- **整合性**: 各 ST の期待値が `deployment-branch-strategy.md` の規定値と一致しており、実測値との比較が客観的に行えることを確認する
- **運用性**: NG 時の差し戻し先が逆引き表で即座に特定できること。smoke test ログが証跡として保存されること

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 10 GO 判定の確認 | 11 | pending | outputs/phase-10/main.md を読む |
| 2 | ST-1 main branch protection 確認 | 11 | pending | GitHub UI または gh CLI で実行 |
| 3 | ST-2 dev branch protection 確認 | 11 | pending | GitHub UI または gh CLI で実行 |
| 4 | ST-3 production environment 確認 | 11 | pending | GitHub UI または gh CLI で実行 |
| 5 | ST-4 staging environment 確認 | 11 | pending | GitHub UI または gh CLI で実行 |
| 6 | ST-5 PR template 確認 | 11 | pending | .github/pull_request_template.md を確認 |
| 7 | ST-6 CODEOWNERS 確認 | 11 | pending | .github/CODEOWNERS を確認 |
| 8 | smoke test 結果記録（manual-smoke-log.md） | 11 | pending | 実測値を記録 |
| 9 | NG 対処フロー実行（必要な場合） | 11 | pending | FAIL があれば差し戻し先を特定 |
| 10 | 総合結果と Phase 12 進行判定（main.md 作成） | 11 | pending | outputs/phase-11/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `doc/01a-parallel-github-and-branch-governance/outputs/phase-11/main.md` | smoke test 総合結果（全 ST 判定・Phase 12 進行可否） |
| ドキュメント | `doc/01a-parallel-github-and-branch-governance/outputs/phase-11/manual-smoke-log.md` | 各 ST の詳細ログ（手順・実測値・判定・備考） |
| メタ | `doc/01a-parallel-github-and-branch-governance/artifacts.json` | Phase 11 status を completed に更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` が作成済み
- [ ] `outputs/phase-11/manual-smoke-log.md` に ST-1〜ST-6 の実測値と判定が記録済み
- [ ] 全 ST PASS、または NG の場合は差し戻し先 Phase が明記済み
- [ ] Phase 12 進行可否が明記されている
- [ ] `artifacts.json` の phase 11 が completed に更新済み

## タスク 100% 実行確認【必須】

- [ ] Phase 10 の GO 判定を確認済み（未確認なら実行しない）
- [ ] ST-1〜ST-6 の全シナリオを実行済み
- [ ] `outputs/phase-11/manual-smoke-log.md` に実測値・判定・備考が記録済み
- [ ] `outputs/phase-11/main.md` が指定パスに作成済み
- [ ] 全 ST PASS、または NG 時の差し戻し先 Phase が特定・記録済み
- [ ] Phase 12 への進行可否が明記済み
- [ ] 異常系（gh CLI エラー・権限不足・設定 drift）も検証・記録済み
- [ ] Phase 12 への引き継ぎ事項（smoke test 証跡 path）を記述済み
- [ ] `artifacts.json` の phase 11 を completed に更新済み

## 次Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: 全 ST PASS の証跡（`outputs/phase-11/manual-smoke-log.md`）と smoke test 総合結果（`outputs/phase-11/main.md`）を Phase 12 の close-out 判断根拠として渡す
- ブロック条件: `outputs/phase-11/main.md` が未作成、または ST に FAIL が残っている場合は Phase 12 に進まない

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | ST-1〜ST-6 の実行により reviewer 不在・force push リスクが実際に排除されていることを確認できるか | TBD（ST-1, ST-2 の実測値で確認） |
| 実現性 | smoke test が GitHub UI と gh CLI のみで完結し、追加コスト・ツールが不要か | TBD（コマンド例で事前確認済み） |
| 整合性 | 実測値が `deployment-branch-strategy.md` の規定値と一致するか | TBD（ST-1〜ST-6 の実測値と期待値の比較で確認） |
| 運用性 | NG 時の差し戻し先が逆引き表で即座に特定でき、再実行が可能か | TBD（逆引き表の網羅性で確認） |
