# Phase 4 成果物: テスト戦略 main

## サマリ

CODEOWNERS は実行系コードを伴わない governance ファイルのため、line / branch coverage は適用しない。本 Phase では **4 系統の検証（T1〜T4）** を仕様正本として固定する。

- T1: `gh api /codeowners/errors` による構文・参照健全性検証（errors=[]）
- T2: test PR (`chore/codeowners-test`) による suggested reviewer 表示の dry-run
- T3: ripgrep による `doc/` 表記残存ゼロ確認
- T4: CI 自動 gate（codeowners-validator 等）導入可否判定 → 本タスク時点では **不採用**

## 前提

| 項目 | 値 |
| --- | --- |
| 検証目的 | ownership 文書化が GitHub 側で機能していることの確認 |
| 検証目的でないこと | PR が CODEOWNERS により block されること（solo 運用で `require_code_owner_reviews=false`） |
| 実行タイミング | 本 Phase は仕様化のみ、実走は Phase 5 / 11 |
| owner | `@daishiman`（個人ハンドル。team handle は採用しない） |

## T1: `gh api /codeowners/errors` で errors=[]

| 項目 | 内容 |
| --- | --- |
| 観点 | 構文・参照健全性 |
| 検証コマンド | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'` |
| 期待値 | `[]`（HTTP 200、空配列） |
| Red 状態 | `.github/CODEOWNERS` 未整備 / 旧表記 / 不正 handle |
| 失敗時切り分け | (a) 構文エラー / (b) 不在 user/team / (c) team 権限不足 silently skip / (d) glob 非互換 |
| 実走 | Phase 5 Step 4 (PR) + Step 5 (post-merge) |

注意: silently skip ケースでは errors=[] でも UI 反映が失敗するため T2 と併用必須。

## T2: test PR の suggested reviewer 表示（dry-run）

### 手順

1. `git switch -c chore/codeowners-test`
2. 各 governance パスに無害な空ファイルを 1 つずつ追加：
   - `docs/30-workflows/.codeowners-test`
   - `.claude/skills/.codeowners-test`（references 配下に作成可能なら `**/references/.codeowners-test`）
   - `.github/workflows/.codeowners-test`
   - `apps/api/.codeowners-test`
   - `apps/web/.codeowners-test`
3. commit & push
4. `gh pr create --draft --title "[test] CODEOWNERS dry-run" --body "Verifying suggested reviewers. DO NOT MERGE."`
5. GitHub UI Reviewers 欄を目視確認。`gh api repos/daishiman/UBM-Hyogo/pulls/<N>/requested_reviewers` でも cross check 可能（automatic request は branch protection 設定次第のため目視を一次証跡とする）

### 期待値

| パス | 期待 reviewer |
| --- | --- |
| `docs/30-workflows/.codeowners-test` | @daishiman |
| `.claude/skills/.../references/.codeowners-test` | @daishiman |
| `.github/workflows/.codeowners-test` | @daishiman |
| `apps/api/.codeowners-test` | @daishiman |
| `apps/web/.codeowners-test` | @daishiman |

### 後始末

- PR を **マージせず close**
- `git push origin --delete chore/codeowners-test`
- ローカルブランチ削除

## T3: `doc/` 表記残存ゼロ確認

### 検証コマンド

```bash
rg -n "(^|[^a-zA-Z])doc/" \
  -g '!node_modules' -g '!.git' \
  -g '!docs/30-workflows/completed-tasks/**' \
  .
```

### 除外範囲の根拠

- `docs/30-workflows/completed-tasks/**`: 完了タスクの原典スペックは `doc/` 言及を保持する場合がある（履歴保護）
- 外部リンク（GitHub Docs URL 等）: false positive のため、Phase 5 Step 1 棚卸し時に個別判定し「不可避ケース」として記録

### 期待値

| 状態 | 件数 |
| --- | --- |
| Phase 5 Step 1 実施前 | N（実態は棚卸しで確定） |
| Phase 5 Step 2 実施後 | 0、または除外記録済みのみ |

## T4: CI 自動 gate 導入可否判定

### 判定基準（3 条件 AND）

1. CODEOWNERS 改変が月次以上の頻度で見込まれる
2. team handle 採用予定があり権限欠落の自動検知が必要
3. 将来 `require_code_owner_reviews=true` 切替計画がある

### 本タスク時点の判定

| 条件 | 該当 |
| --- | --- |
| 1. 月次改変頻度 | NO（governance 設計で安定） |
| 2. team handle 採用 | NO（個人ハンドル運用） |
| 3. 必須レビュー化計画 | NO（solo 運用で恒常的に false） |

→ **CI gate は導入しない**。T1（手動実行）+ Phase 5 Step 5（post-merge 確認）で十分。

### 再評価トリガ（Phase 12 申し送り）

上記 3 条件のいずれかが成立した時点で再起票。Phase 12 unassigned-task-detection.md に「CODEOWNERS CI gate 導入再評価」として登録する。

## カバレッジ表（5 パス × 3 観点）

| Ownership パス | T1 構文 | T2 UI 反映 | T3 表記統一 |
| --- | --- | --- | --- |
| `docs/30-workflows/**` | ◎ | ◎ | ◎ |
| `.claude/skills/**/references/**` | ◎ | ◎ | ◎ |
| `.github/workflows/**` | ◎ | ◎ | - |
| `apps/api/**` | ◎ | ◎ | - |
| `apps/web/**` | ◎ | ◎ | - |
| global fallback `* @daishiman` | ◎ | - | - |

## 実走チェックリスト（Phase 5 / 11 で使用）

- [ ] T1: `gh api .../codeowners/errors` で errors=[]
- [ ] T2: test PR で 5 パスすべて @daishiman が suggested reviewer
- [ ] T2: test PR を close、ブランチ削除
- [ ] T3: 棚卸し ripgrep で 0 hit（または除外記録のみ）
- [ ] T4: 3 条件いずれも成立せず → CI gate 不採用を記録

## 関連ドキュメント

- 原典: `docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md` §2.2 AC / §8 苦戦箇所
- Phase 仕様: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-04.md`
- 後続 Phase: `phase-05.md`（実装ランブック）/ `phase-06.md`（異常系検証）/ `phase-07.md`（AC マトリクス）
