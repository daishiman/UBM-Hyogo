# Phase 11: 手動テスト（NON_VISUAL evidence）

`[実装区分: 実装仕様書]`

## 目的

CI smoke で自動化できない env 切替・production 漏出防止の境界を、focused Playwright run、fixture guard unit test、必要時のローカル 404 手順で確認し、NON_VISUAL evidence として記録する。

## 手動テスト手順

### Test M-01: fixture 有効化 (ENABLE_STAGING_SMOKE_FIXTURE=1, ENVIRONMENT=staging)

```bash
ENABLE_STAGING_SMOKE_FIXTURE=1 ENVIRONMENT=staging \
  mise exec -- pnpm --filter @ubm-hyogo/web dev
```

別ターミナルで:

```bash
curl -i "http://localhost:3000/smoke/loading-state?delay=1500" | head -5
# 期待: HTTP/1.1 200
curl -s "http://localhost:3000/smoke/loading-state?delay=1500" | grep -E 'data-page="smoke-loading-state(-fixture)?"'
# 期待: data-page="smoke-loading-state-fixture" を含む（最終 HTML）
```

ブラウザで `http://localhost:3000/smoke/loading-state?delay=2500` を開き、DevTools で loading boundary `[data-page="smoke-loading-state"]` が 2.5 秒間表示されることを目視確認。

### Test M-02: production env guard

```bash
pnpm --filter @ubm-hyogo/web test -- apps/web/app/__smoke__/_lib/fixture-guard.spec.ts
```

期待: `ENABLE_STAGING_SMOKE_FIXTURE=1` でも `ENVIRONMENT=production` なら `smokeFixtureEnabled()` が `false`。

### Test M-03: fixture 無効 (env flag なし)

```bash
pnpm --filter @ubm-hyogo/web test -- apps/web/app/__smoke__/_lib/fixture-guard.spec.ts
```

期待: flag absent なら `smokeFixtureEnabled()` が `false`。route-level 404 を確認する場合だけ、`unset ENABLE_STAGING_SMOKE_FIXTURE; ENVIRONMENT=staging pnpm --filter @ubm-hyogo/web dev` 後に `curl -i http://localhost:3000/smoke/loading-state | head -5` を実行する。

### Test M-04: Playwright `--repeat-each=10` flake チェック

```bash
ENABLE_STAGING_SMOKE_FIXTURE=1 ENVIRONMENT=staging \
  mise exec -- pnpm exec playwright test apps/web/tests/e2e/staging-smoke.spec.ts \
  --grep "staging smoke / loading state" --repeat-each=10
```

期待: 50 run（5 focused Playwright tests × 10）すべて green。

## Evidence 記録

`docs/30-workflows/task-25-followup-loading-state-observation-fixture/outputs/phase-11/` に以下を保存:

| ファイル | 内容 |
|----------|------|
| `evidence.md` | focused Playwright / fixture guard unit / optional route 404 の実行ログ抜粋 |
| `repeat-each-10.txt` | M-04 の Playwright 出力（pass/fail summary） |

NON_VISUAL のためスクリーンショットは不要。DOM marker / HTML stream assertion / guard unit test を canonical evidence とする。

## DoD（Phase 11）

- M-01..M-04 すべて期待通り。
- `outputs/phase-11/evidence.md` が存在し、focused Playwright と fixture guard unit test の観測ログが記録済。
