[実装区分: 実装仕様書]

# Phase 9: 品質保証 (Quality Assurance)

## 前提
- Phase 8（実装・統合）完了
- `_shared-context.md` を遵守
- 本リポ: `UBM-Hyogo`（skill-creator mirror 対象外）

## 目的
Admin 出席分析ページ UI/UX 全面刷新の最終品質ゲートを通過させ、DoD を満たす。

---

## 1. Lint: `pnpm -w lint`
- **コマンド**: `pnpm -w lint`
- **内訳**: `tsc --noEmit` + `eslint .`
- **期待結果**: エラー 0 件・警告 0 件
- **失敗時対応**: Phase 8 実装に戻り型/lint 修正後再実行
- **PASS 基準**: 終了コード 0

## 2. Build: `pnpm -w build`
- **コマンド**: `pnpm -w build`
- **対象**: `apps/web`（Next.js）/ `apps/workers`（Cloudflare Workers）/ `packages/shared`
- **期待結果**: 全パッケージビルド成功
- **PASS 基準**: 終了コード 0、出力 artifact 生成確認

## 3. Test: `pnpm -w test`
- **コマンド**: `pnpm -w test`
- **対象**: unit / integration（vitest）
- **期待結果**: 全テストグリーン（failed=0, skipped 既知のみ）
- **PASS 基準**: 終了コード 0

## 4. 内部リンク確認（仕様書内参照の生存）
- **対象**: `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/` 配下の Phase 仕様書群が参照する正本 API 仕様
- **検証コマンド**:
  ```bash
  rg -n '01-api-schema\.md' docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/
  test -f docs/00-getting-started-manual/specs/01-api-schema.md
  ```
- **PASS 基準**: 全参照先ファイルが存在（broken link 0）

## 5. File Delete 判定 PASS（FB-UI-02-1）
- **本タスク**: 削除対象ファイル **なし**（明示）
- **判定**: FB-UI-02-1 ルールに従い、削除対象 0 件 → 自動 PASS
- **記録**: `artifacts.json` に `"deleted_files": []` を記載

## 6. Fixture 削除確認
- **適用条件**: 404 原因が fixture に起因する場合のみ該当
- **本タスク**: 404 原因の fixture は **未検出** → 該当外
- **検証**: `grep -rn 'fixture' apps/web/src/features/admin/attendance/` で残置 fixture 参照が production path に含まれないことを確認
- **PASS 基準**: 残置 fixture が prod ルートに影響しない

## 7. Design Token 直書き検出
- **コマンド**:
  ```bash
  grep -rEn '#[0-9a-fA-F]{3,6}' apps/web/src/features/admin/attendance/
  ```
- **期待結果**: マッチ 0 件
- **PASS 基準**: hex カラー直書きゼロ。全色は Design Token 経由参照
- **失敗時**: Phase 8 へ差し戻し、token 化

## 8. .agents Mirror Parity
- **本リポ**: `UBM-Hyogo`（skill-creator mirror **非対象**）
- **判定**: 該当外（N/A）を明記
- **理由**: mirror 機構は `xl-skills` 系リポ専用

## 9. Definition of Done (DoD)
| # | 項目 | 基準 | 仕様作成時の状態 |
|---|------|------|------|
| 1 | lint | `pnpm -w lint` 0 error | `spec_created`（Phase 9 実行時に判定） |
| 2 | build | `pnpm -w build` 成功 | `spec_created`（Phase 9 実行時に判定） |
| 3 | test | `pnpm -w test` green | `spec_created`（Phase 9 実行時に判定） |
| 4 | 内部リンク | broken link 0 | `spec_created`（検証コマンド定義済み） |
| 5 | file delete | FB-UI-02-1 基準 | `spec_created`（削除なし方針） |
| 6 | fixture | prod 影響 0 | `spec_created`（404 RCA 後に判定） |
| 7 | token 直書き | grep hit 0 | `spec_created`（実装後に判定） |
| 8 | mirror parity | N/A 明記 | `spec_created`（UBM-Hyogo では N/A） |

**全項目 PASS をもって Phase 9 完了。** 1 項目でも FAIL の場合は該当 Phase へ差し戻し、修正後 Phase 9 を再実行する。
