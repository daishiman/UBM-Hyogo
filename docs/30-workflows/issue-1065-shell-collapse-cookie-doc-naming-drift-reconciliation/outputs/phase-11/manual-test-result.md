# Phase 11: 手動テスト証跡

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## NON_VISUAL 宣言 [Feedback BEFORE-QUIT-001 / Feedback 4 / WEEKGRD-03]

- **タスク種別**: NON_VISUAL
- **非視覚的理由**: UI/UX の視覚的変更なし。export 名の縮約（dead alias 3 件削除）と設計 doc 文字列整合のみ。sidebar 表示・collapse 挙動・cookie 永続化は一切変わらない。
- **代替証跡（主ソース）**: focused Vitest `shell-collapse-cookie.spec.ts`（4 テストケース）+ `typecheck` + `lint` + `grep`（alias 0 参照確認）。
- **スクリーンショットを作らない理由**: 画面変化が一切ないため。視覚回帰を撮っても before/after が同一であり証跡価値がない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-1065-shell-collapse-cookie-doc-naming-drift-reconciliation |
| タスク種別 | NON_VISUAL（実装仕様書 / implementation_mode: new） |
| 実施日 | 2026-06-03 |
| 実施者 | 実装実行段階（commit/PR は user-gated・本体実装はローカル実行済） |
| 環境 | ローカル（Node 24.15.0 / pnpm 10.33.2・`mise exec` 経由） |

## 証跡の主ソース

- **自動テスト**: `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`
- **テストケース件数**: 4（parse 値→boolean / serialize / document 書込 / document 読取）
- これに `typecheck` / `lint` / `grep`（alias 0 参照）を加えた 4 系統で、視覚証跡（スクリーンショット）の代替とする。

## 検証項目チェックリスト（TC-ID 形式）

本体実装をローカルで実行済み（commit/PR のみ user-gated）。各 TC は **実測 PASS** を取得済み。

| TC-ID | 検証内容 | 期待値 | 主ソース | 状態 |
| --- | --- | --- | --- | --- |
| TC-01 | `parseShellCollapsedCookie` が cookie 値を boolean に parse | `"true"`→`true` / `"false"`→`false` / 不正値→`null` / `null`→`null` | Vitest ケース 1 | ✅ PASS（4 tests passed） |
| TC-02 | `serializeShellCollapsedCookie` が client writable cookie を生成 | `ubm_shell_collapsed=true|false`・Path=/・SameSite=Lax・Max-Age=31536000 | Vitest ケース 2 | ✅ PASS |
| TC-03 | `writeShellCollapsedCookie` が document へ書込 | `document.cookie` に `ubm_shell_collapsed=true` 反映 | Vitest ケース 3 | ✅ PASS |
| TC-04 | `readCollapsedFromDocument` が document から読取 | 他 cookie 混在下でも `true` を返す | Vitest ケース 4 | ✅ PASS |
| TC-05 | alias 削除後の grep 0 参照 | `rg "readCollapsedFromCookieString|writeCollapsedCookie|SHELL_COLLAPSE_COOKIE\b" apps/web/src` が 0 件 | grep | ✅ PASS（apps/web/src 0 件） |
| TC-06 | typecheck green | `pnpm typecheck` exit 0 | typecheck | ✅ PASS（全 7 project Done） |
| TC-07 | lint green | `pnpm lint` exit 0 | lint | ✅ PASS（no dependency violations / eslint clean） |

## source-level PASS と環境ブロッカーの分離 [WEEKGRD-01]

- **source-level（仕様確定）**: TC-01〜TC-04 は既存 focused Vitest が primary 名のみ import しており、alias 削除後も不変で PASS する設計（Phase 4 で確認済）。TC-05〜TC-07 は alias が 0 参照のため削除で fail し得ない。よって source-level の合格見込みは確立済み。
- **環境ブロッカー**: 想定なし。リスクとしては Vitest / esbuild runtime（arch / worktree isolation / esbuild version）のみ。発生時は `pnpm verify:vitest-runtime` で切り分ける（本タスク固有の欠陥ではなく環境要因として分離記録する）。

## 結論

NON_VISUAL タスクとして、視覚証跡の代替に focused Vitest 4 ケース + typecheck + lint + grep を主ソースとする。本体実装をローカルで実行し、TC-01〜TC-07 全件 **実測 PASS**（Vitest 4/4 passed・typecheck exit 0・lint exit 0・alias grep 0 件）を取得した。commit/PR のみ user-gated。
