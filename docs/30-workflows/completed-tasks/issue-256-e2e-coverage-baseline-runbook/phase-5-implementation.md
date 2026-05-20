# Phase 5 — 実装

`[実装区分: 実装仕様書]`

## 1. 変更対象ファイル一覧

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `scripts/measure-coverage-exclude-ratio.ts` | 新規 | exclude 比率計測 CLI |
| 2 | `.github/workflows/verify-coverage-exclude-ratio.yml` | 新規 | PR comment soft warn workflow |
| 3 | `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` | 新規 | 30% 超過時の代替指標 runbook |
| 4 | `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` | 新規 | 17/19-route smoke SLA runbook |
| 5 | `vitest.config.ts` | 編集 | exclude から `loading.tsx` / `not-found.tsx` を削除 |
| 6 | `apps/web/app/__tests__/error.component.spec.tsx` | 既存 | loading.tsx / not-found.tsx regression を継続確認 |
| 7 | `scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | 新規 | denominator / parser / markdown unit test |
| 8 | `package.json` (root) | 編集 | `scripts.coverage:measure-exclude-ratio` script 追加 |

## 2. 実装詳細

### 2.1 `scripts/measure-coverage-exclude-ratio.ts`

```typescript
#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import fastGlob from 'node:fs recursive scan';
import local glob matcher from 'local glob matcher';

export interface ExcludeRatioResult {
  measured_at: string;
  vitest_config_path: string;
  target_glob: string;
  total_files: number;
  excluded_files: string[];
  excluded_count: number;
  ratio: number;
  threshold: number;
  status: 'ok' | 'warn';
}

function extractExcludePatterns(vitestConfigText: string): string[] {
  const match = vitestConfigText.match(/coverage:\s*\{[\s\S]*?exclude:\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return Array.from(match[1].matchAll(/["'`]([^"'`]+)["'`]/g)).map((m) => m[1]);
}

export async function measureCoverageExcludeRatio(opts: {
  vitestConfigPath: string;
  targetGlob: string;
  threshold?: number;
}): Promise<ExcludeRatioResult> {
  const threshold = opts.threshold ?? 0.3;
  const configText = await fs.readFile(opts.vitestConfigPath, 'utf8');
  const patterns = extractExcludePatterns(configText);
  const files = await fastGlob(opts.targetGlob, { dot: false });
  const matchers = patterns.map((p) => local glob matcher(p));
  const excluded = files.filter((f) => matchers.some((m) => m(f)));
  const ratio = files.length === 0 ? 0 : excluded.length / files.length;
  return {
    measured_at: new Date().toISOString(),
    vitest_config_path: opts.vitestConfigPath,
    target_glob: opts.targetGlob,
    total_files: files.length,
    excluded_files: excluded,
    excluded_count: excluded.length,
    ratio,
    threshold,
    status: ratio >= threshold ? 'warn' : 'ok',
  };
}

function toMarkdown(r: ExcludeRatioResult): string {
  const pct = (r.ratio * 100).toFixed(1);
  return [
    `# Coverage Exclude Ratio`,
    ``,
    `- measured_at: ${r.measured_at}`,
    `- target: \`${r.target_glob}\``,
    `- total: ${r.total_files}`,
    `- excluded: ${r.excluded_count}`,
    `- ratio: **${pct}%** (threshold ${(r.threshold * 100).toFixed(0)}%) → ${r.status}`,
    ``,
    `## Excluded files`,
    ``,
    ...r.excluded_files.map((f) => `- ${f}`),
    ``,
  ].join('\n');
}

async function main() {
  const { values } = parseArgs({
    options: {
      'vitest-config': { type: 'string', default: 'vitest.config.ts' },
      target: { type: 'string', default: 'apps/web/app/**/*.tsx' },
      threshold: { type: 'string', default: '0.30' },
      out: { type: 'string' },
    },
  });
  const result = await measureCoverageExcludeRatio({
    vitestConfigPath: values['vitest-config']!,
    targetGlob: values.target!,
    threshold: Number(values.threshold),
  });
  if (values.out) {
    const ext = path.extname(values.out);
    const body = ext === '.md' ? toMarkdown(result) : JSON.stringify(result, null, 2);
    await fs.writeFile(values.out, body);
    // JSON 出力併用 (同じ basename + .json)
    if (ext === '.md') {
      const jsonPath = values.out.replace(/\.md$/, '.json');
      await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
    }
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

### 2.2 workflow (本仕様書 2.2 のテンプレをそのまま採用)

`.github/workflows/verify-coverage-exclude-ratio.yml` を `phase-2-design.md §2.2` のとおり作成。

### 2.3 fallback metric runbook (`docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md`)

```markdown
# E2E Coverage Fallback Metric Runbook

## トリガ
`verify-coverage-exclude-ratio` workflow が PR コメントで warn を出した時 (ratio >= 30%)。

## 補完指標 (全て満たせば実体カバレッジ確保とみなす)
| 指標 | 取得元 | 合格条件 |
|------|--------|---------|
| smoke pass rate (30d) | `gh run list --workflow=playwright-smoke.yml --branch=dev --limit=30` | success rate >= 95% |
| 19-route hit | `apps/web/playwright/tests/full-smoke.spec.ts` 最新実行 | 全 17 routes が HTTP < 400 |
| a11y violations | axe-core 出力 | serious/critical = 0 |
| staging smoke | `runtime-smoke-staging.yml` 最新 | success |

## エスカレーション
- 3 指標以上で fail → `unassigned-task/` に短期 action 起票
- 30% 比率を下げる long-term action: page.tsx / layout.tsx の testable 部分を library 化し unit test 化

## 履歴
| Date | Ratio | Status | Action |
| --- | --- | --- | --- |
```

### 2.4 SLA runbook (`docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md`)

```markdown
# Playwright 19-route Smoke SLA Runbook

## 概要
慣用名 "19-route smoke" は実体 17 routes (公開 7 + 会員 1 + 管理 8 + 404 canary) + 1 attendance visual smoke から成る集合。
正本: `apps/web/playwright/tests/full-smoke.spec.ts`。

## SLA
- gate: `playwright-smoke / smoke (chromium)` (required check on dev / main)
- 必須通過条件: 全 routes が HTTP < 400 + a11y serious/critical violations = 0

## Route 一覧 (auth 別)
- public (7): `/`, `/members`, `/members/sample-001`, `/register`, `/privacy`, `/terms`, `/login`
- member (1): `/profile`
- admin (8): `/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit`
- 共通 (1): `/__not_found_canary` (404 期待)

## 追加手順
1. `full-smoke.spec.ts` の `ROUTES` 配列に追加 (path / auth / landmark / expectedStatus)
2. 必要なら fixture 拡張 (`adminLogin` / `memberLogin`)
3. ローカル: `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke`
4. PR 提出 (smoke job が新 route も pass で gate)

## Triage flow
1. PR で smoke FAIL → trace を artifact から取得 (`playwright-smoke-report`)
2. route 単位の HTTP / a11y violation を切り分け
3. 既存 feature regression なら revert、新 PR 起因なら fix を当 PR 内で
```

### 2.5 vitest.config.ts 編集

`outputs/phase-1/inventory.md §A` の判定どおり `loading.tsx` / `not-found.tsx` を削除。`error.tsx` は scope out (D-04)。

### 2.6 unit tests

`scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` を新規追加し、parser / ratio / empty target / markdown / test spec denominator exclusion を確認する。
`loading.tsx` / `not-found.tsx` は既存 `apps/web/app/__tests__/error.component.spec.tsx` で `Loading` / `NotFound` を import して token regression を検証しているため、新規 component spec は作らない。

### 2.7 package.json (root)

```diff
   "scripts": {
+    "coverage:measure-exclude-ratio": "tsx scripts/measure-coverage-exclude-ratio.ts",
```

## 3. 入出力 / 副作用

| 項目 | 内容 |
|------|------|
| 入力 | `vitest.config.ts`, `apps/web/app/**/*.tsx` |
| 出力 | JSON (stdout), markdown / json (--out 指定時), PR comment (CI) |
| 副作用 | `--out` 指定時のファイル書き込み、CI 内での PR comment 投稿 |

## 4. DoD (Definition of Done)

- [ ] `pnpm coverage:measure-exclude-ratio` が JSON を stdout 出力する
- [ ] measure script 5 TC + existing component regression が GREEN
- [ ] `vitest.config.ts` から `loading.tsx` / `not-found.tsx` 行が削除
- [ ] 2 runbook が `docs/30-workflows/runbooks/` 配下に存在
- [ ] `verify-coverage-exclude-ratio.yml` が syntactically valid (`yamllint` or `actionlint`)
- [ ] `mise exec -- pnpm typecheck` GREEN
- [ ] `mise exec -- pnpm lint` GREEN
- [ ] 既存 `playwright-smoke / smoke (chromium)` が依然 GREEN (regression なし)

## 5. ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm tsx scripts/measure-coverage-exclude-ratio.ts
mise exec -- pnpm vitest run scripts/__tests__/measure-coverage-exclude-ratio.spec.ts
mise exec -- pnpm vitest run apps/web/app/__tests__
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# actionlint (任意)
brew install actionlint && actionlint .github/workflows/verify-coverage-exclude-ratio.yml
```
