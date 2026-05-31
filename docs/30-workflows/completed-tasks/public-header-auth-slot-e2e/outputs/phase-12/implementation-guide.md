# Phase 12 — Implementation Guide

## Part 1 — 中学生レベルの概念説明

### 1. このタスクは何をするの？

ウェブサイトには **3 種類のお客さん** がきます。

| お客さん | 例え |
|----------|------|
| guest（ゲスト） | まだログインしてない人。本屋さんでいうと「ふらっと立ち寄ったお客さん」 |
| member（会員） | ログイン済みの普通の人。本屋さんの「会員カードを持っているお客さん」 |
| admin（管理者） | お店の店員さん。本屋さんの「バックヤードに入れる店長」 |

### 2. 看板（ヘッダ）の表示

このサイトの上の方には **看板（ヘッダ）** があり、お客さんの種類によって表示が変わります。

| お客さん | 看板に表示されるもの |
|----------|----------------------|
| guest | 「ログイン」ボタン |
| member | 「マイページ」ボタン |
| admin | 「マイページ」ボタン + 「管理画面」ボタン |

つまり、**お客さんの種類によって看板の中身が変わる仕組み** を Task A-F で作ったのです。

### 3. でも、本当にそうなってるか確認したい！

7 つのページ（トップ、メンバー一覧、登録、プライバシー、利用規約、マイページ、管理画面）すべてで、3 種類のお客さんすべてに **正しい看板** が出ているか、人間が一つずつ確認するのは大変です。

7 ページ × 3 種類 = **21 通り** に加えて、壊れやすい 4 つの回帰条件も確認します。合計 **25 通り** の auth-slot 判定です。

### 4. そこで「自動巡回ロボット」を作る

このタスクは、**3 人の架空ユーザー（ゲストくん、会員さん、管理者さん）になりきってサイトを自動で巡回するロボット** を作ります。

ロボットの名前は **Playwright（プレイライト）** といって、ブラウザを自動操縦するのが得意なツールです。

### 5. ロボットの動き

1. **着替え room（setup-auth）**: ロボットが「ゲストの服」「会員の服」「管理者の服」を 3 着用意します。この「服」は **cookie（クッキー）** という、ブラウザが覚えてる小さなメモのことです。
2. **巡回 phase（auth-slot-coverage）**: 3 着の服を順番に着て、7 つのページを訪問します。各ページで「看板の表示」を確認します。
3. **判定**: 期待通りなら OK、違ったら「不一致あり！」とエラーを出します。

### 6. 隠し扉の確認

特に重要なのが **「隠し扉」（マイページ / 管理画面）** です。

- ゲストが隠し扉に近づくと、自動的に **「ログイン」のページに飛ばされる** はず。
- 会員が「管理画面」の扉に近づくと、これも **「ログイン」のページに飛ばされる** はず。

これを **fail-closed（飛ばされて当然）** といって、間違って入れちゃうとセキュリティ事故になります。ロボットはここを必ず確認します。

### 7. CI（自動巡回ロボット工場）

このロボットを **GitHub Actions** という「自動工場」に組み込みます。コードを変更するたびに工場が動いて、ロボットが 25 通りの auth-slot 判定を自動でやります。

---

## Part 2 — 技術詳細

### 1. アーキテクチャ

```
┌─────────────────────┐
│ setup-auth project  │   Playwright Project
│ ─────────────────── │   ┌──────────────────────┐
│ guest (空 cookie)    │──▶│ playwright/.auth/    │
│ member (memberLogin)│   │ ├─ guest.json        │
│ admin (adminLogin)  │   │ ├─ member.json       │
└─────────────────────┘   │ └─ admin.json        │
                          └──────────────────────┘
                                    │
                                    │ test.use({ storageState })
                                    ▼
┌─────────────────────────────────────┐
│ auth-slot-coverage project          │
│ describe @guest │ describe @member │ describe @admin │
│ ROUTES × 7 で TC を量産              │
└─────────────────────────────────────┘
```

### 2. ROUTES 配列の型設計

```ts
type State = 'guest' | 'member' | 'admin'
type Expectation = State | 'redirect'

interface Route {
  readonly path: string
  readonly expect: Readonly<Record<State, Expectation>>
}
```

`Expectation = State | 'redirect'` により `data-auth-state` の literal 3 値と redirect 期待を型レベルで一元管理。

### 3. storageState fixture

既存 `apps/web/playwright/fixtures/auth.ts` の `signSessionJwt(secret, payload)` + `adminLogin(ctx)` / `memberLogin(ctx)` を再利用。`setup-auth.spec.ts` から呼び出し、`context.storageState({ path })` で JSON 永続化。

| state | session payload |
|-------|----------------|
| guest | cookie なし |
| member | `{ memberId: 'm-1', email: 'm-1@example.test', isAdmin: false }` |
| admin | `{ memberId: 'admin-1', email: 'admin-1@example.test', isAdmin: true }` |

JWT secret は env `AUTH_SECRET=playwright-e2e-auth-secret-32-bytes` で固定（CI / local 双方）。

### 4. DOM 契約 selector

```ts
const HEADER_LOCATOR =
  '[data-component="public-header"], [data-testid="member-header"], [data-route-group="admin"]'
```

3 selector の OR fallback chain により、公開層 / 会員層 / 管理層のどのページでも一貫して取得可能。`.first()` で先頭採用。

### 5. fail-closed redirect 検証

```ts
await page.goto(route.path, { waitUntil: 'domcontentloaded' })
expect(page.url()).toMatch(/\/login(\?|$)/)
```

`/login` 単独でも `/login?next=/admin` でも matches。middleware / server guard どちらの実装でも対応可能。

### 6. CI matrix

```yaml
auth-slot:
  needs: smoke
  steps:
    - run: playwright test --project=setup-auth --project=auth-slot-coverage
```

`needs: smoke` で既存 19-route smoke 完了後に走らせ、`if: github.event_name != 'schedule'` で nightly cron では skip。timeout-minutes: 15。

### 7. 既存 projects への regression 防止

`desktop-chromium` / `desktop-firefox` / `mobile-webkit` / `staging` の `testIgnore` 配列に以下を追加:

```ts
/setup-auth\.spec\.ts$/,
/auth-slot-coverage\.spec\.ts$/,
```

これにより、新 spec が既存 project で誤実行されない（both-or-none preflight）。

### 8. ファイル変更一覧

| パス | 種別 |
|------|------|
| `apps/web/playwright/tests/setup-auth.spec.ts` | 新規 |
| `apps/web/playwright/tests/auth-slot-coverage.spec.ts` | 新規 |
| `apps/web/playwright/.auth/.gitignore` | 新規（storageState JSON を ignore） |
| `apps/web/playwright/.auth/.gitkeep` | 新規 |
| `apps/web/playwright.config.ts` | 編集（projects 2 追加 + 既存 testIgnore 追加） |
| `.github/workflows/playwright-smoke.yml` | 編集（`auth-slot` job 追加） |
| `apps/web/src/lib/auth-view/` | 新規（AuthView 解決） |
| `apps/web/src/components/public/PublicHeader.tsx` / `(public)/layout.tsx` | 編集（public DOM 契約） |
| `apps/web/src/components/layout/MemberHeader.tsx` / `(member)/layout.tsx` | 編集（member DOM 契約） |
| `apps/web/app/(admin)/layout.tsx` / `AdminSidebar*.tsx` | 編集（admin DOM 契約） |
| `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` | 編集（legal pages public chrome） |
| `apps/web/middleware.ts` | 編集（forbidden redirect 契約） |

### 9. Screenshot Evidence

| 対象 | 証跡 |
|------|------|
| `/privacy` guest public header | `outputs/phase-11/screenshots/privacy-guest-public-header.png` |
| `/terms` guest public header | `outputs/phase-11/screenshots/terms-guest-public-header.png` |

### 10. DoD

Phase 5 §8 の DoD と一致。25 auth-slot TC pass（setup 3 件を含む Playwright total 28）+ 既存 regression なし + PII 非露出 + CI green。
