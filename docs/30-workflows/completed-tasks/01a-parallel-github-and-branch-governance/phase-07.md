# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-23 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | pending |

## 目的

Phase 5（セットアップ実行）と Phase 6（異常系検証）で実施した全検証が AC-1〜AC-5 を漏れなくカバーしているかをトレーサビリティマトリクスで確認する。カバレッジギャップがある場合は補完方針を決定し、Phase 8 以降で手戻りが起きないよう検証の完全性を保証する。

## 実行タスク

1. AC トレーサビリティマトリクスを作成する（各 AC について「どの Phase で・どの手順で・どのように検証するか」を一覧化）
2. カバレッジギャップ分析を実施する（未検証の AC または設計項目がないかチェック）
3. 検証の優先順位を整理する（critical path: AC-1, AC-2）
4. 検証結果を `outputs/phase-07/main.md` にまとめる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01a-parallel-github-and-branch-governance/index.md | AC-1〜AC-5 の定義 |
| 必須 | doc/01a-parallel-github-and-branch-governance/phase-05.md | 正常系検証の内容確認 |
| 必須 | doc/01a-parallel-github-and-branch-governance/phase-06.md | 異常系検証 E-01〜E-07 の結果 |
| 必須 | outputs/phase-05/repository-settings-runbook.md | セットアップ設定の正本 |
| 必須 | outputs/phase-06/main.md | 異常系検証結果の記録 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch / reviewers / env mapping 設計値 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 品質ゲート定義 |

## 実行手順

### ステップ 1: 前提確認と入力の読み込み

- Phase 5 の完了確認: `outputs/phase-05/repository-settings-runbook.md` が存在し、branch protection / environments / PR template / CODEOWNERS の設定内容が記録されていること
- Phase 6 の完了確認: `outputs/phase-06/main.md` が存在し、E-01〜E-07 が全て PASS であること
- index.md の AC-1〜AC-5 定義を再読み込みし、検証対象を確認する

### ステップ 2: AC トレーサビリティマトリクスの作成

各 AC について「どの Phase で・どの手順で・どのように検証するか・合格基準は何か」を以下のマトリクスにまとめる。

#### AC トレーサビリティマトリクス

| AC | 定義 | 正常系検証 Phase | 正常系検証手順 | 異常系検証 Phase | 異常系検証手順 | 合格基準 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | main は reviewer 2名、dev は reviewer 1名 | Phase 5 | branch protection 設定確認（main: required reviews = 2、dev: required reviews = 1） | Phase 6 | E-01: reviewer 1名で main マージ試行→ブロック確認、E-07: reviewer 0名で dev マージ試行→ブロック確認 | reviewer 数が設計値と完全一致し、不足時はマージがブロックされる |
| AC-2 | production は main のみ、staging は dev のみ受け付ける | Phase 5 | environment 設定確認（production: main のみ、staging: dev のみ） | Phase 6 | E-02: dev から production デプロイ試行→拒否確認、E-06: main から staging デプロイ試行→拒否確認 | branch mapping が設計値と完全一致し、誤 branch からのデプロイが拒否される |
| AC-3 | PR template に true issue / dependency / 4条件の欄がある | Phase 5 | PR template ファイル（`.github/pull_request_template.md`）の内容確認、4条件欄（true issue / dependency / 価値性 / 実現性 / 整合性 / 運用性）の存在確認 | — | 異常系検証不要（ドキュメントの内容確認のみ） | 4条件欄が全て存在し、PR 作成時に表示される |
| AC-4 | CODEOWNERS と task 責務が衝突しない | Phase 5 | `.github/CODEOWNERS` の内容と task 責務テーブルの照合 | Phase 6 | E-04: CODEOWNERS 外 reviewer の承認試行→required review として計上されないことを確認 | CODEOWNERS のパス定義が task 責務と矛盾せず、意図したレビュワーのみが required reviewer として機能する |
| AC-5 | local-check-result.md と change-summary.md の close-out path がある | Phase 13 | `outputs/phase-13/local-check-result.md` と `outputs/phase-13/change-summary.md` の存在確認 | — | 異常系検証不要（Phase 13 で close-out 時に確認） | 2ファイルが指定パスに存在する |

### ステップ 3: カバレッジギャップ分析

以下の観点で未検証の AC または設計項目がないかを分析する。

#### ギャップ分析テーブル

| 確認観点 | 分析結果 | 対処方針 |
| --- | --- | --- |
| AC-1 の正常系カバレッジ | Phase 5 で branch protection 設定確認 → カバー済み | 追加対応不要 |
| AC-1 の異常系カバレッジ | Phase 6 で E-01 / E-07 → カバー済み | 追加対応不要 |
| AC-2 の正常系カバレッジ | Phase 5 で environment 設定確認 → カバー済み | 追加対応不要 |
| AC-2 の異常系カバレッジ | Phase 6 で E-02 / E-06 → カバー済み | 追加対応不要 |
| AC-3 の検証カバレッジ | Phase 5 でテンプレートファイルの存在・内容確認 → カバー済み（異常系は不要） | 追加対応不要 |
| AC-4 の正常系カバレッジ | Phase 5 で CODEOWNERS ファイル内容確認 → カバー済み | 追加対応不要 |
| AC-4 の異常系カバレッジ | Phase 6 で E-04 → カバー済み | 追加対応不要 |
| AC-5 の検証カバレッジ | Phase 13 での close-out 時に確認（本 Phase では確認不要） | Phase 13 で確認 |
| force push 禁止の異常系 | Phase 6 で E-03 → AC-1 / AC-2 の補完として カバー済み | 追加対応不要 |
| CI 失敗時のマージブロック | Phase 6 で E-05 → deployment-core.md の CI 品質ゲートに対応してカバー済み | 追加対応不要 |

#### ギャップサマリー

| カテゴリ | 件数 |
| --- | --- |
| カバー済み AC | AC-1 / AC-2 / AC-3 / AC-4（4件） |
| Phase 13 で確認予定 | AC-5（1件） |
| 未カバー（ギャップ） | 0件 |

現時点でのギャップ: **なし**

AC-5 については Phase 13（PR作成）の close-out フェーズで確認するため、本 Phase での未検証は設計上意図されたものである。

### ステップ 4: 検証優先順位の整理

#### Critical Path

以下の AC は本番デプロイの安全性に直結するため、最優先で検証する。

| 優先度 | AC | 理由 | 対応 Phase |
| --- | --- | --- | --- |
| Critical | AC-1 | reviewer 不足によるレビューなしマージは本番品質リスクに直結する | Phase 5 + Phase 6 |
| Critical | AC-2 | 誤 branch からの production デプロイは本番障害を引き起こす | Phase 5 + Phase 6 |
| High | AC-4 | CODEOWNERS の設定ミスは AC-1 の保護を無効化するリスクがある | Phase 5 + Phase 6 |
| Medium | AC-3 | PR template の欠如はプロセス上の漏れを生むが即時障害には至らない | Phase 5 |
| Low | AC-5 | close-out ファイルの不在は最終 PR 作成前に確認できる | Phase 13 |

#### 依存関係チェーン

```
AC-1（branch protection）
  └── AC-4（CODEOWNERS）← CODEOWNERS が壊れると AC-1 の reviewer 要件が無効化される

AC-2（environment branch mapping）
  └── 独立（他 AC との依存なし）

AC-3（PR template）
  └── 独立（他 AC との依存なし）

AC-5（close-out path）
  └── Phase 13 依存（他 Phase で先行確認不可）
```

### ステップ 5: 成果物作成

- トレーサビリティマトリクス・ギャップ分析・優先順位整理を `outputs/phase-07/main.md` に記録する
- Phase 8 への引き継ぎ事項を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の入力: 正常系検証結果 |
| Phase 6 | 本 Phase の入力: 異常系検証結果（E-01〜E-07） |
| Phase 8 | 本 Phase の出力: トレーサビリティマトリクスが DRY 化の前提条件 |
| Phase 10 | 最終レビュー gate において AC-1〜AC-5 の検証状況を参照 |
| Phase 12 | close-out と spec sync において本 Phase のギャップ分析結果を参照 |
| Phase 13 | AC-5 の最終確認タイミング |

## 多角的チェック観点

| 観点 | 確認内容 | 判断基準 |
| --- | --- | --- |
| 価値性 | AC-1〜AC-5 が全て検証され、リリース可否判断の根拠が揃っているか | トレーサビリティマトリクスで全 AC が1つ以上の検証手順にマッピングされている |
| 実現性 | ギャップ分析で未カバー AC が0件であるか（または意図的な延期が記録されているか） | ギャップ件数 = 0、またはギャップの対処方針が記録されている |
| 整合性 | 各 AC の合格基準が deployment-branch-strategy.md の設計値と矛盾しないか | 合格基準の数値（reviewer 数・branch 名）が正本仕様と完全一致する |
| 運用性 | Phase 10 の最終レビューで本 Phase の成果物を参照して判断できるか | `outputs/phase-07/main.md` が Phase 10 から参照可能なパスに存在する |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 前提確認（Phase 5 / 6 完了確認） | 7 | pending | outputs/phase-05 と outputs/phase-06 を読む |
| 2 | AC トレーサビリティマトリクスの作成 | 7 | pending | AC-1〜AC-5 x Phase / 手順 / 合格基準 |
| 3 | カバレッジギャップ分析の実施 | 7 | pending | ギャップ件数 0 の確認 |
| 4 | 検証優先順位の整理（critical path 特定） | 7 | pending | AC-1 / AC-2 を critical と明記 |
| 5 | 依存関係チェーンの確認 | 7 | pending | AC-1 と AC-4 の依存を記録 |
| 6 | outputs/phase-07/main.md 作成 | 7 | pending | マトリクス・ギャップ・優先順位の全記録 |
| 7 | Phase 8 への引き継ぎ事項記録 | 7 | pending | next phase handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC トレーサビリティマトリクス・ギャップ分析・検証優先順位の全記録 |
| メタ | artifacts.json | Phase 7 の状態と outputs パスの機械可読記録 |

## 完了条件

- [ ] AC-1〜AC-5 の全てがトレーサビリティマトリクスに記録されている
- [ ] ギャップ分析が完了し、未カバー AC が 0件（または意図的延期の記録がある）
- [ ] Critical path（AC-1, AC-2）が明示されている
- [ ] `outputs/phase-07/main.md` が存在する
- [ ] Phase 8 への引き継ぎ事項が記録されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が全て completed
- [ ] `outputs/phase-07/main.md` が指定パスに配置済み
- [ ] AC-1〜AC-5 が全てマトリクスに記録されている
- [ ] ギャップ分析が完了し未カバー AC が 0件（または延期記録あり）
- [ ] Critical path（AC-1, AC-2）が明示されている
- [ ] Phase 8 への引き継ぎ事項が記述されている
- [ ] artifacts.json の phase-07 エントリを completed に更新

## 次Phase

- 次: 8 (設定 DRY 化)
- 引き継ぎ事項:
  - AC-1〜AC-4 の検証がトレーサビリティマトリクスで完全にカバーされていることを確認済みとして渡す
  - AC-5 は Phase 13 で確認予定である旨を明記する
  - Critical path の AC-1 / AC-2 は Phase 5 + Phase 6 の両方で検証済みであることを明記する
  - 設定の DRY 化に際しても reviewer 数・branch 名・status check 名は正本仕様値から変更しないこと
- ブロック条件: ギャップ分析で未カバー AC が残っている場合は Phase 8 に進まない

## AC × 検証項目マトリクス（簡易版）

| AC | 検証 Phase | 検証手順 | 合格基準 |
| --- | --- | --- | --- |
| AC-1 | Phase 5 + Phase 6 | branch protection 設定確認（正常系）+ E-01 / E-07 reviewer 不足マージ試行（異常系） | reviewer 数が設計値と一致し、不足時はマージがブロックされる |
| AC-2 | Phase 5 + Phase 6 | environment 設定確認（正常系）+ E-02 / E-06 誤 branch デプロイ試行（異常系） | branch mapping が正本と一致し、誤 branch からのデプロイが拒否される |
| AC-3 | Phase 5 | PR template ファイルの存在・4条件欄の内容確認 | 4条件欄（true issue / dependency / 価値性 / 実現性 / 整合性 / 運用性）が全て存在する |
| AC-4 | Phase 5 + Phase 6 | CODEOWNERS 内容と task 責務の照合（正常系）+ E-04 CODEOWNERS 外 reviewer 承認試行（異常系） | task 責務と衝突なく、CODEOWNERS 外 reviewer の承認が required として計上されない |
| AC-5 | Phase 13 | close-out files の存在確認（outputs/phase-13/local-check-result.md と change-summary.md） | 2ファイルが指定パスに存在する |

## 未カバー AC とフォロー方針

| 状態 | AC | 方針 |
| --- | --- | --- |
| Phase 13 で確認予定 | AC-5 | close-out 時に `outputs/phase-13/` の2ファイル存在を確認する。Phase 13 完了時に artifacts.json の AC-5 を verified に更新する |
| ギャップなし | — | 現時点で未カバーの AC は 0件 |

## 4条件評価テーブル

| 条件 | 評価内容 | 結果 |
| --- | --- | --- |
| 価値性 | AC-1〜AC-5 の全検証カバレッジを可視化し、リリース判断の根拠を提供する | PASS（トレーサビリティマトリクスで全 AC がカバーされている） |
| 実現性 | ギャップ分析・優先順位整理はドキュメント作業のみで完結し、追加実装不要 | PASS |
| 整合性 | 合格基準の数値・名称が deployment-branch-strategy.md の設計値と完全一致する | PASS（reviewer 数・branch 名・status check 名が設計値と一致） |
| 運用性 | Phase 10 の最終レビューで `outputs/phase-07/main.md` を参照して AC 充足を判断できる | PASS（成果物パスが具体的に定義されている） |
