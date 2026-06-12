# Phase 9 — 品質保証 一括判定方針（main.md）

> 型 / lint / vitest / token / diff / line budget / link / a11y を一括判定する方針とコマンド一覧。各検証の PASS 条件を明示する。

## 1. 型 / lint / vitest 一括実行

```bash
# 1) 型チェック
mise exec -- pnpm typecheck
# 2) lint
mise exec -- pnpm lint
# 3) vitest（監査ログ component の変更ファイルに限定）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
```

| 検証 | PASS 条件 |
| --- | --- |
| typecheck | exit 0。新規 helper（`describeAuditAction` 等）の型が解決 |
| lint | exit 0。inline style / boundary / no-inline-style 違反なし |
| vitest（対象限定） | 全 TC / TC-E PASS。exit 0 |

## 2. line budget / link 判定

| 項目 | 方針 |
| --- | --- |
| line budget（docs） | 各 phase / outputs が冗長化しない（200 行程度を上限の目安）。SSOT 重複は参照で代替 |
| link 健全性 | phase-NN.md / outputs が参照する相対パス（`outputs/phase-NN/*.md` / `_shared-context.md`）が実在する |
| CSS line budget | `globals.css` の追加分は `.admin-audit-filter-advanced` 系 + glossary/meta の minmax 上書きのみ（最小差分） |

## 3. AC-8/9/10/11 機械検証（詳細は token-audit.md）

| AC | コマンド | PASS 条件 |
| --- | --- | --- |
| AC-8 | `pnpm verify:tokens` + 追加 CSS の HEX grep | gate PASS + grep 0 件 |
| AC-9 | `git diff --name-only -- apps/api packages/shared` + name 属性 grep | diff 空 + name 8 個維持 |
| AC-10 | `git status --porcelain apps/web/src/components/ui/` | 新規ファイル 0 件 |
| AC-11 | FormField label / details キーボード / aria-label チェックリスト | 全項目 OK |

## 4. 削除確認の基準（[FB-UI-02-1]）

- 本タスクは**削除ファイルなし**。`git status` に `D`（deleted）行が無いことを確認する。
- 不要になったコード（旧英語ラベルの直書き等）は git delete で物理削除し、コメントアウト stub を残さない（dead code を増やさない）。
- 旧 datalist placeholder（`attendance.add` 等の生コード）は新しい日本語 placeholder へ**置換**であり削除ではない。

## 5. 一括判定の最終 PASS 条件

- §1〜§3 のすべてが PASS（exit 0 / 0 件 / 全項目 OK）であれば Phase 10（最終レビュー）へ進む。
- いずれかが FAIL の場合は Phase 5（実装）/ Phase 8（リファクタ）へ差し戻す。
