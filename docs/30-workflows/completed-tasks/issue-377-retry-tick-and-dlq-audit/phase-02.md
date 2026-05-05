# Phase 2: 既存実装調査

## 目的

retry tick / DLQ audit 実装に必要な現行コードの所在と契約を Phase 5/6 のシグネチャ確定前に固定する。

## 調査対象と確定事項

| 対象 | パス | 確定事項 |
| --- | --- | --- |
| repository | `apps/api/src/repository/tagQueue.ts` | `incrementRetry(c, queueId, errorMessage, now, maxRetry?) => {moved:'retry'\|'dlq'\|'noop'}` / `moveToDlq(c, queueId, errorMessage, now) => {changed}` / `listPending(c, {now, limit?}) => Row[]` / `TAG_QUEUE_MAX_RETRY=3` / `TAG_QUEUE_BACKOFF_BASE_SEC=30` |
| scheduled handler | `apps/api/src/index.ts:278-318` | 既存 cron 分岐: `*/15 * * * *`（forms sync）/ `0 18 * * *`（schema sync）/ `0 * * * *`（sheets sync）。新規分岐は分岐 if 文で追加 |
| audit ヘルパ | `apps/api/src/repository/_shared/brand.ts` | `auditAction(literal)` brand 関数。新値 `"admin.tag.queue_dlq_moved"` の追加が必要 |
| audit 挿入パターン | `apps/api/src/workflows/tagQueueResolve.ts:200-240` | `auditAction("admin.tag.queue_resolved")` を使った INSERT パターンを参照 |
| wrangler triggers | `apps/api/wrangler.toml` | dev: `crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]` / prod: 2 本 / staging: 3 本 |
| cron 上限 | Cloudflare free plan | account 全体 3 本程度。production は厳密に管理 |

## 探索コマンド（再現用）

```bash
grep -n "incrementRetry\|moveToDlq\|listPending\|TAG_QUEUE_MAX_RETRY" apps/api/src/repository/tagQueue.ts
grep -n "scheduled\|cron ===" apps/api/src/index.ts
grep -n "auditAction" apps/api/src/repository/_shared/brand.ts
grep -n "crons" apps/api/wrangler.toml
```

## リスク

- production cron 本数上限を超えると deploy fail → Phase 10 で staging だけに先行追加し、production は別 wave に分離する選択肢を残す（CONST_007 例外）。
- `apps/api/src/repository/tagQueue.ts` の `listPending` は fakeD1 制約で JS 側で next_visible_at をフィルタしているため、retry tick 側でも `now` を必ず明示的に渡す。

## 完了条件

- [ ] 上記表のすべてのパス・関数シグネチャが現行コードと一致することを `outputs/phase-02/main.md` に grep 結果付きで記録する。

## 出力

- outputs/phase-02/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- 既存 repository / cron / audit 契約を確認する。

## 参照資料

- `apps/api/src/repository/tagQueue.ts`
- `apps/api/src/index.ts`

## 成果物/実行手順

- `outputs/phase-02/main.md`

## 統合テスト連携

- `apps/api/src/workflows/tagQueueRetryTick.test.ts`
