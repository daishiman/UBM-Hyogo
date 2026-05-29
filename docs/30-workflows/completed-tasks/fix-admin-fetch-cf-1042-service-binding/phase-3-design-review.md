# Phase 3: 設計レビュー

## 4条件評価

| 観点 | 結論 |
|------|------|
| 価値性 | staging /admin 全 Server Component route の SSR fetch を 1 ファイル変更で復旧（影響: 8 admin ページ + fetch-attendance helper 経由の dashboard sub-route 群） |
| 実現性 | 既存 `fetchPublic` の transport selector pattern の機械的適用。設計判断は不要 |
| 整合性 | env accessor 不変条件、CLAUDE.md invariant #5 (D1 直接アクセス禁止) いずれも維持。auth.ts / public.ts と同じ transport policy に統一されるためむしろ整合性向上 |
| 運用性 | local dev では HTTP fallback、staging/production では binding 自動選択。観測も `logTransport` で揃う |

## 因果ループ

- 強化ループ: service binding 経由は同一 isolate での RPC 相当なので latency も下がる → admin SSR の TTFB 改善 → user体感向上
- バランスループ: binding 不在の test env では HTTP fallback に閉じる safety net がある

## 状態所有権

- env binding の所有: `apps/web/src/lib/env.ts`（既存）
- transport 決定の所有: `apps/web/src/lib/admin/server-fetch.ts`（変更対象）
- error code 分類の所有: `apps/web/src/lib/server-fetch/safe-fetch.ts`（変更不要）

## 残リスク

- service binding 経由でも `cookie` header が API Worker 側で session resolve に使えることを確認する必要あり。`auth.ts` で既に同経路を使っているため動作実績あり。
- `x-internal-auth` の値が空文字 (`?? ""`) のまま流れる既存挙動を維持（admin gate は web layout.tsx で完結しているため API 側で internal auth を必須検証していない経路）

## go / no-go

GO. Phase 4 へ進む。

## MINOR 指摘（未タスク候補にしない）

- 将来 admin から D1 への shortcut binding を検討するなら別タスクで議論。今回は対象外。
