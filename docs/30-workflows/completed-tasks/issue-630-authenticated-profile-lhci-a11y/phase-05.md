# Phase 5 — テスト設計

## focused unit test: `apps/web/scripts/__tests__/lhci-auth-storage.spec.ts`

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { main } from '../lhci-auth-storage'

describe('lhci-auth-storage', () => {
  let tmpDir: string
  const prevSecret = process.env.AUTH_SECRET

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'lhci-auth-'))
    process.env.AUTH_SECRET = 'test-secret-32-bytes-padding-xxx'
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    if (prevSecret === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = prevSecret
  })

  it('writes a storage state with authjs.session-token cookie', async () => {
    const out = join(tmpDir, 'storage.json')
    await main(out)
    const state = JSON.parse(readFileSync(out, 'utf8'))
    expect(state.cookies).toHaveLength(1)
    expect(state.cookies[0].name).toBe('authjs.session-token')
    expect(state.cookies[0].domain).toBe('localhost')
    expect(typeof state.cookies[0].value).toBe('string')
    expect(state.cookies[0].value.length).toBeGreaterThan(20)
  })

  it('throws when AUTH_SECRET is missing', async () => {
    delete process.env.AUTH_SECRET
    await expect(main(join(tmpDir, 'storage.json'))).rejects.toThrow(/AUTH_SECRET/)
  })
})
```

## 手動 / CI 検証

| ケース | 手順 | 期待結果 |
| --- | --- | --- |
| ローカル smoke | `pnpm --filter @ubm-hyogo/web build && pnpm --filter @ubm-hyogo/web start &` の後 `pnpm --filter @ubm-hyogo/web lhci:auth-storage && pnpm exec lhci autorun --config=lighthouserc.authenticated.json` | accessibility >= 0.90 を表示し exit 0 |
| AUTH_SECRET 欠落 | env を unset で run | unit test の throw、CI step は明示的に fail |
| cookie 注入失敗 | storage-state.json を破壊 | LHCI run が fail し artifact upload される |

## 既存テストへの影響

- 既存 Playwright e2e は AUTH_SECRET を別 default 値で生成しているため影響なし。
- 既存 LHCI (unauth) 設定からの `/profile` 削除により、unauth 計測対象は 3 URL になる。runtime time が短縮されるのみで gate 値は変更なし。
