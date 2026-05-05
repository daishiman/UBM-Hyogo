# Skill Feedback Report

## テンプレ改善

VISUAL_ON_EXECUTION の execution-only follow-up では、Phase 12 strict files を作る場合でも `NOT_EXECUTED_PENDING_USER_APPROVAL` を明示し、Phase 11 PASS と混同しないテンプレが必要。

## ワークフロー改善

Unassigned task を workflow root に昇格した時点で、元 unassigned file を `promoted_to_workflow` pointer にし、quick-reference / resource-map / task-workflow-active / artifact inventory を同一 wave で同期する。

## ドキュメント改善

Runtime execution root と evidence canonical root が別の場合、wrapper default out-dir と artifact inventory に同じ completed/current path を書く。
