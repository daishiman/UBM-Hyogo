# issue-1103 globals.css 重複 shell ブロック 1 本化 — 実装仕様書 index

`[実装区分: 実装仕様書]`（コード変更を伴う / `implementation_mode: new` / `NON_VISUAL` / `status: implemented_local_evidence_captured`）

> 実装区分の判定根拠: issue #1103 の既定ラベルは `type:refactoring` / `type:followup` だが、root cause（`apps/web/src/styles/globals.css` 内の構造的重複 = `parallel-01 P1-1〜P1-5` ブロックが byte 完全一致で 2 回定義）を解消するには **コード変更（重複ブロック削除）が必須**。CONST_004 に従い実装仕様書として作成する（ラベルより実態優先）。

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task_id | `issue-1103-globals-css-shell-block-consolidation` |
| issue | [#1103](https://github.com/daishiman/UBM-Hyogo/issues/1103)（**CLOSED**・reopen しない） |
| 分類 | リファクタリング（CSS 構造的重複除去 / DRY / drift 防止） |
| 対象機能 | `apps/web/src/styles/globals.css` の shell / token surface 定義 |
| 優先度 | 低（`priority:low` / `scale:small`） |
| 実装区分 | 実装仕様書（`implementation_spec`） |
| implementation_mode | `new` |
| visual_category | `NON_VISUAL`（byte 一致ブロック削除 = 証明可能な視覚不変） |
| status | `implemented_local_evidence_captured`（commit・push・PR・staging screenshot は user-gated） |
| branch | `docs/issue-1103-globals-css-shell-block-consolidation-spec`（base=`dev`） |
| 親タスク | `sidebar-footer-pinning-and-account-popover-ux`（Phase 8 Task 8-1 で整合のみ実施・統合は本 follow-up へ分離） |
| 消費元未タスク | `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/unassigned-task-specs/sidebar-footer-pinning-and-account-popover-ux-followup-002-globals-css-sidebar-block-consolidation.md` |

## 1 サイクル完了スコープ（CONST_007）

本 wave で、仕様書群の作成と単一ファイル `apps/web/src/styles/globals.css` の重複ブロック削除を完了した。先送り（別 PR / バックログ / Phase 2）に分離した項目は **なし**。commit / push / PR / staging screenshot のみ user-gated として残す。

## 調査結論（2026-06-05 現行コード）

| 観点 | 結論 |
| --- | --- |
| 他タスクで解決済みか | 実行前は未解決。2026-06-05 本 wave で後発重複ブロックを削除済み |
| `[data-shell="sidebar"]` 出現箇所 | 削除後は 1708 行（parallel-01 残存）+ 2174 行（admin スコープ派生・対象外）の 2 件 |
| 重複の真の範囲 | issue 記述（`[data-shell]` のみ）より広く、実行前は `parallel-01 P1-1〜P1-5` ブロック全体 130 行が byte 完全一致で 2 回（1642-1772 と 1774-1904）繰り返し |
| cascade 文脈 | 両ブロックとも同一 `@layer components`（124 行開始）直下・@media 非内包 → 完全同一。機械的削除で視覚不変 |
| 解消結果 | 後発ブロック（旧 1774-1904）を削除し、先発ブロック（1642-1772）を残した。byte 一致削除 = ゼロ cascade 変化 |

> **issue の現行コード最適化**: issue の重複対象記述（`[data-shell]` topbar/sidebar/footer + typography）を、現行コードの実態（`parallel-01 P1-1` page surface / `P1-2` section rhythm / `P1-3` card chrome / `P1-4` shell surface / `P1-5` typography の 5 ブロック全体）へ再スコープした。削除対象は後発の重複ブロック全体（1774-1904）とする。

## 受入条件（AC）

- **AC-1**: `grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` が **2 件**（dedup 後の parallel-01 ブロック 1 件 + admin スコープ派生 1 件）になる（削除前 3 件）。
- **AC-2**: `parallel-01 P1-1〜P1-5` の重複ブロック全体が 1 本化される。
- **AC-3**: 削除前に 2 ブロックの byte 一致（diff 空）と cascade 文脈同一を証明し evidence に記録。
- **AC-4**: 削除 diff は重複ブロックの除去のみ（残存ブロックの値は無変更）。
- **AC-5**: shell 描画値（高さ 100dvh / border / 背景 / typography スケール）を変えない。
- **AC-6**: HEX 直書きを増やさず token 変数経由維持（I-4 / `verify:tokens` / `verify-design-tokens` gate 緑）。
- **AC-7**: `pnpm --filter @ubm-hyogo/web build` 成功・統合前後で描画が視覚不変。

## Phase 構成

| Phase | 名称 | 成果物 | status |
| --- | --- | --- | --- |
| 1 | 要件定義 | `phase-1-requirements.md` | completed（spec） |
| 2 | 設計 | `phase-2-design.md` | completed（spec） |
| 3 | 設計レビュー | `phase-3-design-review.md` | completed（spec） |
| 4 | テスト作成 | `phase-4-test-plan.md` | completed（spec） |
| 5 | 実装 | `phase-5-implementation.md` | completed（local implementation） |
| 6 | テスト拡充 | `phase-6-test-additions.md` | completed（spec） |
| 7 | カバレッジ確認 | `phase-7-coverage.md` | completed（spec） |
| 8 | リファクタリング | `phase-8-refactor.md` | completed（spec） |
| 9 | 品質保証 | `phase-9-qa.md` | completed（spec） |
| 10 | 最終レビュー | `phase-10-final-review.md` | completed（local evidence） |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` | completed（NON_VISUAL evidence） |
| 12 | ドキュメント更新 | `outputs/phase-12/main.md` ほか strict 7 | completed（synced） |
| 13 | PR 作成 | `phase-13-pr.md` | blocked（user-gated） |

## user-gated 境界

`git commit` / `git push` / PR 作成・staging screenshot 取得は **ユーザー明示承認後のみ**。globals.css の local 実装と NON_VISUAL 証跡更新は本 wave で完了した。
