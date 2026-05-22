# PR Template

```markdown
## Summary

- task-20-w2-screen-blueprints-public-and-member（docs-only / spec authoring）
- `09e-screen-blueprints-public.md`（公開 6 画面 + §99）/ `09f-screen-blueprints-member.md`（会員 2 画面 + §99）の 2 markdown を新規作成
- 各画面 §X.1〜X.7 fixed schema（prototype 転記 / コピー原文 / mermaid / API 表 / props/state / a11y / 9 series link）

## Why

- 下流 task-11..14（public top + member list / detail + register / login / my profile）が「§X を読んで 1 ファイル書ける」決定論的 input source として必要

## Scope

- C: `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` 1039 行
- C: `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` 921 行
- `apps/` / `packages/` 配下のコード変更なし
- `pages-public.jsx` / `pages-member.jsx` は凍結正本のため不変

## Verification

- 09e §章数 7 / 09f §章数 3
- 全 8 画面で §X.1〜X.7 揃い（09e 42 / 09f 14）
- 視覚値混入 0（fenced jsx 除外、`evidence/grep-visual-values.log`: `GREP_ZERO_HITS_OUTSIDE_FENCED_CODE`）
- login 5+1 状態（input/sent/unregistered/deleted/rules_declined/error）/ profile 4 領域 揃い
- §X.4 API 表が現行 API 正本と一致
- 不変条件 #1〜#7 反映（consent / responseEmail / D1 直接アクセス禁止）

## Test plan

- [x] 09e/09f 構造 grep gate PASS
- [x] 視覚値混入 grep PASS
- [x] login 5+1 状態 / profile 4 領域 grep PASS
- [x] API trace check（§X.4 vs 現行 API 正本）PASS
- [x] 9 series link（09a/09b/09c/09d）揃い

## Refs

- 親 workflow: docs/30-workflows/ui-prototype-alignment-mvp-recovery/
- 元タスク: docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md
- 本仕様書: docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
