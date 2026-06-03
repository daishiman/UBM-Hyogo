# Phase 13 PR 作成結果 — sidebar-footer-pinning-and-account-popover-ux

> implemented_local_evidence_captured。実コードは本サイクルで実装済み。

## 実施状況

| 操作 | 状態 |
|------|------|
| commit | **blocked（user-gated・未実施）** |
| push | **blocked（user-gated・未実施）** |
| PR 作成（`gh pr create`）| **blocked（user-gated・未実施）** |
| Phase 11 screenshot 取得 | **blocked（user-gated・staging 認証必須・未実施）** |

本タスクは implemented_local_evidence_captured（実コード + focused tests + Phase 12 同期済み）。本サイクルではユーザー指示なしに commit / push / PR / screenshot を行わない。以下は user 承認後に使用する **PR 本文ドラフト**。

---

## PR ドラフト

### base / ブランチ

- base ブランチ: `dev`
- work ブランチ: `feat/sidebar-footer-pinning-and-account-popover-ux`

### タイトル案

```
fix(shell): sidebar footer 固定 + account popover 外側クリック閉じ + collapse はみ出し + main footer sticky
```

### 本文ドラフト

```markdown
## 概要

統一 sidebar shell（`apps/web/src/components/shell/`）の UI/UX 不具合 4 件を 1 サイクルで解消する。
公開ホーム `/` を admin 閲覧時の staging スクリーンショット報告（2026-06-02）が起点。
既存 API / D1 / auth / Google Form schema は不変。色・寸法は tokens 経由（HEX 直書きなし）。

## 4 concern サマリ

| # | 症状 | 修正 | AC |
|---|------|------|----|
| C1 | 下部の「公開サイトに戻る」/ user menu / collapse トグルが scroll しないと見えない | `[data-shell="sidebar"]` を `height:100dvh`（fallback 100vh）+ `overflow:hidden` 化し、aside を「スクロール nav（flex-1 overflow-y-auto）」+「固定フッター領域（shrink-0）」の 2 段 flex へ再編 | AC-1 |
| C2 | collapse 時アイコン / badge がはみ出す | aside `overflow-hidden` + 各行 `justify-center` + badge を collapsed ではドット（`nav-badge-dot`）表示 | AC-2 |
| C3 | account popover が外側クリック / Escape で閉じない | `SidebarUserMenu` に `browserDocument()` 経由 `pointerdown` / `keydown` listener を open 中のみ登録。`<details>.open` を正本に維持（additive）| AC-3 |
| C4 | main footer（プライバシー / 利用規約 / コピーライト）が短ページで浮く | `<main>` を flex-column 化 + `[data-component="public-footer"]` を `margin-top:auto` 化（sticky footer）| AC-4 |

## 変更ファイル

ソース 5 / テスト 3 / 新規ソース 0:

- `apps/web/src/styles/globals.css`（C1, C2）
- `apps/web/src/styles/legacy-public.css`（C4）
- `apps/web/src/components/shell/SidebarShell.tsx`（C1, C2, C4）
- `apps/web/src/components/shell/SidebarUserMenu.tsx`（C2, C3）
- `apps/web/src/components/shell/SidebarNavItem.tsx`（C2）
- `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`（C1, C2, C4）
- `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`（C3）
- `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（C2）

## 不変条件

- `useSidebarState()` 戻り値 shape / `SidebarShell` public props 不変（後方互換）
- popover 開閉 state owner は `<details>.open`（React state 新設なし）
- API / D1 / auth / Google Form schema 不変
- 色・寸法は `--shell-*` / `--ubm-color-*` トークン経由（HEX 直書き禁止・`verify-design-tokens` 非抵触）
- `document` アクセスは `browserDocument()` 経由のみ
- DOM 観測契約属性は削除せず additive（`data-shell-block="sidebar-footer"` / `nav-badge-dot`）
- `<details>` / `<summary>` ネイティブ挙動・キーボード操作・`aria-haspopup` 維持

## テスト結果（実装サイクルで転記）

| 検証 | 結果 |
|------|------|
| targeted vitest（SidebarShell / SidebarUserMenu / SidebarNavItem / SidebarShell.server / useSidebarState / PublicFooter / (public)/layout）| <実装済みとして転記> |
| `pnpm typecheck` | <実装済みとして転記> |
| `pnpm lint` | <実装済みとして転記> |
| `verify-design-tokens`（HEX grep 0 件）| <実装済みとして転記> |

## スクリーンショット

<実装済みとして staging（認証必須）で expanded / collapsed / popover open / 短コンテンツ footer 位置を取得し添付。user-gated。>
```

---

## 後続手順（user 承認後）

1. 実装サイクルで apps/web を編集し targeted vitest / typecheck / lint / verify-design-tokens を実走。
2. `git fetch origin dev` → ローカル dev FF 同期 → work ブランチへ merge。
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. staging で Phase 11 screenshot を取得し `outputs/phase-11/` に保存、PR 本文へ参照追加。
5. `gh pr create --base dev` で本ドラフトを本文に PR 作成。

> 1〜5 はすべて user 明示承認後に実施。本 implemented_local_evidence_captured サイクルでは未実行。
