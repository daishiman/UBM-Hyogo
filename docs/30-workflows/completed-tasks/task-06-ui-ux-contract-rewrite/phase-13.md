# Phase 13: PR 作成（approval gate）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 13 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 12 (ドキュメント更新) |
| 下流 Phase | （後続 task-09 / 10 / 11..17 着手可能） |
| 状態 | pending（**user approval 必須**） |

## 目的

ユーザー承認後に feature branch から `dev`（または運用上の base branch）への PR を作成する。本タスクの diff scope は厳密に以下の 2 範囲に限定される（SCOPE.md §6 diff scope 規律遵守）:

- **M（書き換え）**: `docs/00-getting-started-manual/specs/09-ui-ux.md`（1 ファイル）
- **A（追加）**: `docs/30-workflows/task-06-ui-ux-contract-rewrite/**`（本 task package のみ）

それ以外のファイルが diff に含まれている場合は PR 作成前に `git checkout HEAD -- <path>` で復旧してから commit し直す。

## ⚠️ Approval Gate（最重要）

**この Phase は user の明示的承認なしに実行禁止。** 自動 commit / 自動 push / 自動 `gh pr create` を一切行わない。承認待ちの間は status を `pending_approval` に保つ。

承認プロンプト例（user に提示するテキスト）:

> 以下 2 範囲のみが diff に含まれていることを確認しました。PR を作成してよいですか？
> - M: docs/00-getting-started-manual/specs/09-ui-ux.md
> - A: docs/30-workflows/task-06-ui-ux-contract-rewrite/**

## 実行タスク

1. local-check（grep gate / markdown lint / trace check の再実行）
2. diff scope 規律確認（`git diff --name-only main...HEAD` が 2 範囲のみ）
3. commit 単位の確認（仕様書書き換え 1 commit / task package 1 commit の論理分離）
4. change-summary 生成（`git diff --stat`）
5. PR template 確定（title / body / 確認項目）
6. **user 承認確認**（必須）
7. `gh pr create` 実行（承認後のみ）
8. outputs/phase-13/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/documentation-changelog.md | 変更点 |
| 必須 | outputs/phase-12/implementation-guide.md | レビュー観点 |
| 必須 | outputs/phase-11/phase-11-non-visual-alternative-evidence.md | NON_VISUAL evidence サマリ |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md §6 | diff scope 規律 |
| 必須 | CLAUDE.md | ブランチ戦略 |

## 実行手順

### ステップ 1: local-check（再実行）

```bash
F=docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE '#[0-9a-fA-F]{3,8}\b' "$F"; grep -nE 'oklch\(' "$F"
grep -nE '\b[0-9]+px\b' "$F";        grep -nE '\bbg-\[' "$F"
mise exec -- pnpm lint:md "$F"
mise exec -- pnpm typecheck   # NON_VISUAL contract rewrite だが念のため
```

### ステップ 2: diff scope 規律

```bash
git diff --name-only main...HEAD
# 期待出力 (この 2 範囲のみ):
# docs/00-getting-started-manual/specs/09-ui-ux.md
# docs/30-workflows/task-06-ui-ux-contract-rewrite/...
```

範囲外が出た場合: `git checkout HEAD -- <path>` で復旧 → commit 修正。

### ステップ 3: commit 単位

| commit | 範囲 | message 例 |
|--------|------|-----------|
| 1 | docs/00-getting-started-manual/specs/09-ui-ux.md | `docs(specs): rewrite 09-ui-ux.md as contract-only` |
| 2 | docs/30-workflows/task-06-ui-ux-contract-rewrite/** | `docs(workflow): add task-06 ui-ux contract rewrite spec package` |

### ステップ 4: change-summary

```bash
git diff --stat main...HEAD | tee outputs/phase-13/change-summary.txt
```

### ステップ 5: PR template 作成

`outputs/phase-13/pr-template.md` に下記テンプレを格納。

### ステップ 6: **user 承認**（必須）

承認なしに次ステップへ進まない。

### ステップ 7: gh pr create（承認後のみ）

```bash
gh pr create \
  --base dev \
  --head feature/task-06-ui-ux-contract-rewrite \
  --title "docs(specs): rewrite 09-ui-ux.md as contract-only (task-06)" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 後続 task-07 / 08 | 並列実行のため本 PR がマージされなくても着手可能。ただし両者の link 解決には本 PR が先行する方が望ましい |
| 後続 task-09 / 10 / 11..17 | 本 PR が `dev` にマージされ次第、契約の正本として参照可能 |

## 多角的チェック観点（不変条件参照）

- **SCOPE.md §6 diff scope 規律**: M 1 件 + A 1 dir に厳密限定
- **CLAUDE.md sync-merge ポリシー**: hook の自動スキップは sync-merge 時のみ。本 PR の feature commit / push では `--no-verify` を**使わない**
- **元仕様 §0.5 #4**: 視覚詳細値 0 件を local-check で再確認
- **CLAUDE.md #5 #6**: PR description に「apps/web → D1 禁止」「GAS prototype 非昇格」の不変条件を明記

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local-check 再実行 | 13 | pending | 4 grep + lint + typecheck |
| 2 | diff scope 規律 | 13 | pending | 2 範囲のみ |
| 3 | commit 単位確認 | 13 | pending | 論理分離 2 commit |
| 4 | change-summary 生成 | 13 | pending | git diff --stat |
| 5 | PR template | 13 | pending | outputs/phase-13/pr-template.md |
| 6 | **user 承認** | 13 | pending | **必須** |
| 7 | gh pr create | 13 | pending | 承認後のみ |
| 8 | outputs 作成 | 13 | pending | outputs/phase-13/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 作成サマリー |
| ドキュメント | outputs/phase-13/pr-template.md | PR description |
| evidence | outputs/phase-13/local-check.log | grep gate / lint / typecheck 出力 |
| evidence | outputs/phase-13/change-summary.txt | git diff --stat |
| メタ | artifacts.json | Phase 13 を completed（PR url 記録） |

## 完了条件

- [ ] **user 承認取得**
- [ ] local-check 全 PASS
- [ ] diff scope が M 1 + A 1 dir のみ
- [ ] PR が base branch に作成され URL 記録
- [ ] change-summary が PR body に含まれている
- [ ] `--no-verify` を**使っていない**

## タスク 100% 実行確認【必須】

- [ ] 全 8 サブタスク completed
- [ ] outputs/phase-13/main.md と pr-template.md 配置済み
- [ ] artifacts.json に PR URL 記録
- [ ] **user 承認取得**

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項: 後続 task-07 / 08 並列着手 GO / 後続 task-09 / 10 / 11..17 はマージ後 GO
- ブロック条件: user 承認なし / diff scope 範囲外混入

## PR Template

```markdown
## Summary
- `docs/00-getting-started-manual/specs/09-ui-ux.md` を「契約のみ」に全面書き換え（160 行 → 300〜420 行）
- 19 routes × 13 primitives + feature components の props / state / a11y / token 参照名を grep 可能な見出しで整理
- 視覚詳細は task-07（09a-prototype-map.md）/ task-08（09b-design-tokens.md）/ Storybook（task-10 以降）に分離委譲

## Diff Scope（厳密）
- M: docs/00-getting-started-manual/specs/09-ui-ux.md (1 file)
- A: docs/30-workflows/task-06-ui-ux-contract-rewrite/** (task package)

## NON_VISUAL Evidence
- outputs/phase-11/evidence/grep-gate.log（HEX / oklch / px / `bg-[` の 4 種 0 hits）
- outputs/phase-11/evidence/markdown-lint.log（error 0）
- outputs/phase-11/evidence/trace-check.log（phase-3 §2 と §2 API 列完全一致）
- outputs/phase-11/evidence/structure-check.log（## = 10 / ### 2. ≥ 19 / #### 3.1. = 13）

## Invariants（CLAUDE.md）
- #1 Google Form schema を契約に焼き込まない
- #2 consent キーは publicConsent / rulesConsent に統一
- #3 responseEmail は system field
- #5 apps/web → D1 禁止（契約上も apps/api 経由 API のみ）
- #6 GAS prototype の localStorage / EDITMODE 由来要素は不採用明記

## Test Plan
- [ ] outputs/phase-04/verify-matrix.md の grep gate / markdown lint / trace check が通る
- [ ] outputs/phase-09/main.md で 4 軸 PASS の根拠確認
- [ ] outputs/phase-12/implementation-guide.md の後続 task 引き渡し内容確認
- [ ] outputs/phase-11/evidence/ の 4 ログ確認

## Downstream Unblocked
- task-07（09a-prototype-map.md 新設・並列実行可）
- task-08（09b-design-tokens.md 新設・並列実行可）
- task-09 / task-10 / task-11..17（マージ後 GO）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
