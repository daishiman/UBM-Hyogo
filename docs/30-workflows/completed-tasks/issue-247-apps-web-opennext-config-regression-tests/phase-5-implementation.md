# Phase 5 — 実装手順

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 変更対象ファイル

| パス | 種別 | 変更 |
|------|------|------|
| `apps/web/__tests__/opennext-config-regression.spec.ts` | TypeScript | 新規 |
| `.github/workflows/ci.yml` | YAML | Type check 後に focused guard step 追加 |

## 2. spec ファイル内容（提案）

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
type TomlSection = Record<string, string | string[] | boolean>;

const WEB_ROOT = resolve(__dirname, '..');

function readText(rel: string): string {
  return readFileSync(resolve(WEB_ROOT, rel), 'utf8');
}

describe('OpenNext Workers configuration regression guard', () => {
  const wrangler = parseWranglerToml();

  it('AC1: wrangler.toml top-level has no pages_build_output_dir', () => {
    expect(wrangler).not.toHaveProperty('pages_build_output_dir');
    expect(wrangler['']).toMatchObject({ main: '.open-next/worker.js', compatibility_flags: ['nodejs_compat'] });
  });

  it('AC2: env-scoped [assets] exists for staging and production with directory = ".open-next/assets"', () => {
    for (const section of ['assets', 'env.staging.assets', 'env.production.assets'] as const) {
      expect(wrangler[section], `[${section}]`).toMatchObject({
        directory: '.open-next/assets',
        binding: 'ASSETS',
        not_found_handling: 'single-page-application',
      });
    }
  });

  it('AC3: apps/web/package.json has no scripts.deploy (cf.sh wrapper enforcement)', () => {
    const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };
    expect(pkg.scripts ?? {}).not.toHaveProperty('deploy');
    expect(pkg.scripts ?? {}).not.toHaveProperty('deploy:staging');
    expect(pkg.scripts ?? {}).not.toHaveProperty('deploy:production');
  });

  it('AC4: apps/web/.assetsignore contains required exclude lines', () => {
    const lines = new Set(readText('.assetsignore').split('\n').map((l) => l.trim()).filter(Boolean));
    for (const required of ['node_modules', '.DS_Store', '.git', '*.map', '*.test.*', '*.spec.*', '__tests__']) {
      expect(lines.has(required), `.assetsignore must include ${required}`).toBe(true);
    }
  });
});
```

## 3. CI 組み込み（`.github/workflows/ci.yml`）

既存 web test job に下記 step を追加（job 名は実コードに合わせる）:

```yaml
- name: OpenNext config regression guard
  run: pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
```

既存の web vitest job が `__tests__/*.spec.ts` を拾う場合でも、CI 上で drift guard を独立に可視化するため focused step を追加する。

## 4. ローカル実行

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
pnpm typecheck
pnpm lint
```

## 5. DoD

- 上記 spec 1 ファイル / CI 1 step 差分が PR にすべて含まれる
- assert メッセージから drift 個所が一意に特定できる
