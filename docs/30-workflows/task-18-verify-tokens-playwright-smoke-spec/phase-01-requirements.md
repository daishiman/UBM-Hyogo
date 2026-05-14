[実装区分: 実装仕様書]

# Phase 1: 要件定義 — task-18 verify-tokens & playwright-smoke

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Task ID | `task-18-verify-tokens-and-playwright-smoke` |
| Phase | 1 / 13（要件定義） |
| 目的 | MVP 回帰防止 gate（19 routes smoke + design token drift 検知 + 4 画面 visual baseline）の要件を確定する |
| 依存 (前) | task-02 〜 task-17 の全完了（runtime / spec-source / design-system / 公開・会員・管理の全画面 / regression 共通基盤） |
| 依存 (後) | なし（MVP 回帰ゲートの最終 wave） |
| 想定工数 | 0.1 人日（Phase 1 単体） |
| ブランチ命名 | `feat/ui-mvp-task-18-regression-gate` |
| Required status check 候補 | `verify-design-tokens / verify-design-tokens` / `playwright-smoke / smoke (chromium)` / `playwright-smoke / visual (chromium, 4 screens)` |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. **(G1) Playwright smoke**: 19 routes すべてが
   - HTTP < 400 または期待される auth リダイレクト（login への 302/307）を返す
   - 主要 landmark（`<main>` / route ごとの heading or `data-testid`）が visible
   - axe-core による a11y violation が `serious` / `critical` で 0 件
2. **(G2) verify-design-tokens CI**: `docs/00-getting-started-manual/specs/09b-design-tokens.md` §9 JSON の `css` / `value` pair と `apps/web/src/styles/tokens.css` の CSS custom properties が完全一致し、`apps/web/src/styles/globals.css` の `@theme inline` bridge に必要 token が欠落しないこと。drift があれば CI を fail。
3. **(G3) Visual regression baseline**: 4 画面（`/login` / `/` / `/admin` / `/profile`）の baseline screenshot を確立し、`maxDiffPixelRatio: 0.02` で軽量検知。
4. **(G4) Required status check 設定**: PR に `verify-design-tokens` / `playwright-smoke / smoke` / `playwright-smoke / visual` を必須化。smoke は nightly + main merge でも実行。

### 2.2 非ゴール

- 完全な Visual Regression Suite（19 routes × 3 viewport の網羅）。本タスクは 4 画面のみ。
- 負荷試験 / Lighthouse CI 等のパフォーマンス測定。
- Cross-browser matrix の網羅。smoke は chromium のみ必須、firefox/webkit は nightly 任意。
- API contract test の追加（task-17 までで完了済み前提）。
- token に対する semantic 検証（contrast ratio など）。値の literal 一致のみ。

---

## 3. スコープ確定 / 19 routes 一覧（baseURL 相対）

| # | 層 | route | auth | 主要 landmark |
|---|----|-------|------|----------------|
| 1 | 公開 | `/` | unauth OK | `main h1` または `[data-testid="public-hero"]` |
| 2 | 公開 | `/(public)/members` | unauth OK | `main h1` または `[data-testid="member-grid"]` |
| 3 | 公開 | `/(public)/members/[id]` | unauth OK | `main h1`（fixture id `sample-001`） |
| 4 | 公開 | `/register` | unauth OK | `main h1` |
| 5 | 公開 | `/privacy` | unauth OK | `main h1` |
| 6 | 公開 | `/terms` | unauth OK | `main h1` |
| 7 | 会員 | `/login` | unauth OK | `form[data-testid="login-form"]` |
| 8 | 会員 | `/login?state=sent` | unauth OK | `[data-testid="login-state-sent"]` |
| 9 | 会員 | `/login?state=unregistered` | unauth OK | `[data-testid="login-state-unregistered"]` |
| 10 | 会員 | `/profile` | auth required | `main h1`（authenticated fixture） |
| 11 | 管理 | `/(admin)/admin` | admin required | `[data-testid="admin-dashboard"]` |
| 12 | 管理 | `/(admin)/admin/members` | admin required | `[data-testid="admin-members-table"]` |
| 13 | 管理 | `/(admin)/admin/tags` | admin required | `[data-testid="admin-tags"]` |
| 14 | 管理 | `/(admin)/admin/meetings` | admin required | `[data-testid="admin-meetings"]` |
| 15 | 管理 | `/(admin)/admin/schema` | admin required | `[data-testid="admin-schema"]` |
| 16 | 管理 | `/(admin)/admin/requests` | admin required | `[data-testid="admin-requests"]` |
| 17 | 管理 | `/(admin)/admin/identity-conflicts` | admin required | `[data-testid="admin-id-conflicts"]` |
| 18 | 管理 | `/(admin)/admin/audit` | admin required | `[data-testid="admin-audit"]` |
| 19 | 共通 | `/__not_found_canary` | unauth OK | `[data-testid="not-found"]` |

> Next.js App Router の route group 表記 `(public)` / `(admin)` は URL に現れない。Playwright からは `/members`、`/admin` で叩く。

---

## 4. 変更対象ファイル一覧（要件レベルの確定）

| パス | 種別 | 説明 |
|------|------|------|
| `apps/web/playwright.config.ts` | edit | `smoke-chromium` / `visual-chromium` プロジェクト追加 |
| `apps/web/playwright/tests/task18-full-smoke.spec.ts` | new | 19 routes の data-driven smoke |
| `apps/web/playwright/fixtures/auth.ts` | edit | 既存 fixture に task-18 smoke 用の admin/member/public context を接続 |
| `apps/web/playwright/tests/task18-visual.spec.ts` | new | 4 画面の baseline |
| `apps/web/playwright/tests/task18-visual.spec.ts-snapshots/**` | new (gen) | Playwright snapshot baseline（commit 対象） |
| `apps/web/src/__tests__/tokens.test.ts` | edit | 09b SSOT drift / `@theme inline` bridge 検証を強化 |
| `.github/workflows/verify-design-tokens.yml` | new | PR + push で verify-design-tokens を実行 |
| `.github/workflows/playwright-smoke.yml` | new | PR / main merge / nightly で smoke + visual を実行 |
| `.github/workflows/e2e-tests.yml` | edit (任意) | 既存 functional E2E と職掌分離 |
| `package.json` (root) | edit | `verify:tokens` script 追加 |
| `apps/web/package.json` | edit | `e2e:smoke` / `e2e:visual` / `e2e:visual:update` 追加 |
| `apps/web/src/styles/tokens.css` | reference only | task-09 確定の CSS custom properties（変更禁止） |
| `apps/web/src/styles/globals.css` | reference only | task-09 確定の `@theme inline` bridge（変更禁止） |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | edit | token value SSOT。値変更禁止、task-18 gate の運用追記のみ可 |

---

## 5. 不変条件

1. `apps/api/` の本番コードに触れない（smoke の呼び出し対象としてのみ存在）
2. `apps/web/src/styles/tokens.css` と `apps/web/src/styles/globals.css` の `@theme inline` bridge は本タスクで変えない（drift 検知対象）
3. `09b-design-tokens.md` §9 JSON を token value SSOT とする（drift があれば `tokens.css` / `globals.css` 側を直す方針）
4. 既存 Playwright project（`desktop-chromium` / `firefox` / `mobile-webkit`）は温存し、`testMatch` で smoke / visual を完全分離する
5. solo dev ポリシー（`required_pull_request_reviews=null`）の前提を崩さず、品質保証は `required_status_checks` に追加するのみ
6. `.env` に実値を書かない／`E2E_*_SESSION_TOKEN` は GitHub Secrets / 1Password 参照のみ
7. visual baseline は ubuntu-latest（CI と同一 OS）で採取し、font hinting flaky を抑える
8. token 抽出は 09b §9 JSON の `css` / `value` pair と `tokens.css` の CSS custom properties を対象にし、`globals.css` は `@theme inline` bridge の欠落を検査する

---

## 6. 関連シグネチャ（要件レベル）

- 上流: `getEnv().STAGING_BASE_URL`（task-02） / 09b §9 JSON の `css`/`value` pair（task-08） / `tokens.css` & `globals.css @theme inline`（task-09） / 11 primitives と data-testid 規約（task-10） / 19 routes と認可レベル（task-11..17）
- 下流: なし。代わりに以下の CI 参照点を残す:
  - Required status check contexts 3 本
  - Baseline screenshot 4 本（`apps/web/playwright/tests/task18-visual.spec.ts-snapshots/*.png`）
  - verify-design-tokens 出力フォーマット（exit 0 = `✓ design tokens in sync (N tracked)` / exit 1 = drift 列挙）

---

## 7. テスト方針（要件レベル）

- 本タスクは「gate を作る」タスクのため、gate 自身を二重に検証する。
- verify-design-tokens は Vitest による 7 ケース（C1〜C7）を必須化。
- Playwright smoke は 19 routes 全 PASS のほか、壊して fail することを 5 ケース（S1〜S5）で確認。
- Visual diff は 3 ケース（V1〜V3）で baseline 確立 / 微小差分 PASS / 大規模変更 FAIL を担保。
- 詳細は Phase 4 を参照。

---

## 8. ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm verify:tokens
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
```

---

## 9. DoD（Phase 1 完了条件）

- [ ] 19 routes 一覧（§3）が確定し、auth レベルと landmark selector が一意である
- [ ] ゴール G1〜G4 と非ゴールが文書化されている
- [ ] 変更対象ファイル一覧（§4）に new / edit / reference の種別が付与されている
- [ ] 不変条件 8 件（§5）が漏れなく列挙されている
- [ ] 上流タスク（task-02/08/09/10/11..17）からの import surface が要件レベルで参照されている
- [ ] テスト方針が Phase 4 への引き渡しとして整っている
- [ ] 本仕様書のパスが diff scope（task-18 package 配下）に収まっている
