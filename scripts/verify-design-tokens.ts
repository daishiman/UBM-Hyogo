#!/usr/bin/env tsx
/**
 * verify-design-tokens
 *
 * 09b-design-tokens.md §9 JSON / §10 @theme inline と
 * apps/web/src/styles/tokens.css / globals.css の token literal drift を検査する。
 *
 * - drift 0 → exit 0
 * - drift 1 件以上 → exit 1
 *
 * 設計: docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/phase-03.md
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface TokenValue {
  name: string
  raw: string
  scope: string
}

export type DriftReason =
  | 'value-mismatch'
  | 'missing-in-tokens-css'
  | 'missing-in-09b'
  | 'missing-theme-bridge'
  | 'forbidden-color-literal'

export interface TokenDrift {
  key: string
  spec: TokenValue | null
  css: TokenValue | null
  reason: DriftReason
}

export interface VerifyResult {
  specTokens: Map<string, TokenValue>
  cssTokens: Map<string, TokenValue>
  drifts: TokenDrift[]
  ok: boolean
}

export interface VerifyOptions {
  specPath?: string
  tokensCssPath?: string
  globalsCssPath?: string
  includeThemeBridge?: boolean
  scanColorLiterals?: boolean
  colorLiteralRoots?: string[]
}

const DEFAULTS = {
  specPath: 'docs/00-getting-started-manual/specs/09b-design-tokens.md',
  tokensCssPath: 'apps/web/src/styles/tokens.css',
  globalsCssPath: 'apps/web/src/styles/globals.css',
  includeThemeBridge: true,
  scanColorLiterals: true,
  colorLiteralRoots: ['apps/web/app', 'apps/web/src'],
  colorLiteralExcludes: [
    /\/opengraph-image\.tsx$/,
    /\/twitter-image\.tsx$/,
    /\/icon\.tsx$/,
    /\/apple-icon\.tsx$/,
  ] as readonly RegExp[],
}

const ROOT_SCOPE = ':root'
const THEME_SCOPE: Record<string, string> = {
  warm: '[data-theme="warm"]',
  cool: '[data-theme="cool"]',
  dark: '[data-theme="dark"]',
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * 09b spec から最初の fenced json block を抽出して JSON.parse する。
 */
export function extractSpecJsonBlock(md: string): unknown {
  const match = md.match(/```json\s*\n([\s\S]*?)\n```/)
  if (!match) {
    throw new Error('verify-design-tokens: spec から ```json fenced block を抽出できませんでした')
  }
  return JSON.parse(match[1]!)
}

/**
 * 09b spec の §10 `@theme inline { ... }` block を抽出する。存在しなければ空文字を返す。
 */
export function extractSpecThemeInlineBlock(md: string): string {
  // ```css ... @theme inline { ... } ... ``` 形式
  const cssBlocks = [...md.matchAll(/```css\s*\n([\s\S]*?)\n```/g)]
  for (const m of cssBlocks) {
    const body = m[1] ?? ''
    const themeMatch = body.match(/@theme\s+inline\s*\{([\s\S]*?)\}\s*$/m)
    if (themeMatch) {
      return themeMatch[1] ?? ''
    }
    // 中括弧バランスで探す
    const idx = body.indexOf('@theme')
    if (idx >= 0) {
      const open = body.indexOf('{', idx)
      if (open >= 0) {
        let depth = 0
        for (let i = open; i < body.length; i += 1) {
          const ch = body[i]
          if (ch === '{') depth += 1
          else if (ch === '}') {
            depth -= 1
            if (depth === 0) return body.slice(open + 1, i)
          }
        }
      }
    }
  }
  return ''
}

interface SpecLeaf {
  cssName: string
  rawValue: string
  scope: string
  declOrder: number
}

/**
 * 09b JSON を再帰的に歩き、leaf ({value, css}) を宣言順に収集する。
 */
export function walkSpecJson(json: unknown): SpecLeaf[] {
  const leaves: SpecLeaf[] = []
  let order = 0

  const visit = (node: unknown, path: string[]): void => {
    if (node === null || typeof node !== 'object') return
    const obj = node as Record<string, unknown>

    // leaf 判定
    if (typeof obj.value === 'string' && typeof obj.css === 'string') {
      // scope を path から推定
      const themeIdx = path.indexOf('theme')
      let scope = ROOT_SCOPE
      if (themeIdx >= 0 && path[themeIdx + 1]) {
        const themeKey = path[themeIdx + 1]!
        scope = THEME_SCOPE[themeKey] ?? `[data-theme="${themeKey}"]`
      }
      leaves.push({
        cssName: obj.css,
        rawValue: obj.value,
        scope,
        declOrder: order,
      })
      order += 1
      return
    }
    for (const [k, v] of Object.entries(obj)) {
      visit(v, [...path, k])
    }
  }

  visit(json, [])
  return leaves
}

/**
 * css text から CSS custom property 宣言を抽出する。
 * 各 selector block 単位で scope を保持する。
 */
export function extractCssTokens(cssText: string): TokenValue[] {
  const tokens: TokenValue[] = []
  // selector { ... } の中括弧マッチ
  const len = cssText.length
  let i = 0
  let currentSelector = ROOT_SCOPE

  while (i < len) {
    const ch = cssText[i]
    if (ch === '/' && cssText[i + 1] === '*') {
      const end = cssText.indexOf('*/', i + 2)
      if (end < 0) break
      i = end + 2
      continue
    }
    // selector 開始
    const openBrace = cssText.indexOf('{', i)
    if (openBrace < 0) break
    const selectorRaw = cssText.slice(i, openBrace).trim()
    // 直前の `}` までを selector とみなす（複数 selector 連結対応）
    const lastSelectorLine = selectorRaw.split(/[}\n]/).pop()?.trim() ?? selectorRaw
    let selector = lastSelectorLine || ROOT_SCOPE

    // @supports / @media など conditional at-rule の中は fallback / responsive 値であり
    // 通常 cascade の token literal 比較対象に含めない（C6 ネスト無視と同じ扱い）
    if (selector.startsWith('@supports') || selector.startsWith('@media')) {
      const block = readBalancedBlock(cssText, openBrace)
      if (!block) break
      i = block.end + 1
      continue
    }

    // selector を normalize
    selector = normalize(selector)
    currentSelector = selector

    const block = readBalancedBlock(cssText, openBrace)
    if (!block) break

    // block body から `--name: value;` を抽出
    const propRe = /(--[\w-]+)\s*:\s*([^;]+);/g
    for (const m of block.body.matchAll(propRe)) {
      tokens.push({
        name: m[1]!,
        raw: normalize(m[2]!),
        scope: currentSelector,
      })
    }
    i = block.end + 1
  }
  return tokens
}

function readBalancedBlock(
  text: string,
  openBraceIdx: number,
): { body: string; end: number } | null {
  let depth = 0
  for (let i = openBraceIdx; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        return { body: text.slice(openBraceIdx + 1, i), end: i }
      }
    }
  }
  return null
}

/**
 * spec の `{path.to.token}` 参照を `var(--css-name)` 形式に解決する。
 */
function resolveSpecRef(rawValue: string, byPath: Map<string, string>): string {
  return rawValue.replace(/\{([\w.-]+)\}/g, (_match, p1: string) => {
    const cssName = byPath.get(p1)
    return cssName ? `var(${cssName})` : `{${p1}}`
  })
}

/**
 * 09b JSON を walk して、path -> css 名の lookup と leaves を返す。
 */
export function walkSpecJsonWithPaths(json: unknown): {
  leaves: SpecLeaf[]
  byPath: Map<string, string>
} {
  const leaves: SpecLeaf[] = []
  const byPath = new Map<string, string>()
  let order = 0

  const visit = (node: unknown, path: string[]): void => {
    if (node === null || typeof node !== 'object') return
    const obj = node as Record<string, unknown>

    if (typeof obj.value === 'string' && typeof obj.css === 'string') {
      const themeIdx = path.indexOf('theme')
      let scope = ROOT_SCOPE
      if (themeIdx >= 0 && path[themeIdx + 1]) {
        const themeKey = path[themeIdx + 1]!
        scope = THEME_SCOPE[themeKey] ?? `[data-theme="${themeKey}"]`
      }
      leaves.push({
        cssName: obj.css,
        rawValue: obj.value,
        scope,
        declOrder: order,
      })
      byPath.set(path.join('.'), obj.css)
      order += 1
      return
    }
    for (const [k, v] of Object.entries(obj)) {
      visit(v, [...path, k])
    }
  }

  visit(json, [])
  return { leaves, byPath }
}

/**
 * @theme inline block から bridge token を抽出する。
 */
export function extractThemeBridgeTokens(blockBody: string): Map<string, string> {
  const tokens = new Map<string, string>()
  const re = /(--[\w-]+)\s*:\s*[^;]+;/g
  for (const m of blockBody.matchAll(re)) {
    tokens.set(m[1]!, normalize((m[0]!.split(':').slice(1).join(':')).replace(/;$/, '')))
  }
  return tokens
}

function makeKey(cssName: string, scope: string): string {
  return `${scope}::${cssName}`
}

export interface VerifyContent {
  specMd: string
  tokensCss: string
  globalsCss: string
  includeThemeBridge?: boolean
}

export function verifyDesignTokensFromContent(content: VerifyContent): VerifyResult {
  const { specMd, tokensCss, globalsCss } = content
  const includeThemeBridge = content.includeThemeBridge ?? true
  return runVerify(specMd, tokensCss, globalsCss, includeThemeBridge)
}

export async function verifyDesignTokens(options: VerifyOptions = {}): Promise<VerifyResult> {
  const specPath = options.specPath ?? DEFAULTS.specPath
  const tokensCssPath = options.tokensCssPath ?? DEFAULTS.tokensCssPath
  const globalsCssPath = options.globalsCssPath ?? DEFAULTS.globalsCssPath
  const includeThemeBridge = options.includeThemeBridge ?? DEFAULTS.includeThemeBridge
  const scanColorLiterals = options.scanColorLiterals ?? DEFAULTS.scanColorLiterals
  const colorLiteralRoots = options.colorLiteralRoots ?? DEFAULTS.colorLiteralRoots

  const [specMd, tokensCss, globalsCss] = await Promise.all([
    readFile(specPath, 'utf8'),
    readFile(tokensCssPath, 'utf8'),
    readFile(globalsCssPath, 'utf8'),
  ])

  const result = runVerify(specMd, tokensCss, globalsCss, includeThemeBridge)
  if (scanColorLiterals) {
    result.drifts.push(...await scanForbiddenColorLiterals(colorLiteralRoots))
    result.ok = result.drifts.length === 0
  }
  return result
}

function runVerify(
  specMd: string,
  tokensCss: string,
  globalsCss: string,
  includeThemeBridge: boolean,
): VerifyResult {
  const json = extractSpecJsonBlock(specMd)
  const { leaves, byPath } = walkSpecJsonWithPaths(json)

  const specTokens = new Map<string, TokenValue>()
  const specLeafOrder: { key: string; leaf: SpecLeaf }[] = []
  for (const leaf of leaves) {
    const resolvedRaw = resolveSpecRef(leaf.rawValue, byPath)
    const tv: TokenValue = {
      name: leaf.cssName,
      raw: normalize(resolvedRaw),
      scope: leaf.scope,
    }
    const key = makeKey(leaf.cssName, leaf.scope)
    specTokens.set(key, tv)
    specLeafOrder.push({ key, leaf })
  }

  const cssTokenArr = extractCssTokens(tokensCss)
  const cssTokens = new Map<string, TokenValue>()
  for (const t of cssTokenArr) {
    // 同じ key が複数 selector で出現する可能性は scope を分けてあるので衝突しない
    cssTokens.set(makeKey(t.name, t.scope), t)
  }

  const drifts: TokenDrift[] = []

  // spec 宣言順に comparison
  for (const { key } of specLeafOrder) {
    const spec = specTokens.get(key)
    const css = cssTokens.get(key)
    if (!css) {
      drifts.push({ key, spec: spec ?? null, css: null, reason: 'missing-in-tokens-css' })
      continue
    }
    if (normalize(css.raw) !== normalize(spec!.raw)) {
      drifts.push({ key, spec: spec!, css, reason: 'value-mismatch' })
    }
  }

  // spec に無いが --ubm- prefix で tokens.css に存在する場合 → missing-in-09b
  // ただし spec は :root scope と theme scope を区別するため、key で照合
  // spec に登録された css 名（scope 無視のセット）を補助セットで保持
  const specCssNames = new Set<string>()
  for (const leaf of leaves) specCssNames.add(leaf.cssName)
  for (const t of cssTokenArr) {
    if (!t.name.startsWith('--ubm-')) continue
    if (!specCssNames.has(t.name)) {
      const key = makeKey(t.name, t.scope)
      drifts.push({ key, spec: null, css: t, reason: 'missing-in-09b' })
    }
  }

  // theme bridge check
  if (includeThemeBridge) {
    const specBridgeBody = extractSpecThemeInlineBlock(specMd)
    if (specBridgeBody) {
      const expected = extractThemeBridgeTokens(specBridgeBody)
      const globalsBridgeBlock = (() => {
        const idx = globalsCss.indexOf('@theme')
        if (idx < 0) return ''
        const open = globalsCss.indexOf('{', idx)
        if (open < 0) return ''
        const block = readBalancedBlock(globalsCss, open)
        return block?.body ?? ''
      })()
      const actual = extractThemeBridgeTokens(globalsBridgeBlock)
      for (const [name, expectedRaw] of expected) {
        const actualRaw = actual.get(name)
        if (actualRaw === undefined) {
          drifts.push({
            key: `@theme inline::${name}`,
            spec: { name, raw: expectedRaw, scope: '@theme inline' },
            css: null,
            reason: 'missing-theme-bridge',
          })
        } else if (actualRaw !== expectedRaw) {
          drifts.push({
            key: `@theme inline::${name}`,
            spec: { name, raw: expectedRaw, scope: '@theme inline' },
            css: { name, raw: actualRaw, scope: '@theme inline' },
            reason: 'value-mismatch',
          })
        }
      }
    }
  }

  return {
    specTokens,
    cssTokens,
    drifts,
    ok: drifts.length === 0,
  }
}

export function formatDriftReport(result: VerifyResult, paths: {
  specPath: string
  tokensCssPath: string
  globalsCssPath: string
}): string {
  const tracked = result.specTokens.size
  if (result.ok) {
    return `✓ design tokens in sync (${tracked} tracked)\n`
  }
  const lines: string[] = []
  lines.push(`✗ token drift detected (${result.drifts.length}):`)
  for (const d of result.drifts) {
    const specStr = d.spec ? `09b: ${d.spec.raw || '(bridge)'}` : '09b: (missing)'
    const cssStr = d.css ? `tokens.css: ${d.css.raw}` : 'tokens.css: (missing)'
    lines.push(`  ${d.key.padEnd(48)} ${specStr.padEnd(40)} ${cssStr.padEnd(40)} [${d.reason}]`)
  }
  lines.push('hint: 09b        = ' + paths.specPath)
  lines.push('      tokens.css = ' + paths.tokensCssPath)
  lines.push('      globals    = ' + paths.globalsCssPath + ' (@theme inline block)')
  return lines.join('\n') + '\n'
}

async function listFiles(root: string): Promise<string[]> {
  let s
  try {
    s = await stat(root)
  } catch {
    return []
  }
  if (s.isFile()) return [root]
  const entries = await readdir(root, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const path = `${root}/${entry.name}`
    if (entry.isDirectory()) files.push(...await listFiles(path))
    else files.push(path)
  }
  return files
}

async function scanForbiddenColorLiterals(
  roots: readonly string[],
  excludes: readonly RegExp[] = DEFAULTS.colorLiteralExcludes,
): Promise<TokenDrift[]> {
  const files = (await Promise.all(roots.map((root) => listFiles(root))))
    .flat()
    .filter((file) => /\.(ts|tsx|css)$/.test(file))
    .filter((file) => !file.endsWith('/src/styles/tokens.css'))
    // next/og ImageResponse は CSS variable を解決しないため HEX literal 必須。
    .filter((file) => !file.endsWith('/app/opengraph-image.tsx'))
    .filter((file) => !excludes.some((re) => re.test(file)))
  const drifts: TokenDrift[] = []
  const hexRe = /(^|[^A-Za-z0-9_-])(#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?(?:[0-9A-Fa-f]{2})?)\b/g
  const arbitraryRe = /\b(?:bg|text|border|from|to|via)-\[#[0-9A-Fa-f]{3,8}\]/g

  for (const file of files) {
    const text = await readFile(file, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return
      if (arbitraryRe.test(line)) {
        drifts.push({
          key: `${file}:${idx + 1}`,
          spec: null,
          css: { name: file, raw: line.trim(), scope: 'source' },
          reason: 'forbidden-color-literal',
        })
      }
      arbitraryRe.lastIndex = 0
      for (const match of line.matchAll(hexRe)) {
        const raw = match[2]!
        drifts.push({
          key: `${file}:${idx + 1}`,
          spec: null,
          css: { name: file, raw, scope: 'source' },
          reason: 'forbidden-color-literal',
        })
      }
    })
  }

  return drifts
}

async function main(): Promise<void> {
  const paths = {
    specPath: resolvePath(process.cwd(), DEFAULTS.specPath),
    tokensCssPath: resolvePath(process.cwd(), DEFAULTS.tokensCssPath),
    globalsCssPath: resolvePath(process.cwd(), DEFAULTS.globalsCssPath),
  }
  const result = await verifyDesignTokens(paths)
  process.stdout.write(formatDriftReport(result, paths))
  process.exit(result.ok ? 0 : 1)
}

const isMain = (() => {
  if (!process.argv[1]) return false
  try {
    const here = fileURLToPath(import.meta.url)
    return here === resolvePath(process.argv[1])
  } catch {
    return false
  }
})()

if (isMain) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err)
    process.stderr.write(`verify-design-tokens: ${msg}\n`)
    process.exit(2)
  })
}
