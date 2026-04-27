# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-27 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |

## 目的

Phase 1〜12 の成果物をまとめて PR を作成し、ユーザー承認を得てマージする。docs-only / `spec_created` タスクとして変更サマリーを簡潔にまとめ、レビュアーが branch protection 適用根拠と適用結果証跡を即座に把握できる PR を作成する。

> **重要: このフェーズはユーザーの明示的な承認なしに実行してはならない。**
> PR 作成・マージ操作を行う前に、必ずユーザーに確認を取ること。

## 実行タスク

- ユーザー承認ゲートを通過する（承認確認）
- local-check-result を確認する（verify コマンド一括実行）
- change-summary を作成する
- PR を作成する（GitHub Issue #26 に紐付け）
- CI 確認とマージ手順を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-10/final-review.md | GO 判定確認 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/index.md | PR タイトル・説明の根拠 |
| 参考 | CLAUDE.md | ブランチ戦略・PR レビュー人数（個人開発のため承認不要） |

## 実行手順

### ステップ 1: ユーザー承認ゲート（必須）

**このステップはユーザーの明示的な承認なしに進めてはならない。**

1. Phase 10 の GO 判定が確認されていることを確認する
2. Phase 12 の compliance-check が全 PASS であることを確認する
3. change-summary をユーザーに提示して承認を依頼する
4. ユーザーの明示的な承認を得た後にステップ 2 へ進む

### ステップ 2: local-check-result の確認

- `git status` で変更ファイルを確認する
- documentation-changelog と実際の変更ファイルが一致していることを確認する
- 機密情報（GitHub PAT・database_id 実値など）がコミット対象に含まれていないことを確認する
- verify コマンド一覧を順次実行する

### ステップ 3: PR の作成

- feature ブランチを作成する（例: `feat/ut-19-github-branch-protection-manual-apply`）
- 変更ファイルをステージングする
- コミットメッセージを規約に従って作成する
- PR を作成する（GitHub Issue #26 に紐付け）

## 承認ゲート（ユーザー承認必須）【必須】

| ゲート項目 | 確認内容 | 承認状態 |
| --- | --- | --- |
| Phase 10 GO 判定確認 | outputs/phase-10/final-review.md が GO であること | 要確認 |
| Phase 12 compliance-check | 全項目 PASS であること | 要確認 |
| change-summary レビュー | ユーザーが変更内容を把握していること | **ユーザー承認待ち** |
| 機密情報の非混入確認 | PAT / token / database_id 実値が含まれていないこと | 要確認 |
| PR 作成実行 | **ユーザーの明示的な指示があった場合のみ実行** | **承認待ち** |

## verify コマンド一覧【必須】

PR 作成前に以下のコマンドで変更ファイル・整合性・機密情報の有無を確認する。

```bash
# 変更ファイルの確認
git status

# ステージング予定ファイルの確認
git diff --name-only main...HEAD

# 機密情報の混入チェック
grep -rIn -E "(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{36,}" \
  docs/30-workflows/ut-19-github-branch-protection-manual-apply/ || echo "OK: PAT 未検出"

grep -rIn "database_id\s*=\s*\"[a-f0-9-]\{36\}\"" \
  docs/30-workflows/ut-19-github-branch-protection-manual-apply/ \
  | grep -v "placeholder\|dummy\|<.*>" || echo "OK: 実 database_id 未検出"

# Phase 12 compliance-check の最終確認
ls -la docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-12/

# artifacts.json の二重 ledger 同期確認（UBM-005 対策）
diff <(jq .phases docs/30-workflows/ut-19-github-branch-protection-manual-apply/artifacts.json) \
     <(jq .phases docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/artifacts.json)
```

| チェック項目 | 期待値 | 状態 |
| --- | --- | --- |
| 変更ファイルが documentation-changelog と一致 | 一致 | pending |
| PAT / token が含まれていない | 含まれていない | pending |
| 実 database_id が含まれていない | 含まれていない | pending |
| phase-*.md が全 13 ファイル存在する | 13 ファイル | pending |
| index.md の Phase 一覧状態が更新されている | 全 Phase completed | pending |
| root `artifacts.json` と `outputs/artifacts.json` が同期 | diff なし | pending |

## change-summary【必須】

### 変更概要

本 PR は UT-19 (GitHub ブランチ保護・Environments 手動適用) タスクの仕様書を **docs-only / spec_created** として作成し、`main` / `dev` の branch protection 適用と Environments（production / staging）のブランチポリシー設定の根拠・手順・適用結果証跡を文書化するものです。`deployment-branch-strategy.md` への適用結果反映も含みます。

### 変更ファイル一覧

| ファイル | 変更種別 | 説明 |
| --- | --- | --- |
| docs/30-workflows/ut-19-github-branch-protection-manual-apply/index.md | 新規 | タスク仕様書インデックス |
| docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-01.md〜phase-13.md | 新規 | Phase 1〜13 の仕様書 |
| docs/30-workflows/ut-19-github-branch-protection-manual-apply/artifacts.json | 新規 | 機械可読サマリ（root） |
| docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/ | 新規 | Phase 別成果物（gh api before/after JSON 含む） |
| .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | 更新 | UT-19 適用予定/証跡リンクセクション追加 |
| .claude/skills/aiworkflow-requirements/LOGS.md | 更新 | UT-19 完了エントリ追加 |
| .claude/skills/task-specification-creator/LOGS.md | 更新 | UT-19 仕様書化エントリ追加 |
| .claude/skills/aiworkflow-requirements/indexes/topic-map.md | 更新 | branch protection 行更新 |

### 影響範囲

- 実装コードへの変更なし（docs-only / spec_created）
- GitHub リポジトリ設定（branch protection / Environments）は Phase 5 / 11 で手動適用・検証する
- UT-05 (CI/CD パイプライン) / UT-06 (本番デプロイ) の前提条件が確定
- 01a-parallel-github-and-branch-governance Phase 12 unassigned-task-detection.md で UT-19 が `spec_created` に更新済み

### 受入条件の充足

| AC | 充足状態 |
| --- | --- |
| AC-1: main branch protection (status check / approve=0 / no force push / no delete) | outputs/phase-05/gh-api-after-main.json で確認 |
| AC-2: dev branch protection (同上) | outputs/phase-05/gh-api-after-dev.json で確認 |
| AC-3: production environment ブランチポリシー (main のみ / Required Reviewers 0) | outputs/phase-11/manual-smoke-log.md で確認 |
| AC-4: staging environment ブランチポリシー (dev のみ) | 同上 |
| AC-5: gh api before/after JSON が outputs/phase-05/ に保存済み | outputs/phase-05/ 配下 4 ファイル |
| AC-6: ランブックと実適用の乖離なし | outputs/phase-08/runbook-dry-diff.md |
| AC-7: 正式ブランチ指定としての `develop` 旧名残存ゼロ | Phase 10 で grep 確認 |

## commit メッセージ規約【必須】

```
docs(ut-19): GitHub ブランチ保護・Environments 手動適用タスク仕様書

- Phase 1〜13 の仕様書を作成（docs-only / spec_created）
- main / dev branch protection 適用結果証跡を outputs/phase-05/ に記録
- production / staging Environments ブランチポリシー設定根拠を文書化
- deployment-branch-strategy.md に UT-19 適用予定/証跡リンクセクションを追加
- 個人開発方針（承認不要・enforce_admins=false）の判断根拠を明記

Refs #26
```

## PR 作成手順

ユーザー承認後に以下のコマンドを実行する。

```bash
# feature ブランチの作成（main から）
git fetch origin main
git checkout -b feat/ut-19-github-branch-protection-manual-apply origin/main

# 変更ファイルのステージング（パスを明示）
git add docs/30-workflows/ut-19-github-branch-protection-manual-apply/
git add .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md
git add .claude/skills/aiworkflow-requirements/LOGS.md
git add .claude/skills/task-specification-creator/LOGS.md
git add .claude/skills/aiworkflow-requirements/indexes/topic-map.md

# コミット
git commit -m "$(cat <<'EOF'
docs(ut-19): GitHub ブランチ保護・Environments 手動適用タスク仕様書

- Phase 1〜13 の仕様書を作成（docs-only / spec_created）
- main / dev branch protection 適用結果証跡を outputs/phase-05/ に記録
- production / staging Environments ブランチポリシー設定根拠を文書化
- deployment-branch-strategy.md に UT-19 適用予定/証跡リンクセクションを追加
- 個人開発方針（承認不要・enforce_admins=false）の判断根拠を明記

Refs #26
EOF
)"

# PR 作成（base は dev、最終的に main へ昇格）
gh pr create \
  --title "docs(ut-19): GitHub ブランチ保護・Environments 手動適用タスク仕様書" \
  --base dev \
  --head feat/ut-19-github-branch-protection-manual-apply \
  --body "$(cat <<'EOF'
## 概要

UT-19 (GitHub ブランチ保護・Environments 手動適用) タスクの仕様書を docs-only / spec_created として作成します。`main` / `dev` の branch protection と production / staging Environments のブランチポリシー設定について、適用根拠・手順・実適用結果証跡を文書化します。

## 変更内容

- Phase 1〜13 の仕様書を作成
- branch protection 設定の `gh api` payload と適用結果 JSON を outputs/phase-05/ に記録
- 個人開発方針（承認不要・enforce_admins=false）の判断根拠を明記
- ランブック（01a 配下）との整合確認結果を outputs/phase-08/ に記録
- `deployment-branch-strategy.md` に「UT-19 適用予定/証跡リンク」セクションを追加

## 受入条件

- AC-1〜AC-7 を全件充足
- 実装コードへの変更なし（docs-only / spec_created）
- GitHub リポジトリ設定は Phase 5 / 11 で手動適用・検証する

## 動作確認

Phase 11 でテスト PR を立てて branch protection の動作（status check 未通過時のマージブロック・force push 拒否）を確認する。詳細は `outputs/phase-11/manual-smoke-log.md` に記録する。

Refs #26
EOF
)"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を PR 作成の前提条件として使用 |
| Phase 11 | manual-smoke-log を PR 本文の動作確認セクションに引用 |
| Phase 12 | documentation-changelog から変更ファイルを特定 |

## 多角的チェック観点（AIが判断）

- 価値性: PR が Issue #26 を close し、UT-05 / UT-06 への前提条件確定根拠が明確か。
- 実現性: docs-only / spec_created 変更が中心であり CI でのコード品質チェックは非該当か確認する。
- 整合性: change-summary が Phase 12 の documentation-changelog と完全一致しているか。
- 運用性: PR レビュアー（個人開発のため自己レビュー）が変更意図を理解できる説明か。CLAUDE.md のブランチ戦略に従い `feature/* → dev → main` の流れで段階的に昇格させる。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート | 13 | pending | **承認なし禁止** |
| 2 | local-check-result 確認 | 13 | pending | verify コマンド一括実行 |
| 3 | change-summary 作成 | 13 | pending | ユーザーへの提示用 |
| 4 | feature ブランチ作成 | 13 | pending | ユーザー承認後のみ |
| 5 | コミット作成 | 13 | pending | 規約準拠 |
| 6 | PR 作成 | 13 | pending | base=dev / Refs #26 |
| 7 | CI 確認 | 13 | pending | PR 作成後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR | https://github.com/daishiman/UBM-Hyogo/pull/実行時記入 | UT-19 仕様書 PR |
| メタ | artifacts.json | 全 Phase completed に更新 |

## 完了条件

- ユーザー承認ゲートを通過している
- local-check-result の全チェック項目が PASS である
- PR が作成されて Issue #26 に紐付いている（`Refs #26`。Issue は既に CLOSED のため close keyword は使わない）
- artifacts.json の全 Phase 状態が completed である
- root `artifacts.json` と `outputs/artifacts.json` の二重 ledger が同期されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（PAT 混入・実 database_id 混入・未承認実行）を回避済み
- 次 Phase への引き継ぎ事項を記述（なし: 最終 Phase）
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項: PR マージ後、UT-05 / UT-06 担当者に branch protection / Environments が確定したことを通知する。01a Phase 12 の unassigned-task-detection.md で UT-19 を `spec_created` → close 済みとして最終更新する。
- ブロック条件: ユーザー承認がない場合は PR 作成を実行しない。
