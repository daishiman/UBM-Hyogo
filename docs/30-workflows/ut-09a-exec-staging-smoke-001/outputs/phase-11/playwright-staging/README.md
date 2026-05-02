# playwright-staging/ — staging UI smoke evidence

実行結果: BLOCKED — Cloudflare 認証情報未注入のため staging deploy が成立せず、
公開 staging URL を確定できなかった。Playwright の staging profile で必要な
`STAGING_BASE_URL` / `STAGING_API_BASE_URL` を実値として確定できないため、
report.html / trace.zip / screenshot は本ディレクトリ配下に存在しない。

## 取得対象 (target)

08b scaffold (`apps/web/playwright.config.ts` の `staging` profile) で以下を取得する想定だった:

| spec | 想定 evidence file |
| --- | --- |
| public landing | screenshots/01-public-landing.png |
| members directory | screenshots/02-members-directory.png |
| member detail | screenshots/03-member-detail.png |
| login (magic link) | screenshots/04-login-magic-link.png |
| login (google oauth) | screenshots/05-login-google.png |
| profile (logged-in) | screenshots/06-profile-logged-in.png |
| admin dashboard | screenshots/07-admin-dashboard.png |
| admin members | screenshots/08-admin-members.png |
| authz boundary (一般 user → /admin) | screenshots/09-authz-boundary.png |

加えて Playwright HTML report (`report/index.html`) と trace
(`trace/<spec>-trace.zip`) を本ディレクトリに保存する設計だった。

## 復旧条件

`wrangler-tail.log` 末尾「復旧条件」と同等。Cloudflare 認証復旧 + staging deploy 成立後に
`pnpm --filter @ubm-hyogo/web playwright test --project=staging` を実行することで本
ディレクトリに実 evidence が配置される。

## 判定

AC-2: FAIL（実 Playwright report / screenshot 未取得）
