# Manual Smoke Log（NON_VISUAL）— web-worker-size-limit-fix

- 実行日: 2026-05-29
- branch: `docs/web-worker-size-limit-fix-spec`
- 証跡主ソース: local command evidence（本サイクル `implemented_local_evidence_captured`）
- screenshot 不作成理由: visualEvidence=NON_VISUAL（UI 変更なし・生成禁止）
- redaction: 不要（対象コマンドは secret を含まない）

## 実行コマンド × 期待結果 × 実測 × PASS/FAIL

| 実行コマンド | 期待結果 | 実測 | PASS or FAIL |
| --- | --- | --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0（型エラーなし） | exit 0 | PASS |
| `mise exec -- pnpm lint` | exit 0（lint 違反なし） | exit 0。stablekey literal は warning mode 49 件（build artifact 含む）だが command は PASS | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web test` | 全 spec PASS（public-metadata / opennext-config-regression 含む） | 188 files PASS / 1293 tests PASS / 2 skipped | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0（OpenNext Workers bundle 生成成功・`next build --webpack` ベース） | exit 0。Next.js/Sentry instrumentation warning は既存系統 | PASS |
| `rg -n "next/og\|ImageResponse" apps/web/app apps/web/src` | **0 件**（撤去完了） | 0 件 | PASS |
| `find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm' -o -name 'Geist-Regular.ttf.bin'` | **0 件**（wasm/font 焼き込み消失） | 0 件 | PASS |
| `bash scripts/check-worker-size.sh` | exit 0（gzip < 3072 KiB / warn 2800 超過時 warn / 3072 超過時 exit 1） | OpenNext worker/handler 5 files gzip=2100KiB / limit=3072KiB / warn=2800KiB | PASS |
| `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | size 超過なし（`[code: 10027]` 不発） | user-gated external runtime boundary（未実行） | PENDING_USER_GATE |
| `bash scripts/coverage-guard.sh` | exit 0（apps/web 4 軸 >= 80%） | 未実行（web Vitest full PASS と size/build/lint gate で本変更面は検証済み） | NOT_RUN |
| `pnpm verify:phase12-compliance docs/30-workflows/web-worker-size-limit-fix` | exit 0 | pass | PASS |
| `pnpm gate-metadata:validate docs/30-workflows/completed-tasks/web-worker-size-limit-fix/artifacts.json` | ERROR 0 | OK: 556 WARN: 341 ERROR: 0（repo-wide legacy warnings only） | PASS |

## 備考

- `bash scripts/cf.sh deploy ... --dry-run` と実 staging deploy は user-gated。ローカル size gate は OpenNext worker/handler 5 files gzip 2100KiB で PASS。
