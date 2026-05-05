import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const taskRoot = path.resolve(
  __dirname,
  '../../../../docs/30-workflows/06b-C-profile-logged-in-visual-evidence',
)
const evidenceDir =
  process.env.PROFILE_EVIDENCE_OUT_DIR ?? path.join(taskRoot, 'outputs/phase-11')
const storageState = process.env.PROFILE_EVIDENCE_STORAGE_STATE
const today = new Date().toISOString().slice(0, 10)

type Counts = {
  form: number
  input: number
  textarea: number
  submit: number
  editLink: number
}

const viewportCases = [
  { name: 'desktop', size: { width: 1280, height: 800 } },
  { name: 'mobile', size: { width: 390, height: 844 } },
] as const

const signOut = async (page: import('@playwright/test').Page) => {
  await page.context().clearCookies()
}

const ensureDirs = async () => {
  await mkdir(path.join(evidenceDir, 'screenshots'), { recursive: true })
  await mkdir(path.join(evidenceDir, 'dom'), { recursive: true })
}

const collectReadonlyCounts = async (page: import('@playwright/test').Page) =>
  page.locator('main').evaluate((main): Counts => {
    const editableRoot = main.querySelector('[data-testid="request-action-panel"]')
    const inRequestPanel = (element: Element) =>
      editableRoot !== null && editableRoot.contains(element)
    const elements = Array.from(main.querySelectorAll('form,input,textarea,button,a'))
    const candidates = elements.filter((element) => !inRequestPanel(element))
    return {
      form: candidates.filter((element) => element.tagName === 'FORM').length,
      input: candidates.filter((element) => element.tagName === 'INPUT').length,
      textarea: candidates.filter((element) => element.tagName === 'TEXTAREA').length,
      submit: candidates.filter(
        (element) =>
          element instanceof HTMLButtonElement &&
          (element.type === 'submit' || element.textContent?.includes('保存')),
      ).length,
      editLink: candidates.filter(
        (element) =>
          element instanceof HTMLAnchorElement &&
          /edit=true|\/edit\b|編集/.test(element.href + element.textContent),
      ).length,
    }
  })

test.describe('06b-C profile logged-in read-only evidence', () => {
  test.skip(!storageState, 'PROFILE_EVIDENCE_STORAGE_STATE is required for logged-in evidence capture')
  test.use({ storageState })

  for (const viewport of viewportCases) {
    test(`M-08 ${viewport.name} logged-in /profile screenshot`, async ({ page }) => {
      await ensureDirs()
      await page.setViewportSize(viewport.size)
      await page.goto('/profile')
      await expect(page.locator('main')).toBeVisible()
      await expect(page).toHaveURL(/\/profile(?:$|\?)/)
      await page.screenshot({
        fullPage: true,
        path: path.join(evidenceDir, 'screenshots', `M-08-${viewport.name}-${today}.png`),
      })
    })

    test(`M-09 ${viewport.name} no profile edit form`, async ({ page }) => {
      await ensureDirs()
      await page.setViewportSize(viewport.size)
      await page.goto('/profile')
      const counts = await collectReadonlyCounts(page)
      await writeFile(
        path.join(evidenceDir, 'dom', `M-09-no-form-${viewport.name}.json`),
        `${JSON.stringify({ marker: 'M-09', viewport: viewport.name, counts }, null, 2)}\n`,
      )
      expect(counts).toEqual({ form: 0, input: 0, textarea: 0, submit: 0, editLink: 0 })
    })

    test(`M-10 ${viewport.name} edit query ignored`, async ({ page }) => {
      await ensureDirs()
      await page.setViewportSize(viewport.size)
      await page.goto('/profile?edit=true')
      const counts = await collectReadonlyCounts(page)
      await writeFile(
        path.join(evidenceDir, 'dom', `M-10-edit-query-ignored-${viewport.name}.json`),
        `${JSON.stringify({ marker: 'M-10', viewport: viewport.name, counts }, null, 2)}\n`,
      )
      await page.screenshot({
        fullPage: true,
        path: path.join(evidenceDir, 'screenshots', `M-10-${viewport.name}-${today}.png`),
      })
      expect(counts).toEqual({ form: 0, input: 0, textarea: 0, submit: 0, editLink: 0 })
    })
  }

  test('M-16 logout redirects /profile to /login', async ({ page }) => {
    await ensureDirs()
    await page.goto('/profile')
    await expect(page.locator('main')).toBeVisible()
    await signOut(page)
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
    await page.screenshot({
      fullPage: true,
      path: path.join(evidenceDir, 'screenshots', `M-16-redirect-${today}.png`),
    })
  })
})
