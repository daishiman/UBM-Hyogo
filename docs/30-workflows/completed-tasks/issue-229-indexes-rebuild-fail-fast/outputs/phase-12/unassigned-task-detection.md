# 未タスク検出レポート — issue-229-indexes-rebuild-fail-fast

> task-specification-creator Phase 12 の必須成果物（0 件でも必須出力）。本タスクの current 未タスクは **0 件**。`task-specification-creator/scripts/generate-index.js` は `pnpm indexes:rebuild` に未配線の別経路であり、本 issue #229 の AC では実装対象にしない。

## 1. current（本ワークフロー scope 内で解決済）

| # | 観点 | 状態 |
| --- | --- | --- |
| C-1 | `generate-index.js`（aiworkflow-requirements）の fail-fast / atomic write / decisive log | 本タスクの spec で AC-1〜AC-8 として網羅。実装は今回サイクルで完了 |
| C-2 | 回帰 spec test の配置・glob | `scripts/__tests__/generate-index-fail-fast.spec.ts` に決定済（AC-7） |
| C-3 | byte-identical 不変条件 | AC-4 で固定。未解決事項なし |

> current の未タスク（新規起票が必要なもの）: **0 件**。本ワークフローの scope は閉じている。

## 2. baseline（本ワークフロー scope 外の非対象）

| # | 候補 | 検出根拠 | 起票判断 |
| --- | --- | --- | --- |
| B-1 | `task-specification-creator/scripts/generate-index.js` | 同名スクリプトが別 skill に存在するが、`pnpm indexes:rebuild`（package.json）には **未配線**。本タスクの hardening 対象（aiworkflow-requirements 側）とは別経路 | **未タスク化しない**。Issue #229 の decisive exit ループに含まれず、今回実装すると scope と依存関係が拡大して不整合になるため、対象外として記録のみ |

## 3. 検出件数サマリー

| 区分 | 件数 |
| --- | --- |
| current（要新規起票） | 0 |
| baseline（scope 外の非対象） | 1（B-1） |
| **合計検出（要起票）** | **0** |

## 4. 起票方針

- 新規起票なし。
- B-1 は `pnpm indexes:rebuild` への配線要否が未定義であり、今回の AC とは依存関係が異なるため、未タスク化しない。
- Issue #229 は CLOSED のまま扱い、reopen / mutation は行わない。
