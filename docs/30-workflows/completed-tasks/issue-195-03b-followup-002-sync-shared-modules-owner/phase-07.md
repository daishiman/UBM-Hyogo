# Phase 7: 統合相当検証（cross-reference）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 7 / 13 |
| --- | --- |
| 前 Phase | 6 |
| 次 Phase | 8（受け入れテスト） |
| 状態 | completed |

## 目的

03a / 03b の `index.md` から owner 表へ 1 ホップで到達できることを実コマンドで検証する。

## 検証項目

| ID | チェック | コマンド | 期待 |
| --- | --- | --- | --- |
| I-1 | 03a index.md にリンク存在 | `grep -F 'sync-shared-modules-owner.md' docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | 1 件 hit |
| I-2 | 03b index.md にリンク存在 | `grep -F 'sync-shared-modules-owner.md' docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | 1 件 hit |
| I-3 | 相対パス到達性 | 03a / 03b index.md の親ディレクトリから `ls ../../_design/sync-shared-modules-owner.md` 相当で実ファイルに解決 | exit 0 |
| I-4 | followups draft からの参照を更新 | `grep -F 'sync-shared-modules-owner' docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-002-sync-shared-modules-owner.md` | 1 件以上 hit（既存 draft が新表を参照する場合） |
| I-5 | broken link なし | 任意の markdown link checker（`npx markdown-link-check` 等）を新規 / 編集 markdown に対して実行 | broken 0 件 |

## I-3 検証コマンド例

```bash
( cd docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue && ls ../../_design/sync-shared-modules-owner.md )
( cd docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver && ls ../../_design/sync-shared-modules-owner.md )
```

## DoD

- I-1〜I-5 すべて PASS
- 結果を `outputs/phase-07/cross-ref.log` に保存

## 成果物

- `outputs/phase-07/cross-ref.log`

## 完了条件

- 全 I-* PASS

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
