# Phase 8: リファクタリング

> Refs #913
> 前提: Phase 5-7 の実装が完了し、Phase 9 QA 着手前のリファクタ整理段階。

## 目的

Phase 5 で記述した middleware / repository の実装が機能要件を満たす段階で、責務分離・依存方向・テスト可能性の観点から構造を整え、Phase 9 以降の QA / Gate-B 判定に堪える状態にする。コードの振る舞いは変えない（Phase 6 contract.spec / Phase 4 test plan の全ケースが PASS 状態を維持する前提）。

## リファクタリング方針

### 1. middleware 内ヘルパーの切り出し

`apps/api/src/middleware/idempotency.ts` 内のロジックを 3 つの純粋ヘルパーに分離する。middleware 本体は「Hono context との接続」「永続化呼び出し」「再生 / 409 / 422 分岐」のみに専念させる。

| ヘルパー | 配置 | 責務 | 純粋性 |
|---|---|---|---|
| `computeFingerprint(method, path, bodyBytes)` | `apps/api/src/middleware/idempotency/fingerprint.ts` | method + path + body の SHA-256 等価 hash を算出。並列 worktree でのアルゴリズム差異吸収のため、ハッシュ関数の差し替えは引数で受ける | 純粋（I/O なし） |
| `readBodyOnce(c)` | `apps/api/src/middleware/idempotency/body.ts` | `c.req.raw.clone()` で body を ArrayBuffer として 1 度だけ読み出し、後段 handler が再度 `c.req.json()` 等を呼べるよう Request を再構築。size 上限超過時は専用 Error を throw | 副作用は Request 再構築のみ。stream 1 回読み制約を局所化 |
| `buildScopeKey(headerKey, method, path)` | `apps/api/src/middleware/idempotency/scope.ts` | `Idempotency-Key` header と method + path を組み合わせ、UNIQUE INDEX 列順と一致する scope key オブジェクトを返す | 純粋 |

これにより middleware 本体は概ね 80 行程度に収め、`idempotency.spec.ts` で middleware 全体を、各ヘルパー単体は `idempotency.repository.spec.ts` と同水準の純粋関数 spec で覆える状態とする。

### 2. repository への純粋関数寄せ

`apps/api/src/repository/idempotency.repository.ts` のうち、D1 (`c.env.DB`) アクセスを伴う関数と、行データの加工・TTL 判定など純粋ロジックを明示分離する。

| 関数 | 種別 | 配置方針 |
|---|---|---|
| `insertInFlight({ key, method, path, fingerprint, expiresAt })` | I/O | repository に残す |
| `findExistingByScope({ key, method, path })` | I/O | repository に残す |
| `saveResult({ id, status, body, headers })` / `deleteInFlight({ id })` | I/O | repository に残す |
| `pruneExpired({ now })` | I/O（lazy GC） | repository に残す。INSERT 経路の前段で 1 回呼ぶ |
| `isExpired(row, now)` | 純粋 | repository 内に named export として置く（contract.spec から直接 import 可能に） |
| `shouldReplay(row, fingerprint)` | 純粋 | 同上。再生 / 422 fingerprint mismatch / 409 in_flight の分岐判定を純粋関数化 |

純粋関数は `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` で D1 を介さず網羅し、I/O 関数は `idempotency.spec.ts` の D1 lane で覆う。これにより unit lane / D1 lane の責務境界が明確になる。

### 3. 循環参照回避（依存方向の単方向化）

`admin/_shared.ts` から `middleware/idempotency.ts` を import し、middleware 側から `routes/admin/*` を import しない単方向依存に閉じる。同様に repository は middleware からのみ呼び出し、repository から middleware を逆参照しない。

```
apps/api/src/routes/admin/_shared.ts
        │ (import / 配線のみ)
        ▼
apps/api/src/middleware/idempotency.ts
        │ (import)
        ▼
apps/api/src/middleware/idempotency/{fingerprint,body,scope}.ts  ← 純粋ヘルパー
apps/api/src/repository/idempotency.repository.ts                ← I/O + 純粋 named exports
```

`apps/api/src/routes/admin/*.ts` の各 handler は middleware を直接 import しない（`_shared.ts` 経由の `app.use("*", idempotency)` 配線のみで適用される）。これにより handler shape 不変（不変条件 7）と循環参照不在が両立する。

## リファクタ後の検証

このフェーズではコードの振る舞いを変えないため、以下が維持されていることを Phase 9 QA で再確認する:

- Phase 4 test plan に列挙された contract ケース（初回 / 再生 / 並行 409 / fingerprint 422 / 5xx rollback / TTL）が全て PASS
- 純粋関数 spec が D1 を起動せず unit lane で完結
- `apps/web` 配下の参照に変化がない（admin client は middleware の存在を知らない）

## Phase 9 進行条件

- 上記 3 方針に沿った構造でファイル分割 / named export 整理が完了
- ヘルパー単体に test が追加され、`idempotency.spec.ts` の重複セットアップが削減されている
- handler shape / I/F 不変（grep で `apps/api/src/routes/admin/*.ts` の export 一覧に差分なし）

Phase 9 で typecheck / lint / unit / D1 lane / build の 5 コマンドを通し、Gate-B 判定材料を揃える。
