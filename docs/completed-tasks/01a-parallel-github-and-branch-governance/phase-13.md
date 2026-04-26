# Phase 13: PR 作成

> **重要:** この Phase は **ユーザーの明示的な承認がある場合のみ実行する**。AI エージェントが自律的に PR を作成してはならない。承認なしに実行した場合は即座にロールバックすること。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-23 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（終端） |
| 状態 | pending |
| user_approval_required | **true** |

## 目的

Phase 1〜12 で作成・確定したブランチ統制仕様書（branch protection / environments / PR template / CODEOWNERS）を main ブランチにマージするための Pull Request を作成する。PR 作成前に `local-check-result.md` と `change-summary.md` を生成し、close-out 条件を全て満たしていることを証明する。

## ユーザー承認確認

**この Phase は以下の条件が全て満たされた上で、ユーザーが明示的に「Phase 13 を実行してください」と指示した場合のみ実行する。**

承認フロー:

1. AI は本 Phase の実行前に「Phase 13 を実行してよいですか？PR が作成されます。」とユーザーに確認する
2. ユーザーが「はい」「実行してください」「承認します」等の明示的な承認を返した場合のみ実行する
3. ユーザーが承認しない場合、本 Phase の `local-check-result.md` と `change-summary.md` のみ作成し、PR 作成手順は提示するにとどめる

## 実行タスク

### ステップ 1: PR 作成前チェックリスト（local-check-result.md の作成）

`doc/01a-parallel-github-and-branch-governance/outputs/phase-13/local-check-result.md` を作成し、以下のチェックリストを記録する。

```markdown
# PR 作成前ローカル確認結果

## 実行日時
YYYY-MM-DD HH:MM JST

## チェックリスト

### Phase 完了確認
- [ ] Phase 1 (要件定義) が completed
- [ ] Phase 2 (設計) が completed
- [ ] Phase 3 (設計レビュー) が completed
- [ ] Phase 4 (事前検証手順) が completed
- [ ] Phase 5 (セットアップ実行) が completed
- [ ] Phase 6 (異常系検証) が completed
- [ ] Phase 7 (検証項目網羅性) が completed
- [ ] Phase 8 (設定 DRY 化) が completed
- [ ] Phase 9 (品質保証) が completed
- [ ] Phase 10 (最終レビュー) が completed
- [ ] Phase 11 (手動 smoke test) が completed
- [ ] Phase 12 (ドキュメント更新) が completed

### 成果物配置確認
- [ ] artifacts.json の Phase 1〜12 が全て completed
- [ ] outputs/phase-02/github-governance-map.md が存在する
- [ ] outputs/phase-05/repository-settings-runbook.md が存在する
- [ ] outputs/phase-05/pull-request-template.md が存在する
- [ ] outputs/phase-05/codeowners.md が存在する
- [ ] outputs/phase-05/main.md が存在する
- [ ] outputs/phase-12/implementation-guide.md が存在する
- [ ] outputs/phase-12/system-spec-update-summary.md が存在する
- [ ] outputs/phase-12/documentation-changelog.md が存在する
- [ ] outputs/phase-12/unassigned-task-detection.md が存在する
- [ ] outputs/phase-12/skill-feedback-report.md が存在する
- [ ] outputs/phase-12/phase12-task-spec-compliance-check.md が存在する

### セキュリティ確認
- [ ] secrets 実値が一切含まれていない（grep で確認）
- [ ] .env ファイルがコミット対象に含まれていない
- [ ] CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID は名称のみでプレースホルダー扱い

### ブランチ・差分確認
- [ ] ブランチ `docs/01a-github-and-branch-governance-task-spec` が main を取り込んだ最新状態
- [ ] `git diff main...HEAD` で意図しない変更がない
- [ ] `git status` でコミットされていないファイルがない

### AC 確認
- [ ] AC-1: main reviewer 2名、dev reviewer 1名が設計書に明記されている
- [ ] AC-2: production → main のみ、staging → dev のみが設計書に明記されている
- [ ] AC-3: PR template に true issue / dependency / 4条件の欄がある
- [ ] AC-4: CODEOWNERS と task 責務が衝突しない
- [ ] AC-5: local-check-result.md と change-summary.md が存在する（本ファイルと次ファイル）

## 確認コマンド

\`\`\`bash
# secrets 実値が含まれていないか確認
grep -r "ghp_\|sk-\|token:" doc/01a-parallel-github-and-branch-governance/

# ブランチ状態確認
git status
git log --oneline main...HEAD

# 成果物の存在確認
ls doc/01a-parallel-github-and-branch-governance/outputs/phase-12/
ls doc/01a-parallel-github-and-branch-governance/outputs/phase-13/
\`\`\`

## 確認結果

| チェック項目 | 結果 | 備考 |
| --- | --- | --- |
| Phase 1〜12 完了 | - | |
| 成果物配置 | - | |
| secrets 非混入 | - | |
| ブランチ差分 | - | |
| AC 全達成 | - | |
```

### ステップ 2: 変更サマリーの作成（change-summary.md の作成）

`doc/01a-parallel-github-and-branch-governance/outputs/phase-13/change-summary.md` を作成し、以下の内容を記録する。

```markdown
# 変更サマリー

## タスク概要

| 項目 | 内容 |
| --- | --- |
| タスク名 | 01a-parallel-github-and-branch-governance |
| 変更種別 | ドキュメント作成（コード実装なし） |
| ブランチ | docs/01a-github-and-branch-governance-task-spec |
| 作成 Phase 数 | 13 |

## 作成・変更ファイル一覧

| ファイルパス | 操作 | 目的 |
| --- | --- | --- |
| doc/01a-parallel-github-and-branch-governance/index.md | updated | タスク概要・Phase 一覧・AC 定義 |
| doc/01a-parallel-github-and-branch-governance/phase-01.md | created | 要件定義書 |
| doc/01a-parallel-github-and-branch-governance/phase-02.md | created | branch/env/PR template/CODEOWNERS 設計書 |
| doc/01a-parallel-github-and-branch-governance/phase-03.md | created | 設計レビュー手順 |
| doc/01a-parallel-github-and-branch-governance/phase-04.md | created | 事前検証手順 |
| doc/01a-parallel-github-and-branch-governance/phase-05.md | created | GitHub 設定適用 runbook・PR テンプレート |
| doc/01a-parallel-github-and-branch-governance/phase-06.md | created | 異常系検証手順 |
| doc/01a-parallel-github-and-branch-governance/phase-07.md | created | AC トレース・検証項目網羅性 |
| doc/01a-parallel-github-and-branch-governance/phase-08.md | created | 設定 DRY 化 |
| doc/01a-parallel-github-and-branch-governance/phase-09.md | created | 品質保証チェック |
| doc/01a-parallel-github-and-branch-governance/phase-10.md | created | 最終レビュー |
| doc/01a-parallel-github-and-branch-governance/phase-11.md | created | 手動 smoke test |
| doc/01a-parallel-github-and-branch-governance/phase-12.md | created | ドキュメント更新・spec sync |
| doc/01a-parallel-github-and-branch-governance/phase-13.md | created | PR 作成手順（本ファイル） |
| doc/01a-parallel-github-and-branch-governance/artifacts.json | updated | Phase 状態の機械可読サマリー |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-02/github-governance-map.md | created | branch/env/review/CODEOWNERS 設計 map |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | created | GitHub 設定適用 runbook |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-05/pull-request-template.md | created | PR テンプレート本体 |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-05/codeowners.md | created | CODEOWNERS 本文 |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-05/main.md | created | 適用結果サマリー |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-12/implementation-guide.md | created | 運用ガイド |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-12/system-spec-update-summary.md | created | spec 更新サマリー |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-12/documentation-changelog.md | created | ドキュメント変更ログ |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-12/unassigned-task-detection.md | created | 未割り当てタスク検出 |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-12/skill-feedback-report.md | created | スキルフィードバック |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-12/phase12-task-spec-compliance-check.md | created | 必須成果物網羅性確認 |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-13/local-check-result.md | created | PR 前ローカル確認結果 |
| doc/01a-parallel-github-and-branch-governance/outputs/phase-13/change-summary.md | created | 本ファイル |

## 変更の目的と効果

- **目的:** GitHub リポジトリの branch protection / environments / PR template / CODEOWNERS を正本仕様（deployment-branch-strategy.md）に一致させるための設定仕様書を整備する
- **効果:** 後続タスク（02-serial-monorepo-runtime-foundation / 04-serial-cicd-secrets-and-environment-sync）が参照できる正式な設計根拠が確立する。未レビューコードの production 流入を防ぐガバナンスが文書化される

## 影響を受ける下流タスク

| タスク | 影響内容 | 参照成果物 |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | branch protection を前提とした PR フロー設計 | outputs/phase-02/github-governance-map.md |
| 04-serial-cicd-secrets-and-environment-sync | environment 名・secrets 変数名の確定値 | outputs/phase-02/github-governance-map.md |
| 01b-parallel-cloudflare-base-bootstrap | environment 名（production/staging）の整合 | outputs/phase-02/github-governance-map.md |
| 01c-parallel-google-workspace-bootstrap | CODEOWNERS の責務境界 | outputs/phase-02/github-governance-map.md |

## Residual Risk（残留リスク）

| リスク | 内容 | 対処 |
| --- | --- | --- |
| secrets 実値未投入 | CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID は名称確定のみ | 04 Phase 5 で投入 |
| Cloudflare deploy 未設定 | deploy 実行は 01b で扱う | 01b タスクで対応 |
| reviewer 不在時 | emergency hotfix 時の admin bypass 手順は implementation-guide.md に記載 | 運用判断で対応 |
```

### ステップ 3: PR 作成の実行（ユーザー承認後のみ）

**前提:** ユーザーの明示的な承認を受けた後のみ実行する。

#### PR 作成コマンド

```bash
gh pr create \
  --title "docs(01a): GitHub branch governance task spec" \
  --body "$(cat .github/pull_request_template.md)" \
  --base main \
  --head docs/01a-github-and-branch-governance-task-spec
```

`.github/pull_request_template.md` が存在しない場合は、以下のコマンドを使用する:

```bash
gh pr create \
  --title "docs(01a): GitHub branch governance task spec" \
  --body "$(cat <<'EOF'
## 概要

GitHub branch protection / environments / PR template / CODEOWNERS の設定仕様書を整備する。
コード実装は行わず、ドキュメントのみを対象とした docs-only タスク。

## 関連 Issue

- True Issue: #（記入）
- Dependency: なし（Wave 1 parallel タスク）

## 変更種別

- [x] ドキュメント更新

## 4条件チェック

- [x] 価値性: branch governance の設計根拠が文書化され、後続タスクのオンボーディングコストを削減する
- [x] 実現性: docs-only タスクとしてコード実装なしで完結している
- [x] 整合性: deployment-branch-strategy.md の設計値と全成果物が一致している
- [x] 運用性: implementation-guide.md に emergency hotfix 手順と escalation パスが記述されている

## テスト確認

- [x] ローカルで手動 smoke test 通過済み（outputs/phase-11/manual-smoke-log.md 参照）
- [x] secrets 実値が混入していないことを確認済み
- [x] 意図しない変更がないことを git diff で確認済み

## Reviewers

@daishiman
※ main ブランチの 2 名承認は branch protection 側で別途満たす。

## 主要成果物

- `outputs/phase-02/github-governance-map.md`: branch/env/review/CODEOWNERS 設計 map
- `outputs/phase-05/repository-settings-runbook.md`: GitHub 設定適用 runbook
- `outputs/phase-05/pull-request-template.md`: PR テンプレート
- `outputs/phase-12/implementation-guide.md`: 運用ガイド
- `outputs/phase-13/local-check-result.md`: PR 前ローカル確認結果
- `outputs/phase-13/change-summary.md`: 変更サマリー
EOF
)" \
  --base main \
  --head docs/01a-github-and-branch-governance-task-spec \
  --reviewer daishiman  # main ブランチの 2 名承認は branch protection 側で別途満たす
```

#### PR 作成後の確認

```bash
# PR 作成確認
gh pr view --web

# CI 状態確認
gh pr checks

# Reviewers 確認
gh pr view | grep -A5 "Reviewers:"
```

### ステップ 4: Phase 13 完了処理

PR 作成後、`artifacts.json` の Phase 13 を `completed` に更新する。

```json
"13": { "status": "completed", "output": "outputs/phase-13/" }
```

`index.md` の Phase 13 も `completed` に更新する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | PR は承認後のみの規則 |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 必須成果物の完了証跡 |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-11/manual-smoke-log.md` | smoke test 通過証跡 |
| 必須 | `doc/01a-parallel-github-and-branch-governance/artifacts.json` | Phase 1〜12 completed の確認 |
| 必須 | `.github/pull_request_template.md` | PR 本文テンプレート |
| 参考 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-02/github-governance-map.md` | PR 概要の根拠 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | 全成果物が完了していることを前提として使用 |
| Phase 7 | AC トレース結果を PR 本文の 4条件チェックに反映 |
| Phase 11 | smoke test 通過ログを PR 前確認の根拠として使用 |
| 下流タスク 02, 04 | 本 PR マージ後に参照できる成果物パスが確定する |

## 多角的チェック観点

| 観点 | チェック内容 | 合否判定 |
| --- | --- | --- |
| 価値性 | PR が main にマージされることで、後続タスク（02, 04）が設計根拠を参照できるようになるか | - |
| 実現性 | PR 作成が `gh` CLI で実行可能か。GitHub Free プランで利用可能か | - |
| 整合性 | local-check-result.md の全チェックが passed で、AC-1〜5 が全達成か | - |
| 運用性 | PR がマージされた後、rollback が必要な場合に revert PR を作成できるか | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 12 の全成果物完了確認 | 13 | pending | artifacts.json で確認 |
| 2 | local-check-result.md 作成 | 13 | pending | `outputs/phase-13/` |
| 3 | change-summary.md 作成 | 13 | pending | `outputs/phase-13/` |
| 4 | ユーザー承認確認 | 13 | pending | **必須。承認なしに PR 作成不可** |
| 5 | `git diff main...HEAD` で差分確認 | 13 | pending | 意図しない変更がないことを確認 |
| 6 | secrets 非混入確認 | 13 | pending | grep で確認 |
| 7 | PR 作成（`gh pr create`） | 13 | pending | ユーザー承認後のみ実行 |
| 8 | PR 作成後の CI 確認 | 13 | pending | `gh pr checks` |
| 9 | artifacts.json Phase 13 を completed に更新 | 13 | pending | PR 作成成功後 |
| 10 | index.md Phase 13 を completed に更新 | 13 | pending | PR 作成成功後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/local-check-result.md` | PR 作成前の全チェック結果 |
| ドキュメント | `outputs/phase-13/change-summary.md` | タスク全体の変更サマリー |
| GitHub | Pull Request | `docs/01a-github-and-branch-governance-task-spec` → `main` |
| メタ | `artifacts.json` | Phase 13 を completed に更新 |
| メタ | `index.md` | Phase 13 を completed に更新 |

## 完了条件

- [ ] `outputs/phase-13/local-check-result.md` が作成済みで、全チェックが passed
- [ ] `outputs/phase-13/change-summary.md` が作成済み
- [ ] ユーザーの明示的な承認を得た記録がある
- [ ] Pull Request が `docs/01a-github-and-branch-governance-task-spec` → `main` で作成済み
- [ ] PR の Reviewer に `@daishiman` が設定済み
- [ ] PR 作成後 CI が GREEN（docs lint / link check 通過）
- [ ] `artifacts.json` の Phase 1〜13 が全て `completed`
- [ ] `index.md` の Phase 1〜13 が全て `completed`

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（サブタスク 1〜10）が completed
- [ ] `outputs/phase-13/local-check-result.md` が作成済みで全チェック passed
- [ ] `outputs/phase-13/change-summary.md` が作成済み
- [ ] ユーザーの明示的な承認を得ている
- [ ] PR が作成済みで URL が確認できる
- [ ] CI が GREEN
- [ ] `artifacts.json` の Phase 1〜13 が全て completed
- [ ] `index.md` の Phase 1〜13 が全て completed

## 次Phase

**終端。** このタスク（01a-parallel-github-and-branch-governance）の最終 Phase であり、次 Phase はない。

- 下流タスク開始条件: 本 PR がマージされた後、以下のタスクが開始可能になる
  - `02-serial-monorepo-runtime-foundation`: `outputs/phase-02/github-governance-map.md` を参照して PR フロー設計を開始する
  - `04-serial-cicd-secrets-and-environment-sync`: environment 名と secrets 変数名を参照して secrets 投入手順を作成する

## 4条件評価テーブル

| 条件 | 評価内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | PR マージにより、後続タスクが参照できる branch governance の設計根拠が確立するか | - | change-summary.md の downstream 影響欄 |
| 実現性 | `gh pr create` コマンドが GitHub Free プランで利用可能か。CI が docs-only タスクとして通過するか | - | GitHub Free プラン機能範囲 |
| 整合性 | local-check-result.md の AC-1〜5 が全 passed で、artifacts.json と index.md が一致しているか | - | local-check-result.md の確認結果 |
| 運用性 | PR マージ後に rollback が必要な場合、revert PR を作成できるか。Reviewer がレビューできる状態か | - | GitHub revert 機能・Reviewer 可用性 |

## close-out チェックリスト

- [ ] ユーザーの明示的な承認あり
- [ ] `outputs/phase-13/local-check-result.md` が存在する
- [ ] `outputs/phase-13/change-summary.md` が存在する
- [ ] Phase 12 の close-out（全 6 必須成果物）が完了済み
- [ ] `artifacts.json` の全 Phase が completed
- [ ] Pull Request が作成済みで、Reviewer が設定済み
- [ ] CI が GREEN
