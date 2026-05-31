# Phase 1 — 要件定義

## 1. タスク分類

| 項目 | 値 |
|------|----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementationCategory | e2e-test-coverage |
| 実装区分 | 実装仕様書（新規 spec ファイル + storageState setup + playwright.config 編集 + CI matrix 編集） |

## 2. 目的

親 workflow `public-header-logged-in-nav-cleanup` で実装される Task A-F の DOM 契約が、すべての公開系 routes と会員 / 管理 routes で **3 states × 7 routes = 21 ケース** すべて pass することを Playwright で網羅検証する。

## 3. スコープ（routes × states matrix）

| # | path | guest 期待 | member 期待 | admin 期待 |
|---|------|------------|--------------|--------------|
| R1 | `/` | `data-auth-state="guest"` + `data-role="auth-cta"` 可視 | `data-auth-state="member"` + `data-role="member-cta"` 可視 | `data-auth-state="admin"` + `data-role="admin-cta"` 可視 |
| R2 | `/(public)/members` | guest 描画 | member 描画 | admin 描画 |
| R3 | `/register` | guest 描画 | member 描画 | admin 描画 |
| R4 | `/privacy` | guest 描画 | member 描画 | admin 描画 |
| R5 | `/terms` | guest 描画 | member 描画 | admin 描画 |
| R6 | `/profile` | `/login` redirect | member 描画 | admin 描画 |
| R7 | `/admin` | `/login` redirect | `/login` redirect（or 403） | `data-auth-state="admin"` + `data-role="public-return"` 可視 |

## 4. DOM 契約（Task A-F の SSOT）

| 属性 / selector | 取りうる値 |
|---|---|
| `data-auth-state` | `"guest"` / `"member"` / `"admin"` の 3 値のみ |
| `data-role="auth-cta"` | 「ログイン」CTA（guest のみ可視） |
| `data-role="member-cta"` | 「マイページ」CTA（member / admin で可視） |
| `data-role="admin-cta"` | 「管理画面」CTA（admin のみ可視） |
| `data-role="public-return"` | 管理画面側に公開層へ戻るリンク（admin shell 内） |
| ヘッダ root selector | `[data-component="public-header"]` / `[data-testid="member-header"]` / `[data-route-group="admin"]` |

## 5. 不変条件

1. 新規 API endpoint 追加禁止（既存 `apps/api/src/routes/` のみ利用）
2. 既存 `apps/web/playwright/fixtures/auth.ts` の `signSessionJwt` 経由で session cookie 生成
3. テストファイル命名 `*.spec.ts`（`*.test.ts` 禁止）
4. PII 非露出（cookie 値・email を log 出力しない）
5. fail-closed: redirect 期待時は `page.url()` の `/login` 一致で確認
6. `data-auth-state` リテラルは 3 値のみ
7. CI matrix 追加時 既存 `playwright-smoke` job を壊さない（both-or-none preflight）

## 6. dependencies（前提）

| 依存 | 内容 |
|------|------|
| 親 workflow Task A | `PublicHeader` の session-aware 化（`data-auth-state` 属性付与） |
| 親 workflow Task B | `/` の `PublicHeader` async session prop |
| 親 workflow Task C | `/privacy` / `/terms` の public shell |
| 親 workflow Task D | `/login` の authenticated redirect |
| 親 workflow Task E | `MemberHeader` の admin link（`data-role="admin-cta"`） |
| 親 workflow Task F | `AdminSidebar` の public return（`data-role="public-return"` + admin shell `data-auth-state="admin"`） |

> 本仕様書からのフィードバック: Task F の DoD に「`data-route-group="admin"` の親 div が `data-auth-state="admin"` を持つ」を追記する必要がある（Phase 12 `skill-feedback-report.md` 参照）。

## 7. CONST_007 遵守

- 全 phase は実装 1 サイクル内で完了するスコープ
- 「将来別 PR」「Phase 2 で」等の先送り禁止
- スコープ分割は親 workflow との並列実行のためのみ

## 8. DoD（要件層）

- [ ] 7 routes × 3 states = 21 ケースが Phase 4 テスト計画に網羅されている
- [ ] DOM 契約と Task A-F の DoD の対応関係が表で明示されている
- [ ] 不変条件 7 項目が Phase 2-10 全 phase で参照される
