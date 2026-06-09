# Phase 13: PR 作成

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> workflow_state: `implemented_local_runtime_pending`（PR は後続の user-gated 操作）
> issue: #1126（CLOSED 維持・reopen しない）

---

## 1. PR 作成方針

| 項目 | 値 |
|------|-----|
| base ブランチ | `dev`（既定の開発統合ブランチ） |
| head ブランチ | `docs/issue-1126-bulk-tag-picker-viewport-baseline-expansion-spec`（後続の実装フェーズで実コード差分を載せる場合は同ブランチ or `feat/` 派生） |
| issue 参照 | `Refs #1126` のみ。**Closes / Fixes は使わない**（#1126 は既に CLOSED） |
| issue 状態 | CLOSED 維持。reopen / close / comment いずれも user-gated で行わない（明示承認時のみ） |

- 本タスクは実装仕様書（implemented_local_runtime_pending）。本フェーズで PR を作成するのは、staging visual captureフェーズ（user-gated）で実コード差分・新規 baseline 6 枚が確定した後。
- PR は CLAUDE.md「PR作成の完全自律フロー」に従い base=`dev`、`git fetch origin dev` → ローカル `dev` ff 同期 → 作業ブランチへ merge → 品質検証 4 コマンド → `gh pr create --base dev` の順で行う（ただし全工程 user-gated）。

## 2. PR 本文構成

| セクション | 内容 |
|------------|------|
| 概要 | bulk tag picker authenticated staging visual baseline を desktop 単一から mobile/tablet/wide の 3 viewport へ additive 拡張（新規 6 baseline）。`Refs #1126` |
| 背景 | 現行は desktop(1280×800) のみ baseline。スマホ/タブレット/ワイドでの picker レイアウト崩れを視覚回帰で検出できないギャップを埋める |
| 変更ファイル | `apps/web/playwright/fixtures/viewports.ts`（`wide` additive）/ `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`（viewport ループ追加・desktop 温存） |
| 設計 | B案（`page.setViewportSize()` per-test 切替 + snapshot 名 viewport suffix）。A案（project 複製）不採用の理由（config 肥大）を Phase 3 参照で記載 |
| baseline | 新規 6 枚（`bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png`）。既存 desktop 無 suffix 2 枚は温存 |
| 検証 | typecheck / lint PASS、focused vitest（BulkActionBar.spec.tsx）、staging visual capture（`--update-snapshots`）の結果を記載 |
| read-only / CI | タグ apply なし・`bulk-tag-result` count 0・共有 staging D1 副作用ゼロ・CI 無改修（glob 自動参加）を明記 |
| スクリーンショット | `outputs/phase-11/` に取得 PNG がある場合のみ参照を載せる。implemented_local_runtime_pending 段階で実 PNG 未取得のため、capture 完了後に追記。画像が無い場合はスクリーンショット専用セクションを作らない |

## 3. user-gated 境界

以下は全てユーザーの明示承認後にのみ実行する（implemented_local_runtime_pending の本仕様書では実施しない）:

- staging admin storageState の minting
- authenticated staging visual capture / `--update-snapshots`（新規 6 baseline 確定）
- `git commit` / `git push`
- `gh pr create --base dev`（`Refs #1126`）
- GitHub Issue #1126 の状態変更（reopen / close / comment）

## 4. 現状

- workflow_state = `implemented_local_runtime_pending`。Phase 1-13 仕様書と Phase 12 strict 7 outputs を作成済み。
- staging visual capture・PR は後続の user-gated フェーズ。
- Gate-A=passed（spec_review）/ Gate-B=passed（local implementation・runtime visual pending）/ Gate-C=pending（external_ops / PR）。Gate-B の status enum は schema 制約により `passed`。
