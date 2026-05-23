[実装区分: 実装仕様書]

# Phase 6 — テスト追加実装

## 1. 前提

Phase 5 Step 1-2 で以下が export されていること:

- `export async function scanForbiddenColorLiterals(roots, excludes?)`
- `export const DEFAULTS`

## 2. テストファイル

追記先: `scripts/verify-design-tokens.spec.ts`（既存ファイル末尾に追記。新規ファイル作成は不要）。

> 命名規約: `*.spec.ts` のみ許可（CLAUDE.md 不変条件 #8 / lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix`）。既存ファイルが既に準拠。

## 3. 実装 snippet（Vitest）

ファイル先頭の import 追加:

```ts
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach } from 'vitest'

import {
  scanForbiddenColorLiterals,
  verifyDesignTokensFromContent,
} from './verify-design-tokens'
```

ファイル末尾に追加するブロック:

```ts
describe('verify-design-tokens — colorLiteralExcludes (route handler convention)', () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'verify-design-tokens-'))
  })

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  async function writeFixture(relPath: string, content: string): Promise<string> {
    const abs = join(workDir, relPath)
    await mkdir(join(abs, '..'), { recursive: true })
    await writeFile(abs, content, 'utf8')
    return abs
  }

  const HEX_SNIPPET = `export const meta = {
  color: '#1e3a8a',
  background: '#ffffff',
  accent: '#3b82f6',
}
`

  it('C-EX-1 excludes app/.../opengraph-image/route.tsx (route handler convention)', async () => {
    await writeFixture('apps/web/app/foo/opengraph-image/route.tsx', HEX_SNIPPET)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-2 excludes app/.../icon/route.tsx', async () => {
    await writeFixture('apps/web/app/foo/icon/route.tsx', `export const x = '#ffffff'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-3 excludes app/.../twitter-image/route.tsx', async () => {
    await writeFixture('apps/web/app/foo/twitter-image/route.tsx', `export const x = '#3b82f6'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-4 excludes app/.../apple-icon/route.tsx', async () => {
    await writeFixture('apps/web/app/foo/apple-icon/route.tsx', `export const x = '#000000'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-5 still detects HEX in regular src/components/*.tsx (regression guard)', async () => {
    await writeFixture('apps/web/src/components/Foo.tsx', `export const c = '#3b82f6'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts.length).toBeGreaterThanOrEqual(1)
    expect(drifts[0]?.reason).toBe('forbidden-color-literal')
  })

  it('C-EX-6 still excludes existing root convention app/.../opengraph-image.tsx', async () => {
    await writeFixture('apps/web/app/foo/opengraph-image.tsx', HEX_SNIPPET)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })
})
```

## 4. 補足

- `scanForbiddenColorLiterals` の第 2 引数 `excludes` は省略時 `DEFAULTS.colorLiteralExcludes` が使われる（Phase 5 で確定）。テストでは default 動作（= 本番と同じ regex セット）を検証する。
- 各 case は独立 tmpdir なので並列実行可能。`vitest` 既定の並列度で問題なし。
- 既存 C1〜C7 は `verifyDesignTokensFromContent` を直接呼ぶ pure unit test であり、本追加と独立に pass し続けること。

## 5. 実行コマンド

```bash
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts
```

期待: 既存 7 件 + 追加 6 件 = 計 13 件すべて pass。
