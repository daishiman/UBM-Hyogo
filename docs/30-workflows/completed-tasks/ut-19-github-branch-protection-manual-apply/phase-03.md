# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | completed |

## 目的

Phase 2 の設計（main / dev protection payload・Environments ポリシー・適用順序・検証手順・rollback）の妥当性をレビューし、代替案検討と PASS / MINOR / MAJOR 判定を行ったうえで、Phase 4 以降の実行可否を確定する。

## 実行タスク

- Phase 2 の設計が AC-1〜AC-7 を漏れなく満たすかをレビューする
- 代替案（branch protection 不採用 / 別 API / 別ツール）を列挙・比較する
- 4条件（価値性 / 実現性 / 整合性 / 運用性）を再評価する
- 主要リスク（422 エラー・branch 名揺れ・enforce_admins 罠・Environments UI 依存）を洗い出す
- 各観点で PASS / MINOR / MAJOR 判定を行う
- MAJOR があれば Phase 2 に差し戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-02.md | レビュー対象の設計 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-01.md | AC・4条件評価 |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 設計と runbook の乖離確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略との整合確認 |

## 実行手順

### ステップ 1: 設計の妥当性確認

- main / dev payload が AC-1 / AC-2 の項目を全て含んでいるか確認
- Environments ポリシー（production = main, staging = dev）が AC-3 / AC-4 と一致するか確認
- 検証手順（before/after JSON 取得）が AC-5 を満たすか確認
- ランブックと設計に乖離がないか確認（AC-6 への布石）
- `develop` 残存解消の手順が組み込まれているか確認（AC-7）

### ステップ 2: 代替案の検討

- 採用案（`gh api` + UI 併用）以外のアプローチを列挙
- 各代替案のコスト・リスク・効果を比較
- 採用案が最適である理由を記録

### ステップ 3: リスク洗い出しと PASS / MINOR / MAJOR 判定

- 422 / 403 / branch 名揺れ / enforce_admins / UI 依存などのリスクを評価
- 各観点で判定し、結果を記録
- MAJOR が 1 件でもあれば Phase 2 に差し戻し

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | MAJOR 判定時に差し戻す |
| Phase 4 | PASS 判定後に事前検証手順の設計に進む |
| Phase 5 | レビュー結果を実行の根拠とする |
| Phase 6 | 抽出したリスクが異常系検証の入力 |

## 多角的チェック観点（AIが判断）

- 価値性: 採用設計が個人開発方針（承認不要・CI 通過のみ）を最小コストで実現するか
- 実現性: `gh api` で payload が 200 応答する形式か、Environments の UI 依存範囲が明確か
- 整合性: ブランチ戦略（dev / main）・ランブック・正本仕様との齟齬がないか
- 運用性: rollback 手順（before.json 退避 + 再 POST）が現実的に機能するか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | main / dev payload レビュー | 3 | pending | AC-1 / AC-2 と整合 |
| 2 | Environments ポリシーレビュー | 3 | pending | AC-3 / AC-4 と整合 |
| 3 | 検証手順レビュー | 3 | pending | AC-5 と整合 |
| 4 | runbook 乖離レビュー | 3 | pending | AC-6 への布石 |
| 5 | `develop` 残存解消手順レビュー | 3 | pending | AC-7 |
| 6 | 代替案検討 | 3 | pending | gh api 以外の経路 |
| 7 | リスク洗い出し | 3 | pending | 422 / 403 / 揺れ / 罠 |
| 8 | PASS/MINOR/MAJOR 判定 | 3 | pending | 全観点で判定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/review-result.md | 設計レビュー結果（代替案 / リスク / 判定） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 代替案の検討が完了している
- 主要リスクが列挙され、対策が設計に反映可能か判定されている
- 全観点で PASS / MINOR / MAJOR 判定が完了している
- MAJOR がない（または Phase 2 差し戻しが完了している）
- 次 Phase への進行可否が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- MAJOR 判定の場合は Phase 2 差し戻し記録がある
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: 設計レビュー結果・代替案比較・リスク一覧・PASS/MINOR/MAJOR 判定を Phase 4 に渡す
- ブロック条件: MAJOR 判定が残っている場合は次 Phase に進まない

## 代替案

| 案 | 内容 | メリット | デメリット | 採否 |
| --- | --- | --- | --- | --- |
| A: `gh api` + UI 併用（採用案） | branch protection は `gh api`、Environments は `gh api` + UI で適用 | スクリプト化と UI 確実性のバランスが良い | UI 操作の手作業が残る | 採用 |
| B: `gh api` のみで完結 | Environments も全て `gh api` で操作 | 完全自動化 | API 仕様変動・未対応箇所で失敗リスク | 不採用（現時点） |
| C: Terraform / GitHub Provider | IaC で管理 | 再現性・履歴管理が強い | 個人開発で過剰投資・state 管理コスト | 不採用（規模不適合） |
| D: branch protection 不採用 | 設定せず運用ルールで吸収 | 設定コスト ゼロ | CI ゲートが構造的に機能せず事故リスク | 不採用 |
| E: PR 承認必須化 | `required_approving_review_count >= 1` | レビュー強制 | 個人開発で自分自身がブロックされる | 不採用（個人開発方針） |

## 4条件再評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 採用設計が CI ゲートを最小コストで構造化できるか | PASS（CI 必須化と承認不要を両立） |
| 実現性 | `gh api` payload が 200 応答する形式・UI 依存範囲が明確か | PASS（Environment branch policy は UI 併用として明示） |
| 整合性 | ブランチ戦略（dev / main）・runbook と齟齬がないか | PASS（正式名 `dev` / `main` に統一） |
| 運用性 | rollback（before.json 再 POST）が現実的に機能するか | PASS（before snapshot を Phase 4/5 の必須証跡に設定） |

## 主要リスク

| # | リスク | 影響 | 対策 | 担当 Phase |
| --- | --- | --- | --- | --- |
| R-1 | CI 未実行で `contexts` 未登録 → 422 エラー | main / dev 適用が全て失敗 | Phase 4 で UT-05 の CI 実行履歴を確認、未実行ならダミー push で発火 | 4 / 5 |
| R-2 | `develop` 残存により意図しないブランチに適用 | 不要 protection・整合崩壊 | 適用前 grep を Phase 4 チェックリストに必須化、AC-7 で確認 | 4 / 5 |
| R-3 | `enforce_admins=true` 誤設定 | admin（自分）の緊急修正不可 | 設計で `enforce_admins=false` を明示、payload diff で確認 | 2 / 5 |
| R-4 | Environments UI 操作の手作業ミス | production が dev を許可するなど誤設定 | 適用後に `gh api GET environments/{env}` で検証、AC-3/4 で担保 | 5 / 7 |
| R-5 | rollback 用 before.json 取得忘れ | 誤適用時に戻せない | Phase 5 手順で必ず先に before.json 取得、AC-5 で証跡担保 | 5 |
| R-6 | `gh` CLI 認証スコープ不足で 403 | 適用不能 | Phase 4 事前検証で `gh auth status` 確認 | 4 |

## PASS/MINOR/MAJOR 判定

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| main payload の AC-1 整合 | PASS | Phase 2 に contexts / approval=0 / force push 禁止 / deletion 禁止を明記 |
| dev payload の AC-2 整合 | PASS | main と同一構造として明記 |
| Environments 設計の AC-3 / AC-4 整合 | PASS | UI 操作 + `gh api GET` 検証の併用に分離 |
| 検証手順の AC-5 整合 | PASS | before/after 証跡パスを Phase 5 成果物として固定 |
| runbook 乖離（AC-6 への布石） | PASS | Phase 8 に runbook-dry-diff を配置 |
| `develop` 残存解消（AC-7） | PASS | 正式ブランチ指定としての旧名残存ゼロを検査対象にする |
| rollback 手順の現実性 | PASS | before snapshot と DELETE/再適用手順を保持 |
| 主要リスク R-1〜R-6 の対策織り込み | PASS | Phase 4〜6 の事前検証・実行・異常系へ割当済み |

**判定凡例:**
- PASS: そのまま次 Phase に進める
- MINOR: 軽微な修正が必要だが Phase 5 実行前に解消可能
- MAJOR: 設計の根本的な見直しが必要（Phase 2 に差し戻し）

## 承認基準

- 全観点が PASS または MINOR
- MAJOR が 0 件
- 主要リスク R-1〜R-6 の対策が Phase 4 / 5 に確実に引き継がれている
- AC-1〜AC-7 すべてに対応する設計要素が Phase 2 成果物に存在する
