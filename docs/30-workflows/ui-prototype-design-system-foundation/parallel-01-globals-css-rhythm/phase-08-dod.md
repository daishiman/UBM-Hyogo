---
phase: 8
title: DoD — 完了の客観判定基準
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 8 — DoD（Definition of Done）

[実装区分: 実装仕様書]

## 1. 完了判定リスト

下記 7 項目をすべて満たして本 SW を「完了」とする。

| # | 判定項目 | 検証方法 |
|---|---------|---------|
| 1 | `apps/web/src/styles/globals.css` に P1-1〜P1-5 の 5 セクションが既存 parallel-09 G9-6 と G9-7 のあいだに挿入されている | `grep -n 'parallel-01 P1-' apps/web/src/styles/globals.css` で 5 件 |
| 2 | `[data-route]` / `[data-section]` / `[data-card]` / `[data-shell]` / `[data-text]` の全 selector が globals.css に存在 | `grep -nE '\[data-(route\|section\|card\|shell\|text)' apps/web/src/styles/globals.css` で全件 hit |
| 3 | 本 SW 追加分に HEX 直書き / `bg-[#` / `text-[#` が 0 件 | Phase 6 §2 の grep gate 全 0 |
| 4 | `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm build` が exit 0 | Phase 11 に build.log 等を保存 |
| 5 | `verify-design-tokens` CI gate が green | CI 上で確認、`outputs/phase-11/verify-design-tokens.log` |
| 6 | `bash scripts/verify-pr-ready.sh` が exit 0 | `outputs/phase-11/verify-pr-ready.log` |
| 7 | `tokens.css` / `@layer base` / 既存 parallel-09 規則 / focus-visible 既存規則を変更していない | `git diff dev -- apps/web/src/styles/tokens.css` が空、globals.css の diff が挿入のみ |

## 2. 非完了とみなすケース

- P1-1〜P1-5 のいずれかが欠落
- `[data-card-tone="emphasis"]` 等の modifier が欠けている
- 既存 `@layer base` の body 規則を上書きしている
- typography に絶対色（HEX）が混入
- 本 SW で `tokens.css` を編集している（責務外）
- 本 SW で `app/` 配下の TSX を編集している（責務外）

## 3. 完了報告フォーマット

PR description（Phase 13）に下記を含める:

```
- [x] P1-1 page surface 追加
- [x] P1-2 section rhythm 追加
- [x] P1-3 card chrome 追加
- [x] P1-4 shell surface 追加
- [x] P1-5 typography scale 追加
- [x] grep gate (HEX/bg-[#/text-[#) 0 件
- [x] G1-G5 quality gates green
```
