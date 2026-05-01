# task-08b-playwright-e2e-full-execution-001

## 概要

08b Playwright scaffold を full execution に昇格し、実 screenshot、Playwright report、axe report を Phase 11 evidence として保存する。

## 苦戦箇所【記入必須】

08b は `scaffolding-only` / `VISUAL_DEFERRED` として閉じており、全 spec は `test.describe.skip`、Auth fixture は placeholder、D1 seed/reset も未接続である。このまま PR / push CI gate にすると、実質何も検証しない green か、起動前 fail のどちらかになる。

## スコープ（含む/含まない）

含む:

- `test.describe.skip` の解除
- Auth.js 互換 fixture または UI login helper の実装
- D1 seed/reset の決定論的実装
- desktop/mobile screenshot 30 枚以上の保存
- Playwright HTML/JSON report と real `axe-report.json` の保存
- `.github/workflows/e2e-tests.yml` の PR / push gate 昇格

含まない:

- visual regression baseline の全面導入
- production 環境への負荷テスト
- 09a staging deploy そのもの

## リスクと対策

| リスク | 対策 |
| --- | --- |
| skipped spec による偽 green | CI gate 昇格前に `rg "test\\.describe\\.skip" apps/web/playwright/tests` が 0 件であることを必須化 |
| fixture と実 Auth.js cookie の drift | 05a/05b の shared auth contract を参照し、UI login helper 方式も比較する |
| D1 seed race / flaky | global setup で reset/seed を直列実行し、API readiness wait を追加 |
| screenshot に個人情報や token が残る | fixture データを synthetic に限定し、trace/video/screenshot の secret hygiene review を Phase 11 に追加 |

## 検証方法

```bash
pnpm install --frozen-lockfile
pnpm --filter @ubm-hyogo/web test:e2e:list
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm --filter @ubm-hyogo/web test:e2e
find docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence -name '*.png' | wc -l
jq '[.violations[]?] | length' docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence/axe-report.json
```

## 参照

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/`
- `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md`
- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/phase12-task-spec-compliance-check.md`
