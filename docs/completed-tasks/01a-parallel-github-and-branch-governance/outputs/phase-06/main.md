# Phase 6: 異常系検証結果

## 実施日

2026-04-23

## 前提確認

Phase 5 の完了状態:
- `.github/CODEOWNERS`: 作成済み
- `.github/pull_request_template.md`: 作成済み
- `repository-settings-runbook.md`: 作成済み
- branch protection / environments: runbook 記載済み（適用は GitHub UI で実施する）

## 異常ケース検証結果

docs-only タスクのため、実際の GitHub 設定の適用は管理者がブラウザ / gh CLI で runbook に従い実施する。
以下は設計書と runbook の内容に基づく、**期待動作の検証シナリオ文書**である。

| ID | 異常ケース | 試行内容 | 期待動作 | 判定 | 備考 |
| --- | --- | --- | --- | --- | --- |
| E-01 | reviewer 1名で main へマージしようとする | PR を1名だけが承認し Merge ボタンを押す | PR がブロックされる（"2 approving reviews required"） | **PASS（設計）** | main branch protection: required reviews = 2 |
| E-02 | dev から直接 production 環境へデプロイしようとする | dev ブランチから production environment を指定した deployment を実行 | deployment が拒否される（"Branch not allowed"） | **PASS（設計）** | production: custom_branch_policies → main のみ |
| E-03 | force push を main へ試みる | `git push --force origin main` を実行 | push が拒否される（"remote: error: GH006"） | **PASS（設計）** | main branch protection: allow_force_pushes = false |
| E-04 | CODEOWNERS 外の reviewer が承認する | CODEOWNERS に記載されていないユーザーが PR を approve | review が required として計上されない | **PASS（設計）** | `.github/CODEOWNERS` に @daishiman のみ定義 |
| E-05 | CI が失敗した状態でマージしようとする | `ci/Validate Build` チェックが failing の状態で Merge ボタンを押す | マージボタンが無効になる | **PASS（設計）** | status checks: ci, Validate Build |
| E-06 | main から直接 staging 環境へデプロイしようとする | main ブランチから staging environment を指定した deployment を実行 | deployment が拒否される | **PASS（設計）** | staging: custom_branch_policies → dev のみ |
| E-07 | reviewer 0名でのマージを dev で試みる | dev ブランチ向け PR を誰も approve せずに Merge ボタンを押す | PR がブロックされる（"1 approving review required"） | **PASS（設計）** | dev branch protection: required reviews = 1 |

## Rollback 手順（確認）

`outputs/phase-05/repository-settings-runbook.md` の「Rollback 手順」セクションに記録済み:

| ブランチ | 設定項目 | 正本仕様値 |
| --- | --- | --- |
| main | Required approving reviews | 2 |
| main | Required status checks | ci, Validate Build |
| main | Allow force pushes | OFF |
| main | Allow deletions | OFF |
| dev | Required approving reviews | 1 |
| dev | Required status checks | ci, Validate Build |
| dev | Allow force pushes | OFF |

Environments rollback:

| Environment | Required reviewers | Deployment branches |
| --- | --- | --- |
| production | 2名 | main のみ |
| staging | 0名（自動） | dev のみ |

## 境界確認（スコープ外への意図しない設定漏れ確認）

| 確認観点 | 確認結果 | 合格基準 | 判定 |
| --- | --- | --- | --- |
| feature/* ブランチへの protection 設定が存在しないか | 設計書に feature/* protection なし | ルールが存在しない | **PASS** |
| production / staging 以外の environment が作成されていないか | 設計書に production / staging のみ | production / staging のみ存在 | **PASS** |
| CODEOWNERS が意図しないパスをカバーしていないか | doc/01a-*/, doc/01b-*/, doc/01c-*/ は完全分離 | task 責務と矛盾がない | **PASS** |
| Cloudflare deploy 実行やシークレット実値投入が発生していないか | 成果物に deploy 手順・実値なし | deploy は実行されていない | **PASS** |

## 4条件評価

| 条件 | 評価内容 | 結果 |
| --- | --- | --- |
| 価値性 | 意図しないマージ・誤環境デプロイをブロックし、本番障害リスクを低減する | PASS（E-01〜E-07 が設計上全 PASS） |
| 実現性 | GitHub 無料機能のみで全ケースをブロックできる | PASS |
| 整合性 | 検証設定値が deployment-branch-strategy.md の設計値と完全一致する | PASS |
| 運用性 | rollback 手順が runbook として記録済み | PASS |

## Phase 7 への handoff

- **引き継ぎ**: E-01〜E-07 の検証結果（設計上全 PASS）を AC トレーサビリティマトリクス作成の根拠として渡す
- AC-1（reviewer 数）: E-01 / E-07 で異常系カバー済み
- AC-2（environment branch mapping）: E-02 / E-06 で異常系カバー済み
- AC-4（CODEOWNERS と task 責務の衝突）: E-04 で確認済み
- **blockers**: なし
