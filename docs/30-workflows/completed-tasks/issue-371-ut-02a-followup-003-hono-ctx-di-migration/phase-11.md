# Phase 11: contract evidence (NON_VISUAL)

実装区分: 実装仕様書
visualEvidence: NON_VISUAL（API / middleware リファクタのため UI 撮影不要）

## 11.1 evidence マニフェスト

`outputs/phase-11/evidence/` 配下に以下を配置する:

| # | パス | 内容 |
| --- | --- | --- |
| E1 | `outputs/phase-11/evidence/typecheck.log` | `pnpm --filter @ubm-hyogo/api typecheck` 実行ログ（exit 0） |
| E2 | `outputs/phase-11/evidence/lint.log` | `pnpm --filter @ubm-hyogo/api lint` 実行ログ（exit 0） |
| E3 | `outputs/phase-11/evidence/test.log` | `pnpm --filter @ubm-hyogo/api test` 実行ログ（pass / fail / skip サマリ） |
| E4 | `outputs/phase-11/evidence/build.log` | `pnpm --filter @ubm-hyogo/api build` 実行ログ（bundle size 含む） |
| E5 | `outputs/phase-11/evidence/grep-gate.log` | Phase 9 G1〜G5 の実行結果（全て期待通り） |
| E6 | `outputs/phase-11/evidence/middleware-smoke.log` | （任意）`wrangler dev` ローカル smoke で `GET /me/profile` / `GET /admin/members/:mid` の status / response shape をログ |

`test.log` は T1〜T10（builder unit / middleware wiring / route smoke）の pass summary を含める。route smoke を実 HTTP runtime で取らない場合も、route test として T9 / T10 を `test.log` に含める。

## 11.2 evidence 取得スクリプト例

```bash
mkdir -p outputs/phase-11/evidence

mise exec -- pnpm --filter @ubm-hyogo/api typecheck \
  > outputs/phase-11/evidence/typecheck.log 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api lint \
  > outputs/phase-11/evidence/lint.log 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api test \
  > outputs/phase-11/evidence/test.log 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api build \
  > outputs/phase-11/evidence/build.log 2>&1

{
  echo "## G1: builder deps?";
  rg -n "deps\\?\\s*:\\s*\\{\\s*attendanceProvider" apps/api/src/repository/_shared/builder.ts || echo "OK: no match";
  echo "## G2: route inline attendanceProvider";
  rg -n "attendanceProvider:\\s*createAttendanceProvider" apps/api/src/routes/ || echo "OK: no match";
  echo "## G3: builder direct import";
  rg -n "createAttendanceProvider" apps/api/src/repository/_shared/builder.ts || echo "OK: no match";
  echo "## G4: silent fallback";
  rg -n "attendance.*\\?\\?\\s*\\[\\]" apps/api/src/repository/_shared/builder.ts || echo "OK: no match";
  echo "## G5: D1 leak to web";
  rg -n "createAttendanceProvider|D1Database" apps/web/src/ || echo "OK: no match";
} > outputs/phase-11/evidence/grep-gate.log
```

## 11.3 evidence 状態語彙

実装後は **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`** を最終状態とする:

- `typecheck` / `lint` / `test` / `build` / `grep gate` 全 PASS（spec contract は完了）
- `wrangler dev` smoke は任意。実 production runtime 検証は 09a / 09b 既存 smoke 系列に委譲（runtime PASS は別 wave で取得）

仕様書作成時点では実装ログが存在しないため、`outputs/phase-11/main.md` は
実装前は **`CONTRACT_READY_IMPLEMENTATION_PENDING`**、local evidence 取得後は **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`** とする。`PASS` 単独表記は使用しない。

## 11.4 main.md（Phase 11 サマリ）

`outputs/phase-11/main.md` に以下を記載:

```markdown
# Phase 11 main report

- task: issue-371-ut-02a-followup-003-hono-ctx-di-migration
- visualEvidence: NON_VISUAL
- state: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
- evidence:
  - typecheck.log (exit 0)
  - lint.log (exit 0)
  - test.log (pass={n}, fail=0, skip=0)
  - build.log (bundle size delta within ±5%)
  - grep-gate.log (G1-G5 all "no match")
- runtime smoke: 09a / 09b へ委譲
- close-out 条件: 実装サイクルで E1-E5 実ログを配置後に PASS_BOUNDARY_SYNCED_RUNTIME_PENDING へ昇格
```

## 11.5 完了条件

- local implementation close-out 時点: `outputs/phase-11/main.md` が状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を含む
- 実装完了時点: E1〜E5 が `outputs/phase-11/evidence/` に存在
- 実装完了時点: 全 evidence の参照と E1〜E5 が一致（漏れなし）
