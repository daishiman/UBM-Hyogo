# Phase 11: NON_VISUAL evidence

タスク種別は NON_VISUAL（IaC + ドキュメント変更）のため UI スクリーンショットは無し。
実コマンド evidence で代替する。

## test:alerts (52 tests / 7 files PASS)

```
 Test Files  7 passed (7)
      Tests  52 passed (52)
   Start at  18:25:34
   Duration  64.29s
```

抜粋:

- `quota-base.spec.ts (8 tests)` — Q7 / Q8 含む KV 閾値計算 PASS
- `load.spec.ts (5 tests)` — 7 policy + KV 個別 threshold/enabled PASS
- `cf-alerts-cli.spec.ts (14 tests)` — S3 list 7 policy / S4 diff 一致 / S10 apply→diff 収束 PASS

## typecheck

```
> pnpm -r typecheck
Scope: 5 of 6 workspace projects
packages/shared typecheck: Done
packages/integrations typecheck: Done
packages/integrations/google typecheck: Done
apps/web typecheck: Done
apps/api typecheck: Done
```

## lint

```
✔ no dependency violations found (1394 modules, 2007 dependencies cruised)
[stablekey-literal-lint] OK (mode=warning, scanned=385 files, stableKeys=31)
packages/shared lint: Done
apps/web lint: Done
packages/integrations lint: Done
packages/integrations/google lint: Done
apps/api lint: Done
```

## Cloudflare 実機 evidence (Phase 13 user 承認後に追記予定)

- [ ] `mise exec -- pnpm cf:alerts:diff`（apply 前: missing 2 件）の出力
- [ ] `bash scripts/cf.sh alerts apply --yes` の出力
- [ ] `mise exec -- pnpm cf:alerts:diff`（apply 後: no drift detected）の出力 → `outputs/phase-11/evidence/alerts-diff-after-apply.log`
- [ ] `/internal/alert-relay` curl 経由の Slack staging 着信 screenshot / message URL

> 本 PR の repo 側 evidence (test / typecheck / lint) は取得済み。Cloudflare 実機側の evidence は user 承認後の apply 実行時に追記する。
