---
workflow_id: issue-1126-bulk-tag-picker-viewport-baseline-expansion
title: bulk tag picker visual baseline の viewport 拡張（mobile / tablet / wide）
status: implemented_local_runtime_pending
task_type: implementation
implementation_division: 実装仕様書
visual_category: VISUAL_ON_EXECUTION
created_at: 2026-06-06
owner: daishiman
branch: docs/issue-1126-bulk-tag-picker-viewport-baseline-expansion-spec
issue: 1126
issue_state: CLOSED
issue_policy: do not mutate issue state; PR context is Refs #1126 only
parent_issue: 1077
parent_workflow: docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/
recovered_from_unassigned: docs/30-workflows/unassigned-task/task-issue-1077-followup-001-bulk-tag-picker-viewport-baseline-expansion.md
---

# issue-1126 — bulk tag picker visual baseline の viewport 拡張（mobile / tablet / wide）

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（Playwright spec の編集 + viewport fixture の additive 拡張）を伴う **実装仕様書** である。GitHub issue #1126 のラベルは `type:improvement` だが、目的（mobile / tablet / wide viewport の visual baseline を取得し回帰検出範囲を広げる）は Playwright spec の編集なしには達成できないため、CONST_004 に従い実装仕様書として作成した。判定根拠は [`outputs/phase-1/phase-1.md`](outputs/phase-1/phase-1.md) §実装区分判定を参照。

## 調査結論（issue #1126 は未解決）

issue #1126 が要求する「bulk tag picker visual baseline の mobile / tablet / wide viewport 拡張」は **未実装**であることを 2026-06-06 に確認した。

| 観点 | 実測 | 結論 |
| --- | --- | --- |
| 既存 spec `admin-members-bulk-tag-authenticated.spec.ts` | desktop 単一（project default 1280×800）で `toHaveScreenshot(SNAP.assign/unassign)` のみ。`page.setViewportSize()` 不在 | viewport 拡張なし |
| baseline snapshot 物理ファイル | `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png` の canonical 名のみ。`-mobile` / `-tablet` / `-wide` suffix の baseline は存在しない | viewport 別 baseline なし |
| CI `playwright-staging-visual-authenticated.yml` | `--project=staging-visual-authenticated` 単一。viewport matrix なし | viewport 拡張なし |
| 別タスクでの解決 | issue-1125（result mutation baseline）/ issue-1080（result member labels）/ issue-1081（real D1 runtime smoke）はいずれも別スコープ。viewport 拡張を実装したタスクは 0 件 | 重複解決なし |

→ 本 issue の実行は**必要**。CLOSED のまま（reopen せず `Refs #1126`）タスク仕様書を作成する。

## issue の現行コードへの最適化

起票時の前提と現行コードの差分を取り込み、以下を最適化した（詳細は [`outputs/phase-1/phase-1.md`](outputs/phase-1/phase-1.md) §issue 最適化）。

1. **viewport 値を既存 fixture に整合**: `apps/web/playwright/fixtures/viewports.ts` の既存 `VIEWPORTS`（desktop 1280×800 / tablet 768×1024 / mobile 390×844）を正本として再利用し、issue が求める `wide` のみを additive に追加する。desktop は既存 project default で温存（無 suffix baseline 維持）。
2. **拡張方式は B 案（per-test viewport 切替）を確定**: 既存 project に sidebar-shell 系のような viewport 別 project 複製（A 案）を増やすとメンテ面が増えるため、単一 project 内で `page.setViewportSize()` を切り替え、snapshot 名に `-mobile` / `-tablet` / `-wide` suffix を付ける B 案を採用する。現行 config に同型先例（`admin-members-prototype-redesign.spec.ts` の VIEWPORTS ループ）があり整合する。
3. **CI workflow は無改修**: `staging-visual-authenticated` project はファイル glob で spec を拾うため、新 suffix baseline は再 commit するだけで CI の回帰検出に自動参加する。YAML 改修は不要（AC「CI で新 baseline が回帰検出に組み込まれる」を満たす）。

## スコープ（1 サイクル内完了）

CONST_007 に従い、本実行サイクル 1 サイクルで完了する単一スコープに収める。先送り・別 PR 分離はしない。

| 含む | 含まない |
| --- | --- |
| `admin-members-bulk-tag-authenticated.spec.ts` への mobile / tablet / wide × assign / unassign baseline 追加（B 案） | issue-1077 既存 desktop baseline 挙動の変更 |
| `viewports.ts` への `wide` viewport additive 追加 | result mutation baseline（issue-1125 が担当） |
| viewport suffix 命名規約の確定と Phase 11 evidence ledger 同期 | `BulkActionBar.tsx` component 実装そのものの変更 |
| read-only capture（mutation 不在）の維持 | production capture / commit / push / PR |

## Phase 構成

| Phase | 内容 | 成果物 |
| --- | --- | --- |
| 1 | 要件定義・実装区分判定・issue 最適化 | [phase-1](outputs/phase-1/phase-1.md) |
| 2 | 設計（spec 差分・viewport 表・snapshot 命名） | [phase-2](outputs/phase-2/phase-2.md) |
| 3 | 設計レビュー（4 条件評価） | [phase-3](outputs/phase-3/phase-3.md) |
| 4 | テスト計画 | [phase-4](outputs/phase-4/phase-4.md) |
| 5 | 実装手順（変更ファイル・差分方針） | [phase-5](outputs/phase-5/phase-5.md) |
| 6 | テスト追加方針 | [phase-6](outputs/phase-6/phase-6.md) |
| 7 | カバレッジ確認 | [phase-7](outputs/phase-7/phase-7.md) |
| 8 | リファクタリング方針 | [phase-8](outputs/phase-8/phase-8.md) |
| 9 | 品質保証 | [phase-9](outputs/phase-9/phase-9.md) |
| 10 | 最終レビュー | [phase-10](outputs/phase-10/phase-10.md) |
| 11 | 手動テスト / evidence 計画 | [phase-11](outputs/phase-11/phase-11.md) |
| 12 | ドキュメント（strict 7） | [phase-12](outputs/phase-12/main.md) |
| 13 | PR 作成（user-gated） | [phase-13](outputs/phase-13/phase-13.md) |

## user-gated 境界

staging visual capture・`--update-snapshots`・commit・push・PR 作成・issue 状態変更はすべてユーザー明示承認後にのみ実行する。本ワークフローは仕様書作成のみで close-out する。
