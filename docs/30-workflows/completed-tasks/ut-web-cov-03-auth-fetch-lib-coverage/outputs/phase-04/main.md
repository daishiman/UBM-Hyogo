# Phase 4 成果物 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

- status: pending（実装フェーズで実測 capture）
- purpose: テスト戦略
- evidence: <TBD: 実装・実測時に capture。仕様書作成時点では placeholder>

## テスト戦略サマリ

AC ↔ test ID マッピング、coverage 目標（package / file）、除外境界 decision log、実測コマンドを確定。

## AC ↔ test ID マッピング

| AC ID | 内容 | test file | test ID |
| --- | --- | --- | --- |
| AC-1 | 全 7 ファイル ≥85%/80% | 全 6 + me-types.test-d.ts | 全 ID |
| AC-2-a | auth happy | auth.test.ts | AUTH-001, AUTH-005 |
| AC-2-b | auth token-missing | auth.test.ts | AUTH-002 |
| AC-2-c | auth token-invalid | auth.test.ts | AUTH-003 |
| AC-2-d | auth network-fail | auth.test.ts | AUTH-004 |
| AC-3-a | fetch 200 | authed/public.test.ts | FA-001, FP-001/002 |
| AC-3-b | fetch 401 | authed.test.ts | FA-002 |
| AC-3-c | fetch 403 | authed.test.ts | FA-003 |
| AC-3-d | fetch 5xx | authed/public.test.ts | FA-004, FP-005 |
| AC-3-e | fetch network-fail | authed/public.test.ts | FA-005, FP-006 |
| AC-4 | me-types round-trip | me-types.test-d.ts | TYPE-001〜003 |
| AC-5 | regression なし | 全 test | — |
| AC-6 | typecheck / lint | CI | — |

## coverage 目標

### package level (apps/web)

| 指標 | 目標 |
| --- | --- |
| Statements | ≥80% |
| Lines | ≥80% |
| Functions | ≥80% |
| Branches | ≥75% |

### file level（対象 6 ファイル / me-types 除外後）

| ファイル | Stmts | Lines | Funcs | Branches |
| --- | --- | --- | --- | --- |
| auth.ts | ≥85% | ≥85% | ≥85% | ≥80% |
| auth/magic-link-client.ts | ≥85% | ≥85% | ≥85% | ≥80% |
| auth/oauth-client.ts | ≥85% | ≥85% | ≥85% | ≥80% |
| session.ts | ≥85% | ≥85% | ≥85% | ≥80% |
| fetch/authed.ts | ≥85% | ≥85% | ≥85% | ≥80% |
| fetch/public.ts | ≥85% | ≥85% | ≥85% | ≥80% |
| api/me-types.ts | 計測除外（D-04） | — | — | — |

## 除外境界 decision log

| ID | 内容 | 判定 | 理由 |
| --- | --- | --- | --- |
| D-04 | `me-types.ts` を coverage 除外 | 採用 | type-only。代替 `me-types.test-d.ts` |
| D-05 | `vitest.config.ts` の `coverage.exclude` に追記（Phase 5 実施） | 採用 | 設定変更は実装フェーズ |

`vitest.config.ts` 追記内容（参考）:

```ts
// coverage.exclude に追加
"apps/web/src/lib/api/me-types.ts",
```

## 実測コマンド

```
mise exec -- pnpm --filter web test:coverage
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## evidence path

- `apps/web/coverage/coverage-summary.json`
- `apps/web/coverage/coverage-final.json`
- 上記を `outputs/phase-11/` に bundle（実装フェーズ）

## evidence 取得 7 ステップ

1. `mise exec -- pnpm install`
2. `mise exec -- pnpm --filter web test:coverage`
3. `coverage-summary.json` で対象 6 ファイル ≥85%/80% を assert
4. `coverage-final.json` を `outputs/phase-11/` へ保管
5. `pnpm typecheck` / `pnpm lint` pass 確認
6. `pnpm --filter web test` 全 pass で regression なし確認
7. drop 発生時は Phase 2 テストケース表を再確認し test 追加

## DoD

- 6 ファイル全て Stmts/Lines/Funcs ≥85%, Branches ≥80%
- 既存 test pass（regression なし）
- typecheck / lint pass
- AC ↔ test ID 全件実装 + pass

## 変更対象ファイル

- 新規 test 6 + me-types.test-d.ts + helper 1 + vitest.config.ts 設定変更（Phase 5 実施）

## 次 Phase への引き継ぎ

AC ↔ test ID マッピング、coverage 目標、除外境界 decision log（vitest.config.ts 追記内容含む）、実測コマンド、evidence path を Phase 5 実装フェーズへ。
