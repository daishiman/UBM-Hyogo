# Phase 13: PR 作成（user-gated）

`[実装区分: 実装仕様書]`

> **commit / push / PR はユーザーの明示承認後のみ実行する（CONST_002）。本仕様書作成フェーズでは実行しない。**

## 13.1 前提

- Issue #1007 は **CLOSED のまま**。本 PR で再 open しない（ユーザー指示）。PR 本文では「#1007 で切り出された follow-up hardening を実装」と参照のみ。

## 13.2 PR 作成手順（承認後）

1. base = `dev`（CLAUDE.md 既定）。
2. `git fetch origin dev` → ローカル `dev` を FF 同期 → 作業ブランチへ merge。
3. 品質検証: `pnpm install` / `pnpm typecheck` / `pnpm lint` / `verify-design-tokens` / focused vitest。
4. `gh pr create --base dev`。本文に Phase 12 `implementation-guide.md` 要点 + Phase 11 screenshot 参照。

## 13.3 PR 本文骨子

- 変更点: DensityToggle の id useId 化 / HelpHint Escape+click-outside / help icon 整合。
- テスト: DensityToggle.client.spec（15 tests passed）。
- screenshot: `density-toggle-help-closed/open/segmented.png`。
- 参照: closes しない（#1007 は CLOSED 維持）。`Refs #1007`。

## 完了条件
- ユーザー承認 → PR URL を最終レポート。
