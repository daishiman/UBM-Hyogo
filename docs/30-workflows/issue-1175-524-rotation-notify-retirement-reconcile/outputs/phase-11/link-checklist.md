# Phase 11 link checklist — issue-1175-524-rotation-notify-retirement-reconcile

仕様書内の参照リンク・パスの実在確認チェックリスト（2026-06-10 現行検証）。

| # | 参照 | 種別 | 実在 |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/issues/issue-524.md` | 整合対象（編集） | あり（既存・陳腐化状態） |
| 2 | GitHub issue #524 | 整合対象（リモート本文編集） | あり（OPEN） |
| 3 | GitHub issue #1175 | 起点 issue | あり（CLOSED・維持） |
| 4 | `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/` | 親タスク（経緯正本・注記リンク先） | あり（既存） |
| 5 | `docs/30-workflows/unassigned-task/cf-token-env-contract-and-rotation-retirement-followup-001-issue-524-rotation-notify-retirement.md` | 原 followup spec | あり（既存） |
| 6 | `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` | 撤廃後の正本 runbook | あり（既存） |
| 7 | `.github/workflows/cf-token-rotation-reminder.yml` | #524 参照節から除去対象 | **削除済**（親タスク・dangling 解消対象） |
| 8 | `docs/30-workflows/operations/cf-token-rotation-runbook.md` | #524 参照節から除去対象 | あり（tombstone・参照のみ除去対象） |
| 9 | `.github/workflows/post-release-dashboard.yml` | #524 残置参照（残り 2 件） | 参照保全対象 |
| 10 | `.github/workflows/cloudflare-analytics-export.yml` | #524 残置参照（残り 2 件） | 参照保全対象 |

> #7 は削除済みのため #524 参照節から除去する（dangling 解消）。#8 は tombstone として残るが #524 の運用参照としては除去する。#9/#10 は残り 2 件の通知統合に必要なため保全する。
