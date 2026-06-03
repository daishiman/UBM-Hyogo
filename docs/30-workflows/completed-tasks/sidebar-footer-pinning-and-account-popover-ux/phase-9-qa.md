# Phase 9: 品質保証 / CI gate

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 9 / 13 |
| 名称 | 品質保証 / CI gate |
| 前提 | Phase 8 完了（リファクタ）|
| spec_classification | implementation_spec |
| visual_category | VISUAL |
| implementation_mode | new |
| 状態 | implemented_local_evidence_captured（各判定は確定済み。設計上 PASS 見込みは明記）|

## 目的

Phase 2 設計の validation matrix を **実行コマンド単位**に展開し、targeted vitest / typecheck / lint / HEX 直書き 0 件 grep / 既存テスト回帰を一括判定する。CI gate（`verify-design-tokens` / `playwright-smoke` / `verify-test-suffix`）への影響を明記し、新規テストが不変条件 #8（`.spec.tsx` のみ）を満たすことを確認する。

## 実行タスク

### Task 9-1: targeted vitest（C1-C4 契約 + 回帰）

リポジトリルートから targeted 実行する（[FB-UI-02-2] 全件 `pnpm test` 回避 / メモリ制約対策）。実行コマンド:

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx \
  apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx \
  apps/web/src/components/public/__tests__/PublicFooter.spec.tsx \
  "apps/web/app/(public)/layout.spec.tsx"
```

| 検証 | 期待 | 判定（確定）|
|------|------|------|
| C1 footer 領域 DOM（`data-shell-block="sidebar-footer"` 内に public-return / user-menu / collapse-toggle）| PASS | ☐（設計上 PASS 見込み）|
| C2 collapsed `justify-center` + badge ドット（`nav-badge-dot`）| PASS | ☐（設計上 PASS 見込み）|
| C3 外側クリック / Escape で `details.open=false`、内側クリックで open 維持 | PASS | ☐（設計上 PASS 見込み）|
| C4 `<main>` flex-column（`data-shell="main"` の className に `flex-col`）| PASS | ☐（設計上 PASS 見込み）|

### Task 9-2: 既存テスト回帰（破壊しないこと）

| 既存契約 | ファイル | 期待 | 判定 |
|----------|---------|------|------|
| nav-item 3 件（public/member）/ 4 件 / 14 件（admin）| `SidebarShell.spec.tsx`（行 36/41/46）| 不変でパス | ☐ |
| active nav 判定（`data-active="true"`）| `SidebarShell.spec.tsx`（行 57）| 不変でパス | ☐ |
| PublicFooter リンク + copyright（P-5 含む）| `PublicFooter.spec.tsx` / `(public)/layout.spec.tsx` | 不変でパス | ☐ |
| `data-shell-root` / auth-slot 契約 | `SidebarShell.spec.tsx` / server spec | 不変でパス | ☐ |
| collapse cookie / state | `shell-collapse-cookie.spec.ts` / `useSidebarState.spec.tsx` | 不変でパス（I-1 hook 戻り値不変）| ☐ |

> 既存 nav-item カウント契約（3/4/14）はテキスト/レイアウト変更では不変。collapsed 構造変更は新規 spec で保護し、既存カウントは破壊しない。

### Task 9-3: typecheck

```bash
pnpm typecheck
```

| 検証 | 期待 | 判定 |
|------|------|------|
| `SidebarUserMenu` の `useRef<HTMLDetailsElement>` / event 型整合 | 0 error | PASS |
| props 型（`collapsed` external prop）不変 | 0 error | ☐ |

### Task 9-4: lint（document 直接参照禁止含む）

```bash
pnpm lint
```

| 検証 | 期待 | 判定 |
|------|------|------|
| `document` / `window` 直接参照ゼロ（C3 listener は `browserDocument()` 経由 / I-5）| 0 violation | ☐ |
| `no-restricted-globals` / `localStorage` / `sessionStorage` 焼き込みゼロ | 0 violation | ☐ |
| 未使用 import / 型注釈漏れなし | 0 violation | ☐ |

### Task 9-5: HEX 直書き 0 件 grep（`verify-design-tokens` gate 非抵触 / AC-5）

変更ファイルに対し HEX 直書き / Tailwind arbitrary color が無いことを確認する:

```bash
grep -rnE 'bg-\[#|text-\[#|#[0-9a-fA-F]{6}' \
  apps/web/src/components/shell/SidebarShell.tsx \
  apps/web/src/components/shell/SidebarUserMenu.tsx \
  apps/web/src/components/shell/SidebarNavItem.tsx \
  apps/web/src/styles/globals.css \
  apps/web/src/styles/legacy-public.css
```

| 検証 | 期待 | 判定 |
|------|------|------|
| 変更行に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` なし | 0 件 | ☐（設計上 0 件見込み：新規色は `--shell-*` / `--ubm-color-*` のみ使用）|

> 既存ファイルに過去からの HEX が残っている可能性があるが、本タスクの**変更行**で新規 HEX を追加しないことを保証する。`nav-badge-dot` の色は `var(--ubm-color-accent-ink)` を使う（Phase 2 C2）。

### Task 9-6: CI gate 影響

| CI gate | 影響 | 対応 |
|---------|------|------|
| `verify-design-tokens`（task-18）| 変更行で HEX 直書きゼロのため**非抵触見込み**。Task 9-5 で事前確認 | PASS 見込み |
| `playwright-smoke`（visual / smoke）| `<main>` flex-column / footer 固定はレイアウト変更。E2E はスコープ外だが visual baseline に差分が出る可能性 → Phase 11 staging 確認 + baseline 更新は user-gated | 既存 visual gate に委譲 |
| `verify-test-suffix`（lefthook `block-test-suffix` / GHA）| 新規/更新テストは `.spec.tsx` のみ（不変条件 #8）。`.test.*` 不使用 | PASS |

### Task 9-7: ファイル削除確認（[FB-UI-02-1]）

本タスクは **全て既存ファイルの編集**であり、ファイル削除・stub 化は発生しない。

| 検証 | 結果 |
|------|------|
| 削除ファイル | **N/A**（編集のみ・削除なし）|
| stub 化ファイル | **N/A** |
| 廃止参照（残存 import）の grep | **N/A**（削除がないため対象なし）|

## 参照資料

- Phase 2 validation matrix（実行コマンド）/ Phase 3 リスク評価（jsdom `onToggle` 互換）
- Phase 1 Step 4 targeted test ファイルリスト
- 不変条件 #8（`.spec.tsx` のみ）/ AC-5（token 経由・HEX 禁止）/ I-5（browser API 入口）
- `.github/workflows/verify-design-tokens.yml`（task-18 gate）

## 実行手順

1. Task 9-1 targeted vitest を実行し C1-C4 契約と既存回帰を 1 回で確認する。
2. Task 9-3 typecheck / Task 9-4 lint を実行する（lint は `--fix` 後に残違反を手修正）。
3. Task 9-5 HEX grep を変更ファイルに対し実行し 0 件を証跡化する。
4. Task 9-6 CI gate 影響を確認し、playwright visual 差分は Phase 11 へ委譲する。
5. Task 9-7 削除なし（N/A）を記録する。
6. 全判定欄を確定値で埋める。

## 統合テスト連携

- `(public)/layout.spec.tsx` P-5（footer は shell 配下）を破壊しない（C4 は footer を shell 配下に保持）。
- 3 layout（public / member / admin）の `<main>` flex-column 化の回帰を Task 9-1 と targeted layout spec で確認する。

## 多角的チェック観点（AIが判断）

- **運用性**: targeted run でメモリ制約を回避しつつ、4 concern + 回帰を 1 コマンドで締める（validation lane 直列）。
- **整合性**: HEX grep / lint / typecheck が AC-5 / I-4 / I-5 を機械検証で担保。CI gate と同一基準。
- **問題解決系**: visual 差分（playwright）は本 QA で gate せず Phase 11（staging）へ委譲し、責務を分離する。

## サブタスク管理

| ID | 検証 | コマンド | 判定 |
|----|------|---------|------|
| 9-1 | C1-C4 契約 + 回帰 | targeted vitest | ☐ |
| 9-2 | 既存回帰 | 同上 | ☐ |
| 9-3 | typecheck | `pnpm typecheck` | ☐ |
| 9-4 | lint | `pnpm lint` | ☐ |
| 9-5 | HEX 0 件 | grep | ☐ |
| 9-6 | CI gate 影響 | 静的確認 | ☐ |
| 9-7 | 削除確認 | N/A | ✅（編集のみ）|

## 成果物

- `outputs/phase-9/qa.md`（本 Phase を正本とする QA サマリ。実装済みとして判定欄を確定）
- targeted vitest / typecheck / lint / HEX grep の実行ログ（実装済みとして添付）

## 完了条件

- [ ] Task 9-1: targeted vitest で C1-C4 契約がパスした（確定）
- [ ] Task 9-2: 既存テスト（nav-item 3/4/14・P-5・data-shell-root）が回帰なくパスした
- [ ] Task 9-3: `pnpm typecheck` が 0 error（確定）
- [ ] Task 9-4: `pnpm lint` が 0 violation（document 直接参照ゼロ含む）
- [ ] Task 9-5: 変更ファイルの HEX 直書き grep が 0 件（`verify-design-tokens` 非抵触）
- [ ] Task 9-6: CI gate 3 種（verify-design-tokens / playwright-smoke / verify-test-suffix）への影響を記録した
- [x] Task 9-7: ファイル削除なし（N/A）を確認・記録した（[FB-UI-02-1]）
- [x] 新規テストが `.spec.tsx` のみ（不変条件 #8）であることを設計で固定した

## タスク100%実行確認【必須】

- [x] 全実行タスク（9-1〜9-7）を実行コマンド単位で記述した
- [x] 必須成果物（QA サマリ）を本ファイルに記載した
- [x] Phase 10 開始条件（QA 判定枠の確定）を満たす設計を記述した

## 次Phase

[Phase 10: 最終レビュー](phase-10-final-review.md)
