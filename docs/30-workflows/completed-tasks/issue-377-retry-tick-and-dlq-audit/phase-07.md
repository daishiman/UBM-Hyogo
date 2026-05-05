# Phase 7: 整合性検証

## 検証項目

| # | 観点 | 検証方法 | 期待 |
| - | - | - | - |
| 1 | 既存 cron 分岐との衝突 | `grep -n "cron ===" apps/api/src/index.ts` | `*/5 * * * *` が他分岐と被らない |
| 2 | repository 関数シグネチャ | `grep -n "export.*incrementRetry\|moveToDlq\|listPending" apps/api/src/repository/tagQueue.ts` | Phase 2 と一致 |
| 3 | audit action 利用 | `tagQueueRetryTick.ts` を grep | `auditAction("admin.tag.queue_dlq_moved")` が使われる |
| 4 | wrangler triggers 上限 | `grep "crons" apps/api/wrangler.toml` で配列長計測 | top-level / staging / production すべて ≤ 3 |
| 5 | DB スキーマ非変更 | `git diff --stat -- apps/api/migrations/` | 0 ファイル |
| 6 | aiworkflow-requirements drift | `pnpm indexes:rebuild` 後 `git diff` | resource-map / quick-reference / task-workflow-active / lessons / keywords が同期済み |
| 7 | unused import / lint | `pnpm lint` | exit 0 |
| 8 | 型整合 | `pnpm typecheck` | exit 0 |

## 完了条件

- [ ] 8 項目すべての検証コマンドと結果が `outputs/phase-07/main.md` に記録される。

## 出力

- outputs/phase-07/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

実装後の整合性を確認する。

## 実行タスク

- cron parity / tests / aiworkflow sync を検証する。

## 参照資料

- `outputs/phase-11/main.md`

## 成果物/実行手順

- `outputs/phase-07/main.md`

## 統合テスト連携

- focused Vitest 6 cases
