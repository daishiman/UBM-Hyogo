# Phase 11 Manual Evidence

## 判定

04c は API endpoint のみの NON_VISUAL タスクである。`apps/web` / `apps/desktop` の UI 変更はなく、スクリーンショットは対象外。

## 実行済み自動検証

| コマンド | 結果 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/api test -- --run` | PASS: 48 files / 251 tests |

補足: 現ローカル環境は Node `v22.21.1` のため、package engine `node: 24.x` に対する warning が出る。テスト自体は全件 PASS。

## 手動 smoke の扱い

dev/staging deploy 後に `outputs/phase-11/main.md` の curl 手順を実行して更新する。本ブランチ内では local Vitest を Phase 11 の代替 evidence とする。

## スクリーンショット

不要。06c admin pages タスクで UI 統合後に撮影する。
