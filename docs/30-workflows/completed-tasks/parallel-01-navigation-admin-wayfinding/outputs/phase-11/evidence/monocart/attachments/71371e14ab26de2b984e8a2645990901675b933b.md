# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-pages.spec.ts >> admin pages × 認可境界 (5 画面 × 3 ロール) >> admin: 5 画面すべてアクセス可能 + screenshot
- Location: playwright/tests/admin-pages.spec.ts:13:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.waitFor: Target page, context or browser has been closed
Call log:
  - waiting for locator('[data-testid="admin-tag-queue-list"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - navigation "管理メニュー" [ref=e4]:
        - link "ホームに戻る" [ref=e5] [cursor=pointer]:
          - /url: /
          - text: UBM兵庫
        - list [ref=e6]:
          - listitem [ref=e7]:
            - link "ダッシュボード" [ref=e8] [cursor=pointer]:
              - /url: /admin
          - listitem [ref=e9]:
            - link "出席分析" [ref=e10] [cursor=pointer]:
              - /url: /admin/dashboard/attendance
          - listitem [ref=e11]:
            - link "会員管理" [ref=e12] [cursor=pointer]:
              - /url: /admin/members
          - listitem [ref=e13]:
            - link "タグキュー" [ref=e14] [cursor=pointer]:
              - /url: /admin/tags
          - listitem [ref=e15]:
            - link "schema" [ref=e16] [cursor=pointer]:
              - /url: /admin/schema
          - listitem [ref=e17]:
            - link "開催日" [ref=e18] [cursor=pointer]:
              - /url: /admin/meetings
          - listitem [ref=e19]:
            - link "依頼キュー" [ref=e20] [cursor=pointer]:
              - /url: /admin/requests
          - listitem [ref=e21]:
            - link "Identity重複" [ref=e22] [cursor=pointer]:
              - /url: /admin/identity-conflicts
          - listitem [ref=e23]:
            - link "監査ログ" [ref=e24] [cursor=pointer]:
              - /url: /admin/audit
        - button "ログアウト" [ref=e26] [cursor=pointer]
    - main [ref=e27]:
      - alert [ref=e28]:
        - heading "エラーが発生しました" [level=1] [ref=e29]
        - paragraph [ref=e30]: "admin api /admin/tags/queue failed: 404"
        - button "再試行" [ref=e31] [cursor=pointer]
  - generic [ref=e36] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e37]:
      - img [ref=e38]
    - generic [ref=e41]:
      - button "Open issues overlay" [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]: "0"
          - generic [ref=e45]: "1"
        - generic [ref=e46]: Issue
      - button "Collapse issues badge" [ref=e47]:
        - img [ref=e48]
  - alert [ref=e50]
```

# Test source

```ts
  1  | import { BasePage } from './BasePage'
  2  | 
  3  | export class AdminTagsPage extends BasePage {
  4  |   readonly url = '/admin/tags'
  5  |   readonly queueList = this.page.locator('[data-testid="admin-tag-queue-list"]')
  6  |   readonly reviewPanel = this.page.locator('[data-testid="admin-tag-review-panel"]')
  7  |   readonly statusFilters = this.page.getByRole('group', { name: 'ステータス絞込' })
  8  | 
  9  |   async assertQueueShell(): Promise<void> {
> 10 |     await this.queueList.waitFor()
     |                          ^ Error: locator.waitFor: Target page, context or browser has been closed
  11 |     await this.reviewPanel.waitFor()
  12 |     await this.statusFilters.waitFor()
  13 |   }
  14 | }
  15 | 
```