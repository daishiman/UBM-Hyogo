---
phase: 13
title: Commit / PR draft — ブランチ・コミットメッセージ・PR title/body 案
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 13 — Commit / PR Draft

[実装区分: 実装仕様書]

## 1. ブランチ

| 項目 | 値 |
|------|-----|
| base | `dev`（CLAUDE.md「既定の PR base ブランチは dev」） |
| topic | `feat/ui-foundation-parallel-01-globals-css-rhythm` |
| 起点 | `origin/dev` の最新 |

ブランチ作成コマンド（ワークツリー起動直後の例）:

```bash
git fetch origin dev
git switch -c feat/ui-foundation-parallel-01-globals-css-rhythm origin/dev
```

## 2. コミット粒度

CSS のみの単一ファイル変更のため、**1 コミットに集約**する。

### 2.1 コミットメッセージ案

```
feat(ui-foundation): parallel-01 globals.css に page-level rhythm 5 セクション追加

- P1-1 page surface: body / [data-route] 既定背景
- P1-2 section rhythm: [data-section] / [data-section-rhythm] 縦余白
- P1-3 card chrome: [data-card] / [data-card-tone] 4 種
- P1-4 shell surface: [data-shell] topbar/sidebar/footer
- P1-5 typography scale: [data-text] display/title/section/card/body/caption/eyebrow

すべて var(--ubm-*) 経由。HEX/px 直書きなし。既存 @layer base と
parallel-09 規則には触れない（追加挿入のみ）。

Refs docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/
```

evidence ファイルを含める場合は同一コミット内に置く。

## 3. PR

### 3.1 PR title 案

```
feat(ui-foundation/parallel-01): globals.css @layer components に page-level rhythm 追加
```

70 文字以内。

### 3.2 PR body 案（diff-to-pr Phase 13 仕様準拠）

```markdown
## Summary

- `apps/web/src/styles/globals.css` の `@layer components` にプロトタイプの page-level rhythm を翻訳して 5 セクション追加（P1-1〜P1-5）
- 19 routes 全画面が attribute だけでプロトタイプの雰囲気を継承できる仕組みを実装
- すべて `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` / `var(--ubm-shadow-*)` 経由、HEX 直書きゼロ

## 変更ファイル

- `apps/web/src/styles/globals.css`（追加挿入のみ、約 +150 行）

## 追加 selector

| カテゴリ | selector |
|---------|---------|
| Page surface | `[data-route]` |
| Section rhythm | `[data-section]`, `[data-section-rhythm="compact\|comfortable\|loose"]` |
| Card chrome | `[data-card]`, `[data-card-tone="panel\|surface\|emphasis\|flat"]` |
| Shell surface | `[data-shell="topbar\|sidebar\|footer"]` |
| Typography | `[data-text="display\|title\|section\|card\|body\|caption\|eyebrow"]` |

## DoD（Phase 8）

- [x] P1-1 page surface 追加
- [x] P1-2 section rhythm 追加
- [x] P1-3 card chrome 追加
- [x] P1-4 shell surface 追加
- [x] P1-5 typography scale 追加
- [x] grep gate (HEX/bg-[#/text-[#) 0 件
- [x] G1 typecheck / G2 lint / G3 build / G4 verify-design-tokens / G5 verify-pr-ready green

## Test plan

- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` green
- [ ] `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] visual snapshot は serial-07 で取得（本 PR では対象外）

## 関連

- workflow: `docs/30-workflows/ui-prototype-design-system-foundation/`
- sub-workflow: `parallel-01-globals-css-rhythm/`
- 後続: parallel-02 / parallel-03 / parallel-04（並列）→ serial-05 以降

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(ui-foundation/parallel-01): globals.css @layer components に page-level rhythm 追加" --body "$(cat <<'EOF'
（§3.2 の body をここに）
EOF
)"
```

## 5. PR 作成前チェックリスト

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が `apps/web/src/styles/globals.css` と本 SW の docs のみ
- [ ] `outputs/phase-11/` の evidence 10 件が物理存在
- [ ] PR body に DoD 7 項目すべてチェック済
- [ ] base が `dev` であること（`main` ではない）

## 6. マージ後

- `dev` ブランチに統合
- 後続 parallel-02 / parallel-03 / parallel-04 / serial-05〜07 の実装着手可能
- visual regression（serial-07）で本 SW の効果を最終確認
