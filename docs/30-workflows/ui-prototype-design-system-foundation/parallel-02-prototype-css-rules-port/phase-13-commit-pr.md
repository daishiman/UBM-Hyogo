---
phase: 13
title: Commit / PR Draft
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 13 — Commit / PR Draft

[実装区分: 実装仕様書]

## 1. commit 戦略

3 step を 3 commit に分割する。

| Commit | message (推奨) |
|--------|---------------|
| 1 | `feat(ui-foundation): parallel-02 G3-1 tag pill selected CSS` |
| 2 | `feat(ui-foundation): parallel-02 G3-2 member card hover CSS` |
| 3 | `feat(ui-foundation): parallel-02 G3-3 visibility marker CSS` |

各 commit は `apps/web/src/styles/globals.css` のみを変更する。本サブワークフロー spec ファイル群は別 commit で `docs(ui-foundation): parallel-02 spec phase-01..13` として記録する。

## 2. PR 戦略

### 2.1 PR base

`dev` (CLAUDE.md 既定)

### 2.2 PR title (案)

```
feat(ui-foundation): parallel-02 prototype selector-based CSS rules (G3-1/2/3)
```

70 文字以下。

### 2.3 PR body 骨子

```md
## Summary
- G3-1: tag pill `[aria-selected="true"]` 選択時の fill 規則を globals.css に追加
- G3-2: member card hover で border-color / box-shadow を transition 経由で変化
- G3-3: `[data-visibility="public|member|admin"]` の左 border + icon marker 規則を追加

## Scope
- 編集ファイル: `apps/web/src/styles/globals.css` のみ
- markup 側 (`data-*` / `aria-*` 付与) は serial-05 / serial-06 で実施
- parallel-01 と同一ファイルを編集するが、マーカー範囲で責務分離済

## 不変条件
- 既存 API endpoint 不変
- OKLch token 正本化 (HEX 直書き 0 件)
- プロトタイプ未掲載画面でも同じ規則が機械的に効く

## Quality
- pnpm typecheck / lint / build green
- verify-design-tokens green
- Playwright visual snapshot 9 種更新

## Evidence
（outputs/phase-11/ の screenshot を参照リンクで列挙）

## Test plan
- [ ] /members で tag 選択時に fill 反映
- [ ] /members の card hover で border / shadow transition
- [ ] /members/[id] で section に visibility marker 表示
- [ ] verify-design-tokens / playwright-smoke が green

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 2.4 PR 作成コマンド

```bash
gh pr create --base dev --title "feat(ui-foundation): parallel-02 prototype selector-based CSS rules (G3-1/2/3)" --body "$(cat <<'EOF'
## Summary
- G3-1: tag pill 選択時 fill 規則
- G3-2: member card hover elevation
- G3-3: visibility marker (public/member/admin)

(以下 §2.3 全文)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 3. PR 作成前チェック (CLAUDE.md 準拠)

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` で `apps/web/src/styles/globals.css` と本サブワークフロー配下の md ファイルのみが対象
- [ ] `outputs/phase-11/*.png` がすべて存在
- [ ] PR 本文の screenshot 参照と physical 画像数が一致

## 4. parallel-01 PR との関係

parallel-01 が先に dev に merge されている場合: 本 PR は parallel-01 の変更を取り込んだ上で append する形になる。

parallel-01 が未 merge の場合: 本実装サイクル内で `globals.css` の編集順を調整し、マーカー方式により後続追記時の context drift を避ける。

どちらの順序でも、`@layer components { ... }` の閉じ括弧位置が壊れていないことを必ず確認する。

## 5. revert 戦略

`git revert <commit-sha>` で各 step commit を個別 revert 可能。マーカー範囲が独立しているため、partial revert (G3-2 のみ revert 等) も成立する。
