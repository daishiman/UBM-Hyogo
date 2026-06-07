# Phase 11: 手動テスト証跡 — issue-1103

> **[実装区分: 実装仕様書 / NON_VISUAL / status: implemented_local_evidence_captured]**

## NON_VISUAL 宣言 [Feedback BEFORE-QUIT-001 / Feedback 4 / WEEKGRD-03]

- **タスク種別**: NON_VISUAL
- **非視覚的理由**: `apps/web/src/styles/globals.css` 内で **byte 完全一致**で 2 回定義された `parallel-01 P1-1〜P1-5` ブロックのうち、後発の重複ブロック（1774-1904 行）を削除するだけの構造的リファクタリング。両ブロックは同一 `@layer components` 直下・@media 非内包で cascade 文脈が完全同一のため、削除後の computed style は数学的に不変。よって画面の見た目は一切変わらない。
- **代替証跡（主ソース）**: `diff`（2 ブロック byte 一致証明）+ `grep`（`data-shell="sidebar"` 出現件数）+ `pnpm --filter @ubm-hyogo/web build`（ビルド成功）+ token gate（`apps/web/src/__tests__/tokens.runtime.spec.ts` / `verify-design-tokens`）の 4 系統。
- **スクリーンショットを作らない理由**: byte 一致ブロックの削除は cascade 文脈同一の下で computed style を変えないため、before/after のスクリーンショットは必ず同一画像になり証跡価値がない。視覚回帰の代わりに「削除の安全性そのもの（byte 一致 + cascade 文脈同一）」を機械的に証明する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-1103-globals-css-shell-block-consolidation |
| タスク種別 | NON_VISUAL（実装仕様書 / implementation_mode: new / status: implemented_local_evidence_captured） |
| 実施日（仕様作成） | 2026-06-05 |
| 実施者 | 2026-06-05 local implementation wave（commit・push・PR・staging screenshot は user-gated） |
| 想定環境 | ローカル（Node 24.15.0 / pnpm 10.33.2・`mise exec` 経由） |
| 対象ファイル | `apps/web/src/styles/globals.css`（唯一の変更対象） |

## implemented_local_evidence_captured 段階の宣言

本 wave は **実装仕様書（Phase 1-13）の作成と `apps/web/src/styles/globals.css` の重複削除**を完了した。commit / push / PR / staging screenshot は user 明示承認後にのみ実行する。本ファイルは NON_VISUAL の local evidence として、削除後の grep / diff / build / token gate の結果を記録する。

> Gate-C は local implementation evidence として passed。commit / push / PR / staging screenshot は Phase 13 の user-gated 境界に残す。

## 証跡の主ソース（検証コマンドスイート）

| # | 主ソース | 役割 |
| --- | --- | --- |
| 1 | `diff`（2 ブロックの byte 一致） | 削除対象ブロックが残存ブロックと完全一致であることを証明（AC-3） |
| 2 | `grep -n 'data-shell="sidebar"'` | 削除前 3 件 → 削除後 2 件の出現数で 1 本化を確認（AC-1） |
| 3 | `pnpm --filter @ubm-hyogo/web build` | CSS パース成功・ビルド成功（AC-7） |
| 4 | token gate（`tokens.runtime.spec.ts` / `verify-design-tokens`） | HEX 直書きを増やさず token 変数経由維持（AC-6 / I-4） |

これら 4 系統で、視覚証跡（スクリーンショット）の代替とする。

## 検証項目チェックリスト（TC-ID 形式・implemented_local_evidence_captured）

各 TC は本 wave の local implementation 後に確認する。

| TC-ID | 検証内容 | 期待値 | 主ソース | 状態 |
| --- | --- | --- | --- | --- |
| TC-01 | 削除前に 2 ブロックが byte 完全一致 | `diff <(ブロック1: 1642-1772) <(ブロック2: 1774-1904)` が **空**（差分 0 行） | diff | PASS（pre-edit evidence） |
| TC-02 | 両ブロックの cascade 文脈が同一 | 両ブロックとも同一 `@layer components`（124 行開始）直下・@media 非内包であることを確認 | 目視 + grep | PASS（pre-edit evidence） |
| TC-03 | `data-shell="sidebar"` 出現件数（削除前） | `grep -n 'data-shell="sidebar"'` が 3 件（1708 / 1840 / 2306 行） | grep | PASS（pre-edit evidence） |
| TC-04 | `data-shell="sidebar"` 出現件数（削除後・AC-1） | `grep -n 'data-shell="sidebar"'` が 2 件（1708 / 2174 行） | grep | PASS |
| TC-05 | 削除 diff は重複ブロック除去のみ（AC-4） | `git diff --stat` が `apps/web/src/styles/globals.css | 132 deletions(-)`、追加行 0 | git diff | PASS |
| TC-06 | build green（AC-7） | `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0（Sentry/Prisma instrumentation warning は既存 upstream warning） | build | PASS |
| TC-07 | token gate green（AC-6 / I-4） | `mise exec -- pnpm verify:tokens` exit 0（91 tracked in sync）+ `tokens.runtime.spec.ts` 9 tests PASS | token gate | PASS |

## source-level PASS と環境ブロッカーの分離 [WEEKGRD-01]

- **source-level（仕様確定）**: TC-01（byte 一致）と TC-02（cascade 文脈同一）は調査段階で実機確認済み（`diff` 空・両ブロックとも同一 `@layer components` 直下・@media 非内包）。この二重証明により、後発ブロック削除後の computed style 不変は数学的に保証される。よって TC-03〜TC-07 は source-level で合格見込みが確立している。
- **環境ブロッカー**: 想定なし。リスクとしては Vitest / esbuild runtime（arch / worktree isolation / esbuild version）のみ。token gate 実走時に発生した場合は `pnpm verify:vitest-runtime` で切り分ける（本タスク固有の欠陥ではなく環境要因として分離記録する）。

## 結論

NON_VISUAL タスクとして、視覚証跡の代替に diff（byte 一致）+ grep（出現件数）+ build + token gate の 4 系統を主ソースとする。byte 一致 + cascade 文脈同一の二重証明により、後発重複ブロック（1774-1904）の削除は computed style を変えない。本 wave は **implemented_local_evidence_captured**。commit / push / PR / staging screenshot は user-gated。
