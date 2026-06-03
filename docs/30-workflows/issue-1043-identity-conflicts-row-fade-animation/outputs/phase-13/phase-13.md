# Phase 13: PR 作成

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `status: pending_user_approval`

> commit / push / PR 作成 / Issue mutation は**すべて user-gated**（CONST_002 / CONST_006）。本ワークフローは実装、focused Vitest、local Playwright、Phase 11 screenshots まで完了済み。PR base は **`dev`**（production 以外）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| issue_state | **OPEN**（本ワークフローは Issue 状態を変更しない・close しない） |
| PR base | `dev`（開発統合ブランチ。production リリース時のみ `dev → main`） |
| branch（推奨） | `docs/issue-1043-identity-conflicts-row-fade-animation-spec` |
| workflow_state | `implemented_local_evidence_captured`（implemented_local_evidence_captured） |
| status | `pending_user_approval`（PR 未作成） |

## 目的

本タスク #1043（optimistic row 消失の fade animation 追加）の外部操作承認後に PR を作成するための手順を確定する。
本ワークフローでは spec のみを作成し、commit / push / PR / Issue mutation は user の明示承認後にのみ実行する。

## 実行タスク

### 前提（CONST_002 / CONST_006）

- 本タスクは現時点 `implemented_local_evidence_captured` 状態。コード実装、focused Vitest、local Playwright、Phase 11 screenshots は完了し、commit・push・PR・Issue mutation は user-gated。
- Phase 13 の全アクションはユーザーの明示承認後にのみ実行する（PR を自動作成しない）。
- PR base は **`dev`**（CLAUDE.md PR 作成フロー規約）。

### 実行順序（実装完了後・user-gated）

| 順序 | アクション | gate |
| --- | --- | --- |
| 1 | branch `docs/issue-1043-identity-conflicts-row-fade-animation-spec` 作成（dev 直上回避） | 自律可 |
| 2 | `git fetch origin dev` → ローカル `dev` を fast-forward → 作業ブランチに `dev` をマージ | 自律可 |
| 3 | `pnpm install --force` | 自律可 |
| 4 | `pnpm typecheck` | 自律可 |
| 5 | `pnpm --filter web lint`（残違反は `lint --fix` → 手修正） | 自律可 |
| 6 | `bash scripts/verify-pr-ready.sh`（docs-only gate pre-flight: phase12-compliance / gate-metadata:validate / indexes:rebuild drift） | 自律可 |
| 7 | commit | **user-gated** |
| 8 | push | **user-gated** |
| 9 | `gh pr create --base dev` | **user-gated** |
| 10 | Issue #1043 mutation | **しない**（close-out read-only 再確認では CLOSED。reopen/close/label 変更は user-gated） |

> 品質検証で失敗時は最大 3 回まで自動修復し修復差分を commit（commit 自体は user-gated を超えない範囲でPR cycle の一部として扱う）。テスト実行はこの PR 作成フローでは行わない（CLAUDE.md 規約）。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| PR 本文仕様（Phase 13 正本） | `.claude/commands/ai/diff-to-pr.md` | PR 本文の構造・Phase 12 implementation-guide 反映 |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | PR 本文へ反映する変更内容 |
| Phase 11 screenshot | `outputs/phase-11/screenshots/*.png` | PR 本文の screenshot 参照 |
| pre-flight checklist | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` | verify-pr-ready 失敗時の切り分け |
| 確定設計 | `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` | 不変条件遵守・変更 surface |

## 成果物

### PR 本文に含める内容（実装完了時）

- **目的**: `/admin/identity-conflicts` の merge 二段階 confirm 完了後、row を即時 `return null` ではなく **fade out（exiting 相）→ DOM 除去（removed 相）** へ置き換え、視覚的退場の手がかりを付与。server error 時は exiting キャンセルで復元 + inline error。reduced-motion 環境では抑制。dismiss は不変。
- **変更ファイル**: `IdentityConflictRow.tsx`（編集）/ `IdentityConflictRow.spec.tsx`（編集）/ `admin-identity-conflicts.spec.ts`（編集）。API / D1 / page.tsx / hook / tokens.css / globals.css は不変。
- **`outputs/phase-12/implementation-guide.md`** の内容を漏れなく反映。
- **Phase 11 screenshot**: `identity-conflict-row-exiting-fade.png` / `identity-conflict-row-removed-stable.png` / `identity-conflict-row-rollback-restored.png` を参照として含める。
- **不変条件遵守**（#1 既存 API のみ / #2 OKLch token・HEX 直書きなし / #9 / #10）の確認結果。
- **#988 screenshot 意味 drift 注記**（MINOR-2）への対応（#988 成果物は越境編集せず #1043 で新規 canonical を撮る）。

### 本サイクルでの成果物

| 成果物 | 状態 |
| --- | --- |
| 本 Phase 13 spec | 作成済（PR 手順の確定） |
| commit / push / PR / Issue close | **未実行（user-gated）** |

## 統合テスト連携

- PR 作成前に Phase 4/6 の focused Vitest（tier 1 主証跡）と Phase 8 の Playwright（tier 2）が green であることを確認済みとして扱う。
- `git diff dev...HEAD --name-only` を PR に含めるファイル一覧として取得し、漏れなし確認に用いる。
- screenshot 数と PR 本文の画像参照の整合（3 PNG captured）。

## 完了条件（Phase 13）

- PR base = `dev`、branch = `docs/issue-1043-identity-conflicts-row-fade-animation-spec`、外部操作承認後の PR 作成手順（install/typecheck/lint/verify-pr-ready → commit/push/PR は user-gated）を確定した。
- Issue #1043 は close-out read-only 再確認では CLOSED。reopen/close/label 変更をしない方針を記録した。
- 本ワークフローは 実装済みで PR は **未作成 = pending_user_approval** であることを明記した。
- PR 本文へ反映する内容（目的・変更ファイル・不変条件・screenshot 参照）を確定した。
