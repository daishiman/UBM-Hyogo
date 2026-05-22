# Phase 8: Refactor — issue-801 admin error focus transfer

## 方針

**本タスクでは refactor を行わない**。

理由:
- `(admin)/admin/error.tsx` は root を inline で揃えるのが目的（CONST_007 単一サイクル）
- 共通 hook 抽出 (`useAutoFocusOnMount(ref)`) は issue-769-followup-001 として別 issue 管理
- 並列実行下で共通 hook を編集すると衝突リスク（Phase 2 §2.2）

## 横展開メモ（次タスクへの引き継ぎ）

issue-769-followup-001 が走るタイミングで、以下 4 箇所を一括 refactor 対象とする:

| ファイル | 現状 |
|---|---|
| `apps/web/app/error.tsx` | inline focus 実装 (issue-769) |
| `apps/web/app/(admin)/admin/error.tsx` | **本タスクで inline focus 実装** |
| `apps/web/app/login/error.tsx` | focus 未実装（i05 / 別 followup） |
| `apps/web/app/profile/error.tsx` | focus 未実装（issue-769-followup-002） |

## 命名・スタイル整合性

- component 名: root が `RouteError`、本タスクは `AdminError`（segment 識別を明示）
- logger payload: 既存 root が `{ event, digest, err }`、本タスクは `{ event, scope: "admin", digest, err }`（scope 追加で集計差別化）

## DoD

- refactor diff = 0
- 横展開メモが残されている
