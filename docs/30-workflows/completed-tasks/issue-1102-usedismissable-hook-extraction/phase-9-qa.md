---
phase: 9
name: 品質保証
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 9: 品質保証

NON_VISUAL（挙動不変リファクタ）の品質ゲートを定義し、本サイクルで実コード反映後に実行した結果を記録する。

## 9.1 spec ドキュメント自体の品質（line budget / link / mirror parity）

| 観点 | 基準 | 判定方法 |
| --- | --- | --- |
| line budget | 各 phase ファイルが冗長でなく、空見出し / TBD を含まない | 目視 + `grep -rn "TBD\|TODO" docs/30-workflows/completed-tasks/issue-1102-usedismissable-hook-extraction/` が 0 件 |
| link 健全性 | 参照する apps/web パスが実在する | `ls apps/web/src/components/shell/SidebarUserMenu.tsx apps/web/src/components/public/DensityToggle.client.tsx`（実在確認済） |
| mirror parity | `.agents/skills` は `../.claude/skills` への symlink でミラー。本タスクは skill を編集しないため parity 影響なし | 対象外（spec 作成タスク） |

## 9.2 品質チェックリスト（実コード反映後）

| # | チェック項目 | 合格基準 | 判定コマンド |
| --- | --- | --- | --- |
| Q-1 | typecheck 緑 | エラー 0。`DismissReason` literal union / `RefObject<HTMLElement \| null>` が型解決される | **PASS**: `mise exec -- pnpm typecheck` |
| Q-2 | lint 緑 | エラー 0。未使用 import（除去後の `browserDocument` 残骸など）0 | **PASS**: `mise exec -- pnpm lint` |
| Q-3 | focused vitest 全パス | hook spec + consumer 回帰 spec 2 本がすべて PASS | 下記 §9.3 のコマンド（PASS: 3 files / 35 tests） |
| Q-4 | HEX 直書き 0 | 変更ファイルに `#xxxxxx` / `bg-[#` / `text-[#` が無い（NON_VISUAL ゆえ色変更ゼロが正） | `grep -REn "#[0-9a-fA-F]{3,6}\b\|bg-\[#\|text-\[#" apps/web/src/hooks/useDismissable.ts apps/web/src/components/shell/SidebarUserMenu.tsx apps/web/src/components/public/DensityToggle.client.tsx`（0 hit 期待） |
| Q-5 | `<details>.open` の React state 化なし | `useState` で open を持つ実装が混入していない（I-2 保持） | `grep -n "useState" apps/web/src/hooks/useDismissable.ts`（0 hit 期待）。consumer 側も open を `useState` 管理に変えていないこと |
| Q-6 | 素の document.addEventListener なし | document への listener 登録は hook 内の `browserDocument()` 経由 1 経路のみ（I-5） | `grep -rn "document.addEventListener\|window.addEventListener" apps/web/src/components/shell/SidebarUserMenu.tsx apps/web/src/components/public/DensityToggle.client.tsx`（0 hit 期待）。`grep -n "addEventListener" apps/web/src/hooks/useDismissable.ts` の登録先は `browserDocument()` 由来の変数のみ |
| Q-7 | 既存 spec 無改修 | consumer spec 2 本の差分が 0 行 | `git diff --stat -- apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`（変更 0 行期待） |
| Q-8 | cleanup（リーク防止） | hook の `useEffect` が必ず removeEventListener を返す | `useDismissable.spec.tsx` の unmount テストで listener 解除を検証（PASS で機械保証） |

## 9.3 focused vitest コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useDismissable.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
```

結果: **PASS**（2026-06-06T15:48:12+09:00）。3 ファイル / 35 tests がすべて PASS。consumer 2 本は無改修で緑（挙動不変の証跡）。

## 9.4 「ファイル削除」基準の非該当（[FB-UI-02-1]）

本タスクは **新規追加（hook + spec）+ 既存 consumer の inline ロジック置換**のみで構成され、
ファイル単位の削除は発生しない。よって [FB-UI-02-1]「ファイル削除時の参照残存チェック」は本タスク非該当。
削除されるのは consumer 内の inline `useEffect` ブロック（コード断片）であり、ファイルではない。
断片削除後の残骸（コメントアウト・未使用 import）は Q-2（lint）と Q-6 / §8.3 で検出する。

## 9.5 完了判定

Q-1〜Q-3 は PASS。Q-7（既存 consumer spec 無改修）も PASS（対象 spec 2 本の差分なし）。
