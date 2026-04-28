# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-27 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

ランブック (`repository-settings-runbook.md`) と Phase 5 で取得した実適用結果（`gh-api-after-*.json`）の差分を検出し、重複記述・古い記述・乖離箇所を整理する。今後 protection 設定を再適用する際に手順が分散しないよう、`gh api` ペイロードを `.github/scripts/branch-protection.json` 等へ集約する設計案を提示する（実装は本タスクのスコープ外、提案のみ）。個人開発方針（reviews=0 / enforce_admins=false / CI ゲートのみ）を Single Source of Truth として一意化する。

## 実行タスク

- ランブック内のコマンドと実適用結果（after JSON）を Before / After 形式で比較する
- 重複している設定値（main / dev で共通）を共通化する方針を文書化する
- 古い記述（`develop` ブランチ名・承認必須前提など）の整理提案を作成する
- 再適用自動化用の payload 集約案（`.github/scripts/branch-protection.json` の設計）を提示する
- ランブックと実適用 JSON の乖離箇所を一覧化する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | ランブック正本 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-05/gh-api-after-main.json | 適用後の main protection（実値） |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-05/gh-api-after-dev.json | 適用後の dev protection（実値） |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-07/coverage-matrix.md | AC トレース（前 Phase 成果物） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略正本 |

## 実行手順

### ステップ 1: ランブックと実適用結果の差分検出

- ランブックに記載された `gh api PUT` ペイロードと、Phase 5 で取得した after JSON を項目単位で照合する
- 差分（記述あり / 実値なし、記述なし / 実値あり、値の不一致）を一覧化する
- 個人開発方針（reviews=0, enforce_admins=false）が双方で一致しているかを確認する

### ステップ 2: 重複・古い記述の整理提案

- main / dev で共通の設定（contexts, strict, force_pushes, deletions, enforce_admins, reviews）を共通定数として括る
- `develop` 旧名・承認必須を前提とした古い記述を検出し、削除/置換提案を作成する
- ランブック内の手順番号と AC の対応関係を最新化する

### ステップ 3: 再適用自動化の集約設計案

- `.github/scripts/branch-protection.json`（payload 集約ファイル）の構造案を提示する
- `.github/scripts/apply-branch-protection.sh`（適用スクリプト）の擬似コードを提示する
- 実装は本タスクのスコープ外であることを明示する

## Before / After（runbook と実適用の DRY 化前後）【必須】

### Before（ランブックと実適用が分散・重複）

```text
# repository-settings-runbook.md（要点）
- main 用 gh api PUT コマンドが直書き（payload も inline）
- dev 用 gh api PUT コマンドが直書き（main とほぼ同一の payload を再記述）
- Environments は UI 手順のみ記載
- `develop` 旧名の言及が一部に残存（AC-7 で要修正）
- 承認必須を前提とした注記が混在（個人開発方針と矛盾）
```

```jsonc
// 実適用結果（gh-api-after-main.json 抜粋）
{
  "required_status_checks": { "strict": true, "contexts": ["ci","Validate Build"] },
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "enforce_admins": { "enabled": false },
  "allow_force_pushes": { "enabled": false },
  "allow_deletions": { "enabled": false }
}
```

### After（DRY 化後・推奨構造）

```text
# 推奨配置
.github/scripts/branch-protection.json   ← payload 共通定義（main/dev 共有）
.github/scripts/apply-branch-protection.sh ← 適用スクリプト（実装は別タスク）
repository-settings-runbook.md           ← 上記スクリプトを呼び出す手順のみ記載
```

```jsonc
// .github/scripts/branch-protection.json（共通 payload 提案）
{
  "required_status_checks": { "strict": true, "contexts": ["ci", "Validate Build"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": false
}
```

```bash
# .github/scripts/apply-branch-protection.sh（擬似コード・本タスクでは実装しない）
for BRANCH in main dev; do
  gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" \
    --input .github/scripts/branch-protection.json
done
```

### 差分サマリー

| 項目 | Before | After | 理由 |
| --- | --- | --- | --- |
| main / dev の payload | runbook に2回直書き（重複） | 1 ファイルに集約・両ブランチで共有 | 個人開発方針の一意化 |
| `develop` 旧名 | runbook 内に残存箇所あり | 全置換 (`dev`)・grep で 0 件 | AC-7 充足 |
| 承認必須の注記 | 混在 | reviews=0 を不変条件として明示 | 個人開発方針 |
| Environments | UI 手順のみ | UI 手順 + `gh api` 確認スクリプトを併記 | 二重確認の標準化 |
| 適用結果 | runbook 内に貼付 | outputs/phase-05/*.json をリンクするだけ | 実値とコピーの DRY 化 |

## ランブック ⇄ 実適用 乖離一覧【必須】

| # | 乖離箇所 | runbook 記述 | 実適用（after JSON） | 整理方針 |
| --- | --- | --- | --- | --- |
| 1 | `enforce_admins` | 言及不足 | `false` | 個人開発不変条件として runbook に明記 |
| 2 | `required_conversation_resolution` | 未記載 | 実値あり | デフォルト `false` を明記 |
| 3 | `required_pull_request_reviews` | 必須前提の表現 | `required_approving_review_count=0` | 「承認 0 名」を不変条件化 |
| 4 | dev ブランチ手順 | main の章と分離・重複 | main と同値 | 共通 payload 化 |
| 5 | Environments 確認 | UI のみ | gh api でも部分確認可 | 二重確認手順を追加 |
| 6 | `develop` 旧名 | 一部残存 | n/a | 全置換 + grep ガード |

## 集約設計案（実装はスコープ外）

| 提案項目 | 配置先 | 役割 | 備考 |
| --- | --- | --- | --- |
| 共通 payload | `.github/scripts/branch-protection.json` | main / dev 共有 | UT-19 では実装しない |
| 適用スクリプト | `.github/scripts/apply-branch-protection.sh` | 再適用自動化 | 別 UT で実装提案 |
| Environments 確認スクリプト | `.github/scripts/verify-environments.sh` | UI 操作前の事前検証 | optional |
| ランブック | `repository-settings-runbook.md` | スクリプト呼び出し手順のみ | payload 直書き禁止 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 適用結果 JSON を After 構造の根拠として参照 |
| Phase 6 | `develop` 旧名の grep 結果を整理提案に反映 |
| Phase 9 | DRY 化後の構造が secret hygiene / 品質基準を満たすか確認 |
| Phase 12 | 集約設計案を後続タスクへの未割り当て項目として記録 |

## 多角的チェック観点（AIが判断）

- 価値性: DRY 化により再適用時の修正箇所が減り、個人開発方針が一意で管理されるか。
- 実現性: 本タスクは提案のみで実装は伴わないため、後続タスクで実装可能な粒度になっているか。
- 整合性: ランブックと実適用 JSON の乖離が完全に列挙され、解消方針が明示されているか。
- 運用性: 新たな保護対象ブランチ追加時に payload 共通定義を再利用できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook と after JSON の差分検出 | 8 | pending | 乖離一覧表 |
| 2 | 重複・古い記述の整理提案 | 8 | pending | `develop` 旧名・承認必須注記 |
| 3 | 集約設計案の作成 | 8 | pending | `.github/scripts/branch-protection.json` |
| 4 | DRY 化レポート作成 | 8 | pending | outputs/phase-08/runbook-dry-diff.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/runbook-dry-diff.md | runbook と実適用の差分・統合提案・集約設計案 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- ランブックと実適用結果の乖離が全件列挙されている
- 重複・古い記述（`develop` 旧名・承認必須注記）の整理方針が確定している
- 集約設計案（`.github/scripts/branch-protection.json` 等）が提案として記載されている
- 本タスクで実装は行わないことが明示されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（runbook 内の旧記述）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: DRY 化後の推奨構造・集約設計案・乖離解消方針を Phase 9 に引き継ぐ。
- ブロック条件: 乖離一覧または集約設計案が未作成なら次 Phase に進まない。
