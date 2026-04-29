# Phase 5: 実装ランブック（CODEOWNERS 整備 / `doc/` → `docs/` 統一）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |

## 目的

Phase 4 で固定した T1〜T4 を Green にするための **実装ステップ列** を仕様化する。本ランブックは実装担当者（人間 / Claude Code）が実走する 5 ステップ構成で、各 Step に rollback 手順を併記する。CODEOWNERS は最終マッチ勝ち仕様のため、**順序設計** が実装の中核。

> 重要: 本タスクは **solo 運用** であり `require_code_owner_reviews=false`。CODEOWNERS は ownership 文書化のみを目的とする。

## 実行タスク

- タスク1: Step 0 で T4 判定（CI gate 不採用）と前提（owner=`@daishiman`）を確認する。
- タスク2: Step 1〜3 で `doc/` 棚卸し → 置換 → CODEOWNERS 新設を順次実施する。
- タスク3: Step 4 で test PR による T1 / T2 検証、Step 5 で main マージ後の T1 再確認を行う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-04.md | T1〜T4（Green 条件） |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | AC / §8 苦戦箇所 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-02.md | owner 順序設計 / state ownership |
| 参考 | GitHub Docs "About code owners" | 構文 / glob / team 権限 |
| 参考 | CLAUDE.md（リポジトリ直下） | `doc/` 残存箇所の代表 |

## 実装手順（5 ステップ）

### Step 0: 前提確認（必須ゲート）

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| solo 運用方針 | `require_code_owner_reviews=false` 確定 | 必須レビュー化方針が再浮上 |
| owner 形態 | 個人ハンドル `@daishiman` を採用 | team handle 採用が決まり、かつ team の write 権限が未付与 |
| T4 判定（CI gate 可否） | 不採用 | 3 条件のいずれかが該当している |
| Phase 4 仕様存在 | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-04.md` 存在 | 不在 |

すべて Green でなければ実装着手禁止。

**Rollback**: 該当なし（Step 0 は読み取り確認のみ）。

### Step 1: `doc/` 棚卸し（事前 ripgrep）

```bash
# 棚卸しコマンド（T3 と同一）
rg -n "(^|[^a-zA-Z])doc/" \
  -g '!node_modules' -g '!.git' \
  -g '!docs/30-workflows/completed-tasks/**' \
  . | tee /tmp/ut-gov-003-doc-targets.txt

wc -l /tmp/ut-gov-003-doc-targets.txt
```

- 結果を `outputs/phase-05/main.md` の「棚卸し結果」セクションに転記
- 行ごとに「置換対象 / 不可避（外部リンク等） / 完了タスク履歴（除外）」のいずれかを判定
- 不可避ケースは個別に理由メモを残す

**Rollback**: 棚卸しは読み取りのみのため不要。`/tmp/ut-gov-003-doc-targets.txt` を削除すれば原状回帰。

### Step 2: `doc/` → `docs/` 置換

- 対象: Step 1 で「置換対象」と判定されたファイル群（CLAUDE.md / 正本仕様 / `.claude/skills/**/references/**` 等）
- 置換は **手動 review の上で個別 sed / Edit** を推奨。一括 `sed -i` は不可避ケースを巻き込むため禁止。
- 置換後に再棚卸し（T3 コマンドを再実行）し、`/tmp/ut-gov-003-doc-after.txt` と diff を取り、残存が「除外記録済み」のみであることを確認
- コミット粒度: `chore(docs): unify doc/ to docs/ across CLAUDE.md and references`（**コミット 1**）

**Rollback**: `git revert <コミット 1>` で全置換を一括取り消し可能。コミット 1 を独立させる理由はここ。

### Step 3: `.github/CODEOWNERS` 新設

ファイル: `.github/CODEOWNERS`（リポジトリ直下に配置。`docs/CODEOWNERS` ではない）

順序設計（**最終マッチ勝ち** に従い、global fallback を冒頭、governance を末尾に配置）：

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

> 順序の意図: CODEOWNERS は「最後にマッチした行が勝つ」仕様（gitignore 風の上書きとは逆）。global fallback を冒頭に置き、後段ほど governance 重要度が高いパスを並べることで、意図しない上書きを防ぐ。

- コミット粒度: `chore(governance): add .github/CODEOWNERS for ownership documentation`（**コミット 2**）

**Rollback**: `git revert <コミット 2>` で CODEOWNERS ファイルが削除される。コミット 1 とは独立しているためそれぞれ単独 revert 可能。

### Step 4: test PR による T1 / T2 検証

```bash
# 4-1: test ブランチ作成
git switch -c chore/codeowners-test

# 4-2: 各 governance パスに無害ファイル touch
mkdir -p docs/30-workflows .github/workflows apps/api apps/web
touch docs/30-workflows/.codeowners-test
touch .github/workflows/.codeowners-test
touch apps/api/.codeowners-test
touch apps/web/.codeowners-test
# .claude/skills/**/references/** は既存の references ディレクトリ内に配置
SKILL_REF=$(ls -d .claude/skills/*/references | head -1)
touch "$SKILL_REF/.codeowners-test"

git add -A && git commit -m "test: codeowners dry-run (DO NOT MERGE)"
git push -u origin chore/codeowners-test

# 4-3: PR を draft で作成
gh pr create --draft \
  --title "[test] CODEOWNERS dry-run (DO NOT MERGE)" \
  --body "T2 dry-run for UT-GOV-003. Verify suggested reviewers, then close without merging."

# 4-4: T1 確認
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'
# => []

# 4-5: T2 確認（GitHub UI で Reviewers 欄目視）
PR_NUMBER=$(gh pr view --json number --jq '.number')
gh pr view $PR_NUMBER --web

# 4-6: 後始末
gh pr close $PR_NUMBER --delete-branch
```

- T1 / T2 共に Green を確認したら次 Step へ
- T1 / T2 のいずれかが Red の場合 → Phase 6 異常系シナリオで切り分け → Step 3 修正へ戻す

**Rollback**: test PR は **マージしない運用** のため main への影響ゼロ。`gh pr close --delete-branch` でリモートブランチも自動削除。`git branch -D chore/codeowners-test` でローカルも削除。

### Step 5: main マージ後の post-merge 検証

```bash
# 5-1: コミット 1 / コミット 2 を含む実 PR を main へマージ後
git switch main && git pull

# 5-2: T1 を再実行（main 反映後の最終確認）
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'
# => []

# 5-3: T3 を再実行（doc/ 残存が除外記録済みのみ）
rg -n "(^|[^a-zA-Z])doc/" \
  -g '!node_modules' -g '!.git' \
  -g '!docs/30-workflows/completed-tasks/**' \
  .
```

- いずれかが Red の場合 → 即時 hotfix PR を起こし Step 3 / Step 2 を再実施

**Rollback**: 異常時は `git revert <コミット 2>` を main に対して実行。コミット 1（`doc/` 統一）は単独で残しても害がないため revert 不要。

## コミット粒度

| # | メッセージ | スコープ | レビュー観点 | 単独 revert 可否 |
| --- | --- | --- | --- | --- |
| 1 | `chore(docs): unify doc/ to docs/ across CLAUDE.md and references` | `doc/` → `docs/` 文字列置換のみ | 不可避ケースの除外記録 / URL 等 false positive | ◎ |
| 2 | `chore(governance): add .github/CODEOWNERS for ownership documentation` | `.github/CODEOWNERS` 新設のみ | 順序（最終マッチ勝ち）/ owner handle / glob 構文 | ◎ |

> **2 コミット粒度を分離する理由**: CODEOWNERS のみを revert したい場面（誤指定発覚時）と、表記統一のみを revert したい場面（外部参照の互換性問題発覚時）を独立させるため。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-05/main.md` | CODEOWNERS 整備、`doc/` / `docs/` 棚卸し、errors 検証、rollback の実装ランブック |
| 実装対象 | `.github/CODEOWNERS` | 後続実装 PR で新設または更新する owner SSOT |
| 実装対象 | `CLAUDE.md` | `doc/` / `docs/` 正規共存と CODEOWNERS 方針を後続実装 PR で説明する対象 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | Step 3 の順序ミス、owner 解決失敗、glob 誤記、`doc/` 誤置換を fail path として検証する |
| Phase 7 | Step 0〜5 を AC-1〜AC-10 の検証手順へ割り当てる |
| Phase 9 | `gh api .../codeowners/errors`、`rg doc/`、fallback 冒頭確認を品質 gate として再実行する |
| Phase 11 | test PR smoke と suggested reviewer 観察の実走手順を引き継ぐ |

## 検証コマンド（実装担当者向け）

```bash
# Step 1 / Step 2 完了後
rg -c "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!docs/30-workflows/completed-tasks/**' .
# => 0（または除外記録済み件数のみ）

# Step 3 完了後
test -f .github/CODEOWNERS
head -5 .github/CODEOWNERS  # 1 行目に global fallback `* @daishiman` が存在することを目視

# Step 4
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'  # T1
# T2 は GitHub UI 目視

# Step 5
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'  # post-merge T1 再確認
```

## 完了条件

- [ ] Step 0〜5 が `outputs/phase-05/main.md` に記述されている
- [ ] 各 Step に rollback 手順が併記されている
- [ ] `.github/CODEOWNERS` の順序設計（global fallback 冒頭・governance 末尾）が固定されている
- [ ] owner は `@daishiman`（個人ハンドル）に統一されている
- [ ] test PR を **マージしない** 運用が明記されている
- [ ] 2 コミット粒度（`doc/` 統一 / CODEOWNERS 新設）が分離されている
- [ ] post-merge T1 再確認が Step 5 で要求されている

## 苦戦防止メモ

1. **順序を逆にしない**: `* @daishiman` を末尾に書くと、上記の governance ルールがすべて上書きされる。冒頭固定。
2. **team handle を採用しない（本タスク時点）**: 権限不足で silently skip の事故源。個人ハンドルに寄せる（落とし穴 §8-3）。
3. **test PR をマージしない**: governance パスに無害ファイルが残置する事故。`gh pr close --delete-branch` を必ず実行。
4. **`doc/` 一括 sed 禁止**: URL や完了タスク履歴の `doc/` まで巻き込む。手動 review + 個別置換。
5. **`.git/info/exclude` ではなく `.github/CODEOWNERS`**: ファイル配置のうっかりミス。GitHub に認識される正本は `.github/CODEOWNERS` または `CODEOWNERS`（リポジトリ直下）または `docs/CODEOWNERS`。本タスクは `.github/CODEOWNERS` で固定。
6. **post-merge T1 再確認を省かない**: PR 段階で errors=[] でも、main 反映後に他 PR のマージで状況が変わるケースがある（Step 5 必須）。

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 2 コミット粒度の分離が異常系の前提
  - Step 1 棚卸し結果が Phase 6 の T8（doc/ docs/ 両方残置時の挙動）の入力
  - test PR 運用 (`chore/codeowners-test`) を Phase 6 の異常系シナリオでも再利用可能
- ブロック条件:
  - Step 0 の NO-GO 条件のいずれかが成立
  - 順序設計が逆転している
  - team handle が前提で書かれている
