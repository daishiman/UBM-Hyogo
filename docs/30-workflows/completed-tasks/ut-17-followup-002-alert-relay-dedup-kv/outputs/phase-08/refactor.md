# Phase 8 — リファクタリング

## 変更

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| dedup key 生成 | 既存パターンの直書き文字列結合 | 維持 | 既存実装と整合、リスクなし |
| `dedupeTtlMs` → 秒換算 | handler 内 inline（`Math.ceil(dedupeTtlMs / 1000)`） | 維持 | 1 箇所のみで使用、抽出による可読性向上は無い |
| KV stub helper 命名 | — | `createKvStub` / `KvPutCall` / `KvStubEntry` | UPPER_SNAKE_CASE binding と整合、test-only API である旨を helper コメントに明記 |

## 機能変更

なし。Phase 5-7 で Green の実装をそのまま維持。

## 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck  # PASS
mise exec -- pnpm --filter @ubm-hyogo/api lint       # PASS
pnpm exec vitest run apps/api/src/routes/internal/__tests__/alert-relay.test.ts  # 21 PASS
```

## DoD

- [x] 上記コマンドが全 PASS
- [x] 機能変更なし、命名ドリフトなし
