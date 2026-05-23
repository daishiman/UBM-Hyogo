# Phase 1: 要件定義 — Summary

issue-291 / `task-sync-forms-d1-legacy-umbrella-001` で legacy 化した「単一 `/admin/sync` + `sync_audit` + Google Sheets API」を、`.claude/skills/aiworkflow-requirements/references/` 配下の current guidance から除去する。

## 対象

- references 5 ファイル（api-endpoints.md / environment-variables.md / deployment-cloudflare.md / deployment-secrets-management.md / architecture-overview-core.md）
- `task-workflow-backlog.md`（UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001）
- 関連 5 タスクへの逆リンク（03a / 03b / 02c = physical / 04c / 09b = ledger fallback）
- skill indexes 再生成

## 不変条件

- runtime code / D1 migration / Cloudflare Secret は変更しない
- historical lessons-learned 本文は削除しない（分類のみ）
- commit / push / PR は Phase 13 で user 明示承認後のみ
