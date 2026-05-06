# Phase 6: 実装（dispatcher / templates / workflow tick）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装（後半: 配信層 + cron tick） |
| 前 Phase | 5 (永続層実装) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |

## 目的

PII sanitize template、`MailSender` ベース dispatcher、cron 起動の dispatch tick、scheduled handler 結線まで実装する。

## 変更対象ファイル

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/services/notification/templates.ts` | 新規 | sanitizeRejectionNote / buildApprovedMessage / buildRejectedMessage |
| `apps/api/src/services/notification/__tests__/templates.test.ts` | 新規 | AC-8 / AC-9 |
| `apps/api/src/services/notification/dispatcher.ts` | 新規 | createMailDispatcher（MailSender 抽象再利用） |
| `apps/api/src/services/notification/__tests__/dispatcher.test.ts` | 新規 | dispatcher unit（4xx → retryable=false / 5xx → retryable=true） |
| `apps/api/src/services/notification/__fixtures__/fake-mail-sender.ts` | 新規 | テスト用 MailSender fake |
| `apps/api/src/workflows/notificationDispatchTick.ts` | 新規 | runNotificationDispatchTick |
| `apps/api/src/workflows/notificationDispatchTick.test.ts` | 新規 | AC-5 / AC-6 / AC-7 |
| `apps/api/src/index.ts` | 編集 | scheduled handler に dispatch tick 分岐追加 |
| `apps/api/wrangler.toml` | 編集 | triggers.crons に `*/5 * * * *` を追加（既存と統合） |

## 実装詳細

### 6-1. templates

```ts
const CONTROL_CHAR_RE = /[\x00-\x08\x0B-\x1F\x7F]/g;
export const sanitizeRejectionNote = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw.replace(CONTROL_CHAR_RE, "").trim().slice(0, 200);
};
```

approve / reject template は subject / text / html を完全固定文字列とし、reject のみ `reasonSummary` を**末尾に明示ラベル付きで添付**（プレースホルダ展開は文字列結合で行い、resolutionNote 全文を直接埋め込まない）。

text 例（rejected, visibility_request）:

```
UBM 兵庫支部会 です。

ご依頼いただいた公開設定の変更について、申請を見送らせていただきました。

理由（管理者からの要約）:
{reasonSummary}

ご不明点があれば本メール返信または運営までご連絡ください。
```

approve 例（approved, delete_request）:

```
UBM 兵庫支部会 です。

ご依頼いただいた退会・削除のお手続きが完了しました。
今後、メンバーディレクトリ等への掲載は停止されます。
```

### 6-2. dispatcher

```ts
export const createMailDispatcher = (params): NotificationDispatcher => ({
  async dispatch(row) {
    const message = params.buildMessage(row, params.fromAddress);
    try {
      const result = await params.mailSender.send(message);
      if (result.ok) return { ok: true, providerMessageId: result.providerMessageId, retryable: false };
      // ok=false: provider が 4xx を返した場合は retryable=false、ネットワーク等は retryable=true
      const retryable = !/^4\d\d/.test(result.errorMessage ?? "");
      return { ok: false, errorMessage: result.errorMessage, retryable };
    } catch (e) {
      return { ok: false, errorMessage: String(e), retryable: true };
    }
  },
});
```

`buildMessage` は dispatcher 構築時に `(row) => row.outcome === "approved" ? buildApprovedMessage(...) : buildRejectedMessage(...)` を注入する。

### 6-3. workflow tick

```ts
export const runNotificationDispatchTick = async (deps) => {
  const nowIso = deps.now().toISOString();
  const rows = await deps.outbox.claimNextBatch(deps.batchSize, nowIso, staleDispatchingBeforeIso);
  let sent = 0, failed = 0, dlq = 0;
  for (const row of rows) {
    const result = await deps.dispatcher.dispatch(row);
    if (result.ok) {
      await deps.outbox.markSent(row.notificationId, result.providerMessageId!, deps.now().toISOString());
      await deps.outbox.appendLedger(row.notificationId, "sent", row.retryCount + 1, JSON.stringify({ providerMessageId: result.providerMessageId }), deps.now().toISOString());
      sent++;
    } else {
      const nextRetry = row.retryCount + 1;
      if (!result.retryable || nextRetry >= deps.maxRetries) {
        await deps.outbox.moveToDlq(row.notificationId, errorMessage, deps.now().toISOString());
        await deps.outbox.appendLedger(row.notificationId, "dlq", nextRetry, JSON.stringify({ error: result.errorMessage, retryable: result.retryable }), deps.now().toISOString());
        dlq++;
      } else {
        const backoffSec = deps.backoffSchedule[Math.min(row.retryCount, deps.backoffSchedule.length - 1)];
        const nextAt = new Date(deps.now().getTime() + backoffSec * 1000).toISOString();
        await deps.outbox.markRetryableFailure(row.notificationId, result.errorMessage ?? "unknown", nextAt, deps.now().toISOString());
        await deps.outbox.appendLedger(row.notificationId, "failed", nextRetry, JSON.stringify({ error: result.errorMessage }), deps.now().toISOString());
        failed++;
      }
    }
  }
  return { claimed: rows.length, sent, failed, dlq };
};
```

### 6-4. scheduled handler 結線

`apps/api/src/index.ts` の `scheduled` 関数で既存の `TAG_QUEUE_TICK_CRON` branch に統合し、tag queue retry と notification dispatch tick を同一 `*/5` cron で実行する:

```ts
ctx.waitUntil((async () => {
  const notificationTask = runNotificationDispatchTick({
    outbox: createOutboxRepository(env.DB),
    dispatcher: createMailDispatcher({
      mailSender: createResendSender({ apiKey: env.MAIL_PROVIDER_KEY }),
      fromAddress: env.MAIL_FROM_ADDRESS ?? "no-reply@ubm-hyogo.example",
      buildMessage: (row, from) => row.outcome === "approved"
        ? buildApprovedMessage({ to: row.recipientEmail, from, requestType: row.requestType })
        : buildRejectedMessage({ to: row.recipientEmail, from, requestType: row.requestType, reasonSummary: row.reasonSummary }),
    }),
    now: () => new Date(),
    batchSize: 20,
    maxRetries: 5,
    backoffSchedule: [30, 120, 600, 3600, 21600],
  });
  const results = await Promise.allSettled([runTagQueueRetryTick(env), notificationTask]);
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(index === 0 ? "[tagQueueRetryTick] failed" : "[notificationDispatchTick] failed", {
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }
})());
```

### 6-5. wrangler.toml

```toml
[triggers]
crons = ["*/5 * * * *"]   # 既存と統合: 既に同 entry があれば追加不要
```

top-level / staging / production の既存 cron set は `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` を維持する。Cloudflare account cron 上限を避けるため、Issue #401 で 4 本目の cron は増やさない。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm/api typecheck
mise exec -- pnpm --filter @ubm/api lint
mise exec -- pnpm --filter @ubm/api test src/services/notification src/workflows/notificationDispatchTick.test.ts
```

## DoD

- [ ] templates.ts: AC-8 / AC-9 PASS
- [ ] dispatcher.ts: 4xx/5xx retryable 分岐 PASS
- [ ] notificationDispatchTick.ts: AC-5 / AC-6 / AC-7 PASS（retryable failure 後に `status='pending'` へ戻ることを含む）
- [ ] scheduled handler から runNotificationDispatchTick が呼ばれる test PASS
- [ ] wrangler.toml に cron 設定が存在
- [ ] typecheck / lint PASS

## 成果物

- `outputs/phase-06/main.md`（dispatcher / template / workflow / scheduled 結線サマリ）

## 次 Phase

次: 7 (AC マトリクス)。

## 実行タスク

1. template / dispatcher / workflow tick を実装する
2. existing `*/5` scheduled branch に統合する

## 参照資料

- `phase-02.md`
- `apps/api/src/index.ts`
- `apps/api/wrangler.toml`

## 完了条件

- [ ] DoD をすべて満たす
- [ ] workflow test と scheduled handler test が PASS している
- [ ] `*/5` cron を増やさず既存 branch に統合している

## 統合テスト連携

workflow test と scheduled handler test で AC-5 / AC-6 / AC-7 / AC-10 を検証する。
