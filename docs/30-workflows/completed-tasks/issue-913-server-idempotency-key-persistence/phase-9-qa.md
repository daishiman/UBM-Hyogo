# Phase 9: 品質保証

> Refs #913
> 前提: Phase 8 リファクタリング完了。Gate-B 判定の入力となる QA フェーズ。

## 目的

実装 + リファクタ後の状態に対し、ローカルで実行可能な 5 種の検証コマンドを順序通り実行し、全 PASS を Gate-B 通過条件として確定させる。テストコード自体の変更は本フェーズでは行わない（Phase 6 で完了済）。

## 実行コマンド一覧

| # | コマンド | 目的 | 期待結果 |
|---|---|---|---|
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | TypeScript 型整合 | exit 0、追加ファイル全てが型エラーなしで通る |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | ESLint / 規約整合 | exit 0、新規ファイルで `eslint-disable` が増えていない |
| 3 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/middleware/__tests__/idempotency.spec.ts` | focused middleware lane | exit 0、key 無し通過 / replay / fingerprint 422 / 5xx rollback が PASS |
| 4 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/idempotency.repository.spec.ts` | focused repository lane | exit 0、pure replay decision が PASS |
| 5 | `mise exec -- pnpm build` | OpenNext / API 全体 build | exit 0、Workers bundle が生成され、新規 migration / middleware を含めても size 制限内 |

## 各コマンドの期待結果と失敗時のリカバリ

### #1 typecheck

- 期待: `apps/api` の `tsc --noEmit` 相当が 0 error。
- 失敗時:
  - 新規 `idempotency.repository.ts` の `D1Database` 型は `@cloudflare/workers-types` から import 済か確認。
  - middleware の Hono Context generics（`Env` binding）に `DB: D1Database` が宣言されているか確認。
  - 純粋ヘルパーの戻り値型を `as const` / explicit return type で固定し、推論失敗を回避する。

### #2 lint

- 期待: `pnpm --filter @ubm-hyogo/api lint` が 0 warning / 0 error。
- 失敗時:
  - まず `pnpm --filter @ubm-hyogo/api lint --fix` で自動修正可能分を解消。
  - 残違反は対象行のみ修正（`eslint-disable` 追加で握り潰さない）。
  - import 順 / no-floating-promises / await の有無を最優先で確認。

### #3 unit lane

- 期待: `idempotency.repository.spec.ts`（純粋関数）が PASS、他 unit に regression なし。
- 失敗時:
  - `*.contract.spec.ts` が誤って unit lane に混入していないか `vitest.config.ts` の exclude を確認（CLAUDE.md `contract_spec_d1_lane`）。
  - `isExpired` / `shouldReplay` の境界条件（`now === expires_at`）を期待値表と突き合わせ。
  - mock の hash 関数差し替えで `computeFingerprint` を deterministic 化しているか確認。

### #4 repository focused lane

- 期待: repository pure decision が 3 ケース PASS。`*.repository.spec.ts` は root unit config から除外されるため `vitest.d1.config.ts` で focused 実行する。
- 失敗時:
  - migration 0021 が `vitest.d1.config.ts` の setup から適用される経路に乗っているか確認（既存 0009_tag_queue_idempotency_retry と同じ仕組み）。
  - 並行ケース（409）で `Promise.all` の race を意図通り再現できているか、`partial UNIQUE INDEX` の衝突が SQLite から `SQLITE_CONSTRAINT` として返るかをログ確認。
  - 5xx rollback ケースで `deleteInFlight` が確実に呼ばれているか、middleware の `try/finally` 構造を再確認。

### #5 build

- 期待: `pnpm build` が monorepo 全体で exit 0。`apps/api` の Worker bundle 生成成功。
- 失敗時:
  - 新規 `middleware/idempotency/*.ts` のサブパス import が tsconfig の paths / Workers bundler に解決可能か確認。
  - `apps/web` 側の build に影響していないこと（apps/api 内に閉じる不変条件 5）。
  - esbuild version 不整合は `pnpm verify:vitest-runtime` でも兆候が出るため、出た場合は `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 解決を参照（CLAUDE.md）。

## 実行順序の根拠

1 → 2 → 3 → 4 → 5 の順で「軽量・即時失敗」のものから流す。typecheck / lint で構文系の壁を先に倒し、unit lane で純粋ロジックを確認した後、D1 lane で middleware の振る舞いを契約レベルで担保し、最後に build で Workers bundle 化が成立することを確認する。途中で fail した場合はその時点で停止し、対応するリカバリ節に沿って修正後に再実行する。

## Gate-B 判定への引き継ぎ

5 コマンド全て exit 0 を確認した時点で Phase 10 最終レビューに進む。各コマンドのログは Phase 10 の AC 達成判定枠に貼り付け、`artifacts.json` の Gate-B `passed_at` を更新する材料とする。
