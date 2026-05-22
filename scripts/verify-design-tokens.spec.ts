import { describe, expect, it } from 'vitest'

import { verifyDesignTokensFromContent } from './verify-design-tokens'

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
