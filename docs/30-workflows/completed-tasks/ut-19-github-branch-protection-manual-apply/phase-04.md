# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-27 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (適用実行) |
| 状態 | completed |

## 目的

Phase 5 の適用実行前に、status check context の GitHub 内部 DB 登録状況・ブランチ名揺れの解消・`gh` CLI の権限・rollback 経路を事前検証し、`422 Unprocessable Entity` および `403 Forbidden` の主要 failure を排除する。適用前 snapshot（before）を取得して Phase 5 の差分検証の基準を確立する。

## 実行タスク

- `gh auth status` で適用対象リポジトリへの admin 権限を確認する
- CI ワークフロー（`ci` / `Validate Build`）が 1 回以上実行され status check context が登録済みであることを確認する
- `develop` 旧ブランチ名がドキュメント・ワークフローに残存していないことを grep で確認する
- 適用前の `gh api` レスポンスを before snapshot として取得する
- rollback 手順（`gh api DELETE`）を事前合意・記録する
- `enforce_admins=false` の運用方針を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 適用コマンド・手順の正本 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-02.md | branch protection / Environments 設計 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-03.md | 設計レビュー結果 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略正本（`dev` / `main`） |

## 実行手順

### ステップ 1: `gh` CLI 認証・権限確認

- `gh auth status` で `daishiman` アカウントでログイン中であることを確認する
- `repo` / `admin:repo_hook` 等のスコープが付与されていることを確認する
- `gh api repos/daishiman/UBM-Hyogo` で 200 応答を確認する

### ステップ 2: status check context 登録確認

- `gh run list --workflow ci.yml --limit 5` で `ci` ワークフローの実行履歴を確認する（最低 1 件）
- `gh run list --workflow validate-build.yml --limit 5` で `Validate Build` ワークフローの実行履歴を確認する
- `gh api repos/daishiman/UBM-Hyogo/commits/main/check-runs` で context 名が GitHub に認識されていることを確認する

### ステップ 3: ブランチ名揺れ確認

- `grep -rn "develop" docs/ .github/ apps/ 2>/dev/null | grep -v "developer\|development\|developing"` で `develop` 残存箇所を抽出する
- 残存箇所がある場合は Phase 5 適用前に `dev` へ修正する
- `gh api repos/daishiman/UBM-Hyogo/branches` でリモート上に `develop` ブランチが存在しないことを確認する

### ステップ 4: 適用前 snapshot 取得

- `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` の応答を取得し `outputs/phase-04/` に before snapshot として保存する
- `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` も同様に取得する
- protection 未適用の場合の 404 応答も snapshot として記録する

### ステップ 5: rollback 経路の事前合意

- `gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/main/protection` を rollback コマンドとして記録
- 適用失敗時の即時 rollback / 部分 rollback の判断基準を Phase 6 に申し送る
- `enforce_admins=false` のため admin 権限で常に rollback 可能であることを確認

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー PASS を前提に実行 |
| Phase 5 | pre-apply checklist の全項目 PASS を Phase 5 着手の必須条件とする |
| Phase 6 | before snapshot を異常系検証の比較基準として渡す |

## 多角的チェック観点（AIが判断）

- 価値性: pre-apply checklist が AC-1〜AC-7 の事前確認として機能しているか
- 実現性: status check context 登録確認が `gh` API のみで完結するか
- 整合性: `dev` / `main` 両ブランチの before snapshot が漏れなく取得できているか
- 運用性: rollback コマンドが checklist 内に明記され、誰でも即実行できる粒度か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `gh auth status` 確認 | 4 | pending | admin スコープ必須 |
| 2 | CI ワークフロー実行履歴確認 | 4 | pending | `ci` / `Validate Build` 各 1 回以上 |
| 3 | `develop` 残存 grep 確認 | 4 | pending | docs/ / .github/ 配下 |
| 4 | main protection before snapshot 取得 | 4 | pending | 404 でも保存 |
| 5 | dev protection before snapshot 取得 | 4 | pending | 404 でも保存 |
| 6 | rollback コマンド合意 | 4 | pending | DELETE エンドポイント |
| 7 | `enforce_admins=false` 方針確認 | 4 | pending | admin override 経路維持 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/pre-apply-checklist.md | 事前検証チェックリスト |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- `gh auth status` が PASS で admin スコープが確認する
- `ci` / `Validate Build` の status check context が GitHub 内部に登録されていることを確認する
- `develop` 残存が 0 件、または検出箇所が Phase 5 着手前に修正済み
- main / dev の before snapshot が `outputs/phase-04/` に記録されている
- rollback コマンドが pre-apply-checklist.md に明記されている
- `enforce_admins=false` 方針が記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- pre-apply checklist 失敗時の対応が記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 5 (適用実行)
- 引き継ぎ事項: before snapshot・rollback コマンド・`develop` 残存の有無を Phase 5 に渡す
- ブロック条件: pre-apply checklist のいずれかが FAIL の場合は次 Phase に進まない

## verify suite

### チェックリスト

| # | チェック項目 | コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | `gh` CLI 認証確認 | `gh auth status` | `Logged in to github.com as daishiman` | 実行時記入 |
| 2 | リポジトリ admin 権限確認 | `gh api repos/daishiman/UBM-Hyogo --jq .permissions.admin` | `true` | 実行時記入 |
| 3 | `ci` ワークフロー実行履歴 | `gh run list --workflow ci.yml --limit 1` | 1 件以上 | 実行時記入 |
| 4 | `Validate Build` ワークフロー実行履歴 | `gh run list --workflow validate-build.yml --limit 1` | 1 件以上 | 実行時記入 |
| 5 | status check context 登録確認 | `gh api repos/daishiman/UBM-Hyogo/commits/main/check-runs --jq '.check_runs[].name'` | `ci` / `Validate Build` を含む | 実行時記入 |
| 6 | `develop` 残存 grep | `grep -rn "develop" docs/ .github/ \| grep -v "developer\|development"` | 0 件、または既知例外のみ | 実行時記入 |
| 7 | `develop` リモートブランチ非存在 | `gh api repos/daishiman/UBM-Hyogo/branches/develop` | 404 Not Found | 実行時記入 |
| 8 | main protection before snapshot 取得 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-04/before-main.json` | ファイルが生成される（200 or 404） | 実行時記入 |
| 9 | dev protection before snapshot 取得 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-04/before-dev.json` | ファイルが生成される（200 or 404） | 実行時記入 |
| 10 | rollback コマンドの dry-run 確認 | `gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/main/protection --silent` の構文確認のみ | 構文エラーが出ない（実行はしない） | 実行時記入 |

### 実行前提条件

- `gh` CLI がインストール済みで `gh auth login` 完了
- 01a-parallel-github-and-branch-governance のランブックが存在する
- UT-05 の CI ワークフロー（`ci.yml` / `validate-build.yml`）が main ブランチに存在する
- UT-05 の CI が main または PR で 1 回以上成功している

### verify suite 失敗時の対応フロー

```
チェック失敗
  ├── チェック 1-2 失敗: gh auth login 再実行 / scope 再付与
  ├── チェック 3-4 失敗: UT-05 を先行完了させ CI を 1 回実行 → 本 Phase 再開
  ├── チェック 5 失敗: CI が 1 度も成功していない → workflow_dispatch で手動実行
  ├── チェック 6 失敗: 残存箇所を `dev` に修正してから Phase 5 へ
  ├── チェック 7 失敗: リモートに `develop` が存在 → `gh api -X DELETE` で削除
  └── チェック 8-9 失敗: 権限・ネットワーク問題を解消し再取得
```
