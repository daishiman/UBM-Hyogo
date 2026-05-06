# Phase 5: 実装（migration / repository / route enqueue）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（前半: 永続層 + enqueue 結線） |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (実装: dispatcher / templates / workflow) |
| 状態 | spec_created |

## 目的

D1 schema・outbox repository・resolve API 末尾の enqueue 呼出までを実装する。Phase 6（dispatcher 系）の前提を整える。

## 変更対象ファイル

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/migrations/0014_notification_outbox.sql` | 新規 | Phase 2 の DDL（`notification_outbox` / `notification_ledger` + index） |
| `apps/api/src/repository/notificationOutbox.ts` | 新規 | Phase 2 interface 実装 |
| `apps/api/src/repository/__tests__/notificationOutbox.test.ts` | 新規 | repository テスト（AC-2 / AC-4） |
| `apps/api/src/routes/admin/requests.ts` | 編集 | resolve 成功 return 直前に best-effort enqueue を呼ぶ |
| `apps/api/src/routes/admin/requests.test.ts` | 編集 | AC-1 / AC-3 のケース追加 |
| `apps/api/src/index.ts` | 編集 | DI コンテナ（`createOutboxRepository`）を resolve route へ供給 |

## 実装詳細

### 5-1. migration

```sql
-- apps/api/migrations/0014_notification_outbox.sql
-- Phase 2 で固定した DDL をそのまま配置
```

ローカル apply: `bash scripts/cf.sh wrangler d1 migrations apply ubm-hyogo-db-local --local`

### 5-2. notificationOutbox repository

実装ポイント:
- `enqueue`: `INSERT ... ON CONFLICT(note_id, outcome) DO NOTHING` → `changes()` で 0 のとき `{ ok: false, reason: "duplicate" }`
- `claimNextBatch`: 1 文の `UPDATE ... SET status='dispatching', updated_at=? WHERE notification_id IN (SELECT notification_id FROM notification_outbox WHERE status='pending' AND next_attempt_at<=? ORDER BY next_attempt_at LIMIT ?) RETURNING *`（D1 は `RETURNING` を支援）
- `markSent` / `markRetryableFailure` / `moveToDlq`: 個別 UPDATE。retryable failure は `status='pending'` へ戻し、`retry_count++` と `next_attempt_at` 更新で再取得可能にする
- `appendLedger`: `INSERT INTO notification_ledger`、ulid を deps から注入可能（テスト固定化）
- `findRecipientEmail`: `member_identities.response_email` から宛先を取得。空 / NULL / row 不在は `null`

### 5-3. resolve route 結線

`apps/api/src/routes/admin/requests.ts` の resolve handler、resolve transaction 成功後 `c.json({ ok: true, ... })` 直前で:

```ts
try {
  const recipient = await deps.outbox.findRecipientEmail(note.memberId);
  if (!recipient) {
    c.env.LOGGER?.warn?.("notification_enqueue_skipped", { noteId: note.noteId, reason: "missing_email" });
  } else {
    await deps.outbox.enqueue({
      noteId: note.noteId,
      memberId: note.memberId,
      recipientEmail: recipient.responseEmail,
      outcome: resolution === "approve" ? "approved" : "rejected",
      requestType: note.noteType as "visibility_request" | "delete_request",
      reasonSummaryRaw: null,
      nowIso,
    });
  }
} catch (e) {
  c.env.LOGGER?.warn?.("notification_enqueue_failed", { noteId: note.noteId, error: String(e) });
}
```

`recipientEmail` が空文字 / undefined の場合は enqueue しない。missing email は warning log のみで継続し、resolve transaction は成功のまま返す。

### 5-4. DI 結線

`apps/api/src/index.ts` で `createOutboxRepository(env.DB)` を生成し、admin requests route の deps に渡す。既存 DI コンテナ（既に admin notes 等で使用）に倣う。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm/api typecheck
mise exec -- pnpm --filter @ubm/api lint
mise exec -- pnpm --filter @ubm/api test src/repository/__tests__/notificationOutbox.test.ts
mise exec -- pnpm --filter @ubm/api test src/routes/admin/requests.test.ts
bash scripts/cf.sh wrangler d1 migrations apply ubm-hyogo-db-local --local
bash scripts/cf.sh wrangler d1 execute ubm-hyogo-db-local --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'notification%';"
```

## DoD

- [ ] migration が local D1 で apply 成功
- [ ] notificationOutbox repository テストが PASS（AC-2 / AC-4 / retryable failure の pending 復帰 / missing email lookup）
- [ ] resolve API テストが PASS（AC-1 / AC-3）
- [ ] typecheck / lint PASS

## 成果物

- `outputs/phase-05/main.md`（実装サマリ + ローカル apply 結果）

## 次 Phase

次: 6 (dispatcher / templates / workflow tick 実装)。

## 実行タスク

1. migration / repository / recipient lookup を実装する
2. resolve route の best-effort enqueue を実装する

## 参照資料

- `phase-02.md`
- `apps/api/src/routes/admin/requests.ts`

## 完了条件

- [ ] DoD をすべて満たす
- [ ] repository test と route contract test が PASS している
- [ ] migration local apply と schema verification が PASS している

## 統合テスト連携

repository test と route contract test で AC-1 / AC-2 / AC-3 / AC-4 / AC-11 を検証する。
