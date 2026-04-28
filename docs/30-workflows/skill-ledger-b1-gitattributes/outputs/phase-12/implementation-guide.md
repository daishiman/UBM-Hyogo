# Phase 12: Implementation Guide

## Part 1: 初学者向け

なぜ必要か。B-1 は、古い記録用ノートへ2人が同時にメモを書き足したとき、片方のメモが消えたり、手作業で直す時間が増えたりする問題を減らすために必要である。

何をするか。B-1 では、たとえば、同じノートの最後に2人が別々のメモを書き足した場合でも「両方のメモを残す」ルールを、古い記録用ノートだけに付ける設計を作った。

大事なのは、どのノートにもこのルールを付けないこと。家計簿や住所録のように形が決まっているノートへ同じことをすると、順番や形が壊れる。だから対象は `_legacy.md` という古い記録だけに絞る。`_legacy.md` は「新しい書き方へ移す前に残している古い記録ファイル」という意味である。

### 今回作ったもの

- B-1 の Phase 1〜13 仕様書
- NON_VISUAL 証跡の受け皿
- 派生実装タスクで使う `.gitattributes` 手順

## Part 2: 技術者向け

派生実装タスクでは root `.gitattributes` に B-1 セクションを追加し、`.claude/skills/**/_legacy.md` 系にだけ `merge=union` を適用する。JSON / YAML / `SKILL.md` / lockfile / code / active fragment は `unspecified` を維持する。

### TypeScript 型定義

```ts
type MergeAttribute = "union" | "unspecified";

interface B1AttributeRule {
  pattern: string;
  merge: MergeAttribute;
  reason: string;
}

interface CheckAttrResult {
  path: string;
  expected: MergeAttribute;
  actual: MergeAttribute;
  passed: boolean;
}
```

### CLIシグネチャ

```bash
git check-attr merge -- <path>
git ls-files '.claude/skills/**/_legacy.md'
git ls-files --unmerged
```

### 使用例

```bash
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
# expected: merge: union

git check-attr merge -- .claude/skills/aiworkflow-requirements/SKILL.md
# expected: merge: unspecified
```

### エラーハンドリング

`git check-attr` が期待値と異なる場合は `.gitattributes` の pattern を広げず、対象 path が `_legacy.md` 系か、除外対象が誤って含まれていないかを確認する。`merge: union` が JSON / YAML / `SKILL.md` / lockfile に出た場合は MAJOR として B-1 セクションを修正する。

### エッジケース

| ケース | 扱い |
| --- | --- |
| front matter 付き Markdown | 除外 |
| code fence を含む Markdown | 除外 |
| `LOGS/<timestamp>-*.md` active fragment | 除外 |
| `_legacy.md` が空または削除済み | B-1 解除候補 |
| 行順が意味を持つ ledger | A-2 fragment 化へ戻す |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| 対象 root | `.claude/skills/` |
| 許可 suffix | `_legacy.md`, `_legacy*.md` |
| merge driver | `union` |
| 禁止 glob | `**/*.md` |
| visualEvidence | `NON_VISUAL` |

### テスト構成

| Phase | テスト |
| --- | --- |
| Phase 4 | TC-1〜TC-4 の設計 |
| Phase 5 | `git check-attr` Green 確認 |
| Phase 9 | quality gate |
| Phase 11 | NON_VISUAL smoke evidence |

## 解除条件

A-2 fragment 化完了レビューで `_legacy.md` が空、削除済み、または append が停止した場合、`.gitattributes` の B-1 セクションを削除する。
