# Phase 13: PR 作成

`[実装区分: 実装完了]` / `workflow_state: implemented_local_evidence_captured` / `status: blocked_pending_user_approval`

> commit / push / PR 作成 / Issue mutation は**すべて user-gated**（CONST_002 / CONST_006）。local code implementation と focused component test は完了済み。staging authenticated screenshot は user-gated。PR base は **`dev`**（production 以外）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1080-bulk-tag-result-member-labels` |
| issue | #1080（= `task-issue-1036-followup-004`） |
| issue_state | **OPEN**（本ワークフローは Issue 状態を変更しない・close も reopen もしない） |
| PR base | `dev`（開発統合ブランチ。production リリース時のみ `dev → main`） |
| branch（推奨） | `docs/issue-1080-bulk-tag-result-member-labels-spec` |
| workflow_state | `implemented_local_evidence_captured` |
| status | `blocked_pending_user_approval`（PR 未作成） |

## 目的

本タスク #1080（bulk tag 部分失敗結果の member/tag 表示名表示）の PR 作成手順を確定する。本ワークフローは local 実装と focused component test を完了しており、commit / push / PR / Issue mutation はすべて user の明示承認後にのみ実行する。

## 実行タスク

### 前提（CONST_002 / CONST_006）

- 本タスクは現時点 `implemented_local_evidence_captured` 状態。staging screenshot は user-gated。
- commit・push・PR・Issue mutation は user-gated。Phase 13 の全アクションはユーザーの明示承認後にのみ実行する（PR を自動作成しない）。
- PR base は **`dev`**（CLAUDE.md PR 作成フロー規約）。

### 実行順序（実装完了後・user-gated）

| 順序 | アクション | gate |
| --- | --- | --- |
| 1 | branch `docs/issue-1080-bulk-tag-result-member-labels-spec` 作成（dev 直上回避） | 自律可 |
| 2 | `git fetch origin dev` → ローカル `dev` を fast-forward → 作業ブランチに `dev` をマージ | 自律可 |
| 3 | `pnpm install --force` | 自律可 |
| 4 | `pnpm typecheck` | 自律可 |
| 5 | `pnpm --filter @ubm-hyogo/web lint`（残違反は `lint --fix` → 手修正） | 自律可 |
| 6 | `bash scripts/verify-pr-ready.sh`（phase12-compliance / gate-metadata:validate / indexes:rebuild drift） | 自律可 |
| 7 | commit | **user-gated** |
| 8 | push | **user-gated** |
| 9 | `gh pr create --base dev` | **user-gated** |
| 10 | Issue #1080 mutation | **しない**（OPEN のまま。reopen/close/label 変更は user-gated） |

> 品質検証で失敗時は最大 3 回まで自動修復する。commit 自体は user-gated を超えない。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| PR 本文仕様（Phase 13 正本） | `.claude/commands/ai/diff-to-pr.md` | PR 本文の構造・Phase 12 implementation-guide 反映 |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | PR 本文へ反映する変更内容 |
| Phase 11 screenshot | `outputs/phase-11/screenshot-plan.json` | PR 本文の screenshot 参照（canonical 名・pending） |
| pre-flight checklist | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` | verify-pr-ready 失敗時の切り分け |
| 確定設計 | `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` | 不変条件遵守・変更 surface |

## 成果物

### PR 本文に含める内容（実装完了時）

- **目的**: `/admin/members` の `BulkActionBar` tag 一括付与/解除の部分失敗結果 summary を、生 ID（`memberId` / `tagId`）表示から表示名（member `fullName` / tag `label`、未解決時は `{tagId}（未登録）` / memberId fallback）表示へ改善。API response shape `{memberId,tagId,status}` は不変（apps/api 非接触）。
- **変更ファイル**: `BulkActionBar.tsx`（編集・optional prop `membersById?` 追加 + result summary 表示差し替え）/ `MembersClientShell.tsx`（編集・`membersById` を `useMemo` 構築し注入）/ `BulkActionBar.spec.tsx`（編集・TC-BAB-TAG-06/07 追加）。apps/api / D1 / tokens.css は不変。
- **`outputs/phase-12/implementation-guide.md`** の内容を漏れなく反映。
- **Phase 11 screenshot**: `bulk-tag-result-member-labels.png` を参照として含める（取得は staging 認証付き・user-gated）。screenshot が未取得の場合は screenshot 専用セクションを作らない。
- **不変条件遵守**（#1 既存 API のみ / #2 OKLch token・HEX 直書きなし / #5 D1 直接アクセス禁止 / #9 / #10）の確認結果。
- **受け入れ基準対応**（AC-1 skipped fullName / AC-2 tag label・未登録表記 / AC-3 API shape 維持 / AC-4 memberId fallback / AC-5 component test）。

### 本サイクルでの成果物

| 成果物 | 状態 |
| --- | --- |
| 本 Phase 13 spec | 作成済（PR 手順の確定） |
| コード実装 / component test | **完了（focused 12 tests PASS）** |
| staging authenticated screenshot | **pending（user-gated）** |
| commit / push / PR / Issue mutation | **未実行（user-gated）** |

## 統合テスト連携

- PR 作成前に focused component test（`BulkActionBar.spec.tsx`・tier 1 主証跡）が green であることを確認済みとして扱う。
- `git diff dev...HEAD --name-only` を PR に含めるファイル一覧として取得し、漏れなし確認に用いる。
- screenshot 数（`bulk-tag-result-member-labels.png` 1 枚・実装後取得）と PR 本文の画像参照の整合。

## 完了条件（Phase 13）

- PR base = `dev`、branch = `docs/issue-1080-bulk-tag-result-member-labels-spec`、外部操作承認後の PR 作成手順（install/typecheck/lint/verify-pr-ready → commit/push/PR は user-gated）を確定した。
- Issue #1080 は OPEN のまま。reopen/close/label 変更をしない方針を記録した。
- 本ワークフローは local 実装済みで **PR 未作成 = blocked_pending_user_approval** であることを明記した。
- PR 本文へ反映する内容（目的・変更ファイル・不変条件・AC 対応・screenshot 参照）を確定した。
