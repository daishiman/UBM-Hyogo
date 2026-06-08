# Phase 13: PR 作成（ユーザーゲート）— issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL
> **ユーザー明示承認後のみ実施**（CONST_002 / CONST_006）。本 workflow は **implemented_local_evidence_captured**（ローカル実装・focused 証跡取得済み）。commit・push・PR 作成・staging deploy はすべてユーザー明示承認後にのみ行う。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-1104-member-creation-path-unification |
| Phase | 13（PR 作成・統合） |
| workflow_state | **blocked_pending_user_approval**（implemented_local_evidence_captured。commit/PR/staging 待ち） |
| base ブランチ | `dev`（既定。`main` への直接 PR は行わない） |
| 仕様書ブランチ | `docs/issue-1104-member-creation-path-unification-spec`（`origin/dev` 起点） |
| 分類 | NON_VISUAL（`apps/api` のみ。`apps/web` 無変更 = AC-6） |
| GitHub Issue | #1104（**CLOSED 維持・PR で reopen しない**） |

## 目的

本 workflow の成果を `dev` への PR として統合するための手順と前提条件を確定する。本 wave では
PR を**作成しない**。本タスクは **implemented_local_evidence_captured** のため、PR 作成には次の 2 条件が揃って初めて到達する:

1. **コード実装が完了している**こと（F-1〜F-5 の実コード。完了済み）。
2. **ユーザーが明示承認した**こと（CONST_002 / CONST_006）。

## 実行タスク（全てユーザーゲート）

### 13.1 ブロック状態の明示

| 状態 | 値 |
|------|-----|
| 現在の Phase 13 状態 | **blocked_pending_user_approval** |
| ブロック理由 | commit / push / PR / staging はユーザー明示承認が前提（CONST_002） |
| 解除条件 | 上記「目的」の 2 条件（実装完了 + ユーザー承認）が両方揃ったとき |

### 13.2 想定 PR 構成（統合 PR）

本ワークツリーでは、仕様書作成と `apps/api` コード実装が同一ブランチ上で完了済みである。PR を作成する場合は、原則としてこの差分一式（仕様書 + 実装 + tests + skill/ledger 同期）を 1 本にまとめる。

| PR | base | branch | 内容 | タイミング |
|----|------|--------|------|-----------|
| 統合 PR | `dev` | 現ブランチ（`docs/issue-1104-member-creation-path-unification-spec`）またはユーザー指定ブランチ | 本 workflow の Phase 1-13 仕様書一式、`apps/api` 実装、focused tests、skill/ledger 同期 | ユーザー承認後 |

> 分離 PR が必要な場合のみユーザー判断で切り分ける。デフォルトは統合 PR。
> 既定 base は `dev`。`main` への直接 PR は production リリース時の `dev → main` のみ。

### 13.3 ユーザーゲート境界（CONST_002）

| アクション | 境界 | 備考 |
|-----------|------|------|
| 実コード実装（F-1〜F-5 + tests） | **完了** | `apps/api` focused D1 tests 5 files / 51 tests PASS、typecheck/lint PASS |
| テスト実行（D1 contract test） | **完了** | `vitest.d1.config.ts` focused 5 files / 51 tests PASS |
| `git commit` / `git push` | **ユーザーゲート** | ユーザー明示承認後のみ |
| `gh pr create --base dev` | **ユーザーゲート** | base=dev 固定 |
| staging deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`） | **ユーザーゲート** | apps/api のみ。apps/web 無変更のため deploy 不要。新規 migration 無し（AC-7）のため D1 apply 不要 |
| GitHub Issue 状態変更 | **行わない** | #1104 は CLOSED 維持・**reopen しない**（PR で自動 reopen させない。PR 本文で `Closes #1104` 等の自動 close/reopen キーワードを使わず、参照は `Refs #1104` 等に留める） |

### 13.4 PR 作成手順（実装完了 + ユーザー承認後に実施）

1. local evidence を確認する: `pnpm install --force` → `mise exec -- pnpm typecheck` → `pnpm lint` → 対象 vitest D1 config GREEN。
2. AC-6 確認: `git diff --name-only dev...HEAD | grep -c '^apps/web/'` が **0** であること。
3. AC-7 確認: `apps/api/migrations/` に新規ファイルが無いこと（`git diff --name-only dev...HEAD | grep '^apps/api/migrations/'` が 0 件）。
4. `bash scripts/verify-pr-ready.sh`（docs-only gate pre-flight）と `verify-phase12-compliance` を通過させる。
5. PR 本文は `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、`outputs/phase-12/implementation-guide.md` の主要見出しを反映する。Issue は `Refs #1104`（CLOSED 維持・reopen 回避）で参照する。
6. `gh pr create --base dev` で作成（ユーザー承認後）。

### 13.5 完了条件チェックリスト

- [x] Phase 13 を **blocked_pending_user_approval** と明示し、ブロック理由・解除条件を記録した
- [x] PR は (1) コード実装完了 (2) ユーザー承認 の 2 条件成立後に初めて作成すると明記した
- [x] 統合 PR（仕様書 + 実装 + tests + skill/ledger 同期）と base=dev を整理した
- [x] commit / push / PR / staging を全てユーザーゲートと明記した（local focused test は実施済み）
- [x] GitHub Issue #1104 は CLOSED 維持・reopen しない（`Refs #1104` 参照に留める）と明記した

## 参照資料

- Phase 5（実装方針）/ Phase 11 §11.4（staging 実機確認手順）
- index.md（implemented_local_evidence_captured / #1104 CLOSED 維持ポリシー）
- `.claude/commands/ai/diff-to-pr.md`（PR 本文 Phase 13 仕様）
- `outputs/phase-12/implementation-guide.md` / `outputs/phase-12/unassigned-task-detection.md`

## 成果物

- 本ファイル（Phase 13: PR / deploy のユーザーゲート手順・blocked_pending_user_approval）

## 統合テスト連携

- 本 Phase は user-gated external ops の出口。§13.4 の手順 1-3 は Phase 5 / Phase 9 の検証コマンド・AC-6/AC-7 gate と整合する。
- 実装完了後の staging deploy 後に Phase 11 §11.4 の end-to-end 確認（orphan 擬似生成 → auto-link 後 member_status 存在 → 詳細 GET 200）を行い、結果を `manual-test-result.md` に追記する。
