import { test as setup } from '@playwright/test'
import { adminLogin, memberLogin } from '../fixtures/auth'

setup('guest storageState', async ({ context }) => {
  await context.clearCookies()
  await context.storageState({ path: 'playwright/.auth/guest.json' })
})

setup('member storageState', async ({ context }) => {
  await memberLogin(context)
  await context.storageState({ path: 'playwright/.auth/member.json' })
})

setup('admin storageState', async ({ context }) => {
  await adminLogin(context)
  await context.storageState({ path: 'playwright/.auth/admin.json' })
})
