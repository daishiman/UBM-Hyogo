# Phase 7: カバレッジ確認

> 親 index: [index.md](index.md) / 前段: [phase-6-test-additions.md](phase-6-test-additions.md) / 次段: [phase-8-refactor.md](phase-8-refactor.md)

## 計測対象 / ターゲット

| 対象ファイル | line % | branch % | 根拠 |
|---|---|---|---|
| `apps/api/src/middleware/idempotency.ts` | ≥ 80% | ≥ 80% | Phase 4-6 の TC-01..08 + method gating + fail-open D1 throw で主要 branch を網羅 |
| `apps/api/src/repository/idempotency.repository.ts` | ≥ 80% | ≥ 80% | TC-R01..03（pure）+ contract spec 経由で CRUD 関数を間接実行 |

> 変更行ベース（差分行 / 新規ファイル全体）で 80% 以上を満たす。

## 計測コマンド

```bash
# D1 lane（contract spec を含むため middleware の実行カバレッジが取れる）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --coverage \
  --config=vitest.d1.config.ts

# unit lane（repository pure 関数のカバレッジ）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --coverage
```

両 lane の `coverage-final.json` を統合してファイル単位で line/branch を集計する。簡便には、D1 lane 単独で middleware + repository の両方を網羅できる想定（repository 関数は contract spec 経由で実行されるため）。

## 未到達想定 branch（許容して良い分岐）

| ファイル | 未到達想定 | 解釈方針 |
|---|---|---|
| `idempotency.ts` | `c.env.DB undefined` の warn log 出力経路 | TC-08 で 1 度通過済。ただし logger 注入差異により log 行が未到達カウントされたら許容 |
| `idempotency.ts` | `getByScope` の D1 throw 後の fallback `await next()` | TC-08b で通す。通らない場合は許容（fail-open 設計上 deterministic に再現困難なため） |
| `idempotency.repository.ts` | `gcExpired` 内の `catch { return { deleted: 0 } }` | D1 throw を強制するのが難しい。1 行 catch を `/* c8 ignore next */` で抑止し、その旨を実装コメントに残す |
| `idempotency.repository.ts` | `completeWithResponse` の `body === null` 分岐 | TC-07a で通る |

## 80% 未達時の対応

1. まず `coverage-final.json` から未到達行を `lcov-report/idempotency.ts.html` で確認
2. 落とし所:
   - branch 不足 → 該当 if 分岐に対する it を追加（Phase 6 spec に追記）
   - 純粋に到達不能な defensive コード → `/* c8 ignore next */` でカバレッジ計測除外。除外理由を 1 行コメントで明記
3. middleware 内の `try / catch` の catch 側は **TC-08b で通す前提** とし、ignore は使わない（fail-open は本仕様の中核）

## 既存コードへの影響

- `_shared.ts` の 1 行追加（`app.use('*', createIdempotencyMiddleware())`）は既存 route spec 群で間接的に通過するため、変更行ベース 100% を満たす
- 既存 repository / route 側のカバレッジ低下が起きていないことを diff base で確認（`coverage-guard.sh` が --changed モードで gate するため、push 時に自動検出される）

## 完了条件

- 上記コマンドを実行し、両ファイルの line/branch ≥ 80% を満たす
- 未到達行が `c8 ignore` 等で明示的に除外されているか、追加 it で網羅されている
- 既存 spec の回帰 fail が無い（`pnpm --filter @ubm-hyogo/api test` 全 green）
