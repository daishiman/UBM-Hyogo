# Phase 13: PR 作成

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `status: pending_user_approval`

> local 実装・focused Vitest・typecheck・lint・token gate・撤去 grep は完了済み。commit / push / PR 作成 / Issue mutation / staging 手動 SR 検証は**すべて user-gated**（CONST_002 / CONST_006）。PR base は **`dev`**（production 以外）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008） |
| issue_state | **CLOSED**（closed 2026-06-04T22:10:15Z。本ワークフローは Issue 状態を変更しない・reopen も close もしない） |
| PR base | `dev`（開発統合ブランチ。production リリース時のみ `dev → main`） |
| branch（推奨） | `docs/issue-1094-identity-conflicts-optimistic-aria-live-announcement-spec` |
| workflow_state | `implemented_local_evidence_captured`（local 実装・source-level evidence 取得済み） |
| status | `pending_user_approval`（commit / push / PR / Issue mutation / staging 手動 SR 待ち） |

## 目的

本タスク #1094（optimistic 消失時の aria-live アナウンス最適化）の **実装 + 外部操作の承認後**に PR を作成するための手順を確定する。本ワークフローでは spec のみを作成し、コード実装 / commit / push / PR / Issue mutation は user の明示承認後にのみ実行する。

## 実行タスク

### 前提（CONST_002 / CONST_006）

- 本タスクは現時点 `implemented_local_evidence_captured` 状態。コード実装、focused Vitest、local 検証は完了済みであり、commit・push・PR・Issue mutation・staging 手動 SR 検証のみ user-gated。
- Phase 13 の全アクションはユーザーの明示承認後にのみ実行する（実装も PR も自動実行しない）。
- PR base は **`dev`**（CLAUDE.md PR 作成フロー規約）。
- Issue #1094 は **CLOSED**。reopen / close / label 変更を**しない**。

### 実行順序（実装完了後・user-gated）

| 順序 | アクション | gate |
| --- | --- | --- |
| 0 | implementation-guide / phase-1〜11 spec に従いコード実装（新規 2 ファイル + 既存 3 編集）+ focused Vitest 追加・実行 | **完了済み** |
| 1 | branch `docs/issue-1094-identity-conflicts-optimistic-aria-live-announcement-spec` 作成（dev 直上回避） | 自律可 |
| 2 | `git fetch origin dev` → ローカル `dev` を fast-forward → 作業ブランチに `dev` をマージ | 自律可 |
| 3 | `pnpm install --force` | 自律可 |
| 4 | `pnpm typecheck` | 自律可 |
| 5 | `pnpm --filter web lint`（残違反は `lint --fix` → 手修正） | 自律可 |
| 6 | `bash scripts/verify-pr-ready.sh`（pre-flight: phase12-compliance / gate-metadata:validate / indexes:rebuild drift） | 自律可 |
| 7 | commit | **user-gated** |
| 8 | push | **user-gated** |
| 9 | `gh pr create --base dev` | **user-gated** |
| 10 | Issue #1094 mutation | **しない**（CLOSED のまま。reopen / close / label 変更は user-gated・本タスクでは実行しない） |

> 品質検証で失敗時は最大 3 回まで自動修復し修復差分を commit（commit 自体は user-gated を超えない範囲で PR cycle の一部として扱う）。テスト実行はこの PR 作成フローでは行わない（CLAUDE.md 規約。focused Vitest は順序 0 の実装サイクルで実行する）。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| PR 本文仕様（Phase 13 正本） | `.claude/commands/ai/diff-to-pr.md` | PR 本文の構造・Phase 12 implementation-guide 反映 |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | PR 本文へ反映する変更内容（Part 1 / Part 2 / 視覚証跡） |
| pre-flight checklist | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` | verify-pr-ready 失敗時の切り分け |
| 確定設計 / SSOT | `index.md`（§設計方針・§主要シグネチャ）/ `outputs/phase-1/phase-1.md` / `outputs/phase-3/phase-3.md` | 不変条件遵守・変更 surface |

## 成果物

### PR 本文に含める内容（実装完了時）

- **目的**: `/admin/identity-conflicts` の optimistic 消失（merge / dismiss 直後の row 非表示）時の SR アナウンスを、**ページレベル単一 `aria-live="polite"` region（`IdentityConflictAnnouncer`）への append-children 集約 + focus 不動 + 文言単一導出（`announcementFor`）** へ最適化する。row-local status node + focus 奪取を撤去。rollback error（`role="alert"`）は非回帰で維持。
- **変更ファイル**: `IdentityConflictAnnouncer.tsx`（新規）/ `identityConflictAnnouncements.ts`（新規）/ `IdentityConflictRow.tsx`（編集）/ `page.tsx`（編集）/ `IdentityConflictRow.spec.tsx`（編集）/ `IdentityConflictAnnouncer.spec.tsx`（新規）/ `admin-identity-conflicts.spec.ts`（編集・任意）。API / D1 / `useAdminMutation` / `tokens.css` / `globals.css` / `role="alert"` inline error は不変。
- **`outputs/phase-12/implementation-guide.md`** の内容を漏れなく反映。
- **スクリーンショット**: 本タスクは **NON_VISUAL**（sr-only live region・画面ピクセル変化なし）のため、**PR 本文にスクリーンショット専用セクションを設けない**。代替証跡として `outputs/phase-11/manual-test-result.md`（focused Vitest 件数・結果 + 手動 SR 検証ノート）を参照する。
- **不変条件遵守**（#1 既存 API のみ / #2 OKLch token・HEX 直書きなし / #5 / #9 / #10）の確認結果。
- **AC-1〜AC-8** の充足結果（live region 経由 / 非 focus-steal / 連続非競合 / 文言単一導出 / rollback 非回帰 / focused Vitest PASS / typecheck・lint green / legacy hook 未参照・design-tokens gate green）。

### 本サイクルでの成果物

| 成果物 | 状態 |
| --- | --- |
| 本 Phase 13 spec | 作成済（実装 + PR 手順の確定） |
| コード実装 / focused Vitest | **完了済み（26 tests PASS）** |
| typecheck / lint / token gate / grep | **完了済み（PASS）** |
| commit / push / PR / Issue mutation / staging 手動 SR | **未実行（user-gated）** |

## 統合テスト連携

- PR 作成前に Phase 4/6 の focused Vitest（tier 1 主証跡: live region 単一性 / 非 focus-steal / 連続非競合 / TTL / rollback 非アナウンス）が green であることを確認済みとして扱う（実装サイクルで取得）。
- Playwright（tier 2・任意）は単一 `aria-live` region の DOM 存在 + row-local status node 非存在の構造非回帰のみ（screenshot なし）。SR 実読み上げは CI 検証不可（Phase 3 MINOR-3）。
- `git diff dev...HEAD --name-only` を PR に含めるファイル一覧として取得し、漏れなし確認に用いる。
- NON_VISUAL のため screenshot 数は 0。PR 本文に screenshot 参照を作らない。

## 完了条件（Phase 13）

- PR base = `dev`、branch = `docs/issue-1094-identity-conflicts-optimistic-aria-live-announcement-spec`、外部操作承認後の手順（実装 → install/typecheck/lint/verify-pr-ready → commit/push/PR は user-gated）を確定した。
- Issue #1094 は **CLOSED**。reopen / close / label 変更をしない方針を記録した。
- 本ワークフローは **implemented_local_evidence_captured（local 実装済み）** で、commit / push / PR / Issue mutation / staging 手動 SR が **pending_user_approval** であることを明記した。
- PR 本文へ反映する内容（目的・変更ファイル・不変条件・AC・NON_VISUAL のため screenshot セクションなし）を確定した。
