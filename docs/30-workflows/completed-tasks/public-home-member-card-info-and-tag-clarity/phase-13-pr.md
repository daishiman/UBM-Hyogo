# Phase 13: commit / PR / release

- Phase 目的: 実装プロンプト完了後の commit / PR / staging deploy の手順を定義する。本仕様書プロンプトでは**実行しない**。
- 入力: Phase 1-12、実装差分（実装プロンプトで生成）。
- 出力: 本ファイル（手順）、実行時に `outputs/phase-13/pr-creation-result.md`（Gate-C 証跡）。

## 絶対原則

- **commit / push / PR / staging deploy はすべて user 明示承認後のみ実行**（Gate-C / artifacts.json gates）。
- 本仕様書プロンプトはこれらを実行しない（仕様の記述のみ）。
- PR base ブランチ = **`dev`**（CLAUDE.md PR 作成フローの既定）。`main` への PR は production リリース時のみ。

## 実行順序（実装プロンプト完了後・user 承認後）

1. 作業ブランチを確認（未作成なら `feat/public-home-member-card-info-and-tag-clarity` を自律作成）。
2. `git fetch origin dev` → ローカル `dev` を fast-forward 同期 → 作業ブランチに `dev` をマージ（コンフリクトは CLAUDE.md 既定方針で解消）。
3. 品質検証 4 コマンド: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git status --porcelain` 空・`git diff dev...HEAD --name-only` で PR 対象確認。
5. `outputs/phase-12/implementation-guide.md` と `outputs/phase-11/` の screenshot を PR 本文へ反映し、`gh pr create --base dev`。

## DoD（Gate-C）

- AC-1..AC-9 が実装され focused vitest / `verify:tokens` が green。
- staging deploy 後に Phase 11 の 5 screenshot を撮影し PR 本文へ反映。
- `outputs/phase-13/pr-creation-result.md` に PR URL・採用ブランチ・解消コンフリクトを記録。

## Canonical Compliance Addendum

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`

## 目的

本 Phase の上部本文を正本とし、AC-1..AC-9 を実コード・テスト・証跡へ接続する。

## 実行タスク

- [x] Phase 本文の該当タスクを完了
- [x] 実装対象・検証対象を AC trace に接続
- [x] Phase 12 / artifacts の状態語彙と整合

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物/実行手順

本ファイル本文の手順と `artifacts.json.metadata.verify_commands` を正本とする。実装済み成果物は `apps/web` / `apps/api` / `packages/shared` と Phase 11 / 12 outputs に反映済み。

## 完了条件

- [x] AC trace が維持されている
- [x] focused tests が PASS している
- [x] Phase 11 local visual evidence が存在する
- [x] Phase 12 strict 7 が存在する

## 統合テスト連携

focused Vitest 6 files / 50 tests PASS を主証跡とし、typecheck / lint / verify:tokens / verify:phase12-compliance / gate-metadata を全体 gate とする。

