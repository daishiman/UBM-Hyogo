# Phase 13: PR 作成（user-gated） — issue-1103 globals.css 重複 shell ブロック 1 本化

- 区分: 実装仕様書（NON_VISUAL / `implemented_local_evidence_captured`）
- PR base ブランチ: `dev`（CLAUDE.md PR フロー既定）
- branch（head）: `docs/issue-1103-globals-css-shell-block-consolidation-spec`

---

## 重要な境界（冒頭明記）

- **commit / push / PR 作成は user-gated。本 wave では一切実施しない。** 以下はユーザー承認後に用いる計画である。
- 実装（globals.css の後発重複ブロック削除）は本 wave で完了済み。PR 作成前に local verification 結果を確認する。
- issue **#1103 は CLOSED のまま**とし、PR で **reopen しない**。本文では `Refs #1103` で参照のみ行い、`Closes` / `Fixes` は使わない。

## 想定 PR タイトル案

```
refactor(web): globals.css の重複 parallel-01 shell ブロックを 1 本化 (Refs #1103)
```

## PR 本文骨子

### 背景

`apps/web/src/styles/globals.css` 内の `parallel-01 P1-1〜P1-5` ブロック（page surface / section rhythm / card chrome / shell surface / typography の 5 定義・130 行）が、同一 `@layer components` 直下に **byte 完全一致で 2 回**定義されている構造的重複。`[data-shell="sidebar"]` も 1708 行 / 1840 行の 2 箇所に重複しており、「どちらが正本か」判別不能な navigation drift を生んでいた。

### 変更

- 後発の重複ブロック（**1774-1904・130 行**）を削除し、先発ブロック（1642-1772）を残す。
- byte 完全一致ブロックの削除のため、cascade 上書きはゼロ・描画値は不変。
- 残存ブロック（1642-1772）の値・selector・順序は無変更。admin スコープ派生の `[data-shell="sidebar"]`（2306 行・`@media (max-width:767px)` 内）も無変更（削除対象外）。
- 値整理・token 整理・selector リネームは scope 外（重複除去のみに厳格に限定）。

### 検証（実装 wave で記入）

```bash
# 削除前: byte 一致証明（diff 空）
$ sed -n '1642,1772p' apps/web/src/styles/globals.css > /tmp/blk1.css
$ sed -n '1774,1904p' apps/web/src/styles/globals.css > /tmp/blk2.css
$ diff /tmp/blk1.css /tmp/blk2.css                                  → （空 = byte 一致）

# 削除後
$ grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css    → 2 件（削除前 3 件 / AC-1）
$ grep -c 'parallel-01 P1-1' apps/web/src/styles/globals.css        → 1（AC-2）
$ git diff apps/web/src/styles/globals.css                          → 後発ブロック 130 行削除のみ・追加行ゼロ（AC-4）
$ mise exec -- pnpm --filter @ubm-hyogo/web build                   → 成功（AC-7）
$ mise exec -- pnpm --filter @ubm-hyogo/web lint                    → exit 0
# token gate（tokens.runtime.spec.ts / verify-design-tokens）         → 緑（AC-6）
```

### 受入条件（AC）

| AC | 内容 |
| --- | --- |
| AC-1 | `grep data-shell="sidebar"` = 2 件（削除前 3 件） |
| AC-2 | `parallel-01 P1-1〜P1-5` の 1 本化 |
| AC-3 | 削除前 byte 一致（diff 空）+ cascade 文脈同一の証明 |
| AC-4 | 削除のみ（残存ブロック値は無変更） |
| AC-5 | shell 描画値（100dvh / border / 背景 / typography）不変 |
| AC-6 | HEX 直書き増なし・token gate 緑 |
| AC-7 | `pnpm --filter @ubm-hyogo/web build` 成功・視覚不変 |

### 視覚不変の根拠

削除対象は先発ブロックと **byte 完全一致**であり、両ブロックは同一 `@layer components` 直下・@media 非内包で **cascade 文脈が完全同一**。後発ブロックは先発ブロックを上書きするだけの冗長定義であるため、その削除は描画結果に一切影響しない（機械的に視覚不変）。よって NON_VISUAL でスクリーンショット不要。

### スクリーンショット

UI/UX 変更なしのため不要（NON_VISUAL）。

---

## PR 作成手順（承認後）

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期。
2. 作業ブランチ `docs/issue-1103-globals-css-shell-block-consolidation-spec` に `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針）。
3. `pnpm install --force` / `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `lint` / `build` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` → commit（末尾に Co-Authored-By 行）。
5. `gh pr create --base dev` で作成（本文は本骨子 + `outputs/phase-12/implementation-guide.md` 反映）。`Refs #1103` のみ・`Closes` は付けない（#1103 は CLOSED 維持）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
