# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | pending |

## 目的

Phase 5 で適用した branch protection / environments / PR template / CODEOWNERS の設定が、意図的な迂回や操作ミスに対して正しくブロックできることを検証する。正常系が通ることは Phase 5 で確認済みのため、本 Phase は「壊れたケース」に絞って保護機能の有効性を確認し、AC-1 / AC-2 / AC-4 の異常系カバレッジを提供する。

## 実行タスク

1. 異常ケース検証シナリオを設計・実行する
2. rollback 手順を文書化・確認する
3. 境界確認（スコープ外への意図しない設定漏れがないか）を実施する
4. 検証結果を `outputs/phase-06/main.md` にまとめる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01a-parallel-github-and-branch-governance/index.md | AC 定義と Phase 依存関係 |
| 必須 | doc/01a-parallel-github-and-branch-governance/phase-05.md | Phase 5 セットアップ設定内容の確認 |
| 必須 | outputs/phase-05/repository-settings-runbook.md | 適用済み設定の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch / reviewers / env mapping 設計値 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 品質ゲート定義 |
| 参考 | GitHub Repository Settings UI | branch protection / environments 実設定確認 |

## 実行手順

### ステップ 1: 異常ケース検証シナリオの設計

以下の異常ケース一覧を参照し、各シナリオで「何を・どう試みて・何が返るか」を事前に定義する。

#### 異常ケース一覧

| ID | 異常ケース | 試行内容 | 期待動作 | 検証方法 |
| --- | --- | --- | --- | --- |
| E-01 | reviewer 1名で main へマージしようとする | PR を1名だけが承認し Merge ボタンを押す | PR がブロックされる（"2 approving reviews required" エラー表示） | GitHub PR UI で Merge ボタンが無効であることを確認 |
| E-02 | dev から直接 production 環境へデプロイしようとする | dev ブランチから手動で production environment を指定した deployment を実行 | deployment が拒否される（"Branch not allowed" エラー） | GitHub Actions ログで deployment rejection を確認 |
| E-03 | force push を main へ試みる | `git push --force origin main` を実行 | push が拒否される（"remote: error: GH006" エラー） | git push コマンドの exit code 非ゼロを確認 |
| E-04 | CODEOWNERS 外の reviewer が承認する | CODEOWNERS に記載されていないユーザーが PR を approve | review が有効にならない（required reviewer として計上されない） | GitHub PR UI の "Review required" ステータスが解除されないことを確認 |
| E-05 | CI が失敗した状態でマージしようとする | `ci/Validate Build` チェックが failing の状態で Merge ボタンを押す | マージボタンが無効になる（"Required status checks have not passed" エラー） | GitHub PR UI でマージボタンが無効であることを確認 |
| E-06 | main から直接 staging 環境へデプロイしようとする | main ブランチから手動で staging environment を指定した deployment を実行 | deployment が拒否される（staging は dev ブランチのみ受け付ける） | GitHub Actions ログで deployment rejection を確認 |
| E-07 | reviewer 0名でのマージを dev で試みる | dev ブランチ向け PR を誰も approve せずに Merge ボタンを押す | PR がブロックされる（"1 approving review required" エラー表示） | GitHub PR UI で Merge ボタンが無効であることを確認 |

### ステップ 2: 各異常ケースの実行と結果記録

各ケースを試行し、結果を以下のフォーマットで記録する。

```
| ID | 試行日時 | 実際の動作 | 期待と一致 | 備考 |
```

- 結果が期待と一致した場合: PASS と記録
- 結果が期待と異なった場合: FAIL と記録し、設定ミス箇所を特定してロールバック手順に従い修正

### ステップ 3: rollback 手順の確認

以下のロールバック手順を用いて設定ミスが発生した場合の復元フローを確認する。

#### rollback 手順

**branch protection のロールバック**

1. GitHub リポジトリ Settings > Branches を開く
2. 対象ブランチの protection rule を編集
3. Phase 5 の `outputs/phase-05/repository-settings-runbook.md` に記録された設定値を参照し、正本仕様の値へ戻す
4. "Save changes" をクリック

| ブランチ | 設定項目 | 正本仕様値 |
| --- | --- | --- |
| main | Required approving reviews | 2 |
| main | Required status checks | ci/Validate Build |
| main | Allow force pushes | OFF |
| main | Allow deletions | OFF |
| dev | Required approving reviews | 1 |
| dev | Required status checks | ci/Validate Build |
| dev | Allow force pushes | OFF |

**environments のロールバック**

1. GitHub リポジトリ Settings > Environments を開く
2. 対象 environment を選択
3. 以下の設定値へ戻す

| Environment | Required reviewers | Deployment branches |
| --- | --- | --- |
| production | 2名（設定済みレビュワー名） | main のみ |
| staging | 0名（自動） | dev のみ |

**CODEOWNERS のロールバック**

1. リポジトリルートの `.github/CODEOWNERS` を開く
2. Phase 5 で確定したファイル内容へ git revert で戻す
3. PR を作成して dev / main 経由でマージする

### ステップ 4: 境界確認（スコープ外への意図しない設定漏れ確認）

以下の観点でスコープ外への影響がないことを確認する。

| 確認観点 | 確認方法 | 合格基準 |
| --- | --- | --- |
| feature/* ブランチへの protection 設定が存在しないか | GitHub Settings > Branches で feature/* のルールを確認 | ルールが存在しない |
| production / staging 以外の environment が作成されていないか | GitHub Settings > Environments で一覧を確認 | production / staging のみ存在 |
| CODEOWNERS が意図しないパスをカバーしていないか | `.github/CODEOWNERS` の内容と task 責務を照合 | task 責務と矛盾がない |
| Cloudflare deploy 実行やシークレット実値投入が発生していないか | GitHub Actions runs の履歴を確認 | deploy は実行されていない |

### ステップ 5: 成果物作成

- 検証結果を `outputs/phase-06/main.md` に記録する
- FAIL があった場合は設定修正後に再検証し、全項目 PASS になってから完了とする
- Phase 7 への引き継ぎ事項（未解決事項・確認済み内容）を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の入力: Phase 5 で適用した設定が前提 |
| Phase 7 | 本 Phase の出力: E-01〜E-07 の検証結果が AC トレーサビリティマトリクスの根拠 |
| Phase 10 | 最終レビュー gate 判定において本 Phase の PASS/FAIL 記録を参照 |
| Phase 12 | close-out と spec sync 判断において本 Phase の境界確認結果を参照 |

## 多角的チェック観点

| 観点 | 確認内容 | 判断基準 |
| --- | --- | --- |
| 価値性 | 意図しないマージ・デプロイによるリグレッションリスクを下げているか | E-01〜E-07 が全 PASS であることで価値を実証できる |
| 実現性 | 無料枠の GitHub リポジトリ設定の範囲内で全異常系をブロックできるか | force push 禁止・reviewer 数・status check は全て無料機能で実現可能 |
| 整合性 | branch protection / environment の設定が設計書（deployment-branch-strategy.md）と一致するか | 各設定値が正本仕様テーブルの値と完全一致する |
| 運用性 | 設定ミスが発生した場合に runbook を見ながら 30 分以内に復元できるか | ロールバック手順が具体的なステップで記述されており、単独で実行可能 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 前提確認（Phase 5 完了・設定適用済み） | 6 | pending | phase-05.md と outputs/phase-05 を読む |
| 2 | E-01: reviewer 不足で main マージ試行 | 6 | pending | PR UI でブロック確認 |
| 3 | E-02: dev ブランチから production デプロイ試行 | 6 | pending | Actions ログで拒否確認 |
| 4 | E-03: main への force push 試行 | 6 | pending | git push --force エラー確認 |
| 5 | E-04: CODEOWNERS 外 reviewer の承認試行 | 6 | pending | PR ステータスで review 無効確認 |
| 6 | E-05: CI 失敗状態でのマージ試行 | 6 | pending | PR UI でマージボタン無効確認 |
| 7 | E-06: main から staging デプロイ試行 | 6 | pending | Actions ログで拒否確認 |
| 8 | E-07: reviewer 0名で dev へのマージ試行 | 6 | pending | PR UI でブロック確認 |
| 9 | rollback 手順の実行確認 | 6 | pending | FAIL ケースがあれば修正して再検証 |
| 10 | 境界確認（スコープ外への漏れ確認） | 6 | pending | Settings > Branches / Environments 確認 |
| 11 | outputs/phase-06/main.md 作成 | 6 | pending | 検証結果の全記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系検証結果（E-01〜E-07 の PASS/FAIL 記録・rollback 手順・境界確認結果） |
| メタ | artifacts.json | Phase 6 の状態と outputs パスの機械可読記録 |

## 完了条件

- [ ] E-01〜E-07 の全ケースが PASS（またはFAILから修正・再検証してPASS）
- [ ] rollback 手順が `outputs/phase-06/main.md` に記録されている
- [ ] 境界確認でスコープ外への意図しない設定がないことを確認済み
- [ ] Phase 7 への引き継ぎ事項（検証済み AC、残 open question）が記録されている
- [ ] `outputs/phase-06/main.md` が存在する

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜11 が全て completed
- [ ] `outputs/phase-06/main.md` が指定パスに配置済み
- [ ] E-01〜E-07 の全検証結果が PASS
- [ ] rollback 手順が文書化されている
- [ ] 境界確認（スコープ外への漏れなし）が完了している
- [ ] Phase 7 への引き継ぎ事項が記述されている
- [ ] artifacts.json の phase-06 エントリを completed に更新

## 次Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項:
  - E-01〜E-07 の検証結果（全 PASS）を AC トレーサビリティマトリクス作成の根拠として渡す
  - AC-1（reviewer 数）は E-01 / E-07 で、AC-2（environment branch mapping）は E-02 / E-06 で異常系が確認済みであることを明記する
  - AC-4（CODEOWNERS と task 責務の衝突）は E-04 で確認済みであることを明記する
- ブロック条件: E-01〜E-07 に未解決の FAIL がある場合は Phase 7 に進まない

## 異常系シナリオ表

| ID | 異常ケース | 期待される検出 | 対処 |
| --- | --- | --- | --- |
| E-01 | reviewer 1名での main マージ試行 | PR ブロック（2 approvals required） | branch protection の required reviews 値を正本仕様値 2 に戻す |
| E-02 | dev から production デプロイ試行 | deployment 拒否（branch not allowed） | environment の deployment branches 設定を main のみに戻す |
| E-03 | main への force push 試行 | push 拒否（GH006 エラー） | branch protection の allow force pushes を OFF に戻す |
| E-04 | CODEOWNERS 外 reviewer の承認 | review が required として計上されない | CODEOWNERS を正本仕様内容に戻す |
| E-05 | CI 失敗状態でのマージ試行 | マージボタン無効（status check not passed） | branch protection の required status checks に ci/Validate Build を追加する |
| E-06 | main から staging デプロイ試行 | deployment 拒否（branch not allowed） | environment の deployment branches 設定を dev のみに戻す |
| E-07 | reviewer 0名での dev マージ試行 | PR ブロック（1 approval required） | branch protection の required reviews 値を正本仕様値 1 に戻す |

## 4条件評価テーブル

| 条件 | 評価内容 | 結果 |
| --- | --- | --- |
| 価値性 | 意図しないマージ・誤環境デプロイをブロックし、本番障害リスクを低減する | PASS（E-01〜E-07 が全 PASS であれば価値を実証） |
| 実現性 | GitHub 無料機能（branch protection / environments）のみで全ケースをブロックできる。追加コスト不要 | PASS |
| 整合性 | 検証設定値が deployment-branch-strategy.md の設計値と完全一致する。CODEOWNERS が task 責務と衝突しない | PASS（境界確認完了後） |
| 運用性 | rollback 手順が runbook として記録済み。FAIL 発生時も 30 分以内の復元が可能 | PASS（rollback 手順文書化完了後） |
