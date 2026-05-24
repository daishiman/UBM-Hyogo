# Phase 3: 受け入れ基準 / 依存関係 / 既存コード変更マップ / テスト戦略

## 0. 目的

Phase 1 で確定したスコープと Phase 2 の設計を、**実装着手前に検証可能な変更マップ・テスト戦略・コマンド表・DoD** に落とし込む。Phase 4 以降の各 Phase（テスト計画 / 実装 / カバレッジ / リファクタ / QA / 最終レビュー / 手動テスト / Phase 12 ドキュメント整備 / Phase 13 PR）がこの Phase 3 を SSOT として走る。

## 1. 既存コード変更マップ（実装 SSOT）

| # | path | 変更種別 | LoC 目安 | 変更内容 |
|---|---|---|---|---|
| 1 | `apps/web/app/login/page.tsx` | edit | ~10 | `TITLES.input.title` を「会員ログイン」、`subtitle` を「Googleフォームに……」に。`<main>` の中身を `<LoginShell><LoginCard>...</LoginCard></LoginShell>` で囲む |
| 2 | `apps/web/app/login/_components/LoginShell.tsx` | **new** | ~10 | `.auth-shell` ラッパー Server Component |
| 3 | `apps/web/app/login/_components/LoginCard.tsx` | edit | ~25 | `<header>` 内の SVG を `.brand` ブロック（brand-mark + brand-title）に差し替え。h1/p の className を `login-card-title` / `login-card-subtitle` に |
| 4 | `apps/web/app/login/_components/LoginPanel.client.tsx` | edit | ~15 | DOM 順序を MagicLinkForm → OrDivider → GoogleOAuthButton に。register link 文言を「会員でない方は メンバー登録 から」に。`.login-panel` className 付与 |
| 5 | `apps/web/app/login/_components/OrDivider.tsx` | **new** | ~14 | OR divider Server Component |
| 6 | `apps/web/app/login/_components/MagicLinkForm.client.tsx` | edit | ~10 | `<Field required>` / `<Input inputSize="lg" placeholder="you@example.com">` / Button `variant="primary" size="lg" block leftIcon={<Icon name="send"/>}`、label「マジックリンクを送る」、cooldown 中は「<n>s 後に再送可能」維持 |
| 7 | `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | edit | ~6 | Button `variant="ghost" size="lg" block leftIcon={<Icon name="google"/>}`、label「Googleでログイン」 |
| 8 | `apps/web/app/login/_components/LoginStatus.tsx` | edit | ~30 | sent state を `.login-sent-block`（icon block + h2 + email 強調 + 戻る button）で再構成。他 state は無改変 or 軽い className 追加のみ |
| 9 | `apps/web/src/components/ui/icons.ts` | edit | +4 lines | `IconName` union に `send` / `google` / `inbox` / `arrow-left` を追加 |
| 10 | `apps/web/src/components/ui/Icon.tsx` | edit | ~30 | path map に 4 icon 追加（24x24 viewBox / currentColor stroke。google は brand color or 1-tone fallback） |
| 11 | `apps/web/src/styles/auth.css` | **new** | ~150 | `.auth-shell` / `.auth-card` / `.brand-mark` / `.brand-title` / `.login-*` の全 class（Phase 2 §4.1 に全量記載） |
| 12 | `apps/web/src/styles/globals.css` | edit | +1 line | `@import "./auth.css";` を `legacy-public.css` の import 直後に追加 |
| 13 | `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` | edit | ~10 | placeholder と button label の文字列を新仕様に合わせて更新（cooldown / submit / error の振る舞いは無改変） |
| 14 | `apps/web/app/login/_components/__tests__/LoginPanel.input-order.spec.tsx` | **new** | ~40 | DOM 順序 (MagicLink → OR → Google → register link) を `findByRole` + `compareDocumentPosition` で assert |
| 15 | `apps/web/app/login/_components/__tests__/LoginCard.brand.spec.tsx` | **new** | ~30 | brand-mark `兵` / brand-title jp `UBM兵庫支部会` / en `Member Portal` の DOM 存在 + textContent assert |
| 16 | `apps/web/app/login/_components/__tests__/LoginStatus.sent.spec.tsx` | **new** | ~30 | sent state の inbox icon block + email `<b>` 強調表示 + 戻るボタン assert |
| 17 | `e2e/login.spec.ts`（既存ファイルがあれば追記、無ければ新規） | new or edit | ~50 | Playwright で `/login` 訪問 → input パネル DOM 順序 + 主要文言 assert。`/login?state=sent&email=...` で sent パネル assert |

> **総 LoC 見積もり**: 約 400 LoC（CSS 150 + TSX 200 + spec 50）。1 サイクル内完了に収まる規模（CONST_007 OK）。

## 2. 既存テストへの影響

| 既存 spec | 影響 | 対応 |
|---|---|---|
| `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` | placeholder / button label 文字列が変わる | spec 内の文字列定数を更新（変更マップ #13） |
| `apps/web/app/login/error.spec.tsx` / `error.component.spec.tsx` | error.tsx 自体は無改変 | 影響なし |
| `apps/web/app/login/loading.spec.tsx` | loading.tsx 自体は無改変 | 影響なし |
| 他 `apps/web/` 配下の Icon / Button / Card / Input / Field unit spec | API 不変 | 影響なし |

## 3. テスト戦略 overview

### 3.1 Unit / Component (Vitest + React Testing Library)

| 観点 | spec | 主 assertion |
|---|---|---|
| brand 構造 | `LoginCard.brand.spec.tsx`（新規） | `screen.getByText('兵')`, `getByText('UBM兵庫支部会')`, `getByText('Member Portal')`, 3 要素の親子関係 |
| DOM 順序 | `LoginPanel.input-order.spec.tsx`（新規） | MagicLinkForm submit ボタン, OR divider, Google button, register link の `compareDocumentPosition` が単調増加 |
| OR divider a11y | `LoginPanel.input-order.spec.tsx` 内 | `getByRole('separator', { name: 'または' })` 存在 |
| MagicLinkForm label / placeholder | `MagicLinkForm.component.spec.tsx`（既存更新） | `getByPlaceholderText('you@example.com')` / `getByRole('button', { name: 'マジックリンクを送る' })` |
| cooldown / submit 不変 | `MagicLinkForm.component.spec.tsx`（既存） | 60s cooldown、disabled 遷移、replaceLoginState 呼び出しが従来通り |
| sent state | `LoginStatus.sent.spec.tsx`（新規） | inbox icon block 存在 / `<b>` 内に email / 戻る button 存在 |

### 3.2 E2E (Playwright)

| 観点 | spec | 主 assertion |
|---|---|---|
| /login input パネル | `e2e/login.spec.ts` 新規 or 拡張 | `auth-shell` + `auth-card` の DOM 存在、ボタン DOM 順序、subtitle 文言 |
| /login sent パネル | 同 | `/login?state=sent&email=test@example.com&redirect=/` 訪問で icon block + email 表示 |
| visual regression | `e2e/visual/login.spec.ts`（任意・Phase 11 で実行） | input / sent の screenshot をプロトタイプとの目視 diff 用に取得 |

### 3.3 静的検証 (CI gate)

| gate | 目的 | 起動 |
|---|---|---|
| `pnpm typecheck` | type 整合 | local + CI |
| `pnpm lint` | lint 違反 0 | local + CI |
| `pnpm --filter @ubm-hyogo/web build` | OpenNext Cloudflare build PASS | local + CI |
| `verify-design-tokens` | HEX 直書き 0 件（google icon は exclude or 1-tone fallback で対応） | CI |
| `verify-test-suffix` | `.test.{ts,tsx}` 禁止 / `.spec.{ts,tsx}` のみ | CI |
| `bash scripts/verify-pr-ready.sh` | Phase 12 compliance pre-flight | local |

### 3.4 Phase 11 evidence（VISUAL）

| evidence | path | 取得方法 |
|---|---|---|
| input screenshot | `outputs/phase-11/screenshots/login-input.png` | `pnpm --filter @ubm-hyogo/web dev` 起動 → Playwright `page.screenshot()` または手動 |
| sent screenshot | `outputs/phase-11/screenshots/login-sent.png` | 同上、`/login?state=sent&...` |
| typecheck log | `outputs/phase-11/evidence/typecheck.log` | `pnpm typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.log` |
| lint log | `outputs/phase-11/evidence/lint.log` | 同上 |
| test log | `outputs/phase-11/evidence/test.log` | `pnpm --filter @ubm-hyogo/web test` |
| build log | `outputs/phase-11/evidence/build.log` | `pnpm --filter @ubm-hyogo/web build` |

> staging visual smoke は `dev` push 後に user-gated で取得し、必要なら別 unassigned-task で promote する。

## 4. 受け入れ基準（AC）—— Phase 1 から確定値を引用 + 詳細化

- **AC-1**（DOM 構造）: 実機 `view-source:/login` に `<div class="auth-shell">` と `<div class="auth-card">` が存在
- **AC-2**（順序）: input パネル内で `getByRole('button', { name: 'マジックリンクを送る' })` が `getByRole('button', { name: 'Googleでログイン' })` より document 上で先に出現
- **AC-3**（brand）: `.brand-mark` の textContent が「兵」、`.brand-title .jp` が「UBM兵庫支部会」、`.brand-title .en` が「Member Portal」
- **AC-4**（icon）: MagicLink Button と Google Button それぞれの内部に SVG が 1 件以上存在し、SVG の `aria-hidden` が `"true"` または親 span が `aria-hidden`
- **AC-5**（sent）: `/login?state=sent&email=test@example.com&redirect=/` で `.login-sent-icon` が render され、`<b>` の textContent に `test@example.com`
- **AC-6**（OR divider）: `getByRole('separator', { name: 'または' })` が 1 件存在し、その内部に "OR" テキストが含まれる
- **AC-7**（CTA 文言）: register link が「会員でない方は メンバー登録 から」で `<a href="/register">` を含む
- **AC-8**（token 不変条件）: `auth.css` 内に HEX color 0 件（`#` を含む color value が 0、google icon の例外は §5 で扱う）
- **AC-9**（機能不変）: 既存 `MagicLinkForm.component.spec.tsx` の cooldown / submit / error 系 assert が（label 文字列更新を除き）すべて PASS
- **AC-10**（CI gate）: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` / `verify-design-tokens` / `verify-test-suffix` がすべて PASS
- **AC-11**（Phase 11 evidence）: input / sent の 2 screenshot を `outputs/phase-11/screenshots/` 配下に物理配置（`status: present`）
- **AC-12**（compliance）: `bash scripts/verify-pr-ready.sh` が PASS

## 5. 依存関係 / 起動順序

```
Phase 4 (Test Plan)
  └── 上記 §3 のテスト粒度を spec ファイル単位に詳細化（assertion 表）
Phase 5 (Implementation)
  ├── icons.ts + Icon.tsx 拡張 (independent)
  ├── auth.css 新規 + globals.css import (independent)
  ├── LoginShell.tsx / OrDivider.tsx 新規
  ├── LoginCard.tsx / LoginPanel.client.tsx / MagicLinkForm.client.tsx / GoogleOAuthButton.client.tsx / LoginStatus.tsx 改修
  └── page.tsx TITLES 更新 + LoginShell 適用
Phase 6 (Test Additions)
  └── 新規 spec 3 件 (LoginCard.brand / LoginPanel.input-order / LoginStatus.sent) + e2e/login.spec.ts
Phase 7 (Coverage)
  └── 既存 MagicLinkForm spec の文字列更新で coverage 維持
Phase 8 (Refactor)
  └── auth.css の class 命名整合（login-* prefix の整理）
Phase 9 (QA)
  └── typecheck / lint / build / verify-design-tokens
Phase 10 (Final Review)
  └── プロトタイプ pages-member.jsx LoginPage との視覚比較レビュー
Phase 11 (Manual Test / Evidence)
  └── input / sent screenshot + 5 logs を outputs/phase-11/ に配置
Phase 12 (Documentation)
  └── strict 7 outputs（main / implementation-guide / compliance-check / system-spec-update-summary / skill-feedback-report / unassigned-task-detection / documentation-changelog）
Phase 13 (PR)
  └── dev base で gh pr create
```

## 6. リスクと対策（Phase 1 § 9 を継承し詳細化）

| リスク | 検知方法 | 対策 |
|---|---|---|
| Icon `IconName` の breaking change | `pnpm typecheck` | union 拡張のみ。既存値は不変 |
| `.auth-shell` / `.auth-card` の他画面波及 | `rg -n "auth-shell\|auth-card" apps/web/app apps/web/src` | 本サイクルでは `/login` のみで利用と grep で確認、`/register` 等で再利用したい場合は別 PR |
| Google icon の HEX 直書きが verify-design-tokens で fail | local `pnpm lint` 相当 + CI | 1-tone fallback（currentColor）に振るか、`scripts/verify-design-tokens.mjs` の exclude rule を確認 |
| 24px border-radius が token と一致しない | code review | リテラル `24px` を auth.css に許容（色 token 不変条件には抵触しない）。`--ubm-radius-2xl` を 24px に変更するのは scope 外 |
| OR divider の flex 配置で縦リズム崩壊 | screenshot 目視 | `.login-panel { gap: 12px; }` + `.login-or-divider { margin: 6px 0; }` で吸収 |
| sent state の他 query 引き継ぎ崩れ | E2E sent パネル assert | LoginStatus.tsx の email 取得経路（既存 props）を維持 |
| Cloudflare Workers build で `auth.css` の `color-mix` が落ちる | `pnpm --filter @ubm-hyogo/web build` | Tailwind v4 + 現行 CSS は color-mix サポート。OpenNext bundle で warning が出れば fallback (`color-mix` 削除して static rgba) を Phase 8 で適用 |

## 7. 主要コマンド一覧（実行は Phase 5 以降）

```bash
# 依存 / lint / type / build
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build

# 設計トークン CI gate（HEX 直書き検知）
mise exec -- pnpm verify:design-tokens   # 既存 script、または node scripts/verify-design-tokens.mjs

# Playwright (login spec のみ)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test e2e/login.spec.ts

# Phase 11 evidence 収集
mkdir -p docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/{evidence,screenshots}
mise exec -- pnpm typecheck 2>&1 | tee docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint 2>&1 | tee docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence/lint.log
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence/test.log
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence/build.log

# Phase 12 compliance pre-flight
bash scripts/verify-pr-ready.sh
```

## 8. DoD（Definition of Done）

- [ ] §1 変更マップの 17 項目すべてが実装され `git status` がクリーン
- [ ] AC-1〜AC-12 がすべて green
- [ ] §3.3 の CI gate がすべて PASS
- [ ] §3.4 の Phase 11 evidence 6 ファイル（input / sent screenshot + 4 logs）が `outputs/phase-11/` に物理配置
- [ ] `outputs/phase-12/` 配下に strict 7 ファイルが揃う（main / implementation-guide / phase12-task-spec-compliance-check / system-spec-update-summary / skill-feedback-report / unassigned-task-detection / documentation-changelog）
- [ ] `bash scripts/verify-pr-ready.sh` PASS
- [ ] PR を `dev` を base に作成（`gh pr create --base dev`）
- [ ] PR 本文に Phase 11 screenshot 参照を含める

## 9. Phase 3 完了条件

- [x] 変更マップ 17 項目を path / 変更種別 / LoC 目安 / 内容 で表化
- [x] 既存テストへの影響と対応を列挙
- [x] テスト戦略（Unit / E2E / 静的 / Phase 11 evidence）の 4 観点を整理
- [x] AC を AC-1〜AC-12 に拡張し検証粒度を明示
- [x] Phase 4〜13 の起動順序と依存関係を flowchart 化
- [x] リスク 7 件 × 検知方法 × 対策 をマップ化
- [x] 主要コマンド一覧をコピペ可能な形で提示
- [x] DoD を 7 項目 / Phase 3 完了条件を 8 項目で固定
