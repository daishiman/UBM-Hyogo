# Implementation Guide

## Part 1: 中学生レベル

学校の文化祭で、本番前に一度リハーサルをする場所を作る。これが `dev`。今までは個人の準備物をいきなり本番の場所（`main`）へ持っていく流れになりがちだった。これからは、個人作業（`feature/*`）をまずリハーサル場所（`dev`）へ集め、問題がないことを見てから本番（`main`）へ移す。

| 言葉 | 日常語での説明 |
| --- | --- |
| ブランチ | 作業のレーン |
| dev | 本番前のリハーサル場所 |
| main | 本番の場所 |
| PR | 合流してよいか見てもらう依頼 |
| staging | お客さんに見せる前の試し場所 |

## Part 2: 技術者レベル

### 変更契約

```ts
type BranchFlow = {
  featureBase: "origin/dev";
  pullRequestBase: "dev";
  promotionBase: "main";
  visualEvidence: "NON_VISUAL";
};
```

### API / command signatures

```bash
bash scripts/new-worktree.sh <branch_name>
gh pr create --base dev --head <feature_branch>
git rev-list --left-right --count origin/main...origin/dev
git rev-list --left-right --count origin/dev...HEAD
```

### edge cases

| ケース | 扱い |
| --- | --- |
| `origin/dev` と `origin/main` が diverge | remote sync check を FAIL とし、PR 作成前に解消 |
| `--base main` が PR command に残る | wrong-base regression として FAIL |
| dev → main release | 本 task では実行しない。別 approval gate |
| deleted `ut-05a` evidence link | active 正本から撤回し、削除根拠を artifact inventory へ集約 |
