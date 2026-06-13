# Phase 11 — スコープ外発見事項

Task ID: `TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001`

## 0. サマリ

| 項目 | 値 |
| --- | --- |
| current（本タスクで対応する追加事項） | 0 件 |
| baseline 候補（別タスク / 後続で扱う事項） | 1 件 |

## 1. current: 0 件

本タスク（表現層の用語リネーム）の範囲内で、追加対応が必要な発見事項は 0 件である。用語リネーム正本テーブル（[shared-context.md §2](../../shared-context.md)）が全箇所を網羅しており、設計時点で漏れは検出されていない。

## 2. baseline 候補

| # | 事項 | 理由 / 扱い |
| --- | --- | --- |
| B-1 | `SchemaDiffBulkRollbackModal.tsx` の実文字列の最終確認 | [shared-context.md §2-7](../../shared-context.md) は方針（`Bulk Rollback` / `rollback` / `stableKey` を日本語化）を確定しているが、実ファイルの行番号・実文字列は実装時に grep で確認する必要がある。Phase 5 実装手順に内包済みであり、実装フェーズの grep gate（Phase 9 Q6）で機械的に検出・解消する。本タスクのスコープ内で完結予定のため別 Issue 化はしない |

## 3. スコープ境界（参考）

- API / D1 / Google Form / endpoint surface は不変（CLAUDE.md invariant #5）。これらに起因する用語（API レスポンスフィールド名 `stableKey` 等）は内部識別子として据置であり、発見事項ではない。
- 用語集 SSOT 3ファイルの技術名併記は意図的に残す設計（[shared-context.md §2-10](../../shared-context.md)）であり、発見事項ではない。
