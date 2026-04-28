# Phase 5: 適用実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 適用実行 |
| 作成日 | 2026-04-27 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |

## 目的

ランブック（`repository-settings-runbook.md`）に従い `gh api PUT` で `main` / `dev` の branch protection を適用し、GitHub UI で production / staging Environments のブランチポリシーを設定する。適用後の `gh api` レスポンスを after snapshot として保存し、Phase 4 の before snapshot と差分比較して AC-1〜AC-5 を達成する。

## 実行タスク

- `main` ブランチ保護を `gh api PUT` で適用する
- `dev` ブランチ保護を `gh api PUT` で適用する
- production environment のブランチポリシーを GitHub UI で `main` のみに限定する
- staging environment のブランチポリシーを GitHub UI で `dev` のみに限定する
- 適用後の `gh api` レスポンスを after snapshot として取得する
- before / after snapshot の diff を取って想定差分のみであることを確認する
- 適用コマンド・実行ログを `apply-execution-log.md` に記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 適用コマンド・手順の正本 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-04.md | pre-apply checklist 結果・before snapshot |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-02.md | 設計済みの payload マトリクス |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Environments と Cloudflare 連携方針 |

## 実行手順

### ステップ 1: main ブランチ保護の適用

ランブックの payload を使用し `gh api PUT` で main protection を適用する。`required_approving_review_count = 0` / `enforce_admins = false` / `allow_force_pushes = false` / `allow_deletions = false` を必須とする。

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/payload-main.json
```

### ステップ 2: dev ブランチ保護の適用

main と同等の payload を `dev` に適用する。

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/payload-dev.json
```

### ステップ 3: production environment のブランチポリシー設定

GitHub UI で操作する（`gh api` では完結しないため）。

1. `Settings > Environments > production` を開く
2. `Deployment branches` を `Selected branches` に切り替える
3. `Add deployment branch rule` で `main` のみを追加する
4. `Required reviewers` は **0 名のまま** とする（個人開発方針）
5. 設定を保存する

### ステップ 4: staging environment のブランチポリシー設定

production と同手順で `dev` のみを許可する。

1. `Settings > Environments > staging` を開く
2. `Deployment branches` を `Selected branches` に切り替える
3. `Add deployment branch rule` で `dev` のみを追加する
4. `Required reviewers` は 0 名のまま
5. 設定を保存する

### ステップ 5: after snapshot 取得と diff 検証

```bash
# after snapshot 取得
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-05/gh-api-after-main.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-05/gh-api-after-dev.json

# Phase 4 の before snapshot を outputs/phase-05/ にもコピー
cp outputs/phase-04/before-main.json outputs/phase-05/gh-api-before-main.json
cp outputs/phase-04/before-dev.json   outputs/phase-05/gh-api-before-dev.json

# diff 検証
diff outputs/phase-05/gh-api-before-main.json outputs/phase-05/gh-api-after-main.json
diff outputs/phase-05/gh-api-before-dev.json  outputs/phase-05/gh-api-after-dev.json
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | pre-apply checklist の PASS を前提に実行 |
| Phase 6 | 本 Phase の after snapshot を異常系検証の前提とする |
| Phase 7 | 適用結果と AC-1〜AC-5 のトレースを行う |

## 多角的チェック観点（AIが判断）

- 価値性: AC-1〜AC-5 が全て達成されているか
- 実現性: `gh api PUT` と UI 操作の併用が runbook 通りに完結したか
- 整合性: main / dev / production / staging の 4 箇所すべてに適用が完了したか
- 運用性: apply-execution-log.md が次の担当者でも再現できる粒度で記録されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | main protection 適用 | 5 | pending | `gh api PUT` ・AC-1 |
| 2 | dev protection 適用 | 5 | pending | `gh api PUT` ・AC-2 |
| 3 | production env ブランチポリシー設定 | 5 | pending | UI 操作・AC-3 |
| 4 | staging env ブランチポリシー設定 | 5 | pending | UI 操作・AC-4 |
| 5 | after snapshot 取得（main/dev） | 5 | pending | AC-5 |
| 6 | before/after diff 検証 | 5 | pending | 想定差分のみ |
| 7 | apply-execution-log.md 記録 | 5 | pending | コマンド・タイムスタンプ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 証跡 | outputs/phase-05/gh-api-before-main.json | 適用前の main protection レスポンス |
| 証跡 | outputs/phase-05/gh-api-after-main.json | 適用後の main protection レスポンス |
| 証跡 | outputs/phase-05/gh-api-before-dev.json | 適用前の dev protection レスポンス |
| 証跡 | outputs/phase-05/gh-api-after-dev.json | 適用後の dev protection レスポンス |
| ドキュメント | outputs/phase-05/apply-execution-log.md | 適用コマンド・実行ログ |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- main protection が適用され `required_status_checks.contexts` に `ci` / `Validate Build` が登録されている
- dev protection が適用され、main と同等の設定が反映されている
- production environment のブランチポリシーが `main` のみに限定されている
- staging environment のブランチポリシーが `dev` のみに限定されている
- before / after snapshot 4 ファイルが `outputs/phase-05/` に存在する
- before / after diff が想定通り（protection 新規適用・revoke 等の意図せぬ差分なし）
- apply-execution-log.md に実行コマンド・タイムスタンプ・実行者が記録されている
- AC-1〜AC-5 が全て達成されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- `gh api` 応答（200 OK）と UI スクリーンショットが apply-execution-log.md に記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 適用後の after snapshot 4 ファイル・apply-execution-log.md を Phase 6 の前提とする
- ブロック条件: main / dev / production / staging のいずれかで適用が完了していない場合は次 Phase に進まない

## runbook

### branch protection 適用 runbook

**前提条件:**

- Phase 4 の pre-apply checklist が全項目 PASS
- `gh` CLI が admin 権限で認証済み
- `develop` 旧ブランチ名の残存が 0 件
- `ci` / `Validate Build` の status check context が GitHub に登録済み

**実行手順:**

1. main ブランチ保護を適用する:
   ```bash
   gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
     --input <runbook payload-main.json>
   ```
2. dev ブランチ保護を適用する:
   ```bash
   gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
     --input <runbook payload-dev.json>
   ```
3. production environment を UI で設定する（Settings > Environments > production）
4. staging environment を UI で設定する（Settings > Environments > staging）
5. after snapshot を取得する:
   ```bash
   gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-05/gh-api-after-main.json
   gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  > outputs/phase-05/gh-api-after-dev.json
   ```
6. before / after diff を検証する

**rollback 手順（適用を取り消す場合）:**

```bash
# branch protection を削除
gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/main/protection
gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/dev/protection

# Environments のブランチポリシーは UI で「Any branch」に戻す
```

### sanity check

| チェック | コマンド | 期待結果 |
| --- | --- | --- |
| main protection 確認 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq .required_status_checks.contexts` | `["ci","Validate Build"]` |
| main 承認不要確認 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq .required_pull_request_reviews.required_approving_review_count` | `0` |
| main force push 禁止確認 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq .allow_force_pushes.enabled` | `false` |
| main 削除禁止確認 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq .allow_deletions.enabled` | `false` |
| dev protection 確認 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq .required_status_checks.contexts` | `["ci","Validate Build"]` |
| production env policy 確認 | UI: Settings > Environments > production | Deployment branches: `main` のみ |
| staging env policy 確認 | UI: Settings > Environments > staging | Deployment branches: `dev` のみ |
| `enforce_admins=false` 確認 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq .enforce_admins.enabled` | `false` |
