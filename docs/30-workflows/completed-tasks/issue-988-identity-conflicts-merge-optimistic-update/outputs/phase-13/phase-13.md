# Phase 13: PR 作成

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `status: pending_user_approval`

> commit / push / PR 作成 / Issue close は**すべて user-gated**。実コード、local focused tests、Playwright focused tests、Phase 11 screenshot は本サイクルで完了済み。

---

## 前提

- 本タスクは `implemented_local_evidence_captured` 状態。コード実装と local focused Vitest は完了済み。
- Phase 13 の全アクションはユーザーの明示承認後にのみ実行する（PR 作成を自動実行しない）。
- PR base は **`dev`**（CLAUDE.md PR 作成フロー規約。production リリース時のみ `dev → main`）。

## 実行順序（実装完了後・user-gated）

| 順序 | アクション | gate |
| --- | --- | --- |
| 1 | local check result / change summary 作成 | 完了（本 Phase 13 補助成果物） |
| 2 | 追加品質検証（full lint 等） | 必要時 user-gated 前に実行 |
| 3 | commit | **user-gated** |
| 4 | push | **user-gated** |
| 5 | `gh pr create --base dev` | **user-gated** |
| 6 | Issue #988 close | **user-gated**（PR merge 後） |

## PR 本文に含める内容（実装完了時）

- 目的: `/admin/identity-conflicts` の merge 二段階 confirm 後、server round-trip を待たず該当 row を optimistic 非表示にし、server エラー時のみ rollback で復元 + inline error。dismiss は不変。
- 変更ファイル: `IdentityConflictRow.tsx`（編集）/ `IdentityConflictRow.spec.tsx`（編集）/ `admin-identity-conflicts.spec.ts`（編集）。API / D1 / page.tsx は不変。
- `outputs/phase-12/implementation-guide.md` の Part 1 / Part 2 内容を反映。
- Phase 11 screenshot 3 枚（`identity-conflict-row-merge-final.png` / `-optimistic-removed.png` / `-rollback-error.png`）を参照として含める。
- 不変条件遵守（#1 / #2 / #9 / #10）の確認結果。

## Issue 状態の注記

- Issue #988 は調査時点（2026-05-29）で **OPEN**。ユーザー認識（「クローズド」）と GitHub 実状態が乖離していたため記録する。
- 本ワークフローは Issue の open/close を変更しない。
- Issue close は実装完了 + PR マージ後の Phase 13（上記順序 6、user-gated）で行う。

## 本サイクルでの結論

- commit / push / PR / Issue close は**未実行**（user-gated）。
- Phase 13 template 補助成果物（local-check-result / change-summary / pr-info / pr-creation-result）を配置し、PR 作成自体は未実行として記録した。
