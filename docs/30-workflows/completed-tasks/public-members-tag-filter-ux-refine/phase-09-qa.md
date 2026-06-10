# Phase 9: 品質保証

| 項目 | 値 |
|------|-----|
| Phase | Phase 9 — 品質保証 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local` |
| taskType | `implementation`（UI 表現層改善・CSS 主体） |
| visualEvidence | `VISUAL`（視覚 AC は Phase 11 screenshot で確定） |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-02-design.md`](./phase-02-design.md) / [`phase-03-design-review.md`](./phase-03-design-review.md) |

> 本 Phase の全記述は `_shared-context.md` を正本とし、矛盾してはならない。本サイクルは `implemented_local_runtime_pending`（ローカル実装済み）であり、以下コマンドは本サイクルで実行する手順を定義する。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 9 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 完了条件

- [x] 必須見出しを満たす
- [x] 4条件（矛盾なし・漏れなし・整合性あり・依存関係整合）に反しない

## 統合テスト連携

- focused Vitest / typecheck / lint / token gate の結果を Phase 11 evidence と Phase 12 compliance に同期する。
<!-- validator-facing required sections: end -->

## 1. 実行コマンド一括（本サイクルで実行）

vitest の root は repo ルートのため `--root=../..` + `apps/web/...` フルパス指定が必要（MEMORY 既知の罠）。

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --no-coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx \
  "apps/web/app/(public)/members/page.spec.tsx"
mise exec -- pnpm verify:tokens          # AC-6: HEX/任意色 literal drift 0 件（root script = scripts/verify-design-tokens.ts）
bash scripts/verify-pr-ready.sh          # docs-only/phase12/gate-metadata/indexes drift pre-flight
```

> `verify:tokens`（`package.json` 実体）は `scripts/verify-design-tokens.ts` を実行し、`colorLiteralRoots = ['apps/web/app','apps/web/src']`（CSS + tsx）を HEX/literal 色で走査する。`legacy-public.css` / `globals.css` への追加色は **すべて `var(--ubm-...)` トークン参照** とすること（HEX を 1 つも書かない）。

## 2. 全 AC 最終検証手順（AC-1〜AC-11）

| AC | 検証方法 | 期待 | 検証層 |
|----|---------|------|--------|
| AC-1 横並び | Phase 7 COV-1（`tag-picker-options` 配下 `<li>` 列構造）+ Phase 11 screenshot | 縦積み解消・flex-wrap で横並び、折り返し行間適切 | vitest（構造）+ screenshot（視覚） |
| AC-2 グルーピング | Phase 7 COV-6（`filter-group` 存在・入れ子）+ Phase 11 screenshot | フィルタ入力群とタグ群が余白・border-top で視覚分離 | vitest（構造）+ screenshot（視覚） |
| AC-3 選択強調 | Phase 7 COV-2（`aria-checked` トグル値）+ §1 `verify:tokens` + Phase 11 | 選択中 chip が accent 塗りで判別可能 | vitest（値）+ screenshot（視覚） |
| AC-4 grid 過密緩和 | Phase 11 screenshot（comfy/dense/list） | comfy gap 24px・3 密度維持・過密緩和 | screenshot |
| AC-5 tag-pill 挙動不変 | Phase 7 COV-2..5 既存 spec 緑（回帰） | switch/checked/上限 hint/empty option 不変 | vitest |
| **AC-6 OKLch トークン** | **§3 gate（`verify:tokens`）** | **HEX/`bg-[#]`/`text-[#]` 0 件で pass** | gate |
| **AC-7 新規 primitive 0** | **§4 grep** | **`apps/web/src/components/ui/` 新規ファイル 0** | grep |
| **AC-8 API 等差分 0** | **§5 `git diff --name-only`** | **`apps/api`/`packages/shared`/D1 migration/Google Form 差分 0** | git |
| AC-9 レスポンシブ | Phase 11 screenshot（mobile/desktop） | wrap 破綻なし | screenshot |
| AC-10 a11y | §6 a11y チェック | role/aria/フォーカス順序不変・コントラスト AA | grep + 手動 |
| AC-11 一括 green | §1 typecheck/lint/vitest/verify-pr-ready | all green | コマンド |

## 3. AC-6 gate — OKLch トークン（`verify-design-tokens`）

```bash
mise exec -- pnpm verify:tokens
```

- 期待: exit 0。HEX 直書き（`#xxx` / `#xxxxxx`）/ 任意色 literal が `apps/web/app` / `apps/web/src`（CSS・tsx 含む）に **0 件**。
- 本タスクで追加した色（選択強調 `--ubm-color-accent` / `--ubm-color-surface-panel`、区切り `--ubm-color-border-default`、gap `--ubm-space-2` / `--ubm-space-3` / `--ubm-space-6`）が **すべてトークン参照** であること。
- 追加検証 grep（gate を補強）:

```bash
git diff --unified=0 -- apps/web/src/styles/legacy-public.css apps/web/src/styles/globals.css \
  | grep -E '^\+' | grep -E '#[0-9A-Fa-f]{3,8}\b' && echo 'NG: HEX 検出' || echo 'OK: 追加 diff に HEX なし'
git diff -- apps/web/src/components/public/ \
  | grep -E '^\+' | grep -E 'bg-\[#|text-\[#|border-\[#' && echo 'NG: 任意色クラス検出' || echo 'OK: bg-[#]/text-[#] なし'
```

## 4. AC-7 grep — 新規 primitive 0

```bash
git status --porcelain apps/web/src/components/ui/ \
  | grep -E '^\?\?|^A ' && echo 'NG: ui/ に新規ファイル' || echo 'OK: components/ui 新規ファイル 0'
git diff --name-only dev...HEAD -- apps/web/src/components/ui/ \
  | grep . && echo 'NG: ui/ に差分あり' || echo 'OK: components/ui 差分 0'
```

- 期待: `apps/web/src/components/ui/` に新規ファイル・差分が 0（INV-6）。横並び・グルーピング・選択強調・余白調整はすべて既存 CSS + 既存 data-* + ラッパ 1 個で実現。

## 5. AC-8 grep — apps/api / packages/shared / D1 / Google Form 差分 0

```bash
git diff --name-only dev...HEAD | grep -E '^apps/api/' && echo 'NG: apps/api 差分' || echo 'OK: apps/api 差分 0'
git diff --name-only dev...HEAD | grep -E '^packages/shared/' && echo 'NG: packages/shared 差分' || echo 'OK: packages/shared 差分 0'
git diff --name-only dev...HEAD | grep -E 'migrations/.*\.sql$' && echo 'NG: D1 migration 差分' || echo 'OK: D1 migration 差分 0'
git diff --name-only dev...HEAD | grep -iE 'google-form|forms?-schema' && echo 'NG: Google Form 差分' || echo 'OK: Google Form 差分 0'
```

- 期待: 変更が `apps/web/src/styles/` + `apps/web/src/components/public/` + テスト spec に限定される（INV-4）。`topTags` データ shape 不変。

## 6. AC-10 a11y チェック観点

| 観点 | 検証手段 | 期待 |
|------|---------|------|
| role/aria 不変 | grep + COV-2..4（vitest） | `tag-pill` の `role="switch"` / `aria-checked` / `aria-disabled` / `tag-limit-hint`（`aria-live="polite"`）が不変（INV-7） |
| フォーカス順序 | 手動キーボード操作（Phase 11 と併せて）| `filter-group` ラッパ追加で DOM 順序が変わらず、Tab 順序が維持される（ラッパは視覚グルーピングのみ・子要素の順序不変） |
| コントラスト AA | accent トークン値確認 | 選択中 chip = `--ubm-color-accent`（`oklch(0.52 0.10 55)`）背景 × `--ubm-color-surface-panel`（白系面）文字で AA を満たす（Phase 2 §3.3） |
| 縮約 `<li>` の意味 | grep | `<li>` を `display:inline-flex` に縮約しても list 構造（`<ul>/<li>`）は DOM 上保持され、スクリーンリーダーの list セマンティクスが維持される |

```bash
# role/aria 不変の grep（TagPicker.client.tsx 内で属性が削除されていないこと）
grep -nE 'role="switch"|aria-checked|aria-disabled|aria-live' apps/web/src/components/public/TagPicker.client.tsx
```

## 7. grep gate サマリ（INV 対応）

| INV | gate | コマンド要旨 |
|-----|------|------------|
| INV-1 / INV-4 | apps/api 差分 0 | §5 `git diff --name-only ... apps/api` |
| INV-2 | HEX/任意色 0 | §3 `verify:tokens` + diff grep |
| INV-3 | D1 binding 不使用 | `grep -rn 'env\.DB\|\.prepare(' apps/web/src/components/public/` → 0 件 |
| INV-5 | `.spec` のみ（`.test.*` 新規ゼロ） | `git diff --name-only dev...HEAD \| grep -E '\.test\.(ts\|tsx)$'` → 0 件 |
| INV-6 | 新規 primitive 0 | §4 grep |
| INV-7 | tag-pill role/aria 不変 | §6 grep |

## 8. CI required check

- 本タスクで required status check の追加・変更は **なし**。既存 CI gate（`verify-design-tokens` / `ci` / `Validate Build` / coverage-gate 等）のみで pass する。
- `bash scripts/verify-pr-ready.sh`（§1）で docs-only gate / `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を pre-flight 検証する。

## 9. 完了条件

- [x] 実行コマンド一括（vitest root 罠込み・verify:tokens・verify-pr-ready）を明示
- [x] AC-1〜11 の最終検証手順を表で網羅
- [x] AC-6（verify-design-tokens pass・HEX 0）を具体コマンドで明示
- [x] AC-7（新規 primitive 0 grep）を具体コマンドで明示
- [x] AC-8（apps/api/shared/D1/Form 差分 0 `git diff --name-only`）を具体コマンドで明示
- [x] AC-10 a11y チェック観点（role/aria/フォーカス順序/コントラスト AA/list セマンティクス）を明示
- [x] INV 対応 grep gate サマリ・CI required check（追加なし）を明示
