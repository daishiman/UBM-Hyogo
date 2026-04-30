# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-26 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Playwright runner / browser 構成、テストランナーが叩く対象（local Workers 実体 vs preview URL）、page object パターン、scenario / viewport マトリクスを Phase 4 verify suite の元データとして揃える。

## 実行タスク

- [ ] e2e architecture を Mermaid で記述（runner / browser / D1 seed の関係）
- [ ] scenario × viewport matrix（10 画面 × 2 viewport + 主要操作）
- [ ] page object 構造設計
- [ ] env / dependency matrix
- [ ] base URL 戦略（local 既定、preview URL 切替）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | URL 一覧 |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | UI / a11y |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 8b |

## 構成図 (Mermaid)

```mermaid
flowchart TB
  subgraph local
    NEXT[apps/web (Next.js dev)]
    API[apps/api (wrangler dev)]
    D1[D1 local seed]
  end
  subgraph apps/web/test/e2e
    SP[specs/]
    PO[page-objects/]
    F[fixtures/]
    AX[axe helper]
  end
  subgraph specs
    P[public.spec.ts (landing/members/detail/register)]
    L[login.spec.ts (AuthGateState x5)]
    M[profile.spec.ts (editResponseUrl)]
    A[admin.spec.ts (5 pages)]
    S[search.spec.ts (q/zone/status/tag/sort/density)]
    D[density.spec.ts (3 modes)]
    AT[attendance.spec.ts (#15)]
  end
  PO --> P & L & M & A & S & D & AT
  F --> P & L & M & A & S & D & AT
  AX --> P & L & M & A & S
  P & L & M & A & S & D & AT --> CI[GitHub Actions e2e-tests.yml]
  P & L & M & A & S & D & AT --> NEXT
  NEXT --> API
  API --> D1
```

## scenario × viewport matrix

| # | scenario | URL | desktop | mobile | a11y | screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | landing | `/` | ○ | ○ | ○ | desktop+mobile |
| 2 | 一覧 | `/members` | ○ | ○ | ○ | desktop+mobile |
| 3 | 詳細 | `/members/[id]` | ○ | ○ | ○ | desktop+mobile |
| 4 | 登録 | `/register` | ○ | ○ | ○ | desktop+mobile |
| 5 | login input | `/login` (input) | ○ | ○ | ○ | desktop+mobile |
| 6 | login sent | `/login` (sent state) | ○ | ○ | ○ | desktop+mobile |
| 7 | login unregistered | `/login` (unregistered) | ○ | ○ | ○ | desktop+mobile |
| 8 | login rules_declined | `/login` (rules_declined) | ○ | ○ | ○ | desktop+mobile |
| 9 | login deleted | `/login` (deleted) | ○ | ○ | ○ | desktop+mobile |
| 10 | profile | `/profile` | ○ | ○ | ○ | desktop+mobile |
| 11 | profile editResponseUrl | `/profile` → Forms | ○ | ○ | — | external nav |
| 12 | admin dashboard | `/admin` | ○ | ○ | ○ | desktop+mobile |
| 13 | admin members | `/admin/members` | ○ | ○ | ○ | desktop+mobile |
| 14 | admin tags | `/admin/tags` | ○ | ○ | ○ | desktop+mobile |
| 15 | admin schema | `/admin/schema` | ○ | ○ | ○ | desktop+mobile |
| 16 | admin meetings | `/admin/meetings` | ○ | ○ | ○ | desktop+mobile |
| 17 | search q/zone/status/tag/sort/density | `/members?...` | ○ | ○ | — | 5 ケース |
| 18 | density 3 modes | `/members?density=comfy/dense/list` | ○ | ○ | — | 3 modes |
| 19 | attendance dup (#15) | `/admin/meetings/[id]` | ○ | — | — | toast 1 |

合計 **30 枚以上**の screenshot が collect される設計。

## test directory layout

```
apps/web/
├── playwright.config.ts             # devices / projects / baseURL
├── tests/
│   ├── e2e/
│   │   ├── public.spec.ts           # landing / members / detail / register
│   │   ├── login.spec.ts            # AuthGateState x5
│   │   ├── profile.spec.ts          # editResponseUrl 遷移
│   │   ├── admin.spec.ts            # 5 admin pages
│   │   ├── search.spec.ts           # q / zone / status / tag / sort / density
│   │   ├── density.spec.ts          # 3 modes
│   │   └── attendance.spec.ts       # 二重防御 + 削除済み除外 (#15)
│   ├── page-objects/
│   │   ├── PublicPage.ts
│   │   ├── LoginPage.ts
│   │   ├── ProfilePage.ts
│   │   ├── AdminPage.ts
│   │   └── AttendancePage.ts
│   ├── fixtures/
│   │   ├── auth.ts                  # adminCookie / memberCookie / unregisteredCookie / deletedCookie / rulesDeclinedCookie
│   │   ├── seed.ts                  # wrangler d1 execute で local seed
│   │   └── viewports.ts             # desktop=1280x800 / mobile=390x844
│   └── helpers/
│       ├── axe.ts                   # @axe-core/playwright wrapper
│       └── screenshot.ts            # outputs/phase-11/evidence 命名
```

## env / dependency matrix

| 区分 | キー | 配置 | 理由 |
| --- | --- | --- | --- |
| Playwright | `PLAYWRIGHT_BASE_URL=http://localhost:3000` | playwright.config.ts | local web |
| API | `NEXT_PUBLIC_API_BASE=http://localhost:8787` | local Workers | wrangler dev |
| Auth | `AUTH_SECRET` (test 値) | playwright auth fixture | session cookie |
| D1 | local seed via wrangler | `pnpm seed:e2e` | beforeAll |
| Secrets | （新規導入なし） | — | local 完結 |

## base URL 戦略

| 環境 | base URL | 用途 |
| --- | --- | --- |
| local 既定 | `http://localhost:3000` | dev / CI |
| preview | Cloudflare Workers preview URL | 09a が利用 |
| staging | `https://staging.ubm-hyogo.example` | 09a 担当（本タスク scope out） |

## page object 設計

- `PublicPage`: navigate to `/`, `/members`, `/members/[id]`, `/register`、`getMemberCard(id)`、`fillRegisterForm(props)`
- `LoginPage`: render `/login`、`getStateBlock(state)`、`assertNoAccessRouteAbsent()`（不変条件 #9）
- `ProfilePage`: render `/profile`、`assertNoEditFormVisible()`（不変条件 #4）、`clickEditResponseUrl()` → external nav（不変条件 #4）
- `AdminPage`: 5 画面の navigate、認可境界 verify
- `AttendancePage`: dup register → toast、削除済み member 非表示（不変条件 #15）

## scenario × viewport scale

- 7 spec ファイル × 約 4-7 シナリオ × 2 viewport ≈ **70 件 test pass / 30+ screenshot**

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計 alternative |
| Phase 4 | scenario × viewport の verify suite signature |
| Phase 5 | runbook と page object 配置 |
| Phase 7 | AC × scenario × viewport |

## 多角的チェック観点

- 不変条件 **#4** ProfilePage で `assertNoEditFormVisible()` を呼ぶ test を必ず含める（理由: 編集 form 不在を恒久固定）
- 不変条件 **#8** beforeEach / afterReload 後の selector / state 復元 test（理由: localStorage 依存禁止）
- 不変条件 **#9** LoginPage で `/no-access` URL が 404 / 不在を assert（理由: 専用画面禁止）
- 不変条件 **#15** AttendancePage の dup register が toast 表示、削除済み member が候補から除外される test（理由: UI 二重防御）
- a11y: `@axe-core/playwright` を public / login / profile / admin / search で実行、WCAG 2.1 AA 主要違反 0
- 無料枠: chromium / webkit のみ常時実行、firefox は CI nightly 運用検討

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Mermaid 描画 | 2 | pending | e2e-architecture.mmd |
| 2 | scenario × viewport matrix | 2 | pending | 19 行 |
| 3 | directory layout | 2 | pending | apps/web/tests/e2e |
| 4 | env / dependency | 2 | pending | matrix |
| 5 | page object 設計 | 2 | pending | 5 class |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 主成果物 |
| 図 | outputs/phase-02/e2e-architecture.mmd | Mermaid |
| ドキュメント | outputs/phase-02/scenario-matrix.md | matrix |
| メタ | artifacts.json | phase 2 status |

## 完了条件

- [ ] Mermaid + scenario matrix + layout + env / dependency 記述
- [ ] page object 設計記述

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 2 を completed

## 次 Phase

- 次: Phase 3 (設計レビュー)
- 引き継ぎ: alternative 検討項目（local Workers vs preview URL vs staging URL）
- ブロック条件: matrix 未確定なら Phase 3 不可
