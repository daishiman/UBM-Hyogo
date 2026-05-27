# Phase 2 — 設計

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 設計方針

vitest の単一 spec で 4 assert を実装する。実行は既存 `pnpm --filter @ubm-hyogo/web test` パイプラインに自動的に乗る（`apps/web/__tests__/*.spec.ts` は既に拾われる: `middleware.spec.ts` 実績あり）。CI には typecheck job 後に明示 step を 1 つ追加する。

## 2. ファイル構成

| パス | 種別 | 変更 |
|------|------|------|
| `apps/web/__tests__/opennext-config-regression.spec.ts` | TypeScript / vitest | 新規 |
| `.github/workflows/ci.yml` | YAML | step 追加 |

## 3. 主要関数 / 型 / describe-it 構造

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// 追加依存なし。対象 wrangler.toml の section / scalar / string-array だけを test-local parser で読む。

const repoRoot = resolve(__dirname, '../../..');

function readText(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf8');
}

describe('OpenNext Workers 設定回帰防止', () => {
  it('AC1: apps/web/wrangler.toml に pages_build_output_dir が存在しない', () => { /* parse + assert undefined */ });
  it('AC2: top-level / env-scoped [assets] が存在し directory = ".open-next/assets"', () => { /* ... */ });
  it('AC3: apps/web/package.json の deploy 系 scripts が存在しない', () => { /* JSON.parse + assert undefined */ });
  it('AC4: apps/web/.assetsignore に必須行が含まれる', () => { /* split lines + Set.has */ });
});
```

## 4. 入出力 / 副作用

- 入力: `apps/web/wrangler.toml`、`apps/web/package.json`、`apps/web/.assetsignore`（read-only）
- 出力: vitest pass/fail
- 副作用: なし

## 5. CI 組み込み箇所

`.github/workflows/ci.yml` の web typecheck job のあとに以下相当を追加:

```yaml
- name: OpenNext config regression guard
  run: pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
```

既存 `apps/web` test job が `__tests__/*.spec.ts` を全件走らせる場合は重複実行になるため、その場合は本 step を spec パスで明示するだけに留め、独立 job 化はしない。

## 6. ローカル実行

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
```

## 7. DoD

- spec 1 ファイル + CI 1 step diff のみ
- 各 it ブロックが AC と 1:1 で対応している
