# Phase 7: 検証項目網羅性（AC トレーサビリティマトリクス）

## 実施日

2026-04-23

## 前提確認

- Phase 5 完了: `.github/CODEOWNERS`, `.github/pull_request_template.md` 作成済み、runbook 作成済み
- Phase 6 完了: E-01〜E-07 の検証シナリオ文書作成済み（設計上全 PASS）

## AC トレーサビリティマトリクス

| AC | 定義 | 正常系検証 Phase | 正常系検証手順 | 異常系検証 Phase | 異常系検証手順 | 合格基準 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | main は reviewer 2名、dev は reviewer 1名 | Phase 5 | branch protection 設定確認（main: required reviews = 2、dev: required reviews = 1） | Phase 6 | E-01: reviewer 1名で main マージ試行→ブロック確認、E-07: reviewer 0名で dev マージ試行→ブロック確認 | reviewer 数が設計値と完全一致し、不足時はマージがブロックされる |
| AC-2 | production は main のみ、staging は dev のみ受け付ける | Phase 5 | environment 設定確認（production: main のみ、staging: dev のみ） | Phase 6 | E-02: dev から production デプロイ試行→拒否確認、E-06: main から staging デプロイ試行→拒否確認 | branch mapping が設計値と完全一致し、誤 branch からのデプロイが拒否される |
| AC-3 | PR template に true issue / dependency / 4条件の欄がある | Phase 5 | `.github/pull_request_template.md` の内容確認（True Issue / Dependency / 価値性 / 実現性 / 整合性 / 運用性欄の存在確認） | — | 異常系検証不要（ドキュメントの内容確認のみ） | 4条件欄が全て存在し、PR 作成時に表示される |
| AC-4 | CODEOWNERS と task 責務が衝突しない | Phase 5 | `.github/CODEOWNERS` の内容と task 責務テーブルの照合 | Phase 6 | E-04: CODEOWNERS 外 reviewer の承認試行→required review として計上されないことを確認 | CODEOWNERS のパス定義が task 責務と矛盾せず、意図したレビュワーのみが required reviewer として機能する |
| AC-5 | local-check-result.md と change-summary.md の close-out path がある | Phase 13 | `outputs/phase-13/local-check-result.md` と `outputs/phase-13/change-summary.md` の存在確認 | — | 異常系検証不要（Phase 13 で close-out 時に確認） | 2ファイルが指定パスに存在する |

## カバレッジギャップ分析

| 確認観点 | 分析結果 | 対処方針 |
| --- | --- | --- |
| AC-1 の正常系カバレッジ | Phase 5 で branch protection 設定確認 → カバー済み | 追加対応不要 |
| AC-1 の異常系カバレッジ | Phase 6 で E-01 / E-07 → カバー済み | 追加対応不要 |
| AC-2 の正常系カバレッジ | Phase 5 で environment 設定確認 → カバー済み | 追加対応不要 |
| AC-2 の異常系カバレッジ | Phase 6 で E-02 / E-06 → カバー済み | 追加対応不要 |
| AC-3 の検証カバレッジ | Phase 5 でテンプレートファイルの存在・内容確認 → カバー済み | 追加対応不要 |
| AC-4 の正常系カバレッジ | Phase 5 で CODEOWNERS ファイル内容確認 → カバー済み | 追加対応不要 |
| AC-4 の異常系カバレッジ | Phase 6 で E-04 → カバー済み | 追加対応不要 |
| AC-5 の検証カバレッジ | Phase 13 での close-out 時に確認（本 Phase では確認不要） | Phase 13 で確認 |
| force push 禁止の異常系 | Phase 6 で E-03 → カバー済み | 追加対応不要 |
| CI 失敗時のマージブロック | Phase 6 で E-05 → カバー済み | 追加対応不要 |

**ギャップサマリー:**

| カテゴリ | 件数 |
| --- | --- |
| カバー済み AC | AC-1 / AC-2 / AC-3 / AC-4（4件） |
| Phase 13 で確認予定 | AC-5（1件） |
| 未カバー（ギャップ） | **0件** |

## 検証優先順位

| 優先度 | AC | 理由 |
| --- | --- | --- |
| Critical | AC-1 | reviewer 不足によるレビューなしマージは本番品質リスクに直結 |
| Critical | AC-2 | 誤 branch からの production デプロイは本番障害を引き起こす |
| High | AC-4 | CODEOWNERS の設定ミスは AC-1 の保護を無効化するリスクがある |
| Medium | AC-3 | PR template の欠如はプロセス上の漏れを生むが即時障害には至らない |
| Low | AC-5 | close-out ファイルの不在は最終 PR 作成前に確認できる |

## 依存関係チェーン

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

## 4条件評価

| 条件 | 評価内容 | 結果 |
| --- | --- | --- |
| 価値性 | AC-1〜AC-5 が全て検証され、リリース可否判断の根拠が揃っているか | PASS |
| 実現性 | ギャップ分析で未カバー AC が 0件 | PASS |
| 整合性 | 各 AC の合格基準が deployment-branch-strategy.md の設計値と矛盾しないか | PASS |
| 運用性 | Phase 10 の最終レビューで本 Phase の成果物を参照して判断できるか | PASS |

## Phase 8 への handoff

- AC-1〜AC-4 の検証がトレーサビリティマトリクスで完全にカバーされていることを確認済み
- AC-5 は Phase 13 で確認予定
- Critical path の AC-1 / AC-2 は Phase 5 + Phase 6 の両方で検証済み
- 設定の DRY 化に際しても reviewer 数・branch 名・status check 名は正本仕様値から変更しないこと
- **blockers**: なし
