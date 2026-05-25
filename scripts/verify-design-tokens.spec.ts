import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  scanForbiddenColorLiterals,
  verifyDesignTokensFromContent,
} from './verify-design-tokens'

const spec = (value = 'oklch(0.58 0.10 55)', includeInfo = true) => `# Tokens

\`\`\`json
{
  "color": {
    "accent": { "value": "${value}", "css": "--ubm-color-accent" },
    "ok": { "value": "oklch(0.66 0.12 145)", "css": "--ubm-color-ok" },
    "okSoft": { "value": "{color.ok}", "css": "--ubm-color-ok-soft" }${includeInfo ? ',\n    "info": { "value": "oklch(0.60 0.10 250)", "css": "--ubm-color-info" }' : ''}
  }
}
\`\`\`

\`\`\`css
@theme inline {
  --color-accent: var(--ubm-color-accent);
  --color-ok: var(--ubm-color-ok);
}
\`\`\`
`

const tokens = (overrides: Partial<Record<string, string | null>> = {}) => `:root {
  --ubm-color-accent: ${overrides.accent ?? 'oklch(0.58 0.10 55)'};
  --ubm-color-ok: ${overrides.ok ?? 'oklch(0.66 0.12 145)'};
  ${overrides.okSoft === null ? '' : `--ubm-color-ok-soft: ${overrides.okSoft ?? 'var(--ubm-color-ok)'};`}
  --ubm-color-info: ${overrides.info ?? 'oklch(0.60 0.10 250)'};
}
@media (min-width: 1px) {
  :root { --ubm-color-accent: oklch(0.99 0 0); }
}
`

const globals = (accent = 'var(--ubm-color-accent)') => `@theme inline {
  --color-accent: ${accent};
  --color-ok: var(--ubm-color-ok);
}
`

function run(input?: {
  specMd?: string
  tokensCss?: string
  globalsCss?: string
}) {
  return verifyDesignTokensFromContent({
    specMd: input?.specMd ?? spec(),
    tokensCss: input?.tokensCss ?? tokens(),
    globalsCss: input?.globalsCss ?? globals(),
  })
}

describe('verify-design-tokens', () => {
  it('C1 reports ok when 09b, tokens.css, and theme bridge match', () => {
    const result = run()
    expect(result.ok).toBe(true)
    expect(result.drifts).toHaveLength(0)
  })

  it('C2 reports value-mismatch when tokens.css literal differs', () => {
    const result = run({ tokensCss: tokens({ accent: 'oklch(0.99 0 0)' }) })
    expect(result.ok).toBe(false)
    expect(result.drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'value-mismatch' })]),
    )
  })

  it('C3 reports missing-in-tokens-css when a declared token is absent', () => {
    const result = run({ tokensCss: tokens({ okSoft: null }) })
    expect(result.drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'missing-in-tokens-css' })]),
    )
  })

  it('C4 reports missing-in-09b for unexpected --ubm token', () => {
    const result = run({ specMd: spec(undefined, false) })
    expect(result.drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'missing-in-09b' })]),
    )
  })

  it('C5 normalizes whitespace before comparing values', () => {
    const result = run({ specMd: spec('oklch(0.58  0.10  55)') })
    expect(result.ok).toBe(true)
  })

  it('C6 ignores nested @media declarations as cascade fallbacks', () => {
    const result = run()
    expect(result.drifts.find((d) => d.key.includes('@media'))).toBeUndefined()
  })

  it('C7 reports bridge absence and bridge RHS mismatch', () => {
    const missing = run({ globalsCss: '@theme inline { --color-ok: var(--ubm-color-ok); }' })
    expect(missing.drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'missing-theme-bridge' })]),
    )

    const mismatch = run({ globalsCss: globals('var(--ubm-color-ok)') })
    expect(mismatch.drifts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: '@theme inline::--color-accent', reason: 'value-mismatch' }),
      ]),
    )
  })
})

describe('verify-design-tokens colorLiteralExcludes', () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'verify-design-tokens-'))
  })

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  async function writeFixture(relPath: string, content: string): Promise<void> {
    const abs = join(workDir, relPath)
    await mkdir(dirname(abs), { recursive: true })
    await writeFile(abs, content, 'utf8')
  }

  const hexSnippet = `export const meta = {
  color: '#1e3a8a',
  background: '#ffffff',
  accent: '#3b82f6',
}
`

  it('C-EX-1 excludes app/.../opengraph-image/route.tsx', async () => {
    await writeFixture('apps/web/app/foo/opengraph-image/route.tsx', hexSnippet)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-2 excludes app/.../icon/route.tsx', async () => {
    await writeFixture('apps/web/app/foo/icon/route.tsx', `export const color = '#ffffff'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-3 excludes app/.../twitter-image/route.tsx', async () => {
    await writeFixture('apps/web/app/foo/twitter-image/route.tsx', `export const color = '#3b82f6'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-4 excludes app/.../apple-icon/route.tsx', async () => {
    await writeFixture('apps/web/app/foo/apple-icon/route.tsx', `export const color = '#000000'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })

  it('C-EX-5 still detects HEX in regular src components', async () => {
    await writeFixture('apps/web/src/components/Foo.tsx', `export const color = '#3b82f6'\n`)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'forbidden-color-literal' })]),
    )
  })

  it('C-EX-6 still excludes existing root metadata file convention', async () => {
    await writeFixture('apps/web/app/foo/opengraph-image.tsx', hexSnippet)
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/app')])
    expect(drifts).toEqual([])
  })
})

describe('verify-design-tokens brandIconExemptPaths', () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'verify-design-tokens-brand-'))
  })

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  async function writeFixture(relPath: string, content: string): Promise<void> {
    const abs = join(workDir, relPath)
    await mkdir(dirname(abs), { recursive: true })
    await writeFile(abs, content, 'utf8')
  }

  it('TC-EXEMPT-01 exempts brand-icons/*.svg (direct child)', async () => {
    await writeFixture(
      'apps/web/src/components/ui/brand-icons/google.svg',
      '<svg><path fill="#4285F4"/></svg>\n',
    )
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual([])
  })

  it('TC-EXEMPT-02 does NOT exempt brand-icons/*.tsx (wrapper components must not carry HEX)', async () => {
    await writeFixture(
      'apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx',
      `export const fill = '#EA4335'\n`,
    )
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'forbidden-color-literal' })]),
    )
  })

  it('TC-EXEMPT-03 does NOT exempt brand-icons subdirectory (recursion guard)', async () => {
    await writeFixture(
      'apps/web/src/components/ui/brand-icons/sub/google.svg',
      '<svg><path fill="#FBBC05"/></svg>\n',
    )
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'forbidden-color-literal' })]),
    )
  })

  it('TC-EXEMPT-04 still detects HEX in regular src components (regression guard)', async () => {
    await writeFixture(
      'apps/web/src/components/ui/Card.tsx',
      `export const color = '#ff0000'\n`,
    )
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'forbidden-color-literal' })]),
    )
  })

  it('TC-EXEMPT-05 does NOT exempt brand-icons/*.css (svg only)', async () => {
    await writeFixture(
      'apps/web/src/components/ui/brand-icons/google.css',
      `.g { color: #4285F4; }\n`,
    )
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'forbidden-color-literal' })]),
    )
  })

  it('TC-EXEMPT-06 does NOT exempt brand-icons/*.ts (svg only)', async () => {
    await writeFixture(
      'apps/web/src/components/ui/brand-icons/colors.ts',
      `export const c = '#34A853'\n`,
    )
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'forbidden-color-literal' })]),
    )
  })

  it('TC-EXEMPT-07 does NOT exempt brand-icon (singular) typo directory', async () => {
    await writeFixture(
      'apps/web/src/components/ui/brand-icon/google.tsx',
      `export const c = '#4285F4'\n`,
    )
    const drifts = await scanForbiddenColorLiterals([join(workDir, 'apps/web/src')])
    expect(drifts).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'forbidden-color-literal' })]),
    )
  })
})
