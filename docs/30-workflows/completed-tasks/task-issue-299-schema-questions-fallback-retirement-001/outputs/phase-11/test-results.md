# Test Results

## focused: resolve-stable-key.spec.ts

実行時刻: 2026-05-15 16:28 JST (07:28 UTC)

レビュー補正後の再実行: 2026-05-15 16:53 JST。`beforeEach` timeout を 60s に広げ、fallback retired ケースに「旧 fallback SELECT が発行されない」assertion を追加した状態で 6/6 PASS。

コマンド:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec \
  vitest run --root=../.. --config=vitest.d1.config.ts \
  apps/api/src/sync/schema/resolve-stable-key.spec.ts
```

出力（要点）:

```
 ✓ apps/api/src/sync/schema/resolve-stable-key.spec.ts (6 tests) 17524ms
   ✓ resolveStableKey > known: labelToKnownStableKey が返した値を採用する
   ✓ resolveStableKey > alias: D1 既存 stable_key が known より優先される
   ✓ resolveStableKey > fallback retired (issue-299): schema_aliases miss でも schema_questions.stable_key にはフォールバックしない
   ✓ resolveStableKey > fallback retired (issue-299): alias miss かつ known hit の場合は known を採用する
   ✓ resolveStableKey > unknown: alias も known も無ければ stableKey=null / source='unknown'
   ✓ resolveStableKey > unknown: D1 に stable_key='unknown' があっても alias 採用しない

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  26.98s
```

レビュー補正後の出力（要点）:

```
 ✓ apps/api/src/sync/schema/resolve-stable-key.spec.ts (6 tests) 15435ms
   ✓ resolveStableKey > fallback retired (issue-299): schema_aliases miss でも schema_questions.stable_key にはフォールバックしない

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  22.72s
```

exit code: 0

## full unit test suite (vitest.config.ts)

実行時刻: 2026-05-15 16:25 JST

コマンド:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
```

結果:

- Test Files: 47 passed / 1 failed (= 48)
- Tests: 283 passed / 5 skipped (= 288)
- failed suite: `apps/api/migrations/seed/__tests__/issue-399-seed-syntax.spec.ts` — `beforeAll` の Hook timeout (30s) で fail。本 issue-299 タスクのコード変更とは無関係（issue-399 seed harness 由来）。Phase 11 evidence では既知の未関連 flake として扱う。
- 関連スイート（`resolve-stable-key.spec.ts` を含む sync/schema 群）は別 config (`vitest.d1.config.ts`) で実行され、上記 focused 実行で 6/6 PASS を確認済み。

## typecheck

```
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

→ `tsc -p tsconfig.json --noEmit` PASS（出力なし）。

## lint

```
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

→ 同上（API パッケージの lint は `tsc --noEmit` を兼ねる）PASS。
