# Phase 1 成果物 — 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase | 1 / 13（要件定義） |
| 作成日 | 2026-04-30 |
| 状態 | completed |

---

## 1. 真の論点 (true issue)

E2E テストの実行基盤を「**実 D1 + 実 Workers (local 起動)**」と「**mock + storybook 的 placeholder**」のどちらに置くか。
本タスクは前者（local Workers + 実 D1 seed）を採用する。

### 採用案: local Workers + 実 D1（seed 済み fixture）

- `pnpm dev`（Next.js dev）+ `wrangler dev`（apps/api）+ local D1 (`pnpm seed:e2e`)
- 採用理由
  1. 実環境近似: D1 binding / SSR / fetch 経路を本番同等で検証
  2. 無料枠両立: Cloudflare 課金リソース不要、CI 0 円
  3. 不変条件 #4 #8 #9 #15 を実 SQL / 実 cookie / 実遷移で恒久固定可能
  4. staging deploy 前に green を担保（09a の前提条件）

### 不採用案

- **mock + storybook 的 placeholder**: SSR / D1 binding / Auth.js cookie 経路を検証できず、不変条件 #4 #8 #9 が形骸化。view layer のみのスナップショットに退化するため不採用
- **staging URL 直叩き**: 09a の責務と重複、staging 障害時に false positive、無料枠への影響
- **preview URL (PR ごと)**: deploy 30 sec 以上、cron / scheduled が動かないため不採用

加えて、AuthGateState 5 状態 (input / sent / unregistered / rules_declined / deleted) を `/no-access` に独立 URL で逃がすか、`/login` 内で出し分けるかの論点については、不変条件 #9 に従い後者で固定。E2E では「`/no-access` の **不在** (404)」を assert する。

screenshot evidence は **画面 × viewport 格子 + 主要操作後の差分** に限定し、30〜50 枚目標とする。

---

## 2. AC-1〜8 quantitative 化

| AC | 数値定義 | 検証方法 |
| --- | --- | --- |
| AC-1 | 10 画面 × 2 viewport (desktop 1280x800 / mobile 390x844) = **20 セル green** | playwright project 2 つで全 spec 実行 |
| AC-2 | 公開導線 4 シナリオ (landing / 一覧 / 詳細 / 登録) × 2 viewport = **8 pass** | `public.spec.ts` |
| AC-3 | AuthGateState **5 状態**（input / sent / unregistered / rules_declined / deleted）すべて `/login` 内で表示観測 + `/no-access` URL の **404 / 不在 verify** | `login.spec.ts` |
| AC-4 | `/profile` editResponseUrl ボタン押下 → `https://docs.google.com/forms/d/e/.../viewform` への **外部遷移を 1 件観測** | `profile.spec.ts` |
| AC-5 | 管理 5 画面 × 認可境界 3 種 (admin / member / anonymous) = **15 セル**（admin のみ pass、member / anonymous は 403 or login redirect） | `admin.spec.ts` |
| AC-6 | 検索 6 パラメータ (q / zone / status / tag / sort / density) × 代表 **5 ケース** + density **3 値** (comfy / dense / list) | `search.spec.ts` / `density.spec.ts` |
| AC-7 | screenshot evidence **30 枚以上**（10 画面 × desktop + mobile + 主要操作差分） | `outputs/phase-11/evidence/{desktop,mobile}/` 配置検査 |
| AC-8 | `@axe-core/playwright` で WCAG 2.1 AA 主要違反 **0 件** | public / login / profile / admin / search 5 spec で実行 |

---

## 3. 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 不変条件 #4 / #8 / #9 / #15 を E2E で恒久固定するか | **PASS** | 各不変条件に scenario を 1 つ以上対応（下表） |
| 実現性 | local Workers + Playwright で実装可能か | **PASS** | wrangler dev + Next.js dev + chromium、ubuntu-latest で 10 min 以内に完走見込み、Cloudflare 課金なし |
| 整合性 | 上流 6 task (06a/b/c, 07a/b/c) の AC と矛盾しないか | **PASS** | `ui_routes` 11 件と `d1_tables` 7 件を artifacts.json で再列挙、09-ui-ux.md 検証マトリクス全 row と URL 1:1 |
| 運用性 | CI で必ず実行・rollback で test 戻し可能か | **PASS** | `.github/workflows/e2e-tests.yml` placeholder、Playwright HTML report を artifact 保存、phase-11 evidence で再現性担保 |

---

## 4. 不変条件 ↔ E2E scenario 対応

| 不変条件 | 内容 | 対応 scenario | 期待挙動 |
| --- | --- | --- | --- |
| **#4** | 本人プロフィール本文を D1 override で編集しない | `profile.spec.ts` `assertNoEditFormVisible()` + `clickEditResponseUrl()` | `/profile` に編集 form が無く、editResponseUrl で Google Form viewform へ外部遷移 |
| **#8** | localStorage を route / session / data の正本にしない | `public.spec.ts` / `search.spec.ts` reload 後 state 維持 test | reload 後も URL クエリと cookie 由来で同一表示、localStorage 依存しない |
| **#9** | `/no-access` 専用画面に依存しない | `login.spec.ts` `assertNoAccessRouteAbsent()` + AuthGateState 5 状態の `/login` 内出し分け | `/no-access` が 404、5 状態すべて `/login` 内で render |
| **#15** | meeting attendance UI で重複登録 → toast / 削除済み除外 | `attendance.spec.ts` dup register → toast、削除済み member 候補非表示 | 二重防御（API + UI） |

---

## 5. Phase 2 への open question

1. **wrangler dev 起動時間**: `playwright.config.ts.webServer.timeout` をいくつに設定するか（推奨 60s）
2. **D1 seed 手順**: `pnpm seed:e2e` で `wrangler d1 execute --local` を呼ぶか、SQL fixture を直接 import するか
3. **viewport 固定**: desktop=1280x800, mobile=iPhone 13 (390x844) で確定して良いか
4. **screenshot 命名規約**: `{viewport}/{scenario}-{state}.png` 形式で確定
5. **Playwright runner image**: ubuntu-latest + `mcr.microsoft.com/playwright` 固定 tag
6. **a11y 実行範囲**: search / density / attendance は a11y 除外（layout 検証中心）で良いか
7. **AUTH_SECRET 注入経路**: CI は GitHub Secrets、local は `.env`（op 参照）
8. **CI projects**: chromium 常時 + webkit 常時、firefox は nightly 別 workflow か

---

## タスク完了

- [x] 上流 URL / 検証マトリクス引き取り（artifacts.json `ui_routes` 列挙済み）
- [x] AC-1〜8 quantitative 化
- [x] 真の論点記録（採用 / 不採用案）
- [x] 4 条件評価（all PASS）
- [x] 不変条件 #4 / #8 / #9 / #15 の E2E scenario 対応
- [x] Phase 2 open question 列挙

→ Phase 2（設計）へ handoff 可能。
