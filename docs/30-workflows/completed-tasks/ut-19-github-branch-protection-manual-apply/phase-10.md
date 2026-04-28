# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | completed |

## 目的

Phase 1〜9 の成果物を総合的に評価し、4条件（価値性・実現性・整合性・運用性）と AC-1〜AC-7 全件の完了を確認したうえで GO/NO-GO 判定を行う。docs-only / `spec_created` タスクとして、ランブックと実適用結果が整合し、後続 UT-05 / UT-06 が安心して branch protection を前提にできる品質に達していることを最終確認する。

## 実行タスク

- 4条件（価値性・実現性・整合性・運用性）を最終評価する
- AC-1〜AC-7 の全件完了を確認する
- 01a-parallel-github-and-branch-governance および UT-05 との整合を最終確認する
- ランブック (`repository-settings-runbook.md`) と実適用結果の乖離が解消されていることを確認する
- GO/NO-GO 判定を行い結果を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-07/coverage-matrix.md | AC × Phase トレース表 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-09/quality-report.md | 品質保証結果 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-08/runbook-dry-diff.md | runbook と実適用の差分・統合提案 |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 適用ランブックの正本 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略の正本 |

## 実行手順

### ステップ 1: 4条件の最終評価

- 価値性・実現性・整合性・運用性の各条件について Phase 1〜9 の成果物を根拠に評価する
- 各条件の判定（PASS / FAIL / CONDITIONAL）と根拠を記録する
- FAIL または CONDITIONAL の条件がある場合は対応策を検討し、必要に応じて差し戻す

### ステップ 2: AC 全件の最終確認

- Phase 7 の coverage matrix を参照し、AC-1〜AC-7 の証跡が揃っているか確認する
- 未完了の AC がある場合は GO 判定を保留する
- 01a ランブックの手順と実適用結果が乖離していないことを Phase 8 成果物で再確認する
- `develop` 旧ブランチ名残存ゼロ（AC-7）を `grep -rn "develop" docs/ .github/` で再確認する

### ステップ 3: GO/NO-GO 判定と記録

- GO/NO-GO 判定表を作成する
- GO の場合は Phase 11 への引き継ぎ事項を記録する
- NO-GO の場合は対応 Phase を特定し差し戻す

## 4条件最終評価【必須】

| 条件 | 評価観点 | 根拠 Phase | 判定 | 備考 |
| --- | --- | --- | --- | --- |
| 価値性 | branch protection が CI ゲートとして機能し、UT-05 / UT-06 のリスクが下がるか | Phase 1, 2 | 実行時記入 | 個人開発の運用負荷を上げずに承認不要モデルで成立 |
| 実現性 | `gh api` + UI 操作併用で branch protection / Environments を確定できるか | Phase 4, 5 | 実行時記入 | UT-05 の CI 1回実行が前提条件 |
| 整合性 | ランブック・実適用・正本仕様 (`deployment-branch-strategy.md`) が矛盾なく整合しているか | Phase 7, 8 | 実行時記入 | `develop` → `dev` の揺れ解消を含む |
| 運用性 | 適用結果証跡 (before/after JSON) と異常系対応 (Phase 6) が runbook に記録されているか | Phase 5, 6 | 実行時記入 | docs-only / spec_created として文書完結 |

## GO/NO-GO 判定【必須】

| 判定項目 | 基準 | 状態 | 判定 |
| --- | --- | --- | --- |
| AC-1〜AC-7 全件完了 | Phase 7 の coverage matrix で全件 PASS | pending | 実行時記入 |
| 4条件全 PASS | 価値性・実現性・整合性・運用性すべて PASS | pending | 実行時記入 |
| 無料枠 PASS | Phase 9 の無料枠確認結果（GitHub Free / Actions 無料枠内） | pending | 実行時記入 |
| secret hygiene PASS | Phase 9 の secret 混入検査結果（database_id / token 等） | pending | 実行時記入 |
| ランブック整合 PASS | Phase 8 の runbook-dry-diff.md で乖離ゼロ | pending | 実行時記入 |
| `develop` 残存ゼロ | AC-7 の grep 検査結果 | pending | 実行時記入 |

**最終判定: 実行時記入（GO / NO-GO）**

> GO 条件: 上記全項目が PASS であること。
> NO-GO の場合: 対応 Phase を特定して差し戻し、再評価する。

## 01a-parallel-github-and-branch-governance 整合最終確認

| 確認項目 | 期待状態 | 実際の状態 | 判定 |
| --- | --- | --- | --- |
| ランブックのコマンドと実適用コマンドが一致 | 完全一致または差分が Phase 8 で吸収されている | pending | 実行時記入 |
| `required_status_checks.contexts` が UT-05 の CI ジョブ名と一致 | `ci` / `Validate Build` が登録 | pending | 実行時記入 |
| Environments のブランチポリシーがランブック通り | production = main / staging = dev | pending | 実行時記入 |
| 01a Phase 12 の `unassigned-task-detection.md` で UT-19 が close 扱いに更新可能 | 検出済み → 仕様書化済み | pending | 実行時記入 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1〜9 | 全成果物を最終評価の根拠として使用 |
| Phase 11 | GO 判定後にテスト PR で branch protection の動作確認を実施 |
| Phase 12 | GO 判定の結果を close-out（implementation-guide / system-spec-update-summary）に記録 |
| Phase 13 | GO 判定が無い場合は PR 作成に進まない |

## 多角的チェック観点（AIが判断）

- 価値性: docs-only / spec_created として、設定根拠・適用証跡・異常系対応が UT-05 / UT-06 着手者の参照に足るか。
- 実現性: status check context 未登録による 422 エラー回避手順が runbook と Phase 6 で再現可能か。
- 整合性: Phase 1〜9 の成果物が互いに矛盾せず、`deployment-branch-strategy.md` 正本と一貫しているか。
- 運用性: 個人開発前提（承認不要・enforce_admins=false）が将来チーム化した際の差し替えポイントとして明記されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4条件最終評価 | 10 | pending | 根拠 Phase を明記 |
| 2 | AC-1〜AC-7 全件最終確認 | 10 | pending | Phase 7 の coverage matrix 参照 |
| 3 | GO/NO-GO 判定 | 10 | pending | outputs/phase-10/final-review.md |
| 4 | 01a / UT-05 整合最終確認 | 10 | pending | 差し戻し不要か判断 |
| 5 | `develop` 残存ゼロ再確認 | 10 | pending | AC-7 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/final-review.md | GO/NO-GO 判定表と4条件評価結果 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 4条件が全 PASS である
- AC-1〜AC-7 が全件完了している
- GO/NO-GO 判定が GO である
- ランブック・01a タスク・UT-05 との整合が確認されている
- `develop` 旧ブランチ名残存ゼロが確認されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: GO/NO-GO 判定結果と4条件評価結果、ランブック整合確認結果を Phase 11 に引き継ぐ。
- ブロック条件: GO 判定が得られていない場合は Phase 11 に進まない。
