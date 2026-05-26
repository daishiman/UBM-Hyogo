# Unassigned Task Detection — issue-899-static-bearer-fallback-retirement

## 検出件数: 0 件

## 検出ルール適用

| ルール                                                                  | 適用結果                                                                |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 本仕様書スコープ外の新規 task が必要か                                  | なし。全 AC は本 wave + 実装 PR の 1 cycle で完了する設計               |
| 前提タスク（#916）を新規 unassigned-task として formalize する必要があるか | なし。#916 は既存 unassigned-task として独立管理されており重複登録不要 |
| follow-up gate 化（pre-push hook / CI workflow 追加）を別 task 化するか | なし。本タスク内 Phase 4-6 で「現状は不要」と判定済み                   |
| SSOT 状態更新（bearer-lifecycle-ssot.md §6）を別 task に切り出すか      | なし。実装 PR 内で同 wave 更新する設計                                  |
| physical secret 削除を独立 task 化するか                                | なし。本仕様書 Phase 11 §2 Step 4 に user-gated 手順として組込済み      |

## formalize decision

**新規 unassigned-task は作成しない**。`docs/30-workflows/unassigned-task/` への新規 md 追加なし。

## 既存 unassigned-task との関係

| 既存 unassigned-task path                                                                                                                  | 関係                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `docs/30-workflows/unassigned-task/runtime-smoke-staging-mint-recurrence-fix-followup-001-staging-auth-secret-provisioning-mint-activation.md`（#916）| **前提タスク**。本タスク開始の門番       |

## 重複なし判定

`grep -rn "issue-899\|static.bearer.fallback" docs/30-workflows/unassigned-task/` を実装時に実行し 0 件であることを確認する。
