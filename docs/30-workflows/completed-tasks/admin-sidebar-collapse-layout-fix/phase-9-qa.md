# Phase 9: 品質保証（QA）

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- 前提: Phase 1〜8 完了（要件・設計・テスト計画・実装手順・テスト拡充・カバレッジ・リファクタ）
- workflow_state: `implemented_local_evidence_captured`（検証コマンド実行済み。staging visual は user-gated）
- 本 Phase の責務: AC-1..AC-9 の検証手順（検証コマンド・期待結果）を 1 つずつ一覧化し、local 実行で通過した全ゲートを定義する

## QA 概要

本 Phase は local 実行済み検証手順を記録する。focused vitest / typecheck / lint / verify:tokens / apps-api diff / local screenshot は完了済みで、staging visual baseline のみ user-gated とする。
本タスクは `apps/web/src/components/shell/` のみを変更する（AC-8 で `apps/api` 無変更を gate）。検証は以下 5 区分で行う:

1. 型チェック・リント（静的解析）
2. デザイントークン gate（HEX / `bg-[#xxx]` / `text-[#xxx]` 新規追加ゼロ確認）
3. Focused vitest（collapsed/expanded レイアウト contract）
4. API 非変更確認（`git diff --name-only -- apps/api` 空）
5. AC-1..AC-9 の DOM / 静的確認（Phase 11 staging 視覚は user-gated 別途）

## AC-1..AC-9 検証手順テーブル

| AC | 条件要旨 | 検証コマンド / 手段 | 期待結果 |
| --- | --- | --- | --- |
| AC-1 | collapsed 時、brand / nav-item / user-menu / admin-return の水平パディングが除去（`px-0`）され、各行が `w-full justify-center` で中央寄せ | `SidebarNavItem.spec.tsx` / `SidebarUserMenu.spec.tsx` / `SidebarShell.spec.tsx` / `SidebarShell.spec.tsx`（AdminPublicReturn）で collapsed=true 時に `px-0` / `w-full` / `justify-center` class を assert | 4 spec PASS。collapsed render に `px-0 w-full justify-center` を含む |
| AC-2 | collapsed 時、icon(18px) / brand mark(32px) / avatar(36px) が collapsed 幅(64px) 内に収まりはみ出さない | icon/avatar/mark wrapper が collapsed 時 `h-10 w-10`（40px 角）中央化 class を持つことを spec で assert。**実際のはみ出し有無は Phase 11 staging 視覚（staging_pending_user_gate）** | spec PASS（40px 枠 class 存在）。実 pixel は Phase 11 |
| AC-3 | collapsed 時、全行のアイコン/アバターの水平中心が aside 縦中心線に一致し collapse-toggle と軸が揃う | 4 行すべてが共通 40px 角枠中央化 class を持つことを spec で assert。**軸一致の見え方は Phase 11 視覚（staging_pending_user_gate）** | spec PASS（共通枠 class）。視覚は Phase 11 |
| AC-4 | collapsed 時もアクティブ nav-item の左ボーダー（`border-l-2` active 表現）が維持 | `SidebarNavItem.spec.tsx` で collapsed=true かつ active=true 時に `border-l-2` / `data-[active=true]:border-[var(--ubm-color-accent)]` 系 class が破綻せず残ることを assert | spec PASS（active border class が collapsed でも残存） |
| AC-5 | expanded 時にレイアウト regression がない（既存 spec 維持） | 既存 shell spec を **無修正で再実行**し全 green。`mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__` | 既存 expanded assertion が全 PASS（regression なし） |
| AC-6 | collapsed 時 sr-only 化される displayName/role、expanded 時の表示テキストなどアカウント情報の意味的可視性が保たれる | `SidebarUserMenu.spec.tsx` で collapsed=true 時に displayName/role が sr-only（DOM 上は存在）、collapsed=false 時に可視テキスト描画を assert。`SidebarShell.spec.tsx` で brand text の sr-only / 可視分岐を assert | spec PASS（sr-only / 可視の両分岐） |
| AC-7 | 色は `var(--ubm-color-*)` 経由のみ。`apps/web/src` に HEX / `bg-[#xxx]` / `text-[#xxx]` 新規追加なし。`pnpm verify:tokens` green | 下記 §デザイントークン gate（grep + verify:tokens） | grep ヒット 0 件 / `verify:tokens` green |
| AC-8 | `apps/api` / D1 migration / Google Form schema / endpoint surface / fetch URL 無変更 | `git diff --name-only -- apps/api` が空。D1 migration / fetch URL 非変更確認 | 出力なし（空） |
| AC-9 | `pnpm typecheck && pnpm lint && focused vitest` green。shell spec が collapsed レイアウト contract を検証 | 下記 §静的解析 + §focused vitest | typecheck/lint exit 0、focused vitest 全 PASS |

## 実行タスク（local 実行済み）

### タスク 1: 静的解析（typecheck / lint）— AC-9

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

**期待結果**: どちらも exit 0（エラー 0 件）。

### タスク 2: focused vitest 実行 — AC-1/2/3/4/5/6/9

vitest config の root は repo ルートのため、対象パスを指定し `--root=.` を付ける（省略で No test files になる罠。`_shared-context.md` §8）:

```bash
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
```

**期待結果**: 以下の spec が全て PASS する。

| spec ファイル | 検証内容（AC） | 期待 |
| --- | --- | --- |
| `SidebarNavItem.spec.tsx`（更新） | collapsed=true 時 `px-0 w-full justify-center` + 40px 枠（AC-1/2/3）、collapsed+active で `border-l-2` 維持（AC-4） | PASS |
| `SidebarUserMenu.spec.tsx`（更新） | collapsed=true 時 `px-0 w-full justify-center` + avatar 40px 枠中央（AC-1/2/3）、displayName/role の sr-only/可視分岐（AC-6） | PASS |
| `SidebarShell.spec.tsx`（更新・brand collapsed contract を含む） | collapsed 分岐新設の両側（`px-0 justify-center` / `gap-2 px-3`）+ mark 40px 枠 + brand text sr-only/可視（AC-1/2/3/6） | PASS |
| `SidebarShell.spec.tsx`（更新） | AdminPublicReturn collapsed=true 時 `px-0 w-full justify-center`（AC-1/3）、expanded 既存 contract 回帰なし（AC-5） | PASS |

### タスク 3: デザイントークン gate（HEX / arbitrary color 新規追加ゼロ）— AC-7

```bash
# (1) 変更した shell コンポーネント配下に新規 HEX 直書きがないこと
grep -rnE '#[0-9a-fA-F]{3,8}' \
  apps/web/src/components/shell/SidebarNavItem.tsx \
  apps/web/src/components/shell/SidebarUserMenu.tsx \
  apps/web/src/components/shell/SidebarBrand.tsx \
  apps/web/src/components/shell/SidebarShell.tsx \
  | grep -v '^\s*//' \
  && echo "[FAIL: raw hex found]" || echo "[PASS: no raw hex]"

# (2) bg-[#…] / text-[#…] / border-[#…] 形式の arbitrary color がないこと
grep -rnE '(bg|text|border|fill|stroke)-\[#' \
  apps/web/src/components/shell/SidebarNavItem.tsx \
  apps/web/src/components/shell/SidebarUserMenu.tsx \
  apps/web/src/components/shell/SidebarBrand.tsx \
  apps/web/src/components/shell/SidebarShell.tsx \
  && echo "[FAIL: arbitrary color found]" || echo "[PASS: no arbitrary colors]"

# (3) verify:tokens（forbidden-color-literal scan）
mise exec -- pnpm verify:tokens
```

**期待結果**: (1)(2) は出力なし（PASS）、(3) は green。本タスクの変更は `px-*` / `py-*` / `gap-*` / `w-*` / `h-*` / `justify-*` の spacing/layout utility 中心で、色トークンは既存のまま追加なし。

### タスク 4: API 非変更確認 — AC-8

```bash
# apps/api への git diff が空であること
git diff --name-only -- apps/api | grep . \
  && echo "[FAIL: apps/api was modified]" || echo "[PASS: apps/api untouched]"

# D1 migration / fetch URL が変更されていないこと
git diff --name-only -- apps/web/migrations/ apps/api/migrations/ | grep . \
  && echo "[FAIL: migration modified]" || echo "[PASS: migrations untouched]"
```

**期待結果**: どちらも PASS（出力なし）。

### タスク 5: 変更ファイル確認

```bash
# 変更が shell コンポーネント + その spec に閉じていること
git diff --name-only HEAD | grep -E \
  "components/shell/(SidebarNavItem|SidebarUserMenu|SidebarBrand|SidebarShell)\.tsx|\
components/shell/__tests__/(SidebarNavItem|SidebarUserMenu|SidebarBrand|SidebarShell)\.spec\.tsx"
```

**期待結果**: 変更が上記 shell コンポーネント 4 ファイル + spec 群に閉じる（`SidebarNav.tsx` は §D-5 のとおり原則無変更）。

## ファイル削除・expanded regression の扱い

- **ファイル削除は本タスクに存在しない**（編集のみ・新規は `SidebarShell.spec.tsx` 1 件）。よって削除確認は **N/A**。
- **expanded regression（AC-5）は既存 shell spec が green であることで担保する**。expanded 側の className（`gap-3` / `gap-2` / `px-3`）は逐語保持（Phase 8 タスク 2）であり、既存 expanded assertion を無修正で再実行して全 PASS することが regression なしの証跡となる。

## 実走結果の扱い

検証コマンドは local 実行済みで、結果は `outputs/phase-11/manual-test-result.md` と Phase 12 compliance に転記済み。staging visual baseline のみ Phase 13 user-gated とする。

## 検証コマンドまとめ

```bash
# 1. 静的解析（AC-9）
mise exec -- pnpm typecheck && mise exec -- pnpm lint

# 2. focused vitest（AC-1/2/3/4/5/6/9）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__

# 3. デザイントークン gate（AC-7）
mise exec -- pnpm verify:tokens

# 4. API 非変更（AC-8）
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"

# 5. phase12 / gate-metadata（_shared-context.md §8）
pnpm verify:phase12-compliance
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| AC 正本 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-1-requirements.md` | AC-1..AC-9 定義 |
| 設計正本 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-2-design.md` | className 分岐設計 |
| 設計レビュー | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-3-design-review.md` | 不変条件適合・grep gate 根拠 |
| 共有設計 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/_shared-context.md` | §6 AC 正本・§8 検証コマンド |
| デザイントークン | `apps/web/src/styles/tokens.css` | `--ubm-color-*` / `--shell-bar-w-collapsed` token 名確認 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | shell ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 9 仕様書 | 文書 | AC-1..AC-9 検証手順テーブル・検証コマンド・gate 定義（実装時に実行） |
| 各 spec PASS 証跡 | runtime（取得済み） | Phase 11 手動テスト記録に転記 |

## 統合テスト連携

- focused vitest PASS が Phase 10 最終レビューの「AC-9 green」判定根拠となる。
- タスク 3・4 の gate PASS が Phase 10 の AC-7・AC-8 判定根拠となる。
- AC-2/AC-3 の「実際のはみ出し有無・軸一致の見え方」は jsdom で検証不能なため、Phase 11 staging で user-gated（staging_pending_user_gate）として確認する境界を残す。

## 完了条件

1. AC-1..AC-9 が 1 つずつ検証手順テーブル（検証コマンド・期待結果）で定義されている。
2. typecheck / lint / verify:tokens / focused vitest / `git diff --name-only -- apps/api` 空（AC-8）の全コマンドが一覧化されている。
3. HEX / `bg-[#xxx]` / `text-[#xxx]` の新規追加ゼロを grep で確認する方針（AC-7）が定義されている。
4. ファイル削除は N/A、expanded regression（AC-5）は既存 spec green で担保することが明記されている。
5. local 検証は実行済みで、staging visual baseline のみ user-gated として分離されている。
