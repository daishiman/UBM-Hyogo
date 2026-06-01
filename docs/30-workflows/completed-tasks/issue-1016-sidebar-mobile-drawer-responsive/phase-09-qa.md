# Phase 9 — 品質保証（QA）

## 0. 前提

本サイクルは **implemented_local_runtime_pending**。focused Vitest / typecheck / lint / design-token gate / local screenshot は実行済みで green。staging runtime visual は未実行のため pending として分離する。

## 1. 一括判定方針（4 ゲート）

実装後、`apps/web` ワークスペースで以下を順に実行し、**全て成功（green）で初めて Gate-B 合格**とする。1 つでも fail があれば修正してから再実行する。

| # | コマンド | 合格基準 |
|---|---------|---------|
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS（1 file / 9 tests） |
| 4 | targeted vitest（下記 4 ファイル） | PASS（4 files / 21 tests） |

### targeted vitest 対象（4 ファイル）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx \
  apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
```

（`useSidebarState.spec.tsx` は既存 spec への mock 追加 + route-close / md 初期 collapsed ケース追加。新規 3 + 拡張 1 = 計 4 spec ファイル）

## 2. 削除確認（FB-UI-02-1 基準）

判定基準: 「git delete された OR stub 化され live import がゼロ」。

| 確認 | 結果（spec 段階の見込み） |
|------|--------------------------|
| 本タスクで削除されるファイル | **なし**（新規 2 + 編集 2 + spec 4 のみ。既存削除なし） |
| stub 化されるコンポーネント | なし |
| live import がゼロになる旧コンポーネント | なし（`mobileTriggerSlot` prop は後方互換で維持） |

→ 削除確認は「削除対象なし」で完結。dead code / orphan import を残さない。

## 3. HEX 直書きゼロの証跡化手順（INV-2）

実装後、以下で shell 配下に HEX / 任意値カラーが無いことを証跡化する。**いずれも出力 0 行が合格**。

```bash
# HEX 直書き（bg-[#...] / text-[#...] / border-[#...]）
grep -rn 'bg-\[#' apps/web/src/components/shell
grep -rn 'text-\[#' apps/web/src/components/shell
grep -rn 'border-\[#' apps/web/src/components/shell
# 生 HEX リテラル（#rrggbb / #rgb）
grep -rnE '#[0-9a-fA-F]{3,8}\b' apps/web/src/components/shell
```

- 期待: 全コマンド 0 行。色指定は `bg-[var(--shell-bar-bg)]` / `text-[var(--ubm-color-text-primary)]` / `bg-[var(--ubm-color-overlay-scrim)]` 等のトークン参照のみ。
- M-2: `--ubm-color-overlay-scrim` が `tokens.css` に未定義の場合は Phase 5 で既存 scrim トークンへ差し替える。新規 HEX は導入しない。

## 4. INV-3 検証（直接 `window` / `document` / `localStorage` 参照の境界確認）

shell 配下で直接ブラウザ global を参照していないか、または `is-browser` / `getBrowserStorage` 経由かを確認する。

```bash
# 直接参照箇所の洗い出し
grep -rn 'window\.'      apps/web/src/components/shell
grep -rn 'document\.'    apps/web/src/components/shell
grep -rn 'localStorage'  apps/web/src/components/shell
# eslint-disable の限定確認（あれば 1 行 scoped のみ・block disable 禁止）
grep -rn 'eslint-disable' apps/web/src/components/shell
```

合格基準:

| パターン | 判定 |
|---------|------|
| `document` 参照 | `browserDocument()`（`@/lib/is-browser`）経由のみ。`SidebarDrawer` の body 属性 / keydown / focus は全て `browserDocument()` 起点 |
| `localStorage` 参照 | 既存 `getBrowserStorage()` 経由のみ（`useSidebarState.ts` 内 private） |
| `window.matchMedia` | `apps/web/src/lib/is-browser.ts` の `browserMatchMedia(query)` 1 箇所に集約。`useSidebarState` は getter 経由のみ |
| その他 `window.` 直接参照 | 0 件 |

## 5. 判定サマリ（実装後に埋める）

| ゲート | コマンド | 結果 | 備考 |
|-------|---------|------|------|
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | PASS | |
| lint | `pnpm --filter @ubm-hyogo/web lint` | PASS | |
| design-tokens | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS | INV-2 |
| targeted vitest | 4 spec | PASS | `outputs/phase-11/evidence/focused-vitest.log` |
| HEX grep（4 本） | §3 | PASS | 0 行 |
| INV-3 grep | §4 | PASS | `browserMatchMedia()` / `browserDocument()` / `getBrowserStorage()` 境界経由のみ |

## 完了条件

- [ ] typecheck / lint / verify-design-tokens / targeted vitest の一括判定方針を確定
- [ ] 削除確認基準（FB-UI-02-1）を適用（本タスクは削除なし）
- [ ] HEX 直書きゼロの grep 証跡手順を明示（0 行合格）
- [x] INV-3 の grep 検証手順（境界経由）を明示
- [x] focused Vitest は PASS と明記し、未実行の visual/runtime PASS は主張しない
