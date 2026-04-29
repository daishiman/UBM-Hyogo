# Phase 5 成果物: 実装ランブック main

## 概要

`.github/CODEOWNERS` を governance パス単位で新設し、`doc/` → `docs/` 表記揺れを統一する 5 ステップランブック。各 Step に rollback 手順併記。

## 前提（Step 0 ゲート）

| 項目 | 値 |
| --- | --- |
| solo 運用方針 | `require_code_owner_reviews=false` |
| owner | `@daishiman`（個人ハンドル） |
| CI gate | 不採用（T4 判定済み） |
| 配置 | `.github/CODEOWNERS`（リポジトリ直下の `CODEOWNERS` ではない） |

## ステップ一覧

| Step | 目的 | 主コマンド / 編集対象 | コミット | Rollback |
| --- | --- | --- | --- | --- |
| 0 | 前提確認 | （読み取り） | - | - |
| 1 | `doc/` 棚卸し | `rg -n "(^\|[^a-zA-Z])doc/" ...` | - | tmp ファイル削除 |
| 2 | `doc/` → `docs/` 置換 | 手動 Edit / 個別 sed | コミット 1 | `git revert <コミット 1>` |
| 3 | `.github/CODEOWNERS` 新設 | ファイル新設 | コミット 2 | `git revert <コミット 2>` |
| 4 | test PR で T1 / T2 検証 | `gh pr create --draft` | （マージしない） | `gh pr close --delete-branch` |
| 5 | main マージ後の T1 / T3 再確認 | `gh api .../codeowners/errors` | - | hotfix PR |

## Step 1: 棚卸しコマンド

```bash
rg -n "(^|[^a-zA-Z])doc/" \
  -g '!node_modules' -g '!.git' \
  -g '!docs/30-workflows/completed-tasks/**' \
  . | tee /tmp/ut-gov-003-doc-targets.txt
wc -l /tmp/ut-gov-003-doc-targets.txt
```

### 棚卸し結果記録テンプレ

| ファイル:行 | 元表記 | 判定（置換対象 / 不可避 / 完了履歴） | 理由 |
| --- | --- | --- | --- |
| _実装担当者が記入_ | _doc/.../..._ | _置換対象_ | _CLAUDE.md 主要ディレクトリ表_ |

## Step 2: 置換ルール

- 手動 Edit / 個別 sed のみ（一括 sed 禁止）
- 置換後に Step 1 の棚卸しコマンドを再実行 → 残存が「除外記録済み」のみであることを確認
- コミット: `chore(docs): unify doc/ to docs/ across CLAUDE.md and references`

## Step 3: `.github/CODEOWNERS` 本文

```
# UBM-Hyogo CODEOWNERS
# Solo 運用ポリシー: require_code_owner_reviews=false
# 本ファイルは ownership 文書化のみを目的とし、必須レビュアー化はしない。
# 構文検証: gh api repos/daishiman/UBM-Hyogo/codeowners/errors

# --- 1. global fallback（汎用デフォルト：先に書く） ---
* @daishiman

# --- 2. アプリケーション領域（より具体度高） ---
apps/api/** @daishiman
apps/web/** @daishiman

# --- 3. governance 領域（最も具体度高・末尾配置） ---
.github/workflows/** @daishiman
docs/30-workflows/** @daishiman
.claude/skills/**/references/** @daishiman
```

順序の根拠: CODEOWNERS は **最終マッチ勝ち**（gitignore とは逆）。global fallback を冒頭、governance を末尾に配置することで意図しない上書きを防ぐ。

コミット: `chore(governance): add .github/CODEOWNERS for ownership documentation`

## Step 4: test PR 手順

```bash
git switch -c chore/codeowners-test

mkdir -p docs/30-workflows .github/workflows apps/api apps/web
touch docs/30-workflows/.codeowners-test
touch .github/workflows/.codeowners-test
touch apps/api/.codeowners-test
touch apps/web/.codeowners-test
SKILL_REF=$(ls -d .claude/skills/*/references | head -1)
touch "$SKILL_REF/.codeowners-test"

git add -A && git commit -m "test: codeowners dry-run (DO NOT MERGE)"
git push -u origin chore/codeowners-test

gh pr create --draft \
  --title "[test] CODEOWNERS dry-run (DO NOT MERGE)" \
  --body "T2 dry-run for UT-GOV-003. Verify suggested reviewers, then close without merging."

# T1 確認
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'

# T2 確認（UI 目視）
PR_NUMBER=$(gh pr view --json number --jq '.number')
gh pr view $PR_NUMBER --web

# 後始末（マージ禁止）
gh pr close $PR_NUMBER --delete-branch
git switch main
git branch -D chore/codeowners-test 2>/dev/null || true
```

## Step 5: post-merge 検証

```bash
git switch main && git pull
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'  # T1 再確認
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!docs/30-workflows/completed-tasks/**' .  # T3 再確認
```

異常時 → 即時 hotfix PR で Step 3 修正 or Step 2 個別修正。

## コミット粒度

| # | メッセージ | スコープ | 単独 revert |
| --- | --- | --- | --- |
| 1 | `chore(docs): unify doc/ to docs/ across CLAUDE.md and references` | 文字列置換のみ | ◎ |
| 2 | `chore(governance): add .github/CODEOWNERS for ownership documentation` | `.github/CODEOWNERS` 新設のみ | ◎ |

## 完了チェックリスト

- [ ] Step 0 ゲート全項目 Green
- [ ] Step 1 棚卸し結果を本ファイルに記録
- [ ] Step 2 置換実施・除外記録完了
- [ ] Step 3 `.github/CODEOWNERS` 配置・順序確認
- [ ] Step 4 test PR で T1=errors=[] / T2=5 パスすべて @daishiman / test PR close + ブランチ削除
- [ ] Step 5 main マージ後 T1 / T3 再確認

## 関連

- Phase 4 仕様: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-04.md`
- Phase 6 異常系: `phase-06.md`
- Phase 7 AC マトリクス: `phase-07.md`
- 原典: `docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md`
