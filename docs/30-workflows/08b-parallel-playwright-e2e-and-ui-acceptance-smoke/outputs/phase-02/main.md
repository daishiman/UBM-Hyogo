# Phase 2 成果物 — 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase | 2 / 13（設計） |
| 作成日 | 2026-04-30 |
| 状態 | completed |

---

## 1. test directory layout

Phase 1 で確定した「local Workers + 実 D1」方針に沿い、Playwright 関連は `apps/web/` 配下に集約する。

```
apps/web/
├── playwright.config.ts                  # devices / projects / baseURL / webServer
├── playwright/
│   ├── tests/
│   │   ├── public.spec.ts                # landing / members / detail / register
│   │   ├── login.spec.ts                 # AuthGateState x5 + /no-access 不在
│   │   ├── profile.spec.ts               # editResponseUrl 遷移 + 不変条件 #4
│   │   ├── admin.spec.ts                 # 5 admin pages + 認可境界
│   │   ├── search.spec.ts                # q / zone / status / tag / sort / density
│   │   ├── density.spec.ts               # 3 modes (comfy / dense / list)
│   │   └── attendance.spec.ts            # 二重防御 + 削除済み除外 (#15)
│   ├── page-objects/
│   │   ├── PublicPage.ts
│   │   ├── LoginPage.ts
│   │   ├── ProfilePage.ts
│   │   ├── AdminPage.ts
│   │   └── AttendancePage.ts
│   ├── fixtures/
│   │   ├── auth.ts                       # adminCookie / memberCookie / unregisteredCookie / deletedCookie / rulesDeclinedCookie
│   │   ├── seed.ts                       # wrangler d1 execute --local で D1 seed
│   │   └── viewports.ts                  # desktop=1280x800 / mobile=390x844
│   └── helpers/
│       ├── axe.ts                        # @axe-core/playwright wrapper
│       └── screenshot.ts                 # outputs/phase-11/evidence 命名
└── package.json                          # @axe-core/playwright / @playwright/test devDeps
```

> **責務分割**: spec → 検証フロー、page-objects → セレクタ + ドメイン操作、fixtures → 認証・seed・viewport、helpers → a11y / screenshot 共通処理。

---

## 2. 設計概要

### test runner

| 項目 | 値 | 理由 |
| --- | --- | --- |
| runner | `@playwright/test` v1.x | scenario × project の matrix runner |
| projects | `desktop-chromium` / `mobile-chromium` | AC-1 の 2 viewport を project で表現 |
| webServer | `mise exec -- pnpm --filter @apps/web dev`（port 3000）+ `bash scripts/cf.sh dev --config apps/api/wrangler.toml`（port 8787） | local Workers 起動 |
| webServer.timeout | 60_000 ms | wrangler dev 初回起動 ~5 sec + dev compile 余裕 |
| reporter | `html` + `json` | HTML を CI artifact へ、JSON を AC マトリクス自動採点 |
| retries | CI=2 / local=0 | network flake 緩和 |

### browser

- **chromium 常時** (desktop / mobile project)
- webkit / firefox は nightly workflow にて別出し（CI 分節約 / 不変条件 #無料枠）
- mobile 用には `devices['iPhone 13']` 相当の viewport (390x844) を desktop chromium で実行（実機 emulator 起動コスト回避）

### viewport

| project | viewport | userAgent |
| --- | --- | --- |
| desktop-chromium | 1280 × 800 | chromium 既定 |
| mobile-chromium | 390 × 844 | iPhone 13 相当（Playwright `devices['iPhone 13']` で代替） |

### D1 seed

| ステップ | コマンド | 内容 |
| --- | --- | --- |
| 1 | `pnpm db:reset:e2e` | local D1 を空に reset |
| 2 | `pnpm db:migrate:e2e` | `wrangler d1 migrations apply --local` |
| 3 | `pnpm seed:e2e` | `members` / `member_status` / `meeting_sessions` / `member_attendance` / `tag_assignment_queue` / `schema_diff_queue` / `audit_log` を fixture から流し込む |
| 4 | Playwright `globalSetup` で 1〜3 を呼出 | spec 実行前に冪等 seed |

seed データは admin 1 / member 3 / unregistered 1 / deleted 1 / rules_declined 1 を最低限含む（5 AuthGateState verify 用）。

### env / dependency matrix

| 区分 | キー | 配置 | 補足 |
| --- | --- | --- | --- |
| Playwright | `PLAYWRIGHT_BASE_URL=http://localhost:3000` | playwright.config.ts | local |
| API | `NEXT_PUBLIC_API_BASE=http://localhost:8787` | wrangler dev | local Workers |
| Auth | `AUTH_SECRET` (test 値) | local: `.env`（op 参照）/ CI: GitHub Secrets | session cookie 署名 |
| D1 | local seed | `pnpm seed:e2e` | globalSetup |
| Secrets | （新規導入なし） | — | local 完結 |

### base URL 戦略

| 環境 | base URL | 用途 |
| --- | --- | --- |
| local 既定 | `http://localhost:3000` | dev / CI（採用） |
| preview | Cloudflare Workers preview URL | 09a が利用 |
| staging | `https://staging.ubm-hyogo.example` | scope out（09a 責務） |

---

## 3. page object 概要

| クラス | 主メソッド | 不変条件対応 |
| --- | --- | --- |
| `PublicPage` | `goto({path})`, `getMemberCard(id)`, `fillRegisterForm(props)` | — |
| `LoginPage` | `gotoState(state)`, `getStateBlock(state)`, `assertNoAccessRouteAbsent()` | #9 |
| `ProfilePage` | `goto()`, `assertNoEditFormVisible()`, `clickEditResponseUrl()` | #4 |
| `AdminPage` | `goto(path, role)`, `expectForbidden()` | — |
| `AttendancePage` | `addAttendee(memberId)`, `expectDuplicateToast()`, `expectDeletedMembersExcluded()` | #15 |

---

## 4. screenshot / a11y helper 設計

- `helpers/screenshot.ts`: `await capture(page, { viewport, scenario, state })` → `outputs/phase-11/evidence/{viewport}/{scenario}-{state}.png`
- `helpers/axe.ts`: `await runAxe(page)` → 違反 0 件を assert、レポートを `outputs/phase-11/evidence/axe-report.json` に追記

---

## 5. CI workflow placeholder

- `.github/workflows/e2e-tests.yml`（Phase 5 / 9 で実装、本 Phase では参照のみ）
- ubuntu-latest, Node 24 (mise), `pnpm install` → `pnpm e2e`
- artifact: `playwright-report/`, `outputs/phase-11/evidence/`

---

## タスク完了

- [x] e2e architecture Mermaid (`e2e-architecture.mmd` 別出力)
- [x] scenario × viewport matrix (`scenario-matrix.md` 別出力)
- [x] test directory layout（apps/web/playwright/{tests,fixtures,page-objects,helpers}）
- [x] env / dependency matrix
- [x] page object 構造設計
- [x] base URL 戦略

→ Phase 3（設計レビュー）へ handoff 可能。
