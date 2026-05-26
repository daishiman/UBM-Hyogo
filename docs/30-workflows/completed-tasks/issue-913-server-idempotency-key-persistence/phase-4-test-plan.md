# Phase 4: テスト計画

> 親 index: [index.md](index.md) / 前段: [phase-3-design-review.md](phase-3-design-review.md) / 次段: [phase-5-implementation.md](phase-5-implementation.md)
> Gate: Gate-A 通過後着手。RED ケースを spec として落とし込み、Phase 5 で GREEN に倒す。

## 目的

server-side `Idempotency-Key` 永続化 middleware について、handler への副作用を変えずに重複リクエストを冪等化することを契約として固定する。テストは「現状 fail → 実装後 pass」の RED → GREEN 順で記述する。

## テストレーン

| レーン | 対象 spec | 設定 | 実行コマンド |
|---|---|---|---|
| middleware focused | `apps/api/src/middleware/__tests__/idempotency.spec.ts` | `vitest.config.ts` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/middleware/__tests__/idempotency.spec.ts` |
| repository focused | `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` | `vitest.d1.config.ts`（repository spec は root unit config から除外） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/idempotency.repository.spec.ts` |

> contract spec は `apps/api/migrations/*.sql` を local miniflare D1 に適用した状態で起動する。共通 helper は親 issue-842 の precedent（既存 contract spec の `applyMigrations` パターン）を流用する。

## RED テストケース

| ID | レーン | target file | 前提セットアップ | 操作 | 期待値 |
|---|---|---|---|---|---|
| TC-01 | d1 | idempotency.spec.ts | admin 認証済 / `Idempotency-Key` header 無し | admin POST を 2 回投げる | handler は 2 回呼ばれる（dedupe しない）。`idempotency_keys` 行は 0 件 |
| TC-02 | d1 | idempotency.spec.ts | header `key=k1` / 同一 body | POST k1 → 200 → 再度 POST k1 | 1 回目: handler 1 回実行 + row.status=`completed`。2 回目: handler 呼ばれず stored response 再生（status / body / `Idempotent-Replayed: true` header） |
| TC-03 | d1 | idempotency.spec.ts | row 事前 INSERT で `status=in_flight`, `expires_at` 未来 | 同一 key + 同一 fingerprint で POST | 409 Conflict。`{ "error": "idempotency_in_flight" }`。handler 呼ばれない |
| TC-04 | d1 | idempotency.spec.ts | row 事前 INSERT で `status=completed`, fingerprint=hash(A) | 同一 key + body=B（fingerprint 不一致） | 422 Unprocessable。`{ "error": "idempotency_fingerprint_mismatch" }`。handler 呼ばれない |
| TC-05 | d1 | idempotency.spec.ts | header `key=k5` / handler が 500 throw する route を spy 注入 | POST k5（500 受信） → 再度 POST k5 | 1 回目: 500 + row 削除（rollback）。2 回目: handler 再実行（dedupe しない） |
| TC-06 | d1 | idempotency.spec.ts | row `key=k6, status=completed, expires_at=過去` を pre-INSERT | POST k6 | TTL 切れにつき新規 record として扱う（handler 実行 + row 再生成 / UPSERT）|
| TC-07 | d1 | idempotency.spec.ts | handler が `MAX_RESPONSE_BYTES`（既定 64KiB）超 body を返す | POST k7 → 再度 POST k7 | 1 回目: handler 実行 + response 返却 + row は `status=completed` だが `response_body=NULL`（保存スキップ）。2 回目: stored response 無いため handler 再実行 |
| TC-08 | d1 | idempotency.spec.ts | `c.env.DB` を undefined にした test app（fail-open） | POST k8 | middleware は no-op で `next()`。handler 通常実行 + 200。例外を投げない |

### repository unit spec（純ロジック分）

| ID | レーン | target file | 内容 |
|---|---|---|---|
| TC-R01 | unit | idempotency.repository.spec.ts | `computeFingerprint(method, path, bodyHash)` の決定性（同一入力 → 同一 hash・差分入力 → 差分 hash） |
| TC-R02 | unit | idempotency.repository.spec.ts | `isExpired(row, now)` の boundary（`expires_at === now` は expired 扱い） |
| TC-R03 | unit | idempotency.repository.spec.ts | `shouldPersistResponse(bytes, max)` の境界（`bytes === max` は保存可、`bytes > max` は skip） |

> D1 binding を要するもの（`getByScope` / `insertInFlight` / `completeWithResponse` / `rollbackInFlight` / `gcExpired`）は contract.spec 側で間接検証し、unit spec は pure function に限定する。

## 期待 assertion 形式

- HTTP status は `expect(res.status).toBe(N)`
- replay header: `expect(res.headers.get('Idempotent-Replayed')).toBe('true')`（初回は `null`）
- row 確認: contract spec 内で `c.env.DB.prepare('SELECT * FROM idempotency_keys WHERE key=?').bind(k).first()` で直接 SELECT
- handler 実行回数: route 内に `vi.fn()` の counter spy を注入し `expect(spy).toHaveBeenCalledTimes(n)`

## RED 確認手順（Phase 5 着手前）

1. spec ファイル 2 本を作成（実装ファイルは未作成のため import エラーで fail）
2. `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --config=vitest.d1.config.ts` を実行し、全 TC が「import 失敗 / route 未配線」で fail することを確認
3. fail 出力を Phase 5 着手の trigger 証跡として扱う（コミットは不要）

## 完了条件

- 上記 TC-01..08 / TC-R01..03 が spec ファイル内に describe / it として列挙されている
- 各 it に「期待値」と「assertion 形式」が記述されている
- Phase 5 でこれらを GREEN にする差分方針が確定できる
