# Phase 13: PR作成

Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 0. 実行境界（最重要）

| 項目 | 状態 |
| --- | --- |
| commit / push / PR 作成 | **user の明示承認後のみ実行**（CONST_002 / skill 必須ルール）。本ワークフローは `implemented_local_runtime_pending` であり、実装差分はローカルに存在するが、本 Phase の commit / push / PR は **未実行**。 |
| GitHub Issue #1006 | **CLOSED のまま**（reopen しない）。 |
| PR base ブランチ | `dev`（CLAUDE.md PR フロー。`feature/* --PR--> dev`）。 |

## 1. 想定 PR 作成手順（user 承認後に使用）

1. 作業ブランチ（例: `fix/members-selected-filters-chip-ux`）を確認。`dev` 直上なら差分主題から自律作成。
2. `git fetch origin dev` → ローカル `dev` を fast-forward 同期 → 作業ブランチへマージ（コンフリクトは CLAUDE.md 既定方針で解消）。
3. 品質検証 4 コマンド: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。加えて本タスク固有の検証（focused vitest / `verify-design-tokens`）を実行。
4. `git status --porcelain` 空・`git diff dev...HEAD --name-only` 取得 → PR 本文に漏れなし反映。
5. `gh pr create --base dev` で作成。

## 2. 想定 PR タイトル

```
fix(members): SelectedFiltersBar の chip UX 堅牢化（表示名 chip / 削除後 focus 遷移 / mobile 縦積み）
```

## 3. 想定 PR 本文骨子

- **概要**: `/members` の `SelectedFiltersBar` を 3 点で堅牢化。① tag chip を `topTags` 由来の表示名（`#${label}`）で描画（未登録 code は `#${code}` fallback）② chip 個別削除後の focus を「次 chip → 前 chip → 検索入力」へ決定論的に遷移 ③ mobile(<=640px) で chip / クリアを縦積み。
- **変更ファイル**: `SelectedFiltersBar.client.tsx` / `MemberFilters.client.tsx` / `legacy-public.css` ＋ 対応 2 spec。
- **受入条件**: AC-1〜AC-7（表示名 / code fallback / focus 遷移 / mobile 縦積み / sort 非 chip 化維持 / API・D1・Form 変更ゼロ / HEX 直書きゼロ）。
- **検証**: typecheck / focused vitest 2 spec / lint / `verify-design-tokens` green。
- **スクリーンショット**: `outputs/phase-11/screenshots/` の canonical 3 枚（`selected-filters-bar-desktop-labels.png` / `selected-filters-bar-mobile-stacked.png` / `selected-filters-bar-focus-after-remove.png`）を参照。現ローカルでは component-harness screenshot 取得済み。data-backed screenshot は staging または auth 設定済みローカルで user-gated verification として取得する。
- **Issue 参照**: `Refs #1006（closed; spec を最新コードに最適化して実装）`。reopen はしない。

## 4. 残課題

- 実 screenshot は staging または auth 設定済みローカルで取得し、本 Phase の PR 本文へ反映する。
- commit / push / PR は user 承認後に実行（本 wave 未実行）。
