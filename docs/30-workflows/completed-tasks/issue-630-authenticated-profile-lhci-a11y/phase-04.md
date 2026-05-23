# Phase 4 — 詳細設計

## `apps/web/scripts/lhci-auth-storage.ts`

```ts
import { signSessionJwt } from '@ubm-hyogo/shared'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

type StorageStateCookie = {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  httpOnly: boolean
  secure: boolean
  sameSite: 'Lax' | 'Strict' | 'None'
}

type StorageState = {
  cookies: StorageStateCookie[]
  origins: []
}

const TEST_MEMBER_ID = 'e2e-lhci-member-0001'
const COOKIE_NAME = 'authjs.session-token'
const TTL_SEC = 60 * 60

export async function main(
  outPath: string = fileURLToPath(new URL('../.lhci/storage-state.json', import.meta.url)),
): Promise<void> {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is required')

  const token = await signSessionJwt(secret, {
    memberId: TEST_MEMBER_ID,
    isAdmin: false,
    name: 'LHCI Test Member',
    email: 'lhci-test@example.invalid',
    ttlSeconds: TTL_SEC,
  })

  const state: StorageState = {
    cookies: [
      {
        name: COOKIE_NAME,
        value: token,
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + TTL_SEC,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ],
    origins: [],
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(state, null, 2), 'utf8')
  console.log(`[lhci-auth-storage] wrote ${outPath}`)
}

const isDirectInvocation = process.argv[1] === fileURLToPath(import.meta.url)
if (isDirectInvocation) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
```

## `apps/web/lhci/lhci-auth.cjs`

```js
// LHCI puppeteerScript: 計測前に storage-state.json の cookie を注入する
// 引数 shape: ({ page, browser, context }, url) — LHCI v0.13+
const fs = require('node:fs')
const path = require('node:path')

module.exports = async (browser, context = {}) => {
  const storagePath = path.resolve(__dirname, '../.lhci/storage-state.json')
  if (!fs.existsSync(storagePath)) {
    throw new Error(`[lhci-auth] storage-state.json not found at ${storagePath}`)
  }
  const state = JSON.parse(fs.readFileSync(storagePath, 'utf8'))

  // Puppeteer Browser context API
  const pages = await browser.pages()
  const page = pages[0] || (await browser.newPage())

  await page.setCookie(
    ...state.cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite,
    })),
  )

  if (context.url) {
    const response = await page.goto(context.url, { waitUntil: 'networkidle0' })
    const finalUrl = page.url()
    if (!response || !response.ok()) throw new Error(`[lhci-auth] pre-check failed at ${finalUrl}`)
    if (new URL(finalUrl).pathname !== '/profile') throw new Error(`[lhci-auth] expected /profile, got ${finalUrl}`)
  }
}
```

## `apps/web/scripts/lhci-profile-mock-api.ts`

`/profile` は Server Component で `/me` と `/me/profile` を取得するため、authenticated LHCI では deterministic mock API を `127.0.0.1:8787` で起動する。`GET /health` を readiness に使い、`/me` / `/me/profile` / `/me/attendance` は `authjs.session-token` を `verifySessionJwt(AUTH_SECRET, token)` で検証してから返す。

## `lighthouserc.authenticated.json`

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/profile"],
      "numberOfRuns": 1,
      "puppeteerScript": "./lhci/lhci-auth.cjs",
      "puppeteerLaunchOptions": { "headless": "new" },
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.80 }],
        "categories:accessibility": ["error", { "minScore": 0.90 }],
        "categories:best-practices": ["error", { "minScore": 0.90 }],
        "categories:seo": ["error", { "minScore": 0.80 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci-authenticated" }
  }
}
```

## 既存 `lighthouserc.json` の編集

`"http://localhost:3000/profile"` の 1 行を削除。他は変更なし。

## `apps/web/package.json`

`scripts` に以下を追記。

```json
"lhci:auth-storage": "tsx scripts/lhci-auth-storage.ts"
```

`tsx` は `apps/web/package.json` に未登録のため、本実装サイクルで devDependency として追加する。

## 入出力契約

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `lhci-auth-storage.main(outPath)` | `outPath: string`, env `AUTH_SECRET` | `void` | `outPath` にファイル書き出し |
| `lhci-auth.cjs (default)` | `(browser, context)` | `Promise<void>` | puppeteer に cookie をセット |
