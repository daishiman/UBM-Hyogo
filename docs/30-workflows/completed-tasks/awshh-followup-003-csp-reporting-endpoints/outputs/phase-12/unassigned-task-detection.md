# Unassigned Task Detection

## 元 placeholder の consumed trace

> **status**: CONSUMED
> **consumed_at**: 2026-05-24
> **consumed_by**: docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/
> **source_issue**: #868（CLOSED）
> **source_placeholder**: docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-003-reporting-endpoints.md

元 placeholder「Reporting-Endpoints / Report-To による CSP 違反収集集約」を本 workflow が canonical 仕様書として吸収した。受信先を Sentry CSP endpoint に確定し、apps/web のみ・1 サイクルで完結する実装仕様に落とし込んだ。

## 本サイクルで検出した新規未タスク

| ID | 内容 | 扱い |
| --- | --- | --- |
| U-AWSHH-001 | CSP enforce 切替（report-only → enforce 昇格） | 既存。本タスク完了を前提とする下流タスク。本サイクルでは scope out（先送りではなく責務分離） |

> 上記 U-AWSHH-001 は本タスク以前から識別済みの下流タスクであり、本タスクが生んだ新規 gap ではない。本サイクル発の新規未タスクは **0 件**（0 件でも本レポート出力必須）。

## scope out 明示項目（先送りではない責務分離）

- 受信側内製（apps/api 新規 route + D1 保存）: 不変条件 #5 と 1 サイクル完結を破るため不採用。必要時のみ別タスク。
- enforce 切替: U-AWSHH-001 の責務。
