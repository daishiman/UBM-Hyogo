# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-27 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| 視覚タスク区分 | **NON_VISUAL**（docs-only / spec_created） |

## 目的

本タスクはタスク種別 **docs-only / `spec_created`** であり、UI 変更を伴わない **NON_VISUAL** タスクである。3層評価（Semantic / Visual / AI UX）のうち **Semantic / 動作確認のみ**を対象とし、Visual / AI UX 層はスコープ外（N/A）とする。実際にテスト PR を立てて、CI 未通過時に branch protection が PR マージをブロックすることを確認するのが本 Phase の主眼である。

## 視覚タスク区分の宣言【必須】

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| Phase 11 区分 | NON_VISUAL | docs-only / `spec_created` タスクは UI 変更を伴わない |
| 必須 outputs | `main.md` / `manual-smoke-log.md` / `link-checklist.md` | NON_VISUAL の必須 3 点セット |
| screenshots ディレクトリ | **作成しない** | スクリーンショット不要のため `screenshots/.gitkeep` も削除する |
| visual layer 評価 | N/A | UI 変更ゼロ |
| AI UX layer 評価 | N/A | エンドユーザー向け対話 UI 変更ゼロ |

## 実行タスク

- NON_VISUAL タスクであることを `main.md` で明示する
- テスト PR を立てて branch protection の動作確認を行う（Semantic / 動作確認）
- `manual-smoke-log.md` に手動操作ログ（PR URL・status check 状態・マージブロック挙動）を記録する
- `link-checklist.md` で関連リンク健全性（ランブック・正本仕様・AC matrix への参照）を確認する
- `screenshots/.gitkeep` を削除する（スクリーンショット不要のため）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-10/final-review.md | GO 判定確認 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-05/apply-execution-log.md | 適用済み protection 内容の参照 |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 確認コマンドの参照 |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL Phase 11 テンプレート |

## 実行手順

### ステップ 1: NON_VISUAL 区分の宣言と outputs スケルトン作成

- `main.md` に「本タスクは docs-only / spec_created の NON_VISUAL タスクであり、screenshot は不要」と明示する
- `manual-smoke-log.md` のテーブルスケルトンを作成する
- `link-checklist.md` を作成し、関連リンク健全性確認の枠を準備する
- `screenshots/.gitkeep` が存在する場合は削除する

### ステップ 2: テスト PR による branch protection 動作確認（Semantic）

- 一時的な作業ブランチ（例: `chore/ut-19-smoke-test`）を作成し、軽微な docs 変更（typo fix 等）を 1 件コミットする
- `gh pr create --base dev` でテスト PR を作成する
- 以下の挙動を確認し `manual-smoke-log.md` に記録する
  - status check (`ci` / `Validate Build`) が `pending` の状態でマージボタンが無効化されること
  - status check が `failure` の場合にマージがブロックされること
  - status check が `success` になった場合のみマージ可能になること
  - 直接 push（force push）が拒否されることを `git push --force-with-lease origin dev` で確認（リジェクトされること）
- テスト確認後、PR は close（マージしない）し、作業ブランチも削除する

### ステップ 3: link-checklist の作成

- 以下のリンクが正しく解決することを確認する
  - 上位 README、index.md、artifacts.json、Phase 1〜13 仕様書
  - ランブック（`completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md`）
  - 正本仕様（`deployment-branch-strategy.md` / `deployment-cloudflare.md` / `deployment-core.md`）
  - GitHub Issue #26 へのリンク

## NON_VISUAL 証跡メタ情報【必須】

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | テスト PR の HTML URL + `gh pr view` 出力 + `gh api` レスポンス JSON |
| スクリーンショットを作らない理由 | docs-only / spec_created タスクで UI 変更ゼロ。GitHub UI のスクリーンショットは正本ではなく `gh api` JSON レスポンスが正本 |
| 自動テスト件数 | N/A（CI 自動テストはタスク対象外。テスト PR の status check 動作確認のみ） |
| 代替証跡 | `outputs/phase-05/gh-api-after-main.json` / `outputs/phase-05/gh-api-after-dev.json` |

## manual-smoke-log テンプレート【必須】

| # | 確認項目 | 操作 | 期待結果 | 実測結果 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 1 | status check pending 時のマージブロック | テスト PR 作成直後に Merge ボタン状態を確認 | ボタン無効化 | pending | 実行時記入 |
| 2 | status check failure 時のマージブロック | CI を意図的に失敗させる（または失敗待ち） | マージ不可 | pending | 実行時記入 |
| 3 | status check success 時のマージ可能化 | CI 成功後に Merge ボタン状態を確認 | ボタン有効化 | pending | 実行時記入 |
| 4 | force push 拒否 | `git push --force-with-lease origin dev` を試行 | rejected | pending | 実行時記入 |
| 5 | branch deletion 拒否 | `gh api -X DELETE repos/:owner/:repo/git/refs/heads/dev`（dry-run 想定） | 422 / 403 | pending | 実行時記入 |
| 6 | production environment ポリシー | Settings > Environments > production を UI 確認 | main のみ許可 | pending | 実行時記入 |
| 7 | staging environment ポリシー | Settings > Environments > staging を UI 確認 | dev のみ許可 | pending | 実行時記入 |

## link-checklist テンプレート【必須】

| # | リンク種別 | 対象パス / URL | 健全性 |
| --- | --- | --- | --- |
| 1 | 上位 README | ../README.md | 実行時記入 |
| 2 | index.md 内 Phase 一覧 | phase-01.md 〜 phase-13.md | 実行時記入 |
| 3 | ランブック正本 | ../../completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 実行時記入 |
| 4 | 正本仕様 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | 実行時記入 |
| 5 | 元仕様 | ../../unassigned-task/UT-19-github-branch-protection-manual-apply.md | 実行時記入 |
| 6 | GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/26 | 実行時記入 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 適用済み protection 設定をテスト PR の動作確認の前提として使用 |
| Phase 10 | GO 判定を Phase 11 着手の前提とする |
| Phase 12 | manual-smoke-log の結果を close-out（documentation-changelog）に記録 |

## 多角的チェック観点（AIが判断）

- 価値性: テスト PR の動作確認で「branch protection が機能している」ことを後続 UT-05 / UT-06 の着手者に保証できるか。
- 実現性: NON_VISUAL の必須 3 点セット（main.md / manual-smoke-log.md / link-checklist.md）が抜け漏れなく揃っているか。
- 整合性: `screenshots/.gitkeep` 削除が忘れられていないか（NON_VISUAL タスクで残すと validator error）。
- 運用性: 動作確認手順がランブックに逆フィードバックされ、再実行可能になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | NON_VISUAL 宣言と main.md 作成 | 11 | pending | 視覚タスク区分を明記 |
| 2 | テスト PR 作成・動作確認 | 11 | pending | manual-smoke-log.md へ記録 |
| 3 | link-checklist 作成 | 11 | pending | リンク健全性確認 |
| 4 | screenshots/.gitkeep 削除 | 11 | pending | NON_VISUAL では必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 サマリ（NON_VISUAL 宣言含む） |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | テスト PR 動作確認ログ |
| ドキュメント | outputs/phase-11/link-checklist.md | 関連リンク健全性確認 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- `main.md` で NON_VISUAL タスクであることが明示されている
- `manual-smoke-log.md` の全項目が実測結果付きで記録されている
- `link-checklist.md` の全リンクが健全性確認するである
- `screenshots/.gitkeep` が削除されている（または最初から作成されていない）
- テスト PR は close 済みで dev / main に意図しない変更が混入していない

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み（main.md / manual-smoke-log.md / link-checklist.md の3点）
- スクリーンショットは作成しない（NON_VISUAL）
- 全完了条件にチェック
- 異常系（force push / branch deletion / status check failure）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: manual-smoke-log の動作確認結果（PR URL・status check 挙動）と link-checklist 結果を Phase 12 の documentation-changelog に引き継ぐ。
- ブロック条件: テスト PR で branch protection が想定通り動作しなかった場合は Phase 5 / 6 に差し戻す。
