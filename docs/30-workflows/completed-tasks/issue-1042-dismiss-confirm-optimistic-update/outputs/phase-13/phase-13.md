**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 13: PR 作成

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `status: pending_user_approval`

> commit / push / PR 作成 / Issue close は**すべて user-gated**。本ワークフローは実コード・local focused tests・Playwright focused tests・Phase 11 screenshot 取得まで完了済み。

---

## 前提

- 本タスクは `implemented_local_evidence_captured` 状態。Phase 1-13、Phase 11 evidence、Phase 12 strict 7 outputs を作成・更新済み。
- focused Vitest 14 PASS、Playwright desktop 2 PASS、screenshot 2 PNG captured。
- Phase 13 の全アクションはユーザーの明示承認後にのみ実行する（PR 作成を自動実行しない）。
- PR base は **`dev`**（CLAUDE.md PR 作成フロー規約。production リリース時のみ `dev → main`）。

## 実行順序（実装完了後・user-gated）

| 順序 | アクション | gate |
| --- | --- | --- |
| 1 | local check result / change summary 確認 | 完了 |
| 2 | 追加品質検証（必要に応じて `pnpm typecheck` / `pnpm lint`） | user-gated 前に実行可能 |
| 3 | commit | **user-gated** |
| 4 | push | **user-gated** |
| 5 | `gh pr create --base dev` | **user-gated** |
| 6 | Issue #1042 close | **user-gated**（PR merge 後） |

## PR 本文に含める内容（実装完了時）

- 目的: `/admin/identity-conflicts` の dismiss（別人マーク）confirm 後、server round-trip を待たず該当 row を optimistic 非表示にし、server エラー時のみ rollback で復元 + inline error + dismiss 理由保持。merge 側挙動は不変。
- 変更ファイル: `IdentityConflictRow.tsx`（編集）/ `IdentityConflictRow.spec.tsx`（編集）/ `admin-identity-conflicts.spec.ts`（編集）。API / D1 / page.tsx / `useAdminMutation` hook は不変。
- `outputs/phase-12/implementation-guide.md` の Part 1 / Part 2 内容を反映。
- Phase 11 screenshot 2 枚（`identity-conflict-row-dismiss-optimistic-removed.png` / `identity-conflict-row-dismiss-rollback-error.png`）を参照として含める。
- 受け入れ基準 AC-1（state 分離）/ AC-2（実行直後 row 消失）/ AC-3（reject 時 row 復元 + reason 保持）/ AC-4（merge 回帰なし）/ AC-5（Playwright dismiss optimistic/rollback）の達成結果。
- 不変条件遵守（#1 / #2 / #5 / #9 / #10）の確認結果。
- mirror 元 #988 / PR #1046（merge optimistic）への参照。

## Issue 状態の注記

- Issue #1042 は調査時点（2026-06-01）で **OPEN**。ユーザー認識（「クローズド」）と GitHub 実状態が乖離していたため記録する。
- 本ワークフローは Issue の open/close を変更しない。
- Issue close は実装完了 + PR マージ後の Phase 13（上記順序 7、user-gated）で行う。

## 本サイクルでの結論

- 本サイクルで実装・focused tests・Playwright screenshots は完了。
- commit / push / PR / Issue close は**未実行**（user-gated）。
- Phase 13 は PR 作成計画のみを記述し、PR 作成自体は user 承認後に実施する（`status: pending_user_approval`）。
