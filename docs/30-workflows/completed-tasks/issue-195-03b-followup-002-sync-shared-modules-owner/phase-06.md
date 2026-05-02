# Phase 6: ユニット相当検証（vitest + owner 表 lint）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 6 / 13 |
| --- | --- |
| 前 Phase | 5（実装） |
| 次 Phase | 7（統合検証＝cross-ref） |
| 状態 | completed |

## 目的

新規 `_shared/` skeleton の vitest と、owner 表 markdown の構造健全性を確認する。

## 検証項目

| ID | チェック | コマンド | 期待 |
| --- | --- | --- | --- |
| U-1 | `_design/` 配下に 2 ファイル存在 | `find docs/30-workflows/_design -maxdepth 1 -type f -name '*.md' \| wc -l` | `>= 2` |
| U-2 | owner 表に 5 列ヘッダ存在 | `head -20 docs/30-workflows/_design/sync-shared-modules-owner.md \| grep -E '^\\\| ファイル \\\| owner task \\\| co-owner task \\\| 変更時の必須レビュアー \\\| 備考 \\\|'` | 1 件 hit |
| U-3 | owner 表に 3 行以上 | `grep -cE '^\\\| \\\`apps/api/src/jobs/_shared/' docs/30-workflows/_design/sync-shared-modules-owner.md` | `>= 3` |
| U-4 | 変更ルールが箇条書きで 4 項目以上 | `awk '/^## 変更ルール/,/^## /' docs/30-workflows/_design/sync-shared-modules-owner.md \| grep -cE '^[0-9]+\\.'` | `>= 4` |
| U-5 | README.md にリンクあり | `grep -F 'sync-shared-modules-owner.md' docs/30-workflows/_design/README.md` | 1 件 hit |
| U-6 | `_shared/` unit tests | `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared` | PASS |

## DoD

- U-1〜U-6 すべて期待値達成
- 結果を `outputs/phase-06/markdown-lint.log` に保存

## 成果物

- `outputs/phase-06/markdown-lint.log`

## 完了条件

- 全 U-* PASS

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
