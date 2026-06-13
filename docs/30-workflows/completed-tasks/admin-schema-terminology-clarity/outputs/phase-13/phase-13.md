# Phase 13: PR作成

`[実装区分: 実装仕様書]` / status: `pending_user_approval`

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | `TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001` |
| workflow | `admin-schema-terminology-clarity` |
| base ブランチ | `dev`（CLAUDE.md PR フロー既定） |
| branch（head） | `feat/admin-schema-terminology-clarity` |
| workflow_state | `implemented_local_evidence_captured` |
| Gate | Gate-C（external ops・user-gated） |

## 重要

**commit / push / PR はユーザーの明示承認後のみ実施する。** 本 wave では未実行（`pending_user_approval`）。
実装・focused tests は完了済み。authenticated staging screenshot 取得・commit・push・PR はユーザー承認後に行う。

## 目的

local implementation wave（Phase 5 実装 + focused tests GREEN）完了後に、`/admin/schema` と
その波及先のエンジニア用語・英語表記を平易な日本語へ統一する変更を `dev` 宛の PR として提出する。
PR 本文は `outputs/phase-12/implementation-guide.md` の Part 1 / Part 2 / 視覚証跡を反映する。

## 実行タスク

1. 前提（下記）がすべて満たされたことをユーザー承認後に確認する。
2. 作業ブランチ `feat/admin-schema-terminology-clarity` を作成（または使用）し、実装差分をコミットする。
3. `git fetch origin dev` → ローカル `dev` 同期 → 作業ブランチへ `dev` をマージしコンフリクトを解消する。
4. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` を実行する。
5. `gh pr create --base dev` で PR を作成し、本文に implementation-guide の Part 1/2/視覚証跡を反映する。

> 上記 2〜5 はすべてユーザーの明示承認後にのみ実行する。

## 前提

1. Phase 5 の apps/web 実装が完了し、focused tests が GREEN。
2. `verify:tokens` / `@ubm-hyogo/web` typecheck / lint clean / `git diff --quiet -- apps/api` exit 0。
3. §6 DoD の grep gate（`CURRENT REVISION` / `FORM SCHEMA GUIDE` / `DIFF ITEMS` / `Bulk Resolve` /
   `Bulk Rollback` / `ALIAS HISTORY` が用語集ファイル以外で 0 件）が PASS。
4. Phase 11 screenshot を authenticated staging で取得（`admin-schema-terminology-header-renamed.png` /
   `admin-schema-current-revision-hidden-id.png` / `admin-schema-diff-panel-japanese-actions.png` /
   `admin-dashboard-form-item-alert.png`）。
5. `bash scripts/verify-pr-ready.sh` 3 点 PASS。

## 参照資料

- `outputs/phase-12/implementation-guide.md`（PR 本文 Part 1/2/視覚証跡の正本）
- `outputs/phase-11/screenshot-plan.json`（取得すべき screenshot 4 枚）
- `shared-context.md` §6 DoD（grep gate・検証コマンド）
- `.claude/commands/ai/diff-to-pr.md`（Phase 13 PR 本文仕様）

## 統合テスト連携

本タスクは表現層の文言リネームに閉じ、新規の統合テストは追加しない。回帰検証は Phase 4 の focused
vitest と Phase 11 の VISUAL 証跡で担保する。`apps/api` を変更しないため API 側統合テストは無影響
（`git diff --quiet -- apps/api`）。PR 作成時の CI（typecheck / lint / verify:tokens / playwright-smoke）が
最終ゲートとなる。

## PR 計画

| 項目 | 値 |
|------|-----|
| base | `dev` |
| head | `feat/admin-schema-terminology-clarity` |
| title 案 | `feat(web): /admin/schema 等のエンジニア用語を平易な日本語へ統一し生revisionIdを非表示化` |
| 本文 | `implementation-guide.md` の Part 1 / Part 2 / 視覚証跡 + Phase 11 screenshot 参照（取得後） |

## 完了条件

- [ ] ユーザーが PR 作成を明示承認した（未承認のため pending）。
- [ ] 上記前提 1-5 を満たした。
- [ ] `gh pr create --base dev` で PR が作成され、本文に Part 1/2/視覚証跡が反映されている。
