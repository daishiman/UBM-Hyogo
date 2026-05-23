# Phase 06 — テスト拡張

## 拡張観点

Phase 04 で red にした最小ケースに加え、回帰防止と境界ケースを追加する。

| 追加ケース | 対象 spec |
| --- | --- |
| 既存 mail dispatcher の retryable 判定 (4xx false / 5xx true) が channel 経由でも維持されること | `channels/mail.spec.ts` |
| registry を空で生成した場合 `resolve('mail')` が undefined | `registry.spec.ts` |
| outbox の `duplicate` 判定が opt-out gate より後段でも従来通り動作すること（opt-out=0 のケース） | `notificationOutbox.repository.spec.ts` |
| `notificationDispatchTick` が registry.resolve undefined のとき outbox を `dlq` に遷移し ledger に `unknown_channel` を書くこと | `notificationDispatchTick.spec.ts` |
| `PATCH /admin/members/:memberId/notification-pref` の冪等性（同値 PATCH が 200 を返す） | `routes/admin/members.spec.ts` |
| admin UI の toggle が初期値 0 から true→false→true と切替えできる | `MemberDrawer.spec.tsx` |

## 実行コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/api test -- --run
mise exec -- pnpm -F @ubm-hyogo/web test -- --run
```

## DoD

- 上記ケースを含むすべての spec が green
