# Phase 13: PR 作成

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `status: pending_user_approval`

> 本タスクは実コード実装・local focused tests・Playwright・Phase 11 screenshot まで完了。commit / push / PR / Issue 操作は user-gated。

---

## 前提

- 本ワークフローは `implemented_local_evidence_captured` 状態。コード実装・ローカル証跡取得まで完了。
- Phase 13 の全アクションはユーザーの明示承認後にのみ実行する（PR 作成を自動実行しない）。
- PR base は **`dev`**（CLAUDE.md PR 作成フロー規約。production リリース時のみ `dev → main`）。
- Issue #1042 は **CLOSED のまま維持**（open/close 操作を行わない）。

## 実行順序（実装サイクル完了後・外部操作のみ user-gated）

| 順序 | アクション | gate |
| --- | --- | --- |
| 1 | `IdentityConflictRow.tsx` / spec / playwright を実装（dismiss optimistic + rollback） | 完了（同一サイクル） |
| 2 | focused vitest / Playwright focused / typecheck / lint を実行し GREEN 確認 | 実装サイクル内 |
| 3 | Phase 11 screenshot 3 枚を capture（canonical 名） | 実装サイクル内 |
| 4 | local check result / change summary 作成 | 実装サイクル内 |
| 5 | commit | **user-gated** |
| 6 | push | **user-gated** |
| 7 | `gh pr create --base dev` | **user-gated** |
| 8 | Issue #1042 | **CLOSED のまま維持**（操作不要） |

## PR 本文に含める内容（実装完了時）

- 目的: `/admin/identity-conflicts` の dismiss（別人マーク）confirm 完了後、server round-trip を待たず該当 row を optimistic 非表示にし、server エラー時のみ rollback（`dismissReason` 保持）+ inline error 復元。merge optimistic（#988）と挙動を対称化。
- 変更ファイル: `IdentityConflictRow.tsx`（編集）/ `IdentityConflictRow.spec.tsx`（編集）/ `admin-identity-conflicts.spec.ts`（編集）。dismiss API / D1 / page.tsx / hook / merge 設計は不変。
- `outputs/phase-12/implementation-guide.md` の Part 1 / Part 2 内容を反映。
- Phase 11 screenshot 3 枚（`identity-conflict-row-dismiss-confirm.png` / `-dismiss-optimistic-removed.png` / `-dismiss-rollback-error.png`）を参照として含める。
- 不変条件遵守（#1 / #2 / #9 / #10）の確認結果。
- 関連 Issue: `Refs #1042`（CLOSED 済み・本 PR で close 操作しない）。親 `#988`（merge 側）。

## Issue 状態の注記

- Issue #1042（FU-AIDC-006）は調査時点（2026-06-01）で **CLOSED**（`closedAt: 2026-06-01T12:10:19Z`）。
- ユーザー指示により CLOSED のまま仕様書を作成した。本ワークフローは Issue の open/close を変更しない。
- 実装 PR が `dev` へマージされても Issue の状態操作は行わない（既に CLOSED）。

## 本サイクルでの結論

- 実コード実装・screenshot は完了。commit / push / PR は user-gated。
- 本 Phase 13 では PR 作成手順と user-gated boundary を定義した。実装サイクルは完了済みで、実際の PR 作成はユーザー明示承認後に行う。

## 完了条件

- 実装サイクル完了後の commit → push → PR (`--base dev`) の順序と user-gated boundary（外部操作のみ）が定義されていること。
- Issue #1042 を CLOSED のまま維持する方針が明記されていること。
- PR 本文に含める内容（目的 / 変更ファイル / implementation-guide 反映 / screenshot 参照 / 不変条件）が列挙されていること。
